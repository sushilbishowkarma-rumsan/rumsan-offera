// leaverequest.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeaverequestService } from './leaverequest.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-request.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { Request } from 'express'; // ← import express Request

// ← Shared typed request — move to src/common/types/authenticated-request.ts
// and import from there if you use it in multiple controllers
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('leaverequests')
export class LeaverequestController {
  constructor(private readonly leaverequestService: LeaverequestService) {}

  // Get all leave requests (HR Admin)
  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllRequests(@Req() req: AuthenticatedRequest) {
    const { id: userId, role } = req.user;

    // HR Admin and Manager can see all
    if (role === 'HRADMIN' || role === 'MANAGER') {
      return this.leaverequestService.findAll();
    }

    // Employee can only see their department
    return this.leaverequestService.findApprovedLeavesByDepartment(userId);
  }

  @Get('calendar')
  @UseGuards(JwtAuthGuard)
  async getCalendarData(@Req() req: AuthenticatedRequest) {
    const { id: userId, role } = req.user;
    if (role === 'HRADMIN' || role === 'MANAGER') {
      // See all approved leaves
      const approvedLeaves =
        await this.leaverequestService.findApprovedLeaves();
      return approvedLeaves;
    }

    // Employee: see only their department's approved leaves
    const approvedLeaves =
      await this.leaverequestService.findApprovedLeavesByDepartment(userId);
    return approvedLeaves;
  }
  // Get pending requests for manager
  @Get('manager/:managerId/pending')
  @UseGuards(JwtAuthGuard)
  async getPendingForManager(@Param('managerId') managerId: string) {
    const requests = await this.leaverequestService.findAllByManager(managerId);
    return requests.filter((r) => r.status === 'PENDING');
  }
  // Manager: view requests assigned to them
  @Get('manager/:managerId')
  @UseGuards(JwtAuthGuard)
  async getManagerRequests(@Param('managerId') managerId: string) {
    return this.leaverequestService.findAllByManager(managerId);
  }

  // @Get('managerdashboard/:managerId')
  // @UseGuards(JwtAuthGuard)
  // async getManagerRequestsDashboard(@Param('managerId') managerId: string) {
  //   return this.leaverequestService.findByManagerforDashboard(managerId);
  // }

  @Get('employee/:id')
  @UseGuards(JwtAuthGuard)
  async getEmployeeRequests(@Param('id') id: string) {
    return this.leaverequestService.findAllByEmployee(id);
  }
  @Get('employeedashboard/:id')
  @UseGuards(JwtAuthGuard)
  async getEmployeeRequestsforDash(@Param('id') id: string) {
    return this.leaverequestService.findByEmployeefordash(id);
  }
  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createLeaveRequest(@Body() dto: CreateLeaveRequestDto) {
    try {
      const result = await this.leaverequestService.create(dto);
      return { message: 'Leave request created successfully', data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Controller caught error:', message);
      throw error; // Re-throw so NestJS sends the correct HTTP error code
    }
  }

  // Manager: approve or reject
  @Patch(':requestId/status')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateStatus(
    @Param('requestId') requestId: string,
    @Body() dto: UpdateLeaveStatusDto & { managerId: string },
  ) {
    const { managerId, ...updateDto } = dto;
    return this.leaverequestService.updateStatus(
      requestId,
      managerId,
      updateDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteRequest(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leaverequestService.deleteRequest(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateRequest(
    @Param('id') id: string,
    @Body() dto: CreateLeaveRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leaverequestService.updateRequest(id, req.user.id, dto);
  }
}
