// backend/src/leave-policy/leave-policy.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { LeavePolicyService } from './leave-policy.service';
import {
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
} from './dto/leave-policy.dto';
import { LeavePolicyModel } from './leave-policy.model';
import { JwtAuthGuard } from 'src/auth/guards/roles.guard';

// Uncomment and wire up your auth guard when ready:
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('leave-policies')
@UseGuards(JwtAuthGuard)
// @UseGuards(JwtAuthGuard, RolesGuard)   // protect all routes
export class LeavePolicyController {
  constructor(private readonly leavePolicyService: LeavePolicyService) {}

  /**
   * GET /leave-policies
   * Returns all leave policies.
   * Accessible by HR Admin.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  // @Roles('HR_ADMIN')
  async findAll(): Promise<LeavePolicyModel[]> {
    return this.leavePolicyService.findAll();
  }

  /**
   * GET /leave-policies/:id
   * Returns a single leave policy.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LeavePolicyModel> {
    return this.leavePolicyService.findOne(id);
  }

  /**
   * POST /leave-policies
   * Creates a new leave policy.
   * Body: CreateLeavePolicyDto
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  // @Roles('HR_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLeavePolicyDto): Promise<LeavePolicyModel> {
    return this.leavePolicyService.create(dto);
  }

  /**
   * PATCH /leave-policies/:id
   * Partially updates an existing leave policy.
   * Body: UpdateLeavePolicyDto (all fields optional)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  // @Roles('HR_ADMIN')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeavePolicyDto,
  ): Promise<LeavePolicyModel> {
    return this.leavePolicyService.update(id, dto);
  }

  /**
   * DELETE /leave-policies/:id
   * Removes a leave policy.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  // @Roles('HR_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.leavePolicyService.remove(id);
  }
}
