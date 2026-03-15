// // leave-balance/leave-balance.controller.ts
// import {
//   Controller,
//   Get,
//   Post,
//   Param,
//   Query,
//   Res,
//   UseGuards,
// } from '@nestjs/common';
// import { LeaveBalanceService } from './leave-balance.service';
// import type { Response } from 'express';
// import { JwtAuthGuard } from 'src/auth/guards/roles.guard';

// @Controller('leave-balances')
// export class LeaveBalanceController {
//   constructor(private readonly leaveBalanceService: LeaveBalanceService) {}

//   // Employee/Manager/Admin: get own balances
//   @Get('employee/:employeeId')
//   @UseGuards(JwtAuthGuard)
//   async getByEmployee(@Param('employeeId') employeeId: string) {
//     const balances = await this.leaveBalanceService.getByEmployee(employeeId);
//     console.log(`Returning ${balances.length} balances for ${employeeId}`);
//     return balances;
//   }

//   // Get previous months history
//   @Get('employee/:employeeId/history')
//   @UseGuards(JwtAuthGuard)
//   async getHistory(@Param('employeeId') employeeId: string) {
//     return this.leaveBalanceService.getHistoryByEmployee(employeeId);
//   }

//   // HR Admin — all employees history, optionally filtered by month/year
//   @Get('history/all')
//   @UseGuards(JwtAuthGuard)
//   async getAllHistory(
//     @Query('month') month?: string,
//     @Query('year') year?: string,
//   ) {
//     return this.leaveBalanceService.getAllEmployeesHistory(
//       month ? parseInt(month) : undefined,
//       year ? parseInt(year) : undefined,
//     );
//   }

//   // HR Admin — leave requests history by month/year
//   @Get('requests/history')
//   @UseGuards(JwtAuthGuard)
//   async getLeaveRequestsHistory(
//     @Query('month') month?: string,
//     @Query('year') year?: string,
//     @Query('employeeId') employeeId?: string,
//   ) {
//     return this.leaveBalanceService.getLeaveRequestsHistory(
//       month ? parseInt(month) : undefined,
//       year ? parseInt(year) : undefined,
//       employeeId,
//     );
//   }

//   // ── NEW: Download Excel for one employee's monthly leave ────────────────
//   @Get('download/excel')
//   @UseGuards(JwtAuthGuard)
//   async downloadExcel(
//     @Query('employeeId') employeeId: string,
//     @Query('month') month: string,
//     @Query('year') year: string,
//     @Res() res: Response,
//   ) {
//     const buffer = await this.leaveBalanceService.generateEmployeeLeaveExcel(
//       employeeId,
//       parseInt(month),
//       parseInt(year),
//     );

//     res.set({
//       'Content-Type':
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'Content-Disposition': `attachment; filename="leave-report-${month}-${year}.xlsx"`,
//       'Content-Length': buffer.length,
//     });

//     res.end(buffer);
//   }

//   // One-time backfill — call once via Postman
//   @Post('seed')
//   @UseGuards(JwtAuthGuard)
//   async seedAll() {
//     return this.leaveBalanceService.seedBalancesForAllPolicies();
//   }

//   // HR Admin triggers at month end
//   @Post('reset')
//   @UseGuards(JwtAuthGuard)
//   async resetMonthly() {
//     return this.leaveBalanceService.resetMonthlyBalances();
//   }
// }

// leave-balance/leave-balance.controller.ts
// REPLACE your existing leave-balance.controller.ts with this file.
// New endpoints added:
//   POST   /leave-balance/reset/yearly          ← HR Admin: trigger yearly reset
//   GET    /leave-balance/yearly/:employeeId    ← Employee/Admin: view yearly snapshots
//   GET    /leave-balance/yearly-all            ← HR Admin: all yearly snapshots

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { LeaveBalanceService } from './leave-balance.service';

@Controller('leave-balance')
export class LeaveBalanceController {
  constructor(private readonly leaveBalanceService: LeaveBalanceService) {}

  // ─── (UNCHANGED) Get balances for one employee ───────────────────────────
  @Get(':employeeId')
  getByEmployee(@Param('employeeId') employeeId: string) {
    return this.leaveBalanceService.getByEmployee(employeeId);
  }

  // ─── (UNCHANGED) Seed balances for one employee ──────────────────────────
  @Post('seed/:employeeId')
  seedForEmployee(@Param('employeeId') employeeId: string) {
    return this.leaveBalanceService.seedBalancesForEmployee(employeeId);
  }

  // ─── (UNCHANGED) Seed balances for all employees ─────────────────────────
  @Post('seed-all')
  seedAll() {
    return this.leaveBalanceService.seedBalancesForAllPolicies();
  }

  // ─── (UNCHANGED) Monthly reset endpoint ──────────────────────────────────
  @Post('reset/monthly')
  resetMonthly() {
    return this.leaveBalanceService.resetMonthlyBalances();
  }

  // ─── (UNCHANGED) Monthly history for one employee ────────────────────────
  @Get('history/:employeeId')
  getHistory(@Param('employeeId') employeeId: string) {
    return this.leaveBalanceService.getHistoryByEmployee(employeeId);
  }

  // ─── (UNCHANGED) HR Admin: all employees monthly history ─────────────────
  @Get('history-all')
  getAllHistory(@Query('month') month?: string, @Query('year') year?: string) {
    return this.leaveBalanceService.getAllEmployeesHistory(
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  // ─── (UNCHANGED) Leave requests history ──────────────────────────────────
  @Get('requests-history')
  getRequestsHistory(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.leaveBalanceService.getLeaveRequestsHistory(
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
      employeeId,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: Yearly Reset
  // POST /leave-balance/reset/yearly
  // Body: { year?: number }  ← optional; defaults to current year
  //
  // HR Admin triggers this once a year (Jan 1st or whenever).
  // Saves a yearly snapshot then resets all balances to policy defaultQuota.
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('reset/yearly')
  resetYearly(@Body('year') year?: number) {
    return this.leaveBalanceService.resetYearlyBalances(year);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: Get yearly snapshots for one employee
  // GET /leave-balance/yearly/:employeeId
  //
  // Both employee themselves and HR Admin can call this.
  // Returns all yearly snapshots (year, leaveType, total, used, remaining).
  // ═══════════════════════════════════════════════════════════════════════════
  @Get('yearly/:employeeId')
  getYearlySnapshots(@Param('employeeId') employeeId: string) {
    return this.leaveBalanceService.getYearlySnapshotsByEmployee(employeeId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: HR Admin — get all yearly snapshots
  // GET /leave-balance/yearly-all?year=2024
  //
  // Returns all snapshots with employee details. Filter by year is optional.
  // ═══════════════════════════════════════════════════════════════════════════
  @Get('yearly-all')
  getAllYearlySnapshots(@Query('year') year?: string) {
    return this.leaveBalanceService.getYearlySnapshotsAll(
      year ? parseInt(year, 10) : undefined,
    );
  }

  // ─── (UNCHANGED) Generate Excel report ───────────────────────────────────
  @Get('excel/:employeeId')
  async downloadExcel(
    @Param('employeeId') employeeId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Res() res: Response,
  ) {
    const buffer = await this.leaveBalanceService.generateEmployeeLeaveExcel(
      employeeId,
      month,
      year,
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="leave-report-${employeeId}-${month}-${year}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
