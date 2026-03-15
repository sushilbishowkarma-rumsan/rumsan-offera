// // exceeded-leave/exceeded-leave.service.ts
// // Place this file at: src/exceeded-leave/exceeded-leave.service.ts

// import {
//   Injectable,
//   BadRequestException,
//   NotFoundException,
//   ForbiddenException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateExceededLeaveDto } from './dto/create-exceeded-leave.dto';
// import {
//   ExceededLeaveAction,
//   UpdateExceededLeaveDto,
// } from './dto/update-exceeded-leave.dto';
// import { NotificationsService } from '../notifications/notifications.service';

// @Injectable()
// export class ExceededLeaveService {
//   constructor(
//     private prisma: PrismaService,
//     private notificationsService: NotificationsService,
//   ) {}

//   // ─── Create an exceeded leave request ─────────────────────────────────────
//   // Called when employee submits a leave but has 0 (or insufficient) balance.
//   // Instead of blocking the request, it is stored here for admin review.
//   async create(dto: CreateExceededLeaveDto) {
//     const start = new Date(dto.startDate);
//     const end = new Date(dto.endDate);

//     if (end < start) {
//       throw new BadRequestException(
//         'End date cannot be earlier than start date',
//       );
//     }

//     const employee = await this.prisma.user.findUnique({
//       where: { id: dto.employeeId },
//     });

//     if (!employee) {
//       throw new BadRequestException('Employee not found');
//     }

//     // Check current balance to calculate actual exceeded days
//     const balance = await this.prisma.leaveBalance.findUnique({
//       where: {
//         employeeId_leaveType: {
//           employeeId: dto.employeeId,
//           leaveType: dto.leaveType.toUpperCase(),
//         },
//       },
//     });

//     // Remaining balance (0 if no balance record found)
//     const remaining = balance?.remaining ?? 0;
//     // Exceeded days = requested days minus available days (minimum 0)
//     const exceededDays = Math.max(0, dto.totalDays - remaining);

//     const request = await this.prisma.exceededLeaveRequest.create({
//       data: {
//         startDate: start,
//         endDate: end,
//         leaveType: dto.leaveType.toUpperCase(),
//         reason: dto.reason,
//         totalDays: dto.totalDays,
//         exceededDays,
//         isHalfDay: dto.isHalfDay ?? false,
//         halfDayPeriod: dto.isHalfDay ? (dto.halfDayPeriod ?? 'FIRST') : null,
//         department: employee.department ?? dto.department,
//         employeeId: dto.employeeId,
//         managerId: dto.managerId,
//         status: 'PENDING',
//       },
//       include: {
//         employee: true,
//         manager: true,
//       },
//     });

//     // Notify manager about the exceeded leave request
//     if (request.managerId) {
//       await this.notificationsService.create({
//         userId: request.managerId,
//         type: 'exceeded_leave_submitted',
//         title: 'Exceeded Leave Request',
//         message: `${request.employee.name ?? request.employee.email} submitted an exceeded leave request (${exceededDays} day(s) over quota)`,
//         linkTo: `/dashboard/approvals`,
//         relatedRequestId: request.id,
//       });
//     }

//     return request;
//   }

//   // ─── Get all exceeded leaves for a single employee ────────────────────────
//   // Used by: employee viewing their own exceeded leave history
//   async findAllByEmployee(employeeId: string) {
//     return this.prisma.exceededLeaveRequest.findMany({
//       where: { employeeId },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   // ─── Get all exceeded leaves assigned to a manager ────────────────────────
//   // Used by: manager reviewing their team's exceeded leave requests
//   async findAllByManager(managerId: string) {
//     return this.prisma.exceededLeaveRequest.findMany({
//       where: { managerId },
//       orderBy: { createdAt: 'desc' },
//       include: {
//         employee: {
//           select: { id: true, name: true, email: true, avatar: true },
//         },
//       },
//     });
//   }

//   // ─── Get ALL exceeded leaves (HR Admin only) ──────────────────────────────
//   // Returns all exceeded leave requests across all employees with full details
//   async findAll() {
//     return this.prisma.exceededLeaveRequest.findMany({
//       include: {
//         employee: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             role: true,
//             department: true,
//           },
//         },
//         manager: {
//           select: { id: true, name: true, email: true },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   // ─── Get exceeded summary per employee (HR Admin) ─────────────────────────
//   // Returns total exceeded days grouped by employee and leave type.
//   // Useful for a summary dashboard view.
//   async getExceededSummary() {
//     const all = await this.prisma.exceededLeaveRequest.findMany({
//       include: {
//         employee: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             department: true,
//             role: true,
//           },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     // Group by employeeId → leaveType → sum exceededDays
//     const summaryMap: Record<
//       string,
//       {
//         employee: {
//           id: string;
//           name: string | null;
//           email: string;
//           department: string | null;
//           role: string;
//         };
//         totalExceededDays: number;
//         byLeaveType: Record<string, number>;
//         requests: typeof all;
//       }
//     > = {};

