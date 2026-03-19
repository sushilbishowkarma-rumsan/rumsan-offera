import { Module } from '@nestjs/common';
import { WfhRequestService } from './wfh-request.service';
import { WfhRequestController } from './wfh-request.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module'; // ← Add

@Module({
  imports: [NotificationsModule, AuthModule, MailModule],
  providers: [WfhRequestService, PrismaService],
  controllers: [WfhRequestController],
})
export class WfhRequestModule {}
