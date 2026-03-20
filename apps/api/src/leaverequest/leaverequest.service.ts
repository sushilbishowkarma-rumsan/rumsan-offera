//rumsan-offera/apps/api/src/leaverequest/leaverequest.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path to your PrismaService
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  LeaveAction,
  UpdateLeaveStatusDto,
} from './dto/update-leave-request.dto';

@Injectable()
export class LeaverequestService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService, // ← Add this
    private mailService: MailService,
  ) {}
  async create(dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException(
        'End date cannot be earlier than start date',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.employeeId },
    });

    if (!user) {
      throw new BadRequestException('Employee not found');
    }

    let internalManagerId: string | undefined = undefined;

    if (dto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { rsofficeId: dto.managerId }, // Frontend sent the CUID
        select: { id: true, email: true },
      });

      if (manager) {
        internalManagerId = manager.id;
      } else {
        console.warn(
          `Manager with CUID ${dto.managerId} not found in local DB.`,
        );
        // Optionally throw error or fallback to null
      }
    }
    // 3. Create the request
    const request = await this.prisma.leaveRequest.create({
      data: {
        startDate: start,
        endDate: end,
        leaveType: dto.leaveType.toUpperCase(),
        reason: dto.reason,
        isHalfDay: dto.isHalfDay || false,
        halfDayPeriod: dto.isHalfDay ? (dto.halfDayPeriod ?? 'FIRST') : null,
        department: user.department || dto.department,
        employeeId: dto.employeeId,
        managerId: internalManagerId, // ← save manager
        totalDays: dto.totalDays,
        // totalDays: dto.isHalfDay ? 0.5 : dto.totalDays,
        status: 'PENDING', // Defaulting via schema, but good to be explicit
        leaveDays: dto.leaveDays?.length
          ? {
              create: dto.leaveDays.map((d) => ({
                date: d.date,
                dayType: d.dayType,
              })),
            }
          : undefined,
      },
      include: {
        employee: true,
        manager: true,
        leaveDays: true,
      },
    });
    // Send notification to manager
    if (request.managerId) {
      await this.notificationsService.create({
        userId: request.managerId,
        type: 'new_request',
        title: 'New Leave Request',
        message: `${request.employee.name || request.employee.email} has submitted a leave request`,
        linkTo: `/dashboard/approvals`,
        relatedRequestId: request.id,
      });
    }
    if (request.manager?.email) {
      this.mailService
        .sendLeaveRequestNotification({
          managerEmail: request.manager.email,
          managerName: request.manager.name || 'Manager',
          employeeName: request.employee.name || request.employee.email,
          leaveType: request.leaveType,
          startDate: request.startDate,
          endDate: request.endDate,
          totalDays: request.totalDays,
          reason: request.reason,
          approvalLink: `${process.env.APP_URL}/dashboard/approvals`,
        })
        .catch((err) => {
          // Log but don't crash — email failure won't affect the response
          console.error('Failed to send leave request email:', err);
        });
    }
    return request;
  }

  async findAllByEmployee(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        leaveDays: true, // ← ADD THIS
      },
    });
  }

  // Manager: get only requests assigned to them
  async findAllByManager(managerId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        leaveDays: true,
      },
    });
  }

  async updateStatus(
    requestId: string,
    managerId: string,
    dto: UpdateLeaveStatusDto,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!request) throw new NotFoundException('Leave request not found');
    if (request.managerId !== managerId)
      throw new ForbiddenException('Not authorized');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Already processed');

    if (dto.action === LeaveAction.REJECT && !dto.approverComment?.trim()) {
      throw new BadRequestException('Comment required when rejecting');
    }

    // ── Run in transaction so balance + status update atomically ──
    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      if (dto.action === LeaveAction.APPROVE) {
        // Check balance exists and is sufficient
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveType: {
              employeeId: request.employeeId,
              leaveType: request.leaveType,
            },
          },
        });

        // if (balance && balance.remaining < request.totalDays) {
        //   throw new BadRequestException(
        //     `Insufficient leave balance. Available: ${balance.remaining}, Requested: ${request.totalDays}`,
        //   );
        // }

        // Deduct from balance
        if (balance) {
          const withinQuota = Math.min(request.totalDays, balance.remaining);
          const overQuota = Math.max(0, request.totalDays - balance.remaining);

          await tx.leaveBalance.update({
            where: {
              employeeId_leaveType: {
                employeeId: request.employeeId,
                leaveType: request.leaveType,
              },
            },
            data: {
              remaining: { decrement: withinQuota },
              exceeded: { increment: overQuota },
            },
          });
        }
      }

      // Update the request status
      return tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: dto.action,
          approverComment: dto.approverComment,
        },
      });
    });
    // Send notification to employee AFTER the transaction is successful
    await this.notificationsService.create({
      userId: request.employeeId,
      type:
        dto.action === LeaveAction.APPROVE
          ? 'leave_approved'
          : 'leave_rejected',
      title: `Leave Request ${dto.action === LeaveAction.APPROVE ? 'Approved' : 'Rejected'}`,
      message: `Your request was ${dto.action.toLowerCase()}${dto.approverComment ? `: ${dto.approverComment}` : ''}`,
      linkTo: `/dashboard/leave/history`,
      relatedRequestId: updatedRequest.id,
    });

    this.mailService
      .sendRequestStatusNotification({
        employeeEmail: request.employee.email,
        employeeName: request.employee.name || request.employee.email,
        requestType: 'Leave',
        action: dto.action === LeaveAction.APPROVE ? 'APPROVED' : 'REJECTED',
        startDate: request.startDate,
        endDate: request.endDate,
        approverComment: dto.approverComment,
      })
      .catch((err) => {
        // Log but don't crash — email failure won't affect the response
        console.error('Failed to send leave request email:', err);
      });

    return updatedRequest;
  }

  async findAll() {
    return this.prisma.leaveRequest.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ✅ New: Get all approved leaves (HR Admin & Manager)
  async findApprovedLeaves() {
    const results = await this.prisma.leaveRequest.findMany({
      where: { status: 'APPROVED' },
      include: {
        leaveDays: true,
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
      orderBy: { startDate: 'asc' },
    });
    console.log('=== findApprovedLeaves result count:', results.length);
    console.log('=== sample:', JSON.stringify(results[0], null, 2));
    return results;
  }

  // ✅ New: Get approved leaves by department (for employees)
  async findApprovedLeavesByDepartment(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });
    console.log(
      '=== Employee department:',
      user?.department,
      'userId:',
      userId,
    );

    if (!user || !user?.department) {
      return this.prisma.leaveRequest.findMany({
        where: {
          employeeId: userId, // ← their own leaves only
          status: 'APPROVED',
        },
        include: {
          leaveDays: true,
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
        orderBy: { startDate: 'asc' },
      });
    }
    // Has department → show entire department's approved leaves
    return this.prisma.leaveRequest.findMany({
      where: {
        department: user.department, // ← same department only
        status: 'APPROVED',
      },
      include: {
        leaveDays: true,
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
      orderBy: { startDate: 'asc' },
    });
  }
}
