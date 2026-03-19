// src/leave-balance/leave-balance.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

interface ExceededLeaveEntry {
  leaveType: string;
  label: string;
  total: number;
  exceeded: number;
}

interface GroupedEmployeeData {
  employee: {
    id: string;
    name: string | null;
    email: string;
  };
  leaves: ExceededLeaveEntry[];
  totalExceededDays: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class LeaveBalanceScheduler {
  private readonly logger = new Logger(LeaveBalanceScheduler.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * Runs every day at 9:00 AM.
   * Checks if today is exactly 7 days before month end.
   * If yes — finds ALL employees with exceeded balances and sends
   * one email per employee listing all exceeded leave types and total.
   */
  //uncomment this for month end
  //@Cron('0 9 * * *') // Every day at 9:00 AM
  @Cron(CronExpression.EVERY_10_MINUTES)
  // @Cron(CronExpression.EVERY_MINUTE)
  async sendMonthEndExceededWarnings() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (0 = January)

    // Last day of current month (day 0 of next month = last day of this month)
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const daysUntilMonthEnd = lastDayOfMonth - now.getDate();

    // Only fire on exactly the 7th-last day of the month
    //uncomment this for month end
    // if (daysUntilMonthEnd !== 7) {
    //   return;
    // }
    //uncomment this for month end
    // this.logger.log(
    //   `[ExceededLeaveWarning] ${daysUntilMonthEnd} days to month end — scanning exceeded balances...`,
    // );

    this.logger.log(
      `[ExceededLeaveWarning] TEST RUN — scanning exceeded balances...`,
    );
    // ── Fetch ALL leaveBalance rows where exceeded > 0 across ALL employees ──
    const exceededRows = await this.prisma.leaveBalance.findMany({
      where: { exceeded: { gt: 0 } },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ employee: { name: 'asc' } }, { leaveType: 'asc' }],
    });

    if (exceededRows.length === 0) {
      this.logger.log(
        '[ExceededLeaveWarning] No exceeded balances found — no emails sent.',
      );
      return;
    }

    this.logger.log(
      `[ExceededLeaveWarning] Found ${exceededRows.length} exceeded row(s) — grouping by employee...`,
    );

    // ── Group rows by employeeId ──────────────────────────────────────────────
    // One employee may have exceeded multiple leave types (sick + personal etc.)
    // We collect all their exceeded types into one entry and sum the total.
    //
    // Example DB rows:
    //   Alice  | SICK     | exceeded: 2
    //   Alice  | PERSONAL | exceeded: 1
    //   Bob    | SICK     | exceeded: 3
    //
    // After grouping:
    //   Alice → leaves: [SICK(2), PERSONAL(1)], totalExceededDays: 3
    //   Bob   → leaves: [SICK(3)],              totalExceededDays: 3
    const grouped = new Map<string, GroupedEmployeeData>();

    for (const row of exceededRows) {
      const entry: ExceededLeaveEntry = {
        leaveType: row.leaveType,
        label:
          row.leaveType.charAt(0).toUpperCase() +
          row.leaveType.slice(1).toLowerCase(),
        total: row.total,
        exceeded: row.exceeded,
      };

      const existing = grouped.get(row.employeeId);

      if (existing) {
        // Employee already in map — append this leave type and add to total
        existing.leaves.push(entry);
        existing.totalExceededDays += row.exceeded;
      } else {
        // First exceeded row for this employee — create their map entry
        grouped.set(row.employeeId, {
          employee: {
            id: row.employee.id,
            name: row.employee.name,
            email: row.employee.email,
          },
          leaves: [entry],
          totalExceededDays: row.exceeded,
        });
      }
    }

    this.logger.log(
      `[ExceededLeaveWarning] Grouped into ${grouped.size} employee(s) — sending emails...`,
    );

    // ── Send one email per employee ───────────────────────────────────────────
    let sent = 0;
    let failed = 0;

