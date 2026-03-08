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
import { RsOfficeModule } from './rsoffice/rsoffice.module';
import { WfhRequestModule } from './wfh-request/wfh-request.module';

@Module({
  imports: [
    RsOfficeModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    LeaverequestModule,
    LeavePolicyModule,
    LeaveBalanceModule,
    NotificationsModule,
    HolidaysModule,
    WfhRequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
