// leave-balance/leave-balance.module.ts
import { Module } from '@nestjs/common';
import { LeaveBalanceService } from './leave-balance.service';
import { LeaveBalanceController } from './leave-balance.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [LeaveBalanceService, PrismaService],
  controllers: [LeaveBalanceController],
  exports: [LeaveBalanceService],
})
export class LeaveBalanceModule {}
