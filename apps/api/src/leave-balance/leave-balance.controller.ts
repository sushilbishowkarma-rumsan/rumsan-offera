// rumsan-offera/apps/api/src/leave-balance/leave-balance.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LeaveBalanceService } from './leave-balance.service';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/roles.guard';
import {
  SetEmployeeLeaveQuotaDto,
  SetEmployeeLeaveQuotaBulkDto,
} from './dto/set-employee-quota.dto';

@Controller('leave-balances')
export class LeaveBalanceController {
  constructor(private readonly leaveBalanceService: LeaveBalanceService) {}

  // ── GET: employee's own balances ─────────────────────────────────────────────
  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  async getByEmployee(@Param('employeeId') employeeId: string) {
    const balances = await this.leaveBalanceService.getByEmployee(employeeId);
    console.log(`Returning ${balances.length} balances for ${employeeId}`);
    return balances;
  }

  // ── NEW: Rich summary (total, used, remaining, exceeded) ─────────────────
  // Used by employee dashboard and HR admin user profile.
  // GET /leave-balances/employee/:employeeId/summary
  @Get('employee/:employeeId/summary')
  @UseGuards(JwtAuthGuard)
  async getBalanceSummary(@Param('employeeId') employeeId: string) {
    return this.leaveBalanceService.getLeaveBalanceSummary(employeeId);
  }

  // ── GET: employee balance history ────────────────────────────────────────────
  @Get('employee/:employeeId/history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Param('employeeId') employeeId: string) {
    return this.leaveBalanceService.getHistoryByEmployee(employeeId);
  }

  // ── NEW: PATCH — HR sets one leave quota for one employee ────────────────────
  // Called per-row if HR wants to update a single type.
  // POST /leave-balances/employee/:employeeId/quota
  // Body: { leaveType: "SICK", quota: 12 }
  @Patch('employee/:employeeId/quota')
  @UseGuards(JwtAuthGuard)
  async setEmployeeQuota(
    @Param('employeeId') employeeId: string,
    @Body() dto: SetEmployeeLeaveQuotaDto,
  ) {
    await this.leaveBalanceService.setEmployeeLeaveQuota(
      employeeId,
      dto.leaveType,
      dto.quota,
    );
    return { message: 'Quota updated successfully' };
  }

  // ── NEW: PATCH — HR sets ALL leave quotas for one employee at once ───────────
  // The UI sends one bulk payload, avoids N sequential requests.
  // PATCH /leave-balances/employee/:employeeId/quota/bulk
  // Body: { entries: [{ leaveType: "SICK", quota: 12 }, ...] }
  @Patch('employee/:employeeId/quota/bulk')
  @UseGuards(JwtAuthGuard)
  async setEmployeeQuotaBulk(
    @Param('employeeId') employeeId: string,
    @Body() dto: SetEmployeeLeaveQuotaBulkDto,
  ) {
    const result = await this.leaveBalanceService.setEmployeeLeaveQuotaBulk(
      employeeId,
      dto.entries,
    );
    return { message: `${result.updated} quota(s) updated successfully` };
  }

  // ── NEW: GET — all employees with their current balances ─────────────────────
  // Used by HR policies page to populate the user selector + quota grid.
  // GET /leave-balances/employees/all
  @Get('employees/all')
  @UseGuards(JwtAuthGuard)
  async getAllEmployeesWithBalances() {
    return this.leaveBalanceService.getAllEmployeesWithBalances();
  }

  // ── HR Admin — all history, optionally filtered ──────────────────────────────
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

  // ── HR Admin — leave requests history by month/year ──────────────────────────
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

  // ── Download Excel ────────────────────────────────────────────────────────────
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

  // ── One-time backfill ─────────────────────────────────────────────────────────
  @Post('seed')
  @UseGuards(JwtAuthGuard)
  async seedAll() {
    return this.leaveBalanceService.seedBalancesForAllPolicies();
  }

  // ── Month-end reset ───────────────────────────────────────────────────────────
  @Post('reset')
  @UseGuards(JwtAuthGuard)
  async resetMonthly() {
    return this.leaveBalanceService.resetMonthlyBalances();
  }
}
