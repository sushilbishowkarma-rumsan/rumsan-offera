import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/roles.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserNotifications(@Param('userId') userId: string) {
    return this.notificationsService.findByUser(userId);
  }

  @Get('user/:userId/unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Param('userId') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('user/:userId/mark-all-read')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
