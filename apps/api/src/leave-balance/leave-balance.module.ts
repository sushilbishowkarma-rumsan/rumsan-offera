// leave-balance/leave-balance.module.ts
import { Module } from '@nestjs/common';
import { LeaveBalanceService } from './leave-balance.service';
import { LeaveBalanceController } from './leave-balance.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module'; // ← add this import

@Module({
  imports: [AuthModule],
  providers: [LeaveBalanceService, PrismaService],
  controllers: [LeaveBalanceController],
  exports: [LeaveBalanceService],
})
export class LeaveBalanceModule {}
