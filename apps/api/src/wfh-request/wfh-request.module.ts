import { Module } from '@nestjs/common';
import { WfhRequestService } from './wfh-request.service';
import { WfhRequestController } from './wfh-request.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  providers: [WfhRequestService, PrismaService],
  controllers: [WfhRequestController],
})
export class WfhRequestModule {}
