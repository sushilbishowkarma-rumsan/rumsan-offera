// leave-reset-cron/leave-reset-cron.service.ts
// Place this file at: src/leave-reset-cron/leave-reset-cron.service.ts
//
// This service uses @nestjs/schedule to run the yearly reset automatically
// on January 1st at 00:05 server time.
//
// SETUP STEPS:
//   1. npm install @nestjs/schedule
//   2. In your AppModule: import { ScheduleModule } from '@nestjs/schedule'
//      and add ScheduleModule.forRoot() to the imports array
//   3. Register LeaveResetCronModule in AppModule imports

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeaveBalanceService } from '../leave-balance/leave-balance.service';

@Injectable()
export class LeaveResetCronService {
  // Logger so you can track cron runs in production logs
  private readonly logger = new Logger(LeaveResetCronService.name);

  constructor(private leaveBalanceService: LeaveBalanceService) {}

  // ─── Runs every January 1st at 00:05 AM (server local time) ──────────────
  // Cron syntax: '5 0 1 1 *' = minute 5, hour 0, day 1, month 1 (January), any weekday
  @Cron('5 0 1 1 *', {
    name: 'yearly-leave-reset',
    timeZone: 'Asia/Kathmandu', // ← Change to your server's timezone
  })
  async handleYearlyReset() {
    this.logger.log('[YearlyReset] Cron triggered — starting yearly reset');

    try {
      // The previous year is what we are snapshotting
      const previousYear = new Date().getFullYear() - 1;
      const result =
        await this.leaveBalanceService.resetYearlyBalances(previousYear);
      this.logger.log(`[YearlyReset] Done: ${result.message}`);
    } catch (err) {
      this.logger.error('[YearlyReset] Failed:', err);
    }
  }
}
