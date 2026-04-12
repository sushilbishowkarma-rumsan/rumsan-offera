import {
  Logger,
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWfhRequestDto } from './dto/create-wfh-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

interface UpdateWfhDto {
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
}

@Injectable()
export class WfhRequestService {
  private readonly logger = new Logger(WfhRequestService.name);
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateWfhRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.employeeId },
    });
    if (!user) throw new BadRequestException('Employee not found');

    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('End date cannot be before start date');
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

    const request = await this.prisma.wfhRequest.create({
      data: {
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalDays: dto.totalDays,
        reason: dto.reason,
        employeeId: dto.employeeId,
        managerId: internalManagerId,
        // managerId: dto.managerId,

        status: 'PENDING',
      },
      include: { employee: true, manager: true },
    });

    if (request.managerId) {
      this.notificationsService
        .create({
          userId: request.managerId,
          type: 'new_request',
          title: 'New WFH Request',
          message: `${request.employee.name || request.employee.email} has requested to work from home`,
          linkTo: `/approvals`,
          relatedRequestId: request.id,
        })
        .catch((err) => {
          // Log but don't crash — email failure won't affect the response
          console.error('Failed to send leave request email:', err);
        });
    }

    if (request.manager?.email) {
      this.mailService
        .sendWfhRequestNotification({
          managerEmail: request.manager.email,
          managerName: request.manager.name || 'Manager',
          employeeName: request.employee.name || request.employee.email,
          startDate: new Date(request.startDate),
          endDate: new Date(request.endDate),
          totalDays: request.totalDays,
          reason: request.reason,
          approvalLink: `${process.env.APP_URL}/approvals`,
        })
        .catch((err) => {
          // Log but don't crash — email failure won't affect the response
          console.error('Failed to send leave request email:', err);
        });
    }
    return request;
  }

  async findAllByEmployee(employeeId: string) {
    return this.prisma.wfhRequest.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: {
            department: true, // This grabs the department from the Employee table
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmployeeForDash(employeeId: string) {
    return this.prisma.wfhRequest.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: { department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5, // ← just hardcode it here
    });
  }

  async findAllByManager(managerId: string) {
    return this.prisma.wfhRequest.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  }
  // async findByManagerDashboard(managerId: string) {
  //   return this.prisma.wfhRequest.findMany({
  //     where: { managerId },
  //     orderBy: { createdAt: 'desc' },
  //     include: {
  //       employee: {
  //         select: { id: true, name: true, email: true, avatar: true },
  //       },
  //     },
  //     take: 5,
  //   });
  // }

  async updateStatus(
    requestId: string,
    managerId: string,
    action: 'APPROVED' | 'REJECTED',
    approverComment?: string,
  ) {
    const request = await this.prisma.wfhRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });
    if (!request) throw new NotFoundException('WFH request not found');
    if (request.managerId !== managerId)
      throw new ForbiddenException('Not authorized');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Already processed');

    const updated = await this.prisma.wfhRequest.update({
      where: { id: requestId },
      data: { status: action, approverComment },
    });

    this.notificationsService
      .create({
        userId: request.employeeId,
        type: action === 'APPROVED' ? 'leave_approved' : 'leave_rejected',
        title: `WFH Request ${action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your WFH request was ${action.toLowerCase()}${approverComment ? `: ${approverComment}` : ''}`,
        linkTo: `/leave/history`,
        relatedRequestId: updated.id,
      })
      .catch((err) => {
        // Log but don't crash — email failure won't affect the response
        console.error('Failed to send leave request email:', err);
      });

    this.mailService
      .sendRequestStatusNotification({
        employeeEmail: request.employee.email,
        employeeName: request.employee.name || request.employee.email,
        requestType: 'WFH',
        action: action, // already 'APPROVED' | 'REJECTED'
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        approverComment: approverComment,
      })
      .catch((err) => {
        // Log but don't crash — email failure won't affect the response
        console.error('Failed to send leave request email:', err);
      });
    return updated;
  }

  async findApprovedForCalendar() {
    return this.prisma.wfhRequest.findMany({
      where: { status: 'APPROVED' },
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findApprovedWfhByDepartment(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });

    if (!user?.department) {
      // ← show only this user's own approved WFH, not filter by department=userId
      return this.prisma.wfhRequest.findMany({
        where: { employeeId: userId, status: 'APPROVED' },
        include: {
          employee: {
            select: { id: true, name: true, email: true, department: true },
          },
        },
        orderBy: { startDate: 'asc' },
      });
    }

    return this.prisma.wfhRequest.findMany({
      where: { status: 'APPROVED' },
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.wfhRequest.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
    });
  }

  async findByEmployeeWfh() {
    return this.prisma.wfhRequest.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
    });
  }

  async deleteRequest(requestId: string, requestingUserId: string) {
    this.logger.log(
      `Attempting to delete WFH request ++++++____+++>>>>>>>>>> ${requestId} by user ${requestingUserId}`,
    );
    const request = await this.prisma.wfhRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!request) {
      this.logger.warn(
        `Delete failed: WFH request ++++++____+++>>>>>>>>>> ${requestId} not found`,
      );
      throw new NotFoundException('WFH request not found');
    }
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { id: true, role: true },
    });
    if (!requestingUser) throw new ForbiddenException('User not found');

    const isOwner = request.employeeId === requestingUser.id;

    if (!isOwner) {
      throw new ForbiddenException(
        'You are not authorized to delete this request',
      );
    }

    if (request.status !== 'PENDING') {
      this.logger.warn(
        `Delete failed: Request ++++++____+++>>>>>>>>>> ${requestId} is ${request.status}, not PENDING`,
      );
      throw new BadRequestException('Only PENDING requests can be deleted');
    }

    await this.prisma.wfhRequest.delete({ where: { id: requestId } });
    this.logger.log(
      `Successfully deleted WFH request ++++++____+++>>>>>>>>>> ${requestId} for user ${requestingUserId}`,
    );
    return { message: 'WFH request deleted successfully' };
  }

  async updateRequest(
    requestId: string,
    requestingUserId: string,
    dto: UpdateWfhDto,
  ) {
    this.logger.log(
      `User ++++++____+++>>>>>>>>>> ${requestingUserId} is updating WFH request ${requestId}`,
    );
    try {
      const request = await this.prisma.wfhRequest.findUnique({
        where: { id: requestId },
        include: { employee: true, manager: true },
      });

      if (!request) {
        throw new NotFoundException('WFH request not found');
      }
      const requestingUser = await this.prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { id: true, role: true },
      });

      this.logger.log(
        `WFH request ++++++____+++>>>>>>>>>> ${requestId} updated successfully`,
      );

      if (!requestingUser) throw new ForbiddenException('User not found');

      const isOwner = request.employeeId === requestingUser.id;
      if (!isOwner) {
        throw new ForbiddenException(
          'You are not authorized to edit this request',
        );
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException('Only PENDING requests can be edited');
      }

      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (end < start) {
        throw new BadRequestException(
          'End date cannot be earlier than start date',
        );
      }

      const updated = await this.prisma.wfhRequest.update({
        where: { id: requestId },
        data: {
          startDate: dto.startDate,
          endDate: dto.endDate,
          totalDays: dto.totalDays,
          reason: dto.reason ?? '',
        },
        include: {
          employee: true,
          manager: true,
        },
      });
      if (updated.managerId) {
        this.notificationsService
          .create({
            userId: updated.managerId,
            type: 'new_request',
            title: 'WFH Request Updated',
            message: `${updated.employee.name || updated.employee.email} has updated their WFH request`,
            linkTo: `/approvals`,
            relatedRequestId: updated.id,
          })
          .catch((err) =>
            console.error('Failed to send WFH update notification:', err),
          );
      }

      if (updated.manager?.email) {
        this.mailService
          .sendWfhRequestNotification({
            managerEmail: updated.manager.email,
            managerName: updated.manager.name || 'Manager',
            employeeName: updated.employee.name || updated.employee.email,
            startDate: new Date(updated.startDate),
            endDate: new Date(updated.endDate),
            totalDays: updated.totalDays,
            reason: updated.reason,
            approvalLink: `${process.env.APP_URL}/approvals`,
          })
          .catch((err) =>
            console.error('Failed to send WFH update email:', err),
          );
      }
      this.logger.debug(
        `Triggering notifications for update on request ++++++____+++>>>>>>>>>> ${requestId}`,
      );
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update WFH request ++++++____+++>>>>>>>>>> ${requestId}: ${error}`,
      );
      throw error;
    }
  }

  async adminDeleteRequest(requestId: string): Promise<{ message: string }> {
    const request = await this.prisma.wfhRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('WFH request not found');
    }

    await this.prisma.wfhRequest.delete({
      where: { id: requestId },
    });

    return { message: 'WFH request deleted successfully by admin' };
  }
}
