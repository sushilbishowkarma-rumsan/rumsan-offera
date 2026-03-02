// leave-balance/leave-balance.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LeaveBalanceService } from './leave-balance.service';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/roles.guard';

@Controller('leave-balances')
export class LeaveBalanceController {
  constructor(private readonly leaveBalanceService: LeaveBalanceService) {}

  // Employee/Manager/Admin: get own balances
  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  async getByEmployee(@Param('employeeId') employeeId: string) {
    const balances = await this.leaveBalanceService.getByEmployee(employeeId);
    console.log(`Returning ${balances.length} balances for ${employeeId}`);
    return balances;
  }

  // Get previous months history
  @Get('employee/:employeeId/history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Param('employeeId') employeeId: string) {
    return this.leaveBalanceService.getHistoryByEmployee(employeeId);
  }

  // HR Admin — all employees history, optionally filtered by month/year
  @Get('history/all')
  @UseGuards(JwtAuthGuard)
  async getAllHistory(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.leaveBalanceService.getAllEmployeesHistory(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }

  // HR Admin — leave requests history by month/year
  @Get('requests/history')
  @UseGuards(JwtAuthGuard)
  async getLeaveRequestsHistory(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.leaveBalanceService.getLeaveRequestsHistory(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
      employeeId,
    );
  }

  // ── NEW: Download Excel for one employee's monthly leave ────────────────
  @Get('download/excel')
  @UseGuards(JwtAuthGuard)
  async downloadExcel(
    @Query('employeeId') employeeId: string,
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const buffer = await this.leaveBalanceService.generateEmployeeLeaveExcel(
      employeeId,
      parseInt(month),
      parseInt(year),
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="leave-report-${month}-${year}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  // One-time backfill — call once via Postman
  @Post('seed')
  @UseGuards(JwtAuthGuard)
  async seedAll() {
    return this.leaveBalanceService.seedBalancesForAllPolicies();
  }

  // HR Admin triggers at month end
  @Post('reset')
  @UseGuards(JwtAuthGuard)
  async resetMonthly() {
    return this.leaveBalanceService.resetMonthlyBalances();
  }
}
