// rumsan-offera/apps/api/src/notifications/notifications.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

/**
 * Socket.IO gateway for real-time notifications.
 *
 * Room strategy: each user joins a private room keyed by their userId.
 * When a notification is created anywhere in the app, call
 *   gateway.emitToUser(userId, notification)
 * and the browser receives it instantly.
 *
 * CORS: adjust origin to match your Next.js dev/prod URL.
 */

interface SocketData {
  userId: string;
  role: string;
  email: string;
}
type AuthenticatedSocket = Socket<
  Record<string, never>,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

interface ServerToClientEvents {
  joined: (data: { userId: string }) => void;
  new_notification: (notification: object) => void;
  unread_count: (data: { count: number }) => void;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    // origin: process.env.APP_URL,
    origin: process.env.APP_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  // userId → Set of socket ids (a user can have multiple tabs open)
  private readonly userSockets = new Map<string, Set<string>>();

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  handleConnection(client: Socket): void {
    this.logger.debug(
      `[WS] client connected: ${client.id}, auth token present: ${!!client.handshake.auth?.token}`,
    );
  }

  handleDisconnect(client: Socket): void {
    const userId: string | undefined = (client.data as Partial<SocketData>)
      .userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
    this.logger.debug(`[WS] client disconnected: ${client.id}`);
  }

  // ── Client messages ────────────────────────────────────────────────────────

  /**
   * Client sends { userId } after connecting with a valid JWT.
   * We use a dedicated "join" event so the guard can verify the token
   * before we trust the userId claim.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() _body: unknown, // body ignored — trust guard only
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    const { userId } = client.data;

    this.logger.log(
      `[WS] handleJoin called — client.data.userId: ${userId}, socket: ${client.id}`,
    );

    if (!userId) {
      // ADD THIS LOG
      this.logger.error(
        `[WS] userId is UNDEFINED on client.data — guard did not populate it!`,
      );
      return;
    }

    // Put the socket into the private room
    void client.join(`user:${userId}`);

    // Track for internal use (e.g. presence checks)
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set<string>());
    }
    this.userSockets.get(userId)!.add(client.id);

    client.emit('joined', { userId });
    this.logger.log(`[WS] socket ${client.id} joined room user:${userId}`);
  }

  // ── Server-side emit helpers ───────────────────────────────────────────────

  /**
   * Emit a new notification to all browser tabs of a specific user.
   * Call this from NotificationsService.create().
   */
  emitToUser(userId: string, notification: object): void {
    this.logger.log(
      `[WS] emitToUser → room: user:${userId}, connectedRooms: ${JSON.stringify([...this.userSockets.entries()].map(([k, v]) => ({ user: k, sockets: [...v] })))}`,
    );

    this.server.to(`user:${userId}`).emit('new_notification', notification);
  }

  /**
   * Emit an unread-count update.  Cheaper than re-fetching the full list.
   */
  emitUnreadCount(userId: string, count: number): void {
    this.server.to(`user:${userId}`).emit('unread_count', { count });
  }
}
