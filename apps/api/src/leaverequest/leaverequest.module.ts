// leaverequest.module.ts
import { Module } from '@nestjs/common';
import { LeaverequestService } from './leaverequest.service';
import { LeaverequestController } from './leaverequest.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AuthModule } from '../auth/auth.module'; // ← add this import
import { ExceededLeaveModule } from '../exceeded-leave/exceeded-leave.module';

@Module({
  imports: [NotificationsModule, AuthModule, ExceededLeaveModule],
  providers: [LeaverequestService, PrismaService],
  controllers: [LeaverequestController],
})
export class LeaverequestModule {}
