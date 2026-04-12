import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  UsePipes,
  Req,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { WfhRequestService } from './wfh-request.service';
import { CreateWfhRequestDto } from './dto/create-wfh-request.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { Request } from 'express';
// ── Typed authenticated request ──────────────────────────────────────────────
// Extends express Request with our known user shape from JwtAuthGuard.
// This eliminates ALL `any` unsafe assignment warnings on req.user.
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('wfh-requests')
export class WfhRequestController {
  constructor(private readonly wfhRequestService: WfhRequestService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() dto: CreateWfhRequestDto) {
    return this.wfhRequestService.create(dto);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  getAllWfhRequests(@Req() req: AuthenticatedRequest) {
    const { role } = req.user;
    // Only HRADMIN sees all — same pattern as leaverequests/all
    if (role === 'HRADMIN' || role === 'MANAGER') {
      return this.wfhRequestService.findAll(); // ← see service below
    }
    return this.wfhRequestService.findByEmployeeWfh();
    // return [];
  }
  @Get('calendar')
  @UseGuards(JwtAuthGuard)
  getCalendarData() {
    return this.wfhRequestService.findApprovedForCalendar();
  }
  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  getByEmployee(@Param('employeeId') employeeId: string) {
    return this.wfhRequestService.findAllByEmployee(employeeId);
  }
  @Get('employeedashboard/:employeeId')
  @UseGuards(JwtAuthGuard)
  getByEmployeeForDashboard(@Param('employeeId') employeeId: string) {
    return this.wfhRequestService.findByEmployeeForDash(employeeId);
  }

  @Get('manager/:managerId')
  @UseGuards(JwtAuthGuard)
  getByManager(@Param('managerId') managerId: string) {
    return this.wfhRequestService.findAllByManager(managerId);
  }

  // @Get('managerdashboard/:managerId')
  // @UseGuards(JwtAuthGuard)
  // getByManagerforDashboard(@Param('managerId') managerId: string) {
  //   return this.wfhRequestService.findByManagerDashboard(managerId);
  // }
  @Patch(':requestId/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('requestId') requestId: string,
    @Body()
    body: {
      managerId: string;
      action: 'APPROVED' | 'REJECTED';
      approverComment?: string;
    },
  ) {
    return this.wfhRequestService.updateStatus(
      requestId,
      body.managerId,
      body.action,
      body.approverComment,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateRequest(
    @Param('id') id: string,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      totalDays: number;
      reason?: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.wfhRequestService.updateRequest(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteRequest(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.wfhRequestService.deleteRequest(id, req.user.id);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  async adminDeleteRequest(@Param('id') id: string) {
    return this.wfhRequestService.adminDeleteRequest(id);
  }
}
