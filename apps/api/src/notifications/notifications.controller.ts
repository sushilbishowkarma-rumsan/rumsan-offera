import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/roles.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user/:userId/unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(
    @Param('userId') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.notificationsService.findByUserPaginated(userId, page, limit);
  }

  @Patch('user/:userId/mark-all-read')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(
    @Param('userId') userId: string,
  ): Promise<{ count: number }> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
