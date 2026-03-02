import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client'; // Import the type from Prisma
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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
    return await this.prisma.notification.create({
      data,
    });
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
    return await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    return await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete old read notifications (cleanup job)
   */
  async deleteOldReadNotifications(
    daysOld: number = 30,
  ): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });
  }
}
