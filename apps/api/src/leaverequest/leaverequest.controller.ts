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
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeaverequestService } from './leaverequest.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-request.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';

@Controller('leaverequests')
export class LeaverequestController {
  constructor(private readonly leaverequestService: LeaverequestService) {}

  // Get all leave requests (HR Admin)
  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllRequests(@Req() req: any) {
    const { id: userId, role } = req.user;

    // HR Admin and Manager can see all
    if (role === 'HRADMIN' || role === 'MANAGER') {
      return this.leaverequestService.findAll();
    }

    // Employee can only see their department
    return this.leaverequestService.findByDepartment(userId);
  }

  // Get pending requests for manager
  @Get('manager/:managerId/pending')
  @UseGuards(JwtAuthGuard)
  async getPendingForManager(@Param('managerId') managerId: string) {
    // const requests = await this.leaverequestService.findByManager(managerId);
    const requests = await this.leaverequestService.findAllByManager(managerId);
    return requests.filter((r) => r.status === 'PENDING');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createLeaveRequest(@Body() dto: CreateLeaveRequestDto) {
    console.log('--- STEP 1: Controller Received Request ---');
    console.log('Payload:', JSON.stringify(dto, null, 2));
    try {
      const result = await this.leaverequestService.create(dto);
      console.log('--- STEP 4: Controller Sending Success Response ---');
      return { message: 'Leave request created successfully', data: result };
    } catch (error) {
      console.error('--- STEP 4 (ERROR): Controller caught error ---');
      console.error(error.message);
      throw error; // Re-throw so NestJS sends the correct HTTP error code
    }
  }

  @Get('employee/:id')
  @UseGuards(JwtAuthGuard)
  async getEmployeeRequests(@Param('id') id: string) {
    return this.leaverequestService.findAllByEmployee(id);
  }

  // Manager: view requests assigned to them
  @Get('manager/:managerId')
  @UseGuards(JwtAuthGuard)
  async getManagerRequests(@Param('managerId') managerId: string) {
    return this.leaverequestService.findAllByManager(managerId);
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
  // ✅ New: Get calendar data based on role
  @Get('calendar')
  @UseGuards(JwtAuthGuard)
  async getCalendarData(@Req() req: any) {
    const { id: userId, role } = req.user;

    if (role === 'HRADMIN' || role === 'MANAGER') {
      // See all approved leaves
      return this.leaverequestService.findApprovedLeaves();
    }

    // Employee: see only their department's approved leaves
    return this.leaverequestService.findApprovedLeavesByDepartment(userId);
  }
}
