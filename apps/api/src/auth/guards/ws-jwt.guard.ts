// rumsan-offera/apps/api/src/auth/guards/ws-jwt.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import type { RsOfficeClient } from '@rumsan/user';
import { RS_OFFICE_CLIENT } from '../../rsoffice/rsoffice.module';
import { CryptoService } from '../crypto.service';
import { PrismaService } from '../../prisma/prisma.service';

interface SocketData {
  userId: string;
  role: string;
  email: string;
}

/**
 * WebSocket equivalent of JwtAuthGuard.
 *
 * Uses the SAME verification pipeline:
 *   1. Fetch RsOffice public key (cached after first load, lazy-reloaded on fail)
 *   2. crypto.verifyJwt(token, publicKey)
 *   3. DB lookup to resolve our internal userId + role
 *
 * Token source: socket.handshake.auth.token
 *   → set by frontend: io('/notifications', { auth: { token } })
 *
 * On success: populates client.data.{ userId, role, email }
 *   → gateway reads client.data.userId without re-verifying
 */
@Injectable()
export class WsJwtGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(WsJwtGuard.name);

  // Stored as string once loaded; null only before first successful fetch
  private signingPublicKey: string | null = null;

  constructor(
    @Inject(RS_OFFICE_CLIENT) private readonly rsOfficeClient: RsOfficeClient,
    private readonly crypto: CryptoService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Pre-load public key on startup ────────────────────────────────────────
  async onModuleInit(): Promise<void> {
    try {
      const { publicKey } = await this.rsOfficeClient.auth.getPublicKey();
      this.signingPublicKey = publicKey;
      this.logger.log('[WsJwtGuard] JWT signing public key loaded');
    } catch (err) {
      this.logger.warn(
        `[WsJwtGuard] Could not load JWT public key on startup: ${err}`,
      );
    }
  }

  // ── Ensure public key is available (lazy fallback) ────────────────────────
  private async ensurePublicKey(): Promise<string> {
    if (this.signingPublicKey) return this.signingPublicKey;

    try {
      const { publicKey } = await this.rsOfficeClient.auth.getPublicKey();
      this.signingPublicKey = publicKey;
      return publicKey;
    } catch {
      throw new WsException('Could not retrieve JWT signing public key');
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // const client = context.switchToWs().getClient<Socket>();
    const client = context
      .switchToWs()
      .getClient<Socket<any, any, any, SocketData>>();

    // ── 1. Extract token ───────────────────────────────────────────────────
    // const token = client.handshake.auth?.token as string | undefined;
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      client.handshake.headers?.authorization?.split(' ')[1];

    this.logger.debug(
      `[WsJwtGuard] token present: ${!!token}, socket: ${client.id}`,
    );

    if (!token) {
      throw new WsException('Missing token in socket handshake auth');
    }

    // ── 2. Verify signature ────────────────────────────────────────────────
    const publicKey = await this.ensurePublicKey();

    const { valid, payload } = await this.crypto.verifyJwt(token, publicKey);

    this.logger.debug(
      `[WsJwtGuard] jwt valid: ${valid}, sub: ${String(payload?.sub)}`,
    );
    if (!valid || !payload) {
      throw new WsException('Invalid or expired token');
    }

    // ── 3. DB lookup — resolve internal UUID + role ────────────────────────
    try {
      const dbUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ rsofficeId: payload.sub }, { email: payload.email }],
        },
        select: { id: true, role: true, email: true },
      });

      this.logger.debug(
        `[WsJwtGuard] dbUser found: ${!!dbUser}, role: ${dbUser?.role}, id: ${dbUser?.id}`,
      );

      if (dbUser) {
        client.data.userId = dbUser.id;
        client.data.role = dbUser.role;
        client.data.email = dbUser.email;
        this.logger.debug(
          `[WsJwtGuard] resolved rsoffice_sub=${String(payload.sub)} → db.id=${dbUser.id} role=${dbUser.role}`,
        );
        return true;
      }
    } catch (err) {
      this.logger.warn(`[WsJwtGuard] DB lookup failed: ${err}`);
    }
    this.logger.warn(
      `[WsJwtGuard] FALLBACK — using payload.sub as userId: ${payload.sub}`,
    );

    // ── 4. Fallback — use token claims directly ────────────────────────────
    client.data.userId = payload.sub;
    client.data.role =
      (payload.roles as string[] | undefined)?.[0] ?? 'EMPLOYEE';
    client.data.email = payload.email;

    return true;
  }
}
