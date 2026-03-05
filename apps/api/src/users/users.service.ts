import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class UsersService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  // Google Auth logic with default role 'EMPLOYEE'
  async authenticateGoogleUser(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid token');
      const { sub: googleId, email, name, picture: avatar } = payload;
      const user = await this.prisma.user.upsert({
        where: { googleId },
        update: { name, avatar },
        create: {
          googleId,
          email: email!,
          name,
          avatar,
          role: 'EMPLOYEE',
        },
      });
      // Seed leave balances for new employees (skipDuplicates = safe to call always)
      const policies = await this.prisma.leavePolicy.findMany({
        where: { isActive: true },
      });

      if (policies.length > 0) {
        await this.prisma.leaveBalance.createMany({
          data: policies.map((p) => ({
            employeeId: user.id,
            leaveType: p.leaveType,
            total: p.defaultQuota,
            remaining: p.defaultQuota,
          })),
          skipDuplicates: true, // safe — won't reset existing balances
        });
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async updateRole(id: string, role: 'EMPLOYEE' | 'MANAGER' | 'HRADMIN') {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async findById(id: string) {
    // return this.prisma.user.findUnique({
    //   where: { id },
    // });
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
