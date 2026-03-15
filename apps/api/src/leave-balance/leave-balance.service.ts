// // leave-balance/leave-balance.service.ts
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import * as ExcelJS from 'exceljs';
// import { Prisma } from '@prisma/client';

// @Injectable()
// export class LeaveBalanceService {
//   constructor(private prisma: PrismaService) {}

//   async getByEmployee(employeeId: string) {
//     const balances = await this.prisma.leaveBalance.findMany({
//       where: { employeeId },
//       orderBy: { leaveType: 'asc' },
//     });

//     if (balances.length === 0) {
//       console.log(`No balances found for ${employeeId} — auto seeding...`);
//       await this.seedBalancesForEmployee(employeeId);
//       return this.prisma.leaveBalance.findMany({
//         where: { employeeId },
//         orderBy: { leaveType: 'asc' },
//       });
//     }

//     return balances;
//   }

//   async seedBalancesForEmployee(employeeId: string) {
//     const employee = await this.prisma.user.findUnique({
//       where: { id: employeeId },
//     });

//     if (!employee) {
//       console.error(`Cannot seed balances: Employee ${employeeId} not found.`);
//       return;
//     }

//     const policies = await this.prisma.leavePolicy.findMany({
//       where: { isActive: true },
//     });

//     if (policies.length === 0) {
//       console.log('No active policies found — nothing to seed');
//       return;
//     }

//     const result = await this.prisma.leaveBalance.createMany({
//       data: policies.map((p) => ({
//         employeeId,
//         leaveType: p.leaveType,
//         total: p.defaultQuota,
//         remaining: p.defaultQuota,
//         leavePolicyId: p.id,
//       })),
//       skipDuplicates: true,
//     });

//     console.log(
//       `Auto-seeded ${result.count} balances for employee ${employeeId}`,
//     );
//     return result;
//   }

//   async seedBalancesForAllPolicies() {
//     const policies = await this.prisma.leavePolicy.findMany({
//       where: { isActive: true },
//     });

//     const users = await this.prisma.user.findMany({
//       select: { id: true, role: true },
//     });
//     console.log(`Seeding ${users.length} users x ${policies.length} policies`);

//     let created = 0;
//     for (const policy of policies) {
//       const result = await this.prisma.leaveBalance.createMany({
//         data: users.map((u) => ({
//           employeeId: u.id,
//           leaveType: policy.leaveType,
//           total: policy.defaultQuota,
//           remaining: policy.defaultQuota,
//           leavePolicyId: policy.id,
//         })),
//         skipDuplicates: true,
//       });
//       created += result.count;
//     }

//     return {
//       message: `Seeded ${created} balances for ${users.length} users across ${policies.length} policies.`,
//     };
//   }

//   async resetMonthlyBalances() {
//     const now = new Date();
//     const month = now.getMonth() + 1;
//     const year = now.getFullYear();

//     const balances = await this.prisma.leaveBalance.findMany();

//     await this.prisma.leaveBalanceHistory.createMany({
//       data: balances.map((b) => ({
//         employeeId: b.employeeId,
//         leaveType: b.leaveType,
//         month,
//         year,
//         total: b.total,
//         used: b.total - b.remaining,
//         remaining: b.remaining,
//       })),
//       skipDuplicates: true,
//     });

//     await Promise.all(
//       balances.map((b) =>
//         this.prisma.leaveBalance.update({
//           where: { id: b.id },
//           data: { remaining: b.total },
//         }),
//       ),
//     );

//     return {
//       message: `Archived and reset ${balances.length} balances for ${month}/${year}.`,
//     };
//   }

//   async getHistoryByEmployee(employeeId: string) {
//     return await this.prisma.leaveBalanceHistory.findMany({
//       where: { employeeId },
//       orderBy: [{ year: 'desc' }, { month: 'desc' }],
//     });
//   }

//   // Add these two methods to leave-balance.service.ts

//   // HR Admin — get all employees balance history
//   // Optionally filter by month and year
//   async getAllEmployeesHistory(month?: number, year?: number) {
//     const where: Prisma.LeaveBalanceHistoryWhereInput = {};

//     if (month) where.month = month;
//     if (year) where.year = year;

//     const history = await this.prisma.leaveBalanceHistory.findMany({
//       where,
//       include: {
//         employee: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             role: true,
//           },
//         },
//       },
//       orderBy: [{ year: 'desc' }, { month: 'desc' }, { leaveType: 'asc' }],
//     });

