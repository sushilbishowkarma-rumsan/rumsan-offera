// leave-reset-cron/leave-reset-cron.module.ts
// Place this file at: src/leave-reset-cron/leave-reset-cron.module.ts

import { Module } from '@nestjs/common';
import { LeaveResetCronService } from './leave-reset-cron.service';
// Import LeaveBalanceModule so LeaveBalanceService is available here
import { LeaveBalanceModule } from '../leave-balance/leave-balance.module';

@Module({
  imports: [
    LeaveBalanceModule, // ← LeaveBalanceService must be exported from LeaveBalanceModule
  ],
  providers: [LeaveResetCronService],
})
export class LeaveResetCronModule {}
