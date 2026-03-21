// rumsan-offera/apps/api/src/leave-balance/leave-balance.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
export interface ExceededLeaveEntry {
  leaveType: string;
  label: string;
  total: number;
  exceeded: number;
  remaining: number;
  usedWithinQuota: number;
}
export interface ExceededEmployeeRow {
  employee: {
    id: string;
    name: string | null;
    email: string;
    department: string | null;
    role: string;
    avatar: string | null;
  };
  leaves: ExceededLeaveEntry[];
  totalExceededDays: number;
}
export interface YearEndResetResult {
  archived: number;
  deleted: number;
  created: number;
  year: number;
}

export interface ExceededHistoryEmployee {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  role: string;
  avatar: string | null;
}

export interface ExceededHistoryRecord {
  id: string;
  employeeId: string;
  leaveType: string;
  month: number;
  year: number;
  total: number;
  used: number;
  remaining: number;
  exceeded: number; // always the real/derived value — never 0 if genuinely exceeded
  createdAt: Date;
  employee: ExceededHistoryEmployee;
}

@Injectable()
export class LeaveBalanceService {
  constructor(private prisma: PrismaService) {}

  async getByEmployee(employeeId: string) {
    const balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId },
      orderBy: { leaveType: 'asc' },
      include: {
        leavePolicy: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (balances.length === 0) {
      await this.seedBalancesForEmployee(employeeId);
      return this.prisma.leaveBalance.findMany({
        where: { employeeId, total: { gt: 0 } },
        orderBy: { leaveType: 'asc' },
        include: {
          leavePolicy: { select: { comments: true } },
        },
      });
    }

    const result = balances.map((b) => ({
      ...b,
      comments: (b.leavePolicy as { comments: string }).comments, // Then, flatten the comments
    }));
    return result;
  }