//     return history;
//   }

//   // HR Admin — get all leave requests for a specific month/year
//   async getLeaveRequestsHistory(
//     month?: number,
//     year?: number,
//     employeeId?: string,
//   ) {
//     const where: Prisma.LeaveRequestWhereInput = {};

//     // Filter by month/year using date range
//     if (month && year) {
//       const startOfMonth = new Date(year, month - 1, 1);
//       const endOfMonth = new Date(year, month, 0, 23, 59, 59);
//       where.createdAt = {
//         gte: startOfMonth,
//         lte: endOfMonth,
//       };
//     } else if (year) {
//       where.createdAt = {
//         gte: new Date(year, 0, 1),
//         lte: new Date(year, 11, 31, 23, 59, 59),
//       };
//     }

//     if (employeeId) where.employeeId = employeeId;

//     return this.prisma.leaveRequest.findMany({
//       where,
//       include: {
//         employee: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             role: true,
//           },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   // Add this import at the top of leave-balance.service.ts
//   // Add this method inside LeaveBalanceService class
//   async generateEmployeeLeaveExcel(
//     employeeId: string,
//     month: number,
//     year: number,
//   ): Promise<Buffer> {
//     // 1. Fetch employee info
//     const employee = await this.prisma.user.findUnique({
//       where: { id: employeeId },
//       select: { id: true, name: true, email: true, role: true },
//     });

//     // 2. Fetch leave requests for that employee in that month
//     const startOfMonth = new Date(year, month - 1, 1);
//     const endOfMonth = new Date(year, month, 0, 23, 59, 59);

//     const requests = await this.prisma.leaveRequest.findMany({
//       where: {
//         employeeId,
//         createdAt: { gte: startOfMonth, lte: endOfMonth },
//       },
//       orderBy: { createdAt: 'asc' },
//     });

//     // 3. Fetch leave balances
//     const balances = await this.prisma.leaveBalance.findMany({
//       where: { employeeId },
//       orderBy: { leaveType: 'asc' },
//     });

//     const MONTH_NAMES = [
//       '',
//       'January',
//       'February',
//       'March',
//       'April',
//       'May',
//       'June',
//       'July',
//       'August',
//       'September',
//       'October',
//       'November',
//       'December',
//     ];

//     // 4. Build Excel workbook
//     const workbook = new ExcelJS.Workbook();
//     workbook.creator = 'Offera HR System';
//     workbook.created = new Date();

//     const sheet = workbook.addWorksheet(
//       `Leave Report - ${MONTH_NAMES[month]} ${year}`,
//     );

//     // ── Header colors ──
//     const primaryColor = '3B6CF5';
//     const lightBlue = 'EBF0FF';
//     const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

//     // ── Column widths ──
//     sheet.columns = [
//       { key: 'a', width: 22 },
//       { key: 'b', width: 22 },
//       { key: 'c', width: 18 },
//       { key: 'd', width: 18 },
//       { key: 'e', width: 14 },
//       { key: 'f', width: 18 },
//       { key: 'g', width: 28 },
//     ];

//     // ── Title block ──
//     sheet.mergeCells('A1:G1');
//     const titleCell = sheet.getCell('A1');
//     titleCell.value = `Leave Report — ${MONTH_NAMES[month]} ${year}`;
//     titleCell.font = {
//       bold: true,
//       size: 14,
//       color: { argb: 'FF' + primaryColor },
//     };
//     titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
//     sheet.getRow(1).height = 30;

//     sheet.mergeCells('A2:G2');
//     const subTitleCell = sheet.getCell('A2');
//     subTitleCell.value = 'Generated by Offera HR System';
//     subTitleCell.font = { size: 10, color: { argb: 'FF888888' } };
//     subTitleCell.alignment = { horizontal: 'center' };

//     sheet.addRow([]); // blank row

//     // ── Employee Info block ──
//     const infoHeaderRow = sheet.addRow(['Employee Information']);
//     infoHeaderRow.getCell(1).font = { bold: true, size: 11 };
//     infoHeaderRow.getCell(1).fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FF' + lightBlue },
//     };
//     sheet.mergeCells(`A${infoHeaderRow.number}:G${infoHeaderRow.number}`);

//     const addInfoRow = (label: string, value: string) => {
//       const row = sheet.addRow([label, value]);
//       row.getCell(1).font = { bold: true, size: 10 };
//       row.getCell(2).font = { size: 10 };
//     };

