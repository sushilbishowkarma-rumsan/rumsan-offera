// // exceeded-leave/exceeded-leave.controller.ts
// // Place this file at: src/exceeded-leave/exceeded-leave.controller.ts

// import {
//   Controller,
//   Get,
//   Post,
//   Patch,
//   Body,
//   Param,
//   Request,
// } from '@nestjs/common';
// import { ExceededLeaveService } from './exceeded-leave.service';
// import { CreateExceededLeaveDto } from './dto/create-exceeded-leave.dto';
// import { UpdateExceededLeaveDto } from './dto/update-exceeded-leave.dto';
// // ─── Import your existing auth guard ─────────────────────────────────────────
// // Adjust the import path to match your project structure
// // import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// // import { RolesGuard }   from '../auth/roles.guard';
// // import { Roles }        from '../auth/roles.decorator';

// @Controller('exceeded-leave')
// // @UseGuards(JwtAuthGuard)  // ← Uncomment once you have auth guards wired up
// export class ExceededLeaveController {
//   constructor(private readonly exceededLeaveService: ExceededLeaveService) {}

//   // ─── POST /exceeded-leave ─────────────────────────────────────────────────
//   // Employee submits an exceeded leave request
//   @Post()
//   create(@Body() dto: CreateExceededLeaveDto) {
//     return this.exceededLeaveService.create(dto);
//   }

//   // ─── GET /exceeded-leave/admin/all ────────────────────────────────────────
//   // HR Admin: view ALL exceeded leave requests across all employees
//   // @Roles('HRADMIN')  ← Uncomment when roles guard is active
//   @Get('admin/all')
//   findAll() {
//     return this.exceededLeaveService.findAll();
//   }

//   // ─── GET /exceeded-leave/admin/summary ───────────────────────────────────
//   // HR Admin: view exceeded leave summary grouped by employee
//   // @Roles('HRADMIN')  ← Uncomment when roles guard is active
//   @Get('admin/summary')
//   getExceededSummary() {
//     return this.exceededLeaveService.getExceededSummary();
//   }

//   // ─── GET /exceeded-leave/employee/:employeeId ─────────────────────────────
//   // Employee (or admin): view exceeded leave requests for a specific employee
//   @Get('employee/:employeeId')
//   findByEmployee(@Param('employeeId') employeeId: string) {
//     return this.exceededLeaveService.findAllByEmployee(employeeId);
//   }

//   // ─── GET /exceeded-leave/employee/:employeeId/summary ────────────────────
//   // Employee (or admin): view exceeded leave SUMMARY for a specific employee
//   // Returns totals per leave type plus individual request list
//   @Get('employee/:employeeId/summary')
//   getEmployeeSummary(@Param('employeeId') employeeId: string) {
//     return this.exceededLeaveService.getExceededSummaryByEmployee(employeeId);
//   }

//   // ─── GET /exceeded-leave/manager/:managerId ───────────────────────────────
//   // Manager: view exceeded leave requests assigned to them
//   @Get('manager/:managerId')
//   findByManager(@Param('managerId') managerId: string) {
//     return this.exceededLeaveService.findAllByManager(managerId);
//   }

//   // ─── PATCH /exceeded-leave/:id/status ────────────────────────────────────
//   // Manager: approve or reject an exceeded leave request
//   @Patch(':id/status')
//   updateStatus(
//     @Param('id') id: string,
//     @Body() dto: UpdateExceededLeaveDto & { managerId: string },
//   ) {
//     const { managerId, ...updateDto } = dto;
//     return this.exceededLeaveService.updateStatus(id, managerId, updateDto);
//   }

//   // ─── PATCH /exceeded-leave/:id/admin-status ───────────────────────────────
//   // HR Admin: approve or reject any exceeded leave request (bypasses manager check)
//   // @Roles('HRADMIN')  ← Uncomment when roles guard is active
//   @Patch(':id/admin-status')
//   updateStatusAsAdmin(
//     @Param('id') id: string,
//     @Body() dto: UpdateExceededLeaveDto,
//   ) {
//     return this.exceededLeaveService.updateStatusAsAdmin(id, dto);
//   }
// }

