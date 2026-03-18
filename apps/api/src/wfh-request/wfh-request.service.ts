import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWfhRequestDto } from './dto/create-wfh-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WfhRequestService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateWfhRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.employeeId },
    });
    if (!user) throw new BadRequestException('Employee not found');

    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('End date cannot be before start date');
    }
    // const totalDays = calculateBusinessDays(dto.startDate, dto.endDate);

    const request = await this.prisma.wfhRequest.create({
      data: {
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalDays: dto.totalDays,
        reason: dto.reason,
        employeeId: dto.employeeId,
        managerId: dto.managerId,
        status: 'PENDING',
      },
      include: { employee: true, manager: true },
    });

    if (request.managerId) {
      await this.notificationsService.create({
        userId: request.managerId,
        type: 'new_request',
        title: 'New WFH Request',
        message: `${request.employee.name || request.employee.email} has requested to work from home`,
        linkTo: `/dashboard/approvals`,
        relatedRequestId: request.id,
      });
    }

    return request;
  }

  async findAllByEmployee(employeeId: string) {
    return this.prisma.wfhRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
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

    await this.notificationsService.create({
      userId: request.employeeId,
      type: action === 'APPROVED' ? 'leave_approved' : 'leave_rejected',
      title: `WFH Request ${action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: `Your WFH request was ${action.toLowerCase()}${approverComment ? `: ${approverComment}` : ''}`,
      linkTo: `/dashboard/leave/history`,
      relatedRequestId: updated.id,
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
}