//     addInfoRow('Name', employee?.name ?? '—');
//     addInfoRow('Email', employee?.email ?? '—');
//     addInfoRow('Role', employee?.role ?? '—');
//     addInfoRow('Report Period', `${MONTH_NAMES[month]} ${year}`);

//     sheet.addRow([]); // blank row

//     // ── Leave Balance Summary ──
//     const balHeaderRow = sheet.addRow(['Leave Balance Summary']);
//     balHeaderRow.getCell(1).font = { bold: true, size: 11 };
//     balHeaderRow.getCell(1).fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FF' + lightBlue },
//     };
//     sheet.mergeCells(`A${balHeaderRow.number}:G${balHeaderRow.number}`);

//     // Balance table header
//     const balColHeader = sheet.addRow([
//       'Leave Type',
//       'Total Allocated',
//       'Used',
//       'Remaining',
//       'Usage %',
//     ]);
//     balColHeader.eachCell((cell, colNum) => {
//       if (colNum <= 5) {
//         cell.font = headerFont;
//         cell.fill = {
//           type: 'pattern',
//           pattern: 'solid',
//           fgColor: { argb: 'FF' + primaryColor },
//         };
//         cell.alignment = { horizontal: 'center', vertical: 'middle' };
//         cell.border = {
//           bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
//         };
//       }
//     });
//     balColHeader.height = 22;

//     balances.forEach((bal) => {
//       const used = bal.total - bal.remaining;
//       const usedPct = bal.total > 0 ? Math.round((used / bal.total) * 100) : 0;
//       const row = sheet.addRow([
//         bal.leaveType.charAt(0) + bal.leaveType.slice(1).toLowerCase(),
//         bal.total,
//         used,
//         bal.remaining,
//         `${usedPct}%`,
//       ]);
//       row.eachCell((cell, colNum) => {
//         if (colNum <= 5) {
//           cell.alignment = { horizontal: 'center' };
//           cell.border = {
//             bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
//           };
//         }
//       });
//       // Color the remaining cell
//       const remainingCell = row.getCell(4);
//       remainingCell.font = {
//         bold: true,
//         color: {
//           argb: bal.remaining <= 2 ? 'FFCC0000' : 'FF006600',
//         },
//       };
//     });

//     sheet.addRow([]); // blank row

//     // ── Leave Requests Detail ──
//     const reqHeaderRow = sheet.addRow(['Leave Requests This Month']);
//     reqHeaderRow.getCell(1).font = { bold: true, size: 11 };
//     reqHeaderRow.getCell(1).fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FF' + lightBlue },
//     };
//     sheet.mergeCells(`A${reqHeaderRow.number}:G${reqHeaderRow.number}`);

//     if (requests.length === 0) {
//       const noDataRow = sheet.addRow([
//         'No leave requests found for this period.',
//       ]);
//       noDataRow.getCell(1).font = {
//         italic: true,
//         color: { argb: 'FF888888' },
//       };
//       sheet.mergeCells(`A${noDataRow.number}:G${noDataRow.number}`);
//     } else {
//       // Request table header
//       const reqColHeader = sheet.addRow([
//         'Leave Type',
//         'Start Date',
//         'End Date',
//         'Days',
//         'Half Day',
//         'Status',
//         'Manager Comment',
//       ]);
//       reqColHeader.eachCell((cell, colNum) => {
//         if (colNum <= 7) {
//           cell.font = headerFont;
//           cell.fill = {
//             type: 'pattern',
//             pattern: 'solid',
//             fgColor: { argb: 'FF' + primaryColor },
//           };
//           cell.alignment = { horizontal: 'center', vertical: 'middle' };
//         }
//       });
//       reqColHeader.height = 22;

//       const STATUS_COLORS: Record<string, string> = {
//         APPROVED: 'FF006600',
//         REJECTED: 'FFCC0000',
//         PENDING: 'FF996600',
//       };

//       requests.forEach((req, idx) => {
//         const row = sheet.addRow([
//           req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase(),
//           new Date(req.startDate).toLocaleDateString('en-US', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//           }),
//           new Date(req.endDate).toLocaleDateString('en-US', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//           }),
//           req.totalDays,
//           req.isHalfDay ? 'Yes' : 'No',
//           req.status,
//           req.approverComment ?? '—',
//         ]);

