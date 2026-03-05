// import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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
// import { AuthGuard } from '@nestjs/passport';
import type { RsOfficeClient } from '@rumsan/user';
import type { Request } from 'express';
import { RS_OFFICE_CLIENT } from '../../rsoffice/rsoffice.module';
import { CryptoService } from '../crypto.service';

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private signingPublicKey: string | null = null;

  constructor(
    @Inject(RS_OFFICE_CLIENT) private readonly client: RsOfficeClient,
    private readonly crypto: CryptoService,
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
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: any }>();
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

    // Keep your existing shape: { id, email, role }
    // RsOffice payload has different claims — map them to your app's shape
    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.roles?.[0] ?? 'EMPLOYEE',
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
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {
//     const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
//       context.getHandler(),
//       context.getClass(),
//     ]);
//     if (!requiredRoles) return true;

//     const { user } = context.switchToHttp().getRequest();
//     return requiredRoles.some((role) => user.role === role);
//   }
// }

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {}