    for (const [employeeId, data] of grouped) {
      try {
        await this.mailService.sendExceededLeaveWarning({
          employeeEmail: data.employee.email,
          employeeName: data.employee.name || data.employee.email,
          exceededLeaves: data.leaves,
          totalExceededDays: data.totalExceededDays,
          monthName: MONTH_NAMES[month],
          year,
          daysUntilMonthEnd,
        });

        this.logger.log(
          `[ExceededLeaveWarning] ✅ ${data.employee.email} — ` +
            `${data.totalExceededDays} exceeded day(s) across ` +
            `${data.leaves.length} leave type(s): ` +
            data.leaves.map((l) => `${l.label}(${l.exceeded})`).join(', '),
        );
        sent++;
      } catch (err) {
        this.logger.error(
          `[ExceededLeaveWarning] ❌ Failed for ${data.employee.email} ` +
            `(id: ${employeeId}): ${(err as Error).message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `[ExceededLeaveWarning] Complete — ✅ sent: ${sent} | ❌ failed: ${failed} | ` +
        `total employees processed: ${grouped.size}`,
    );
  }

  /**
   * Manual trigger — used for testing without waiting for the cron schedule.
   * Call this from your controller: POST /leave-balance/send-exceeded-warnings
   *
   * Bypasses the 7-day check so it always fires immediately.
   */
  async triggerExceededWarningsNow() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const daysUntilMonthEnd = lastDayOfMonth - now.getDate();

    this.logger.log(
      `[ExceededLeaveWarning] Manual trigger — scanning exceeded balances...`,
    );

    const exceededRows = await this.prisma.leaveBalance.findMany({
      where: { exceeded: { gt: 0 } },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ employee: { name: 'asc' } }, { leaveType: 'asc' }],
    });

    if (exceededRows.length === 0) {
      this.logger.log(
        '[ExceededLeaveWarning] No exceeded balances found — no emails sent.',
      );
      return { sent: 0, failed: 0, totalEmployees: 0 };
    }

    const grouped = new Map<string, GroupedEmployeeData>();

    for (const row of exceededRows) {
      const entry: ExceededLeaveEntry = {
        leaveType: row.leaveType,
        label:
          row.leaveType.charAt(0).toUpperCase() +
          row.leaveType.slice(1).toLowerCase(),
        total: row.total,
        exceeded: row.exceeded,
      };

      const existing = grouped.get(row.employeeId);
      if (existing) {
        existing.leaves.push(entry);
        existing.totalExceededDays += row.exceeded;
      } else {
        grouped.set(row.employeeId, {
          employee: {
            id: row.employee.id,
            name: row.employee.name,
            email: row.employee.email,
          },
          leaves: [entry],
          totalExceededDays: row.exceeded,
        });
      }
    }

    let sent = 0;
    let failed = 0;

    for (const [employeeId, data] of grouped) {
      try {
        await this.mailService.sendExceededLeaveWarning({
          employeeEmail: data.employee.email,
          employeeName: data.employee.name || data.employee.email,
          exceededLeaves: data.leaves,
          totalExceededDays: data.totalExceededDays,
          monthName: MONTH_NAMES[month],
          year,
          daysUntilMonthEnd,
        });

        this.logger.log(
          `[ExceededLeaveWarning] ✅ ${data.employee.email} — ` +
            `${data.totalExceededDays} day(s): ` +
            data.leaves.map((l) => `${l.label}(${l.exceeded})`).join(', '),
        );
        sent++;
      } catch (err) {
        this.logger.error(
          `[ExceededLeaveWarning] ❌ Failed for ${data.employee.email} ` +
            `(id: ${employeeId}): ${(err as Error).message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `[ExceededLeaveWarning] Manual trigger complete — sent: ${sent}, failed: ${failed}`,
    );

    return { sent, failed, totalEmployees: grouped.size };
  }
}