//         // Alternating row color
//         const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF5F7FF';
//         row.eachCell((cell, colNum) => {
//           if (colNum <= 7) {
//             cell.alignment = { horizontal: 'center', wrapText: true };
//             cell.fill = {
//               type: 'pattern',
//               pattern: 'solid',
//               fgColor: { argb: bgColor },
//             };
//             cell.border = {
//               bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
//             };
//           }
//         });

//         // Color status cell
//         const statusCell = row.getCell(6);
//         statusCell.font = {
//           bold: true,
//           color: { argb: STATUS_COLORS[req.status] ?? 'FF333333' },
//         };

//         // Left-align comment
//         row.getCell(7).alignment = { horizontal: 'left', wrapText: true };
//       });
//     }

//     // ── Footer ──
//     sheet.addRow([]);
//     const footerRow = sheet.addRow([
//       `Report generated on ${new Date().toLocaleString('en-US')}`,
//     ]);
//     footerRow.getCell(1).font = {
//       italic: true,
//       size: 9,
//       color: { argb: 'FF999999' },
//     };
//     sheet.mergeCells(`A${footerRow.number}:G${footerRow.number}`);

//     // 5. Write to buffer and return
//     const arrayBuffer = await workbook.xlsx.writeBuffer();
//     return Buffer.from(arrayBuffer);
//   }
// }

