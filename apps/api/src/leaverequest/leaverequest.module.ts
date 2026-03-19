// leaverequest.module.ts
import { Module } from '@nestjs/common';
import { LeaverequestService } from './leaverequest.service';
import { LeaverequestController } from './leaverequest.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AuthModule } from '../auth/auth.module'; // ← add this import
import { MailModule } from '../mail/mail.module'; // ← Add

@Module({
  imports: [NotificationsModule, AuthModule, MailModule],
  providers: [LeaverequestService, PrismaService],
  controllers: [LeaverequestController],
})
export class LeaverequestModule {}
