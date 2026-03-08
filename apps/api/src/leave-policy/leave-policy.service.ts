// backend/src/leave-policy/leave-policy.service.ts

import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
} from './dto/leave-policy.dto';
import { LeavePolicyModel } from './leave-policy.model';

@Injectable()
export class LeavePolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<LeavePolicyModel[]> {
    return this.prisma.leavePolicy.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<LeavePolicyModel> {
    const policy = await this.prisma.leavePolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`Leave policy with id "${id}" not found.`);
    }

    return policy;
  }

  async create(dto: CreateLeavePolicyDto): Promise<LeavePolicyModel> {
    const existing = await this.prisma.leavePolicy.findUnique({
      where: { leaveType: dto.leaveType },
    });
    if (existing) {
      throw new ConflictException(
        `Policy for "${dto.leaveType}" already exists.`,
      );
    }

    // 1. Create the policy
    const policy = await this.prisma.leavePolicy.create({
      data: {
        leaveType: dto.leaveType,
        defaultQuota: dto.defaultQuota,
        carryForwardLimit: dto.carryForwardLimit ?? 0,
        accrualRate: dto.accrualRate ?? 0,
        maxConsecutiveDays: dto.maxConsecutiveDays ?? 1,
        requiresApproval: dto.requiresApproval ?? true,
        isActive: dto.isActive ?? true,
      },
    });

    // 2. Seed LeaveBalance for ALL existing employees automatically
    const employees = await this.prisma.user.findMany({
      // where: { role: 'EMPLOYEE' },
      select: { id: true },
    });

    if (employees.length > 0) {
      await this.prisma.leaveBalance.createMany({
        data: employees.map((emp) => ({
          employeeId: emp.id,
          leaveType: dto.leaveType,
          total: dto.defaultQuota,
          remaining: dto.defaultQuota,
        })),
        skipDuplicates: true,
      });
    }

    return policy;
  }

  // Also update update() — if defaultQuota changes, sync balance totals
  async update(
    id: string,
    dto: UpdateLeavePolicyDto,
  ): Promise<LeavePolicyModel> {
    await this.findOne(id);

    if (dto.leaveType) {
      const conflict = await this.prisma.leavePolicy.findFirst({
        where: { leaveType: dto.leaveType, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          `A policy for "${dto.leaveType}" already exists.`,
        );
      }
    }

    const updated = await this.prisma.leavePolicy.update({
      where: { id },
      data: dto,
    });

    // ── If quota changed, update all employee balances total ──
    if (dto.defaultQuota !== undefined) {
      await this.prisma.leaveBalance.updateMany({
        where: { leaveType: updated.leaveType },
        data: { total: dto.defaultQuota },
      });
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // throws 404 if not found
    await this.prisma.leavePolicy.delete({ where: { id } });
  }
}