//     for (const req of all) {
//       const key = req.employeeId;
//       if (!summaryMap[key]) {
//         summaryMap[key] = {
//           employee: req.employee,
//           totalExceededDays: 0,
//           byLeaveType: {},
//           requests: [],
//         };
//       }
//       summaryMap[key].totalExceededDays += req.exceededDays;
//       summaryMap[key].byLeaveType[req.leaveType] =
//         (summaryMap[key].byLeaveType[req.leaveType] ?? 0) + req.exceededDays;
//       summaryMap[key].requests.push(req);
//     }

//     return Object.values(summaryMap);
//   }

//   // ─── Get exceeded summary for a specific employee ─────────────────────────
//   // Returns exceeded total per leave type for one employee.
//   // Used by: employee's own profile / leave page
//   async getExceededSummaryByEmployee(employeeId: string) {
//     const requests = await this.prisma.exceededLeaveRequest.findMany({
//       where: { employeeId },
//       orderBy: { createdAt: 'desc' },
//     });

//     // Build per-leaveType totals
//     const byLeaveType: Record<
//       string,
//       { totalExceeded: number; count: number }
//     > = {};

//     let grandTotal = 0;
//     for (const req of requests) {
//       grandTotal += req.exceededDays;
//       if (!byLeaveType[req.leaveType]) {
//         byLeaveType[req.leaveType] = { totalExceeded: 0, count: 0 };
//       }
//       byLeaveType[req.leaveType].totalExceeded += req.exceededDays;
//       byLeaveType[req.leaveType].count += 1;
//     }

//     return {
//       employeeId,
//       grandTotalExceededDays: grandTotal,
//       byLeaveType,
//       requests,
//     };
//   }

//   // ─── Update status (approve/reject) — Manager or HR Admin ─────────────────
//   async updateStatus(
//     requestId: string,
//     managerId: string,
//     dto: UpdateExceededLeaveDto,
//   ) {
//     const request = await this.prisma.exceededLeaveRequest.findUnique({
//       where: { id: requestId },
//       include: { employee: true },
//     });

//     if (!request)
//       throw new NotFoundException('Exceeded leave request not found');

//     // Only the assigned manager (or HR admin handled in controller) can act
//     if (request.managerId !== managerId) {
//       throw new ForbiddenException('Not authorized to update this request');
//     }

//     if (request.status !== 'PENDING') {
//       throw new BadRequestException('Request has already been processed');
//     }

//     if (
//       dto.action === ExceededLeaveAction.REJECT &&
//       !dto.approverComment?.trim()
//     ) {
//       throw new BadRequestException('Comment required when rejecting');
//     }

//     const updated = await this.prisma.exceededLeaveRequest.update({
//       where: { id: requestId },
//       data: {
//         status: dto.action,
//         approverComment: dto.approverComment,
//       },
//     });

//     // Notify the employee of the decision
//     await this.notificationsService.create({
//       userId: request.employeeId,
//       type:
//         dto.action === ExceededLeaveAction.APPROVE
//           ? 'exceeded_leave_approved'
//           : 'exceeded_leave_rejected',
//       title: `Exceeded Leave ${dto.action === ExceededLeaveAction.APPROVE ? 'Approved' : 'Rejected'}`,
//       message: `Your exceeded leave request was ${dto.action.toLowerCase()}${dto.approverComment ? `: ${dto.approverComment}` : ''}`,
//       linkTo: `/dashboard/leave/history`,
//       relatedRequestId: updated.id,
//     });

//     return updated;
//   }

//   // ─── HR Admin: update status bypassing manager check ──────────────────────
//   // HR admins can approve/reject any exceeded leave request regardless of manager
//   async updateStatusAsAdmin(requestId: string, dto: UpdateExceededLeaveDto) {
//     const request = await this.prisma.exceededLeaveRequest.findUnique({
//       where: { id: requestId },
//       include: { employee: true },
//     });

//     if (!request)
//       throw new NotFoundException('Exceeded leave request not found');

//     if (request.status !== 'PENDING') {
//       throw new BadRequestException('Request has already been processed');
//     }

//     if (
//       dto.action === ExceededLeaveAction.REJECT &&
//       !dto.approverComment?.trim()
//     ) {
//       throw new BadRequestException('Comment required when rejecting');
//     }

