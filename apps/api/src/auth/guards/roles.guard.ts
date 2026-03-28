import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import type { RsOfficeClient } from '@rumsan/user';
import type { Request } from 'express';
import { RS_OFFICE_CLIENT } from '../../rsoffice/rsoffice.module';
import { CryptoService } from '../crypto.service';
import { PrismaService } from '../../prisma/prisma.service'; //add for ovveride role from my db

// ── Shared typed request — single source of truth for req.user shape ──────────
// Matches exactly what JwtAuthGuard sets on request.user
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string; // ← string, not Role enum, because fallback can be 'EMPLOYEE' string
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private signingPublicKey: string | null = null;

  constructor(
    @Inject(RS_OFFICE_CLIENT) private readonly client: RsOfficeClient,
    private readonly crypto: CryptoService,
    private readonly prisma: PrismaService, // ← ADDED for role override
  ) {}
  async onModuleInit(): Promise<void> {
    try {
      const { publicKey } = await this.client.auth.getPublicKey();
      this.signingPublicKey = publicKey;
      this.logger.log('JWT signing public key loaded from RsOffice API');
    } catch (err) {
      this.logger.warn(`Could not load JWT public key on startup: ${err}`);
    }
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.slice(7);

    if (!this.signingPublicKey) {
      try {
        const { publicKey } = await this.client.auth.getPublicKey();
        this.signingPublicKey = publicKey;
      } catch {
        throw new UnauthorizedException(
          'Could not retrieve JWT signing public key',
        );
      }
    }

    const { valid, payload } = await this.crypto.verifyJwt(
      token,
      this.signingPublicKey,
    );
    if (!valid || !payload)
      throw new UnauthorizedException('Invalid or expired token');

    try {
      const dbUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { rsofficeId: payload.sub }, // ← first try RsOffice ID
            { email: payload.email }, // ← also try email
          ],
        },
        select: { id: true, role: true, email: true },
      });

      if (dbUser && dbUser.role !== 'EMPLOYEE') {
        // DB says elevated role → override token role
        request.user = {
          id: dbUser.id, // ← use our DB UUID, not RsOffice sub
          email: dbUser.email,
          role: dbUser.role, // ← always from DB
        };

        this.logger.debug(
          `Auth resolved: rsoffice_sub=${payload.sub} → db.id=${dbUser.id} role=${dbUser.role}`,
        );
        return true;
      }
      // If DB role is EMPLOYEE or user not found → keep tokenRole as-is
    } catch (err) {
      this.logger.warn(`DB role lookup failed for ${payload.sub}: ${err}`);
    }
    // ─────────────────────────────────────────────────────────────────────

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.roles?.[0] ?? 'EMPLOYEE', // ← uses DB role if elevated, token role otherwise
    };

    return true;
  }
}

// ── Roles Guard (unchanged) ───────────────────────────────────────────────────
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const { user } = request;
    return requiredRoles.some((role) => user.role === role);
  }
}