// leave-balance/leave-balance.service.ts
// REPLACE your existing leave-balance.service.ts with this file.
// Changes from original:
//   1. Added resetYearlyBalances()  ← NEW: yearly reset + snapshot
//   2. Added getYearlySnapshotsByEmployee()  ← NEW: employee/admin can see yearly history
//   3. Added getYearlySnapshotsAll()  ← NEW: HR Admin sees all yearly snapshots
//   4. All original methods kept exactly as-is (no breaking changes)

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaveBalanceService {
  constructor(private prisma: PrismaService) {}

  // ─── (UNCHANGED) Get balances for one employee ───────────────────────────
  async getByEmployee(employeeId: string) {
    const balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId },
      orderBy: { leaveType: 'asc' },
    });

    if (balances.length === 0) {
      console.log(`No balances found for ${employeeId} — auto seeding...`);
      await this.seedBalancesForEmployee(employeeId);
      return this.prisma.leaveBalance.findMany({
        where: { employeeId },
        orderBy: { leaveType: 'asc' },
      });
    }

    return balances;
  }

  // ─── (UNCHANGED) Seed balances for one employee ──────────────────────────
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
      console.log('No active policies found — nothing to seed');
      return;
    }

    const result = await this.prisma.leaveBalance.createMany({
      data: policies.map((p) => ({
        employeeId,
        leaveType: p.leaveType,
        total: p.defaultQuota,
        remaining: p.defaultQuota,
        leavePolicyId: p.id,
      })),
      skipDuplicates: true,
    });

    console.log(
      `Auto-seeded ${result.count} balances for employee ${employeeId}`,
    );
    return result;
  }

  // ─── (UNCHANGED) Seed balances for all employees and policies ───────────
  async seedBalancesForAllPolicies() {
    const policies = await this.prisma.leavePolicy.findMany({
      where: { isActive: true },
    });

    const users = await this.prisma.user.findMany({
      select: { id: true, role: true },
    });
    console.log(`Seeding ${users.length} users x ${policies.length} policies`);

    let created = 0;
    for (const policy of policies) {
      const result = await this.prisma.leaveBalance.createMany({
        data: users.map((u) => ({
          employeeId: u.id,
          leaveType: policy.leaveType,
          total: policy.defaultQuota,
          remaining: policy.defaultQuota,
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

  // ─── (UNCHANGED) Monthly reset (archives current month, resets remaining) ─
  async resetMonthlyBalances() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const balances = await this.prisma.leaveBalance.findMany();

    await this.prisma.leaveBalanceHistory.createMany({
      data: balances.map((b) => ({
        employeeId: b.employeeId,
        leaveType: b.leaveType,
        month,
        year,
        total: b.total,
        used: b.total - b.remaining,
        remaining: b.remaining,
      })),
      skipDuplicates: true,
    });

    await Promise.all(
      balances.map((b) =>
        this.prisma.leaveBalance.update({
          where: { id: b.id },
          data: { remaining: b.total },
        }),
      ),
    );

    return {
      message: `Archived and reset ${balances.length} balances for ${month}/${year}.`,
    };
  }

  // ─── (UNCHANGED) Monthly history for one employee ────────────────────────
  async getHistoryByEmployee(employeeId: string) {
    return await this.prisma.leaveBalanceHistory.findMany({
      where: { employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  // ─── (UNCHANGED) HR Admin: all employees monthly history ─────────────────
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

  // ─── (UNCHANGED) Leave request history ───────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW METHOD: resetYearlyBalances
  // ─────────────────────────────────────────────────────────────────────────
  // Call this ONCE per year (e.g. via a cron job on Jan 1st, or manually
  // from an HR Admin endpoint).
  //
  // What it does:
  //   1. Reads all current LeaveBalance rows
  //   2. Saves a snapshot into LeaveBalanceYearlySnapshot (previous year data)
  //   3. Resets every employee's remaining back to the policy's defaultQuota
  //
  // Previous year's data is stored permanently in LeaveBalanceYearlySnapshot
  // and is never deleted.
  // ═══════════════════════════════════════════════════════════════════════════
  async resetYearlyBalances(targetYear?: number) {
    // The year we are snapshotting = current year (or explicitly provided)
    const year = targetYear ?? new Date().getFullYear();

    console.log(`[resetYearlyBalances] Starting yearly reset for year ${year}`);

    // 1. Fetch all current balances with their associated policies
    const balances = await this.prisma.leaveBalance.findMany({
      include: {
        leavePolicy: true, // we need defaultQuota to reset
      },
    });

    if (balances.length === 0) {
      console.log('[resetYearlyBalances] No balances found — nothing to reset');
      return { message: 'No balances to reset', snapshotCount: 0 };
    }

    // 2. Save yearly snapshots (skip if already snapshotted for this year)
    //    Each record is unique on [employeeId, leaveType, year]
    const snapshotResult =
      await this.prisma.leaveBalanceYearlySnapshot.createMany({
        data: balances.map((b) => ({
          employeeId: b.employeeId,
          leaveType: b.leaveType,
          year,
          total: b.total,
          used: b.total - b.remaining, // days consumed during the year
          remaining: b.remaining, // unused days at year end
        })),
        skipDuplicates: true, // safe to call multiple times — won't duplicate
      });

    console.log(
      `[resetYearlyBalances] Saved ${snapshotResult.count} yearly snapshots for year ${year}`,
    );

    // 3. Reset each employee's remaining to the policy defaultQuota
    //    (i.e. fresh allocation for the new year)
    let resetCount = 0;
    for (const balance of balances) {
      const newQuota = balance.leavePolicy?.defaultQuota ?? balance.total;
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          total: newQuota, // in case policy quota was updated during the year
          remaining: newQuota, // full reset for new year
        },
      });
      resetCount++;
    }

    console.log(
      `[resetYearlyBalances] Reset ${resetCount} balances to new-year quotas`,
    );

    return {
      message: `Yearly reset complete for ${year}. Snapshotted ${snapshotResult.count} records, reset ${resetCount} balances.`,
      year,
      snapshotCount: snapshotResult.count,
      resetCount,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW METHOD: getYearlySnapshotsByEmployee
  // ─────────────────────────────────────────────────────────────────────────
  // Returns yearly balance snapshots for a specific employee.
  // Both the employee themselves AND HR admins can call this.
  // ═══════════════════════════════════════════════════════════════════════════
  async getYearlySnapshotsByEmployee(employeeId: string) {
    return this.prisma.leaveBalanceYearlySnapshot.findMany({
      where: { employeeId },
      orderBy: [{ year: 'desc' }, { leaveType: 'asc' }],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW METHOD: getYearlySnapshotsAll
  // ─────────────────────────────────────────────────────────────────────────
  // HR Admin: get all yearly snapshots, optionally filtered by year.
  // Returns snapshots with full employee info.
  // ═══════════════════════════════════════════════════════════════════════════
  async getYearlySnapshotsAll(year?: number) {
    const where: Prisma.LeaveBalanceYearlySnapshotWhereInput = {};
    if (year) where.year = year;

    return this.prisma.leaveBalanceYearlySnapshot.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { leaveType: 'asc' }],
    });
  }

  // ─── (UNCHANGED) Generate Excel report for one employee ──────────────────
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
      const remainingCell = row.getCell(4);
      remainingCell.font = {
        bold: true,
        color: {
          argb: bal.remaining <= 2 ? 'FFCC0000' : 'FF006600',
        },
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
      noDataRow.getCell(1).font = {
        italic: true,
        color: { argb: 'FF888888' },
      };
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
}