//     const updated = await this.prisma.exceededLeaveRequest.update({
//       where: { id: requestId },
//       data: {
//         status: dto.action,
//         approverComment: dto.approverComment,
//       },
//     });

//     // Notify the employee
//     await this.notificationsService.create({
//       userId: request.employeeId,
//       type:
//         dto.action === ExceededLeaveAction.APPROVE
//           ? 'exceeded_leave_approved'
//           : 'exceeded_leave_rejected',
//       title: `Exceeded Leave ${dto.action === ExceededLeaveAction.APPROVE ? 'Approved' : 'Rejected'} by HR`,
//       message: `Your exceeded leave request was ${dto.action.toLowerCase()} by HR Admin${dto.approverComment ? `: ${dto.approverComment}` : ''}`,
//       linkTo: `/dashboard/leave/history`,
//       relatedRequestId: updated.id,
//     });

//     return updated;
//   }
// }

// exceeded-leave/exceeded-leave.service.ts
// REPLACE your existing exceeded-leave.service.ts
//
// Key fix in updateStatus / updateStatusAsAdmin:
//   When APPROVED, deduct whatever balance remains from LeaveBalance.
//   The exceeded portion (exceededDays) is NOT deducted — balance can't go below 0.
//   This means approval is still logged, employee gets the leave,
//   and the exceeded amount stays as a record.

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExceededLeaveDto } from './dto/create-exceeded-leave.dto';
import {
  ExceededLeaveAction,
  UpdateExceededLeaveDto,
} from './dto/update-exceeded-leave.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ExceededLeaveService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ─── Create exceeded leave request ────────────────────────────────────────
  // Called automatically by LeaverequestService.create() when balance < requested.
  async create(dto: CreateExceededLeaveDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException(
        'End date cannot be earlier than start date',
      );
    }

    const employee = await this.prisma.user.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) throw new BadRequestException('Employee not found');

    // Re-calculate exceeded days from live balance to be accurate
    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType: {
          employeeId: dto.employeeId,
          leaveType: dto.leaveType.toUpperCase(),
        },
      },
    });

    const remaining = balance?.remaining ?? 0;
    // exceededDays = how many days beyond what's available
    const exceededDays = Math.max(0, dto.totalDays - remaining);

    const request = await this.prisma.exceededLeaveRequest.create({
      data: {
        startDate: start,
        endDate: end,
        leaveType: dto.leaveType.toUpperCase(),
        reason: dto.reason,
        totalDays: dto.totalDays,
        exceededDays,
        isHalfDay: dto.isHalfDay ?? false,
        halfDayPeriod: dto.isHalfDay ? (dto.halfDayPeriod ?? 'FIRST') : null,
        department: employee.department ?? dto.department,
        employeeId: dto.employeeId,
        managerId: dto.managerId,
        status: 'PENDING',
      },
      include: { employee: true, manager: true },
    });

    // Notify manager
    if (request.managerId) {
      await this.notificationsService.create({
        userId: request.managerId,
        type: 'exceeded_leave_submitted',
        title: 'Exceeded Leave Request',
        message: `${request.employee.name ?? request.employee.email} requested ${dto.totalDays} day(s) but only has ${remaining} available (${exceededDays} exceeded)`,
        linkTo: `/dashboard/approvals`,
        relatedRequestId: request.id,
      });
    }

    return request;
  }

  // ─── Get all exceeded leaves for one employee ─────────────────────────────
  async findAllByEmployee(employeeId: string) {
    return this.prisma.exceededLeaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Get all exceeded leaves assigned to a manager ────────────────────────
  async findAllByManager(managerId: string) {
    return this.prisma.exceededLeaveRequest.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  }

  // ─── Get ALL exceeded leaves (HR Admin) ───────────────────────────────────
  async findAll() {
    return this.prisma.exceededLeaveRequest.findMany({
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
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Exceeded summary grouped by employee ────────────────────────────────
  async getExceededSummary() {
    const all = await this.prisma.exceededLeaveRequest.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    type SummaryEntry = {
      employee: (typeof all)[0]['employee'];
      totalExceededDays: number;
      byLeaveType: Record<string, number>;
      requests: typeof all;
    };

    const summaryMap: Record<string, SummaryEntry> = {};

    for (const req of all) {
      const key = req.employeeId;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          employee: req.employee,
          totalExceededDays: 0,
          byLeaveType: {},
          requests: [],
        };
      }
      summaryMap[key].totalExceededDays += req.exceededDays;
      summaryMap[key].byLeaveType[req.leaveType] =
        (summaryMap[key].byLeaveType[req.leaveType] ?? 0) + req.exceededDays;
      summaryMap[key].requests.push(req);
    }

    return Object.values(summaryMap);
  }

  // ─── Exceeded summary for one employee ────────────────────────────────────
  async getExceededSummaryByEmployee(employeeId: string) {
    const requests = await this.prisma.exceededLeaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    const byLeaveType: Record<
      string,
      { totalExceeded: number; count: number }
    > = {};
    let grandTotal = 0;

    for (const req of requests) {
      grandTotal += req.exceededDays;
      if (!byLeaveType[req.leaveType]) {
        byLeaveType[req.leaveType] = { totalExceeded: 0, count: 0 };
      }
      byLeaveType[req.leaveType].totalExceeded += req.exceededDays;
      byLeaveType[req.leaveType].count += 1;
    }

    return {
      employeeId,
      grandTotalExceededDays: grandTotal,
      byLeaveType,
      requests,
    };
  }

  // ─── Update status (Manager) ───────────────────────────────────────────────
  // When APPROVED: deducts remaining balance to 0 (balance can't go negative).
  // The exceeded portion is recorded but NOT deducted from LeaveBalance.
  async updateStatus(
    requestId: string,
    managerId: string,
    dto: UpdateExceededLeaveDto,
  ) {
    const request = await this.prisma.exceededLeaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!request)
      throw new NotFoundException('Exceeded leave request not found');
    if (request.managerId !== managerId)
      throw new ForbiddenException('Not authorized to update this request');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Request has already been processed');
    if (
      dto.action === ExceededLeaveAction.REJECT &&
      !dto.approverComment?.trim()
    )
      throw new BadRequestException('Comment required when rejecting');

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.action === ExceededLeaveAction.APPROVE) {
        // Deduct whatever balance remains (set remaining to 0)
        // We only deduct the "normal" portion (totalDays - exceededDays)
        const normalDays = request.totalDays - request.exceededDays;
        if (normalDays > 0) {
          await tx.leaveBalance.updateMany({
            where: {
              employeeId: request.employeeId,
              leaveType: request.leaveType,
              remaining: { gt: 0 }, // only if there's something left
            },
            data: { remaining: 0 }, // drain to 0 — exceeded means balance is gone
          });
        }
      }

      return tx.exceededLeaveRequest.update({
        where: { id: requestId },
        data: { status: dto.action, approverComment: dto.approverComment },
      });
    });

    // Notify employee
    await this.notificationsService.create({
      userId: request.employeeId,
      type:
        dto.action === ExceededLeaveAction.APPROVE
          ? 'exceeded_leave_approved'
          : 'exceeded_leave_rejected',
      title: `Exceeded Leave ${dto.action === ExceededLeaveAction.APPROVE ? 'Approved' : 'Rejected'}`,
      message: `Your exceeded leave request (${request.exceededDays} day(s) over quota) was ${dto.action.toLowerCase()}${dto.approverComment ? `: ${dto.approverComment}` : ''}`,
      linkTo: `/dashboard/leave/history`,
      relatedRequestId: updated.id,
    });

    return updated;
  }

  // ─── Update status (HR Admin — bypasses manager check) ────────────────────
  async updateStatusAsAdmin(requestId: string, dto: UpdateExceededLeaveDto) {
    const request = await this.prisma.exceededLeaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!request)
      throw new NotFoundException('Exceeded leave request not found');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Request has already been processed');
    if (
      dto.action === ExceededLeaveAction.REJECT &&
      !dto.approverComment?.trim()
    )
      throw new BadRequestException('Comment required when rejecting');

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.action === ExceededLeaveAction.APPROVE) {
        // Drain remaining balance to 0 for the normal portion
        const normalDays = request.totalDays - request.exceededDays;
        if (normalDays > 0) {
          await tx.leaveBalance.updateMany({
            where: {
              employeeId: request.employeeId,
              leaveType: request.leaveType,
              remaining: { gt: 0 },
            },
            data: { remaining: 0 },
          });
        }
      }

      return tx.exceededLeaveRequest.update({
        where: { id: requestId },
        data: { status: dto.action, approverComment: dto.approverComment },
      });
    });

    await this.notificationsService.create({
      userId: request.employeeId,
      type:
        dto.action === ExceededLeaveAction.APPROVE
          ? 'exceeded_leave_approved'
          : 'exceeded_leave_rejected',
      title: `Exceeded Leave ${dto.action === ExceededLeaveAction.APPROVE ? 'Approved' : 'Rejected'} by HR`,
      message: `Your exceeded leave request was ${dto.action.toLowerCase()} by HR Admin${dto.approverComment ? `: ${dto.approverComment}` : ''}`,
      linkTo: `/dashboard/leave/history`,
      relatedRequestId: updated.id,
    });

    return updated;
  }
}
