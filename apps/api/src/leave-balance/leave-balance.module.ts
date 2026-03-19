// leave-balance/leave-balance.module.ts
import { Module } from '@nestjs/common';
import { LeaveBalanceService } from './leave-balance.service';
import { LeaveBalanceController } from './leave-balance.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module'; // ← add this import
import { LeaveBalanceScheduler } from './leave-balance.scheduler'; // ← Add
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule, MailModule],
  providers: [LeaveBalanceService, LeaveBalanceScheduler, PrismaService],
  controllers: [LeaveBalanceController],
  exports: [LeaveBalanceService],
})
export class LeaveBalanceModule {}