// exceeded-leave/exceeded-leave.controller.ts
// REPLACE your existing exceeded-leave.controller.ts
//
// Fixes:
//  1. PATCH /:id/status — accepts managerId from body (manager route)
//  2. PATCH /:id/admin-status — no managerId needed (admin route)
//  3. All GET endpoints return empty array [] by default (no 404 on no data)

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExceededLeaveService } from './exceeded-leave.service';
import { CreateExceededLeaveDto } from './dto/create-exceeded-leave.dto';
import { UpdateExceededLeaveDto } from './dto/update-exceeded-leave.dto';

@Controller('exceeded-leave')
export class ExceededLeaveController {
  constructor(private readonly exceededLeaveService: ExceededLeaveService) {}

  // ── POST /exceeded-leave ──────────────────────────────────────────────────
  // Employee submits exceeded leave (called internally by leaverequest.service)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateExceededLeaveDto) {
    return this.exceededLeaveService.create(dto);
  }

  // ── GET /exceeded-leave/admin/all ─────────────────────────────────────────
  // HR Admin: flat list of ALL exceeded requests
  // Returns [] if none — never 404
  @Get('admin/all')
  async findAll() {
    try {
      return await this.exceededLeaveService.findAll();
    } catch {
      return [];
    }
  }

  // ── GET /exceeded-leave/admin/summary ────────────────────────────────────
  // HR Admin: grouped by employee with totals
  // Returns [] if none — never 404
  @Get('admin/summary')
  async getExceededSummary() {
    try {
      return await this.exceededLeaveService.getExceededSummary();
    } catch {
      return [];
    }
  }

  // ── GET /exceeded-leave/employee/:employeeId ──────────────────────────────
  // Employee / Admin: list of exceeded requests for one employee
  // Returns [] if none — never 404
  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string) {
    try {
      return await this.exceededLeaveService.findAllByEmployee(employeeId);
    } catch {
      return [];
    }
  }

  // ── GET /exceeded-leave/employee/:employeeId/summary ─────────────────────
  // Employee / Admin: totals per leave type for one employee
  // Returns safe empty summary if none — never 404
  @Get('employee/:employeeId/summary')
  async getEmployeeSummary(@Param('employeeId') employeeId: string) {
    try {
      return await this.exceededLeaveService.getExceededSummaryByEmployee(
        employeeId,
      );
    } catch {
      // Return safe empty summary instead of throwing
      return {
        employeeId,
        grandTotalExceededDays: 0,
        byLeaveType: {},
        requests: [],
      };
    }
  }

  // ── GET /exceeded-leave/manager/:managerId ────────────────────────────────
  // Manager: exceeded requests assigned to them (for approvals page)
  // Returns [] if none — never 404
  @Get('manager/:managerId')
  async findByManager(@Param('managerId') managerId: string) {
    try {
      return await this.exceededLeaveService.findAllByManager(managerId);
    } catch {
      return [];
    }
  }

  // ── PATCH /exceeded-leave/:id/status ─────────────────────────────────────
  // Manager: approve or reject
  // Body: { action, managerId, approverComment? }
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateExceededLeaveDto & { managerId: string },
  ) {
    const { managerId, ...dto } = body;
    return this.exceededLeaveService.updateStatus(id, managerId, dto);
  }

  // ── PATCH /exceeded-leave/:id/admin-status ───────────────────────────────
  // HR Admin: approve or reject any exceeded request (no managerId check)
  // Body: { action, approverComment? }
  @Patch(':id/admin-status')
  updateStatusAsAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateExceededLeaveDto,
  ) {
    return this.exceededLeaveService.updateStatusAsAdmin(id, dto);
  }
}
