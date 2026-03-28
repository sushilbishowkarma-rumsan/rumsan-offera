import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client'; // Import the type from Prisma
import { NotificationsGateway } from './notifications.gateway';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  meta: PaginationMeta;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Create a notification
   */
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    linkTo?: string;
    relatedRequestId?: string;
  }): Promise<Notification> {
    const notification = await this.prisma.notification.create({ data });
    if (this.gateway) {
      this.gateway.emitToUser(data.userId, notification);
      void this.getUnreadCount(data.userId).then((count) => {
        this.gateway.emitUnreadCount(data.userId, count);
      });
    }
    return notification;
  }

  async findByUserPaginated(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedNotifications> {
    // Clamp limit to prevent abuse
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    // Run count + data fetch in parallel for performance
    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  /**
   * Get all notifications for a user
   */
  async findByUser(userId: string): Promise<Notification[]> {
    return await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    if (this.gateway) {
      void this.getUnreadCount(notification.userId).then((count) => {
        this.gateway.emitUnreadCount(notification.userId, count);
      });
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    // Badge → 0
    this.gateway.emitUnreadCount(userId, 0);

    return { count: result.count };
  }

  /**
   * Delete old read notifications (cleanup job)
   */
  async deleteOldReadNotifications(daysOld = 30): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });

    return { count: result.count };
  }
}