  // ─── NEW: Rich summary for dashboard/profile display ────────────────────────
  // Returns: leaveType, total, used, remaining, exceeded per type
  async getLeaveBalanceSummary(employeeId: string) {
    let balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId },
      orderBy: { leaveType: 'asc' },
      include: {
        leavePolicy: { select: { comments: true } },
      },
    });

    if (balances.length === 0) {
      await this.seedBalancesForEmployee(employeeId);
      balances = await this.prisma.leaveBalance.findMany({
        where: { employeeId },
        orderBy: { leaveType: 'asc' },
        include: {
          leavePolicy: { select: { comments: true } },
        },
      });
    }
    const formattedBalances = balances
      .filter((b) => b.total > 0)
      .map((b) => ({
        leaveType: b.leaveType,
        label:
          b.leaveType.charAt(0).toUpperCase() +
          b.leaveType.slice(1).toLowerCase(),
        total: b.total,
        used: Math.max(0, b.total - b.remaining), // within-quota days consumed
        remaining: b.remaining,
        exceeded: b.exceeded, // days approved beyond quota
        hasExceeded: b.exceeded > 0,
        comments: b.leavePolicy?.comments ?? 'No policy comments available',
        //(b.leavePolicy as { comments: string }).comments,
      }));
    return formattedBalances;
  }

  async seedBalancesForEmployee(employeeId: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      console.error(`Cannot seed balances: Employee ${employeeId} not found.`);
      return;
    }

    const policies = await this.prisma.leavePolicy.findMany({
      where: { isActive: true },
    });

    if (policies.length === 0) {
      return;
    }

    const result = await this.prisma.leaveBalance.createMany({
      data: policies.map((p) => ({
        employeeId,
        leaveType: p.leaveType,
        total: p.defaultQuota,
        remaining: p.defaultQuota,
        exceeded: 0,
        leavePolicyId: p.id,
      })),
      skipDuplicates: true,
    });

    return result;
  }

  async seedBalancesForAllPolicies() {
    const policies = await this.prisma.leavePolicy.findMany({
      where: { isActive: true },
    });

    const users = await this.prisma.user.findMany({
      select: { id: true, role: true },
    });

    let created = 0;
    for (const policy of policies) {
      const result = await this.prisma.leaveBalance.createMany({
        data: users.map((u) => ({
          employeeId: u.id,
          leaveType: policy.leaveType,
          total: policy.defaultQuota,
          remaining: policy.defaultQuota,
          exceeded: 0,
          leavePolicyId: policy.id,
        })),
        skipDuplicates: true,
      });
      created += result.count;
    }

    return {
      message: `Seeded ${created} balances for ${users.length} users across ${policies.length} policies.`,
    };
  }

  async resetMonthlyBalances() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const balances = await this.prisma.leaveBalance.findMany();

    await Promise.all(
      balances.map((b) =>
        this.prisma.leaveBalanceHistory.upsert({
          where: {
            employeeId_leaveType_month_year: {
              employeeId: b.employeeId,
              leaveType: b.leaveType,
              month,
              year,
            },
          },
          update: {
            total: b.total,
            used: Math.max(0, b.total - b.remaining),
            remaining: b.remaining,
            exceeded: b.exceeded, // ← store real exceeded value
          },
          create: {
            employeeId: b.employeeId,
            leaveType: b.leaveType,
            month,
            year,
            total: b.total,
            used: Math.max(0, b.total - b.remaining),
            remaining: b.remaining,
            exceeded: b.exceeded, // ← store real exceeded value
          },
        }),
      ),
    );

    return {
      message: `Archived and reset ${balances.length} balances for ${month}/${year}. Exceeded days cleared.`,
    };
  }

  async getHistoryByEmployee(employeeId: string) {
    return await this.prisma.leaveBalanceHistory.findMany({
      where: { employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getAllEmployeesHistory(month?: number, year?: number) {
    const where: Prisma.LeaveBalanceHistoryWhereInput = {};

    if (month) where.month = month;
    if (year) where.year = year;

    const history = await this.prisma.leaveBalanceHistory.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { leaveType: 'asc' }],
    });

    return history;
  }

  async getLeaveRequestsHistory(
    month?: number,
    year?: number,
    employeeId?: string,
  ) {
    const where: Prisma.LeaveRequestWhereInput = {};

    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      where.createdAt = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (year) {
      where.createdAt = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59),
      };
    }

    if (employeeId) where.employeeId = employeeId;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── NEW: Set individual quota for one employee + one leave type ─────────────
  //
  // Called by HR Admin from the policies page user-selector panel.
  // Uses upsert so it works whether the balance row exists already or not.
  // IMPORTANT: "remaining" is reset to match the new total.
  // If the employee has already used some days this cycle, HR should be aware —
  // the UI shows the current "remaining" value before saving so HR can decide.

  async setEmployeeLeaveQuota(
    employeeId: string,
    leaveType: string,
    quota: number,
  ): Promise<void> {
    // Verify the policy exists — we need its id for the FK
    const policy = await this.prisma.leavePolicy.findUnique({
      where: { leaveType },
    });
    if (!policy) {
      throw new NotFoundException(
        `No leave policy found for type "${leaveType}". Create the policy first.`,
      );
    }

    // Verify the employee exists
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee "${employeeId}" not found.`);
    }

    await this.prisma.leaveBalance.upsert({
      where: {
        // Uses the @@unique([employeeId, leaveType]) composite key from schema
        employeeId_leaveType: { employeeId, leaveType },
      },
      update: {
        total: quota,
        remaining: quota, // Reset remaining to new total
        exceeded: 0,
      },
      create: {
        employeeId,
        leaveType,
        total: quota,
        remaining: quota,
        exceeded: 0,
        leavePolicyId: policy.id,
      },
    });
  }

  // ─── NEW: Set ALL leave quotas for one employee in a single call ─────────────
  //
  // The UI sends one bulk payload instead of N separate requests.
  // Each entry is processed sequentially so we get proper error messages
  // if any individual leaveType doesn't have a policy yet.

  async setEmployeeLeaveQuotaBulk(
    employeeId: string,
    entries: { leaveType: string; quota: number }[],
  ): Promise<{ updated: number }> {
    for (const { leaveType, quota } of entries) {
      await this.setEmployeeLeaveQuota(employeeId, leaveType, quota);
    }
    return { updated: entries.length };
  }

  // ─── NEW: Get all employees with their leave balances ────────────────────────
  //
  // Used by the HR policies page to show all employees and their current
  // per-type balances in the individual quota assignment panel.

  async getAllEmployeesWithBalances() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        leaveBalances: {
          select: {
            leaveType: true,
            total: true,
            remaining: true,
            exceeded: true,
          },
          orderBy: { leaveType: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }

  async getExceededBalancesForAllEmployees(): Promise<ExceededEmployeeRow[]> {
    // Fetch all balance rows where exceeded > 0, eagerly join the employee
    const rows = await this.prisma.leaveBalance.findMany({
      where: { exceeded: { gt: 0 } },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ employee: { name: 'asc' } }, { leaveType: 'asc' }],
    });

    // Group individual rows by employeeId so the UI gets one card per person
    const grouped = new Map<string, ExceededEmployeeRow>();

    for (const row of rows) {
      const existing = grouped.get(row.employeeId);
      const leaveEntry: ExceededLeaveEntry = {
        leaveType: row.leaveType,
        label:
          row.leaveType.charAt(0).toUpperCase() +
          row.leaveType.slice(1).toLowerCase(),
        total: row.total,
        exceeded: row.exceeded,
        remaining: row.remaining,
        // "used within quota" = total - remaining (capped at 0 minimum)
        usedWithinQuota: Math.max(0, row.total - row.remaining),
      };

      if (existing) {
        existing.leaves.push(leaveEntry);
        existing.totalExceededDays += row.exceeded;
      } else {
        grouped.set(row.employeeId, {
          employee: row.employee,
          leaves: [leaveEntry],
          totalExceededDays: row.exceeded,
        });
      }
    }

    // Convert map → sorted array (highest total exceeded first)
    return Array.from(grouped.values()).sort(
      (a, b) => b.totalExceededDays - a.totalExceededDays,
    );
  }

  async generateEmployeeLeaveExcel(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<Buffer> {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, email: true, role: true },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { createdAt: 'asc' },
    });

    const balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId },
      orderBy: { leaveType: 'asc' },
    });

    const MONTH_NAMES = [
      '',
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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Offera HR System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
      `Leave Report - ${MONTH_NAMES[month]} ${year}`,
    );

    const primaryColor = '3B6CF5';
    const lightBlue = 'EBF0FF';
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    sheet.columns = [
      { key: 'a', width: 22 },
      { key: 'b', width: 22 },
      { key: 'c', width: 18 },
      { key: 'd', width: 18 },
      { key: 'e', width: 14 },
      { key: 'f', width: 18 },
      { key: 'g', width: 28 },
    ];

    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Leave Report — ${MONTH_NAMES[month]} ${year}`;
    titleCell.font = {
      bold: true,
      size: 14,
      color: { argb: 'FF' + primaryColor },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:G2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = 'Generated by Offera HR System';
    subTitleCell.font = { size: 10, color: { argb: 'FF888888' } };
    subTitleCell.alignment = { horizontal: 'center' };

    sheet.addRow([]);

    const infoHeaderRow = sheet.addRow(['Employee Information']);
    infoHeaderRow.getCell(1).font = { bold: true, size: 11 };
    infoHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + lightBlue },
    };
    sheet.mergeCells(`A${infoHeaderRow.number}:G${infoHeaderRow.number}`);

    const addInfoRow = (label: string, value: string) => {
      const row = sheet.addRow([label, value]);
      row.getCell(1).font = { bold: true, size: 10 };
      row.getCell(2).font = { size: 10 };
    };

    addInfoRow('Name', employee?.name ?? '—');
    addInfoRow('Email', employee?.email ?? '—');
    addInfoRow('Role', employee?.role ?? '—');
    addInfoRow('Report Period', `${MONTH_NAMES[month]} ${year}`);
    sheet.addRow([]);

    const balHeaderRow = sheet.addRow(['Leave Balance Summary']);
    balHeaderRow.getCell(1).font = { bold: true, size: 11 };
    balHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + lightBlue },
    };
    sheet.mergeCells(`A${balHeaderRow.number}:G${balHeaderRow.number}`);

    const balColHeader = sheet.addRow([
      'Leave Type',
      'Total Allocated',
      'Used',
      'Remaining',
      'Exceeded',
      'Usage %',
    ]);
    balColHeader.eachCell((cell, colNum) => {
      if (colNum <= 5) {
        cell.font = headerFont;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF' + primaryColor },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        };
      }
    });
    balColHeader.height = 22;

    balances.forEach((bal) => {
      const used = bal.total - bal.remaining;
      const usedPct = bal.total > 0 ? Math.round((used / bal.total) * 100) : 0;
      const row = sheet.addRow([
        bal.leaveType.charAt(0) + bal.leaveType.slice(1).toLowerCase(),
        bal.total,
        used,
        bal.remaining,
        bal.exceeded,
        `${usedPct}%`,
      ]);
      row.eachCell((cell, colNum) => {
        if (colNum <= 5) {
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          };
        }
      });

      const exceededCell = row.getCell(5);
      if (bal.exceeded > 0) {
        exceededCell.font = { bold: true, color: { argb: 'FFCC0000' } };
      }
      const remainingCell = row.getCell(4);
      remainingCell.font = {
        bold: true,
        color: { argb: bal.remaining <= 2 ? 'FFCC0000' : 'FF006600' },
      };
    });

    sheet.addRow([]);

    const reqHeaderRow = sheet.addRow(['Leave Requests This Month']);
    reqHeaderRow.getCell(1).font = { bold: true, size: 11 };
    reqHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + lightBlue },
    };
    sheet.mergeCells(`A${reqHeaderRow.number}:G${reqHeaderRow.number}`);

    if (requests.length === 0) {
      const noDataRow = sheet.addRow([
        'No leave requests found for this period.',
      ]);
      noDataRow.getCell(1).font = { italic: true, color: { argb: 'FF888888' } };
      sheet.mergeCells(`A${noDataRow.number}:G${noDataRow.number}`);
    } else {
      const reqColHeader = sheet.addRow([
        'Leave Type',
        'Start Date',
        'End Date',
        'Days',
        'Half Day',
        'Status',
        'Manager Comment',
      ]);
      reqColHeader.eachCell((cell, colNum) => {
        if (colNum <= 7) {
          cell.font = headerFont;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + primaryColor },
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
      reqColHeader.height = 22;

      const STATUS_COLORS: Record<string, string> = {
        APPROVED: 'FF006600',
        REJECTED: 'FFCC0000',
        PENDING: 'FF996600',
      };

      requests.forEach((req, idx) => {
        const row = sheet.addRow([
          req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase(),
          new Date(req.startDate).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          new Date(req.endDate).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          req.totalDays,
          req.isHalfDay ? 'Yes' : 'No',
          req.status,
          req.approverComment ?? '—',
        ]);

        const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF5F7FF';
        row.eachCell((cell, colNum) => {
          if (colNum <= 7) {
            cell.alignment = { horizontal: 'center', wrapText: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor },
            };
            cell.border = {
              bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            };
          }
        });

        const statusCell = row.getCell(6);
        statusCell.font = {
          bold: true,
          color: { argb: STATUS_COLORS[req.status] ?? 'FF333333' },
        };
        row.getCell(7).alignment = { horizontal: 'left', wrapText: true };
      });
    }

    sheet.addRow([]);
    const footerRow = sheet.addRow([
      `Report generated on ${new Date().toLocaleString('en-US')}`,
    ]);
    footerRow.getCell(1).font = {
      italic: true,
      size: 9,
      color: { argb: 'FF999999' },
    };
    sheet.mergeCells(`A${footerRow.number}:G${footerRow.number}`);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Manually clear all exceeded leave days for every employee.
   *
   * Called by the HR Admin from the "Exceeded Balances" page.
   * This does the same archiving as resetMonthlyBalances() but ONLY
   * zeroes the exceeded column — it does NOT touch remaining/total.
   *
   * Flow:
   *   1. Find every LeaveBalance row where exceeded > 0
   *   2. Archive a snapshot to LeaveBalanceHistory (skips duplicates for
   *      the current month so you can call this mid-month safely)
   *   3. Set exceeded = 0 on every matching row
   *   4. Return how many rows were cleared
   */
  async clearAllExceededBalances(): Promise<{ cleared: number }> {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // Step 1 — fetch only rows that actually have exceeded days
    const exceededRows = await this.prisma.leaveBalance.findMany({
      where: { exceeded: { gt: 0 } },
    });

    if (exceededRows.length === 0) {
      return { cleared: 0 };
    }

    // Step 2 — archive current state before wiping
    // skipDuplicates = true so this is safe even if called multiple times
    // in the same month (won't overwrite an existing history row).
    // await this.prisma.leaveBalanceHistory.createMany({
    //   data: exceededRows.map((b) => ({
    //     employeeId: b.employeeId,
    //     leaveType: b.leaveType,
    //     month,
    //     year,
    //     total: b.total,
    //     used: Math.max(0, b.total - b.remaining), // within-quota used
    //     remaining: b.remaining,
    //     // Uncomment once you add `exceeded Float @default(0)` to schema:
    //     exceeded: b.exceeded,
    //   })),
    //   skipDuplicates: true,
    // });
    await Promise.all(
      exceededRows.map((b) =>
        this.prisma.leaveBalanceHistory.upsert({
          where: {
            // Uses the @@unique composite key
            employeeId_leaveType_month_year: {
              employeeId: b.employeeId,
              leaveType: b.leaveType,
              month,
              year,
            },
          },
          // If a row already exists for this month, update it with latest values
          update: {
            total: b.total,
            used: Math.max(0, b.total - b.remaining),
            remaining: b.remaining,
            exceeded: b.exceeded, // ← THE FIX: store the real exceeded value
          },
          // If no row exists yet, create it
          create: {
            employeeId: b.employeeId,
            leaveType: b.leaveType,
            month,
            year,
            total: b.total,
            used: Math.max(0, b.total - b.remaining),
            remaining: b.remaining,
            exceeded: b.exceeded, // ← THE FIX: store the real exceeded value
          },
        }),
      ),
    );
    // Step 3 — zero out exceeded for every affected row
    await this.prisma.leaveBalance.updateMany({
      where: { exceeded: { gt: 0 } },
      data: { exceeded: 0 },
    });

    return { cleared: exceededRows.length };
  }

  /**
   * getExceededHistory()
   *
   * Returns all LeaveBalanceHistory rows where exceeded > 0,
   * joined with employee info.
   *
   * Optional filters:
   *   - year:       only that calendar year
   *   - month:      only that month (1-12)
   *   - employeeId: only that employee
   *   - search:     matches against employee name or email (case-insensitive)
   *
   * Shape returned to the frontend:
   *   Array of {
   *     id, employeeId, leaveType, month, year,
   *     total, used, remaining, exceeded, createdAt,
   *     employee: { id, name, email, department, role, avatar }
   *   }
   *
   * The frontend groups these by year → month for display.
   */
  async getExceededHistory(filters?: {
    year?: number;
    month?: number;
    employeeId?: string;
    search?: string;
  }) {
    const baseExceededCondition: Prisma.LeaveBalanceHistoryWhereInput = {
      OR: [
        { exceeded: { gt: 0 } }, // correctly stored exceeded value
        {
          // safety net: used more than quota
          AND: [
            { used: { gt: 0 } },
            // Prisma doesn't support field-vs-field comparisons directly,
            // so we use a raw filter workaround via a NOT condition:
            // We check used > total by ensuring NOT (used <= total).
            // Since Prisma doesn't support col > col, we use $queryRaw for
            // this specific sub-filter — see note below.
            // For now, include all rows with used > 0 and exceeded = 0,
            // then filter in JS after fetching:
            { exceeded: 0 },
          ],
        },
      ],
    };

    // if (filters?.year) baseExceededCondition.year = filters.year;
    // if (filters?.month) baseExceededCondition.month = filters.month;
    // if (filters?.employeeId)
    //   baseExceededCondition.employeeId = filters.employeeId;

    // Text search: match against employee name OR email
    // if (filters?.search?.trim()) {
    //   baseExceededCondition.employee = {
    //     OR: [
    //       { name: { contains: filters.search, mode: 'insensitive' } },
    //       { email: { contains: filters.search, mode: 'insensitive' } },
    //     ],
    //   };
    // }
    const employeeFilter: Prisma.LeaveBalanceHistoryWhereInput =
      filters?.search?.trim()
        ? {
            employee: {
              OR: [
                {
                  name: {
                    contains: filters.search.trim(),
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: filters.search.trim(),
                    mode: 'insensitive',
                  },
                },
              ],
            },
          }
        : {};

    const where: Prisma.LeaveBalanceHistoryWhereInput = {
      AND: [
        baseExceededCondition,
        employeeFilter,
        filters?.year ? { year: filters.year } : {},
        filters?.month ? { month: filters.month } : {},
        filters?.employeeId ? { employeeId: filters.employeeId } : {},
      ].filter((c) => Object.keys(c).length > 0), // remove empty objects
    };

    const rows = await this.prisma.leaveBalanceHistory.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { employee: { name: 'asc' } },
        { leaveType: 'asc' },
      ],
    });

    const filtered = rows.filter((r) => {
      const exceeded = r.exceeded;
      const used = r.used;
      const total = r.total;
      return exceeded > 0 || used > total;
    });

    const result: ExceededHistoryRecord[] = filtered.map((r) => {
      const exceeded = r.exceeded;
      const used = r.used;
      const total = r.total;

      return {
        id: r.id,
        employeeId: r.employeeId,
        leaveType: r.leaveType,
        month: r.month,
        year: r.year,
        total,
        used,
        remaining: r.remaining,
        createdAt: r.createdAt,
        // If exceeded was stored correctly, use it.
        // If it was stored as 0 but used > total, derive it.
        exceeded: exceeded > 0 ? exceeded : Math.max(0, used - total),
        employee: {
          id: r.employee.id,
          name: r.employee.name,
          email: r.employee.email,
          department: r.employee.department,
          role: r.employee.role,
          avatar: r.employee.avatar,
        },
      };
    });

    return result;

    // return rows;
  }

  /**
   * getExceededHistoryYears()
   *
   * Returns the distinct years that have exceeded history records.
   * Used to populate the year filter dropdown on the history page.
   */
  async getExceededHistoryYears(): Promise<number[]> {
    const rows = await this.prisma.leaveBalanceHistory.findMany({
      where: { exceeded: { gt: 0 } },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });
    return rows.map((r) => r.year);
  }

  async resetYearEndBalances(): Promise<YearEndResetResult> {
    // const now = new Date();
    // const year = now.getFullYear();
    // // Archive as month 12 of the closing year so history is clearly "year-end"
    // const month = 12;
    const now: Date = new Date();
    const year: number = now.getFullYear();
    const month: number = 12;
    // ── Step 1: fetch every current balance ──────────────────────────────────
    const allBalances = await this.prisma.leaveBalance.findMany();

    await Promise.all(
      allBalances.map((b) =>
        this.prisma.leaveBalanceHistory.upsert({
          where: {
            employeeId_leaveType_month_year: {
              employeeId: b.employeeId,
              leaveType: b.leaveType,
              month, // month = 12 in resetYearEndBalances
              year,
            },
          },
          update: {
            total: b.total,
            used: Math.max(0, b.total - b.remaining),
            remaining: b.remaining,
            exceeded: b.exceeded,
          },
          create: {
            employeeId: b.employeeId,
            leaveType: b.leaveType,
            month,
            year,
            total: b.total,
            used: Math.max(0, b.total - b.remaining),
            remaining: b.remaining,
            exceeded: b.exceeded,
          },
        }),
      ),
    );
    const deleteResult = await this.prisma.leaveBalance.deleteMany({});
    const policies = await this.prisma.leavePolicy.findMany({
      where: { isActive: true },
    });

    const users = await this.prisma.user.findMany({
      select: { id: true },
    });
    const newBalances = users.flatMap((u) =>
      policies.map((p) => ({
        employeeId: u.id,
        leaveType: p.leaveType,
        total: p.defaultQuota,
        remaining: p.defaultQuota,
        exceeded: 0,
        leavePolicyId: p.id,
      })),
    );

    const createResult = await this.prisma.leaveBalance.createMany({
      data: newBalances,
      skipDuplicates: true,
    });
    const archived: number = allBalances.length;
    const deleted: number = deleteResult.count;
    const created: number = createResult.count;

    // Explicit object literal — no spread, no inference ambiguity.
    // TypeScript can trivially check this satisfies Promise<YearEndResetResult>.
    return {
      archived,
      deleted,
      created,
      year,
    };
    // return {
    //   archived: allBalances.length,
    //   deleted: deleted.count,
    //   created: created.count,
    //   year,
    // };
  }

  async repairExceededHistory(): Promise<{ repaired: number }> {
    // Find all history rows that may have been stored with exceeded=0 incorrectly.
    // We target rows where:
    //   - exceeded = 0 (was never correctly written)
    //   - used > 0    (employee actually used some days — worth investigating)
    const suspectRows = await this.prisma.leaveBalanceHistory.findMany({
      where: {
        exceeded: 0,
        used: { gt: 0 }, // skip rows where no days were used at all
      },
    });

    if (suspectRows.length === 0) {
      return { repaired: 0 };
    }

    let repaired = 0;

    for (const row of suspectRows) {
      // For this employee + leaveType + month + year, find all APPROVED
      // leave requests whose startDate falls in that month.
      // Sum their totalDays to get total approved usage.
      const startOfMonth = new Date(row.year, row.month - 1, 1);
      const endOfMonth = new Date(row.year, row.month, 0, 23, 59, 59);

      const approvedRequests = await this.prisma.leaveRequest.findMany({
        where: {
          employeeId: row.employeeId,
          leaveType: row.leaveType,
          status: 'APPROVED',
          startDate: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { totalDays: true },
      });

      const totalApproved = approvedRequests.reduce(
        (sum, r) => sum + (r.totalDays ?? 0),
        0,
      );

      // exceeded = approved days beyond the quota
      // If total approved <= quota (row.total), exceeded = 0 (correctly 0)
      // If total approved > quota, the difference is the real exceeded value
      const derivedExceeded = Math.max(0, totalApproved - row.total);

      if (derivedExceeded > 0) {
        await this.prisma.leaveBalanceHistory.update({
          where: { id: row.id },
          data: { exceeded: derivedExceeded },
        });
        repaired++;
      }
    }

    return { repaired };
  }
}
