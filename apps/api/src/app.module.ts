import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LeaverequestModule } from './leaverequest/leaverequest.module';
import { LeavePolicyModule } from './leave-policy/leave-policy.module';
import { LeaveBalanceModule } from './leave-balance/leave-balance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HolidaysModule } from './holidays/holidays.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    LeaverequestModule,
    LeavePolicyModule,
    LeaveBalanceModule,
    NotificationsModule,
    HolidaysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
