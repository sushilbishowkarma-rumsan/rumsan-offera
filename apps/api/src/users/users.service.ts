import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // This is the missing method causing your error!
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateRole(id: string, role: 'EMPLOYEE' | 'MANAGER' | 'HRADMIN') {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        googleId: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateDepartment(id: string, department: string) {
    return this.prisma.user.update({
      where: { id },
      data: { department },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });
  }

  async findManagers() {
    return this.prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: { name: 'asc' },
    });
  }
}
