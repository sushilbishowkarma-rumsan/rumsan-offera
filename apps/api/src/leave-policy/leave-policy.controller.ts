// backend/src/leave-policy/leave-policy.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LeavePolicyService } from './leave-policy.service';
import {
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
} from './dto/leave-policy.dto';
import { LeavePolicyModel } from './leave-policy.model';
import { JwtAuthGuard } from 'src/auth/guards/roles.guard';

@Controller('leave-policies')
@UseGuards(JwtAuthGuard)
export class LeavePolicyController {
  constructor(private readonly leavePolicyService: LeavePolicyService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  // @Roles('HR_ADMIN')
  async findAll(@Query('userId') userId?: string): Promise<LeavePolicyModel[]> {
    return this.leavePolicyService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<LeavePolicyModel> {
    return this.leavePolicyService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  // @Roles('HR_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLeavePolicyDto): Promise<LeavePolicyModel> {
    return this.leavePolicyService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  // @Roles('HR_ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeavePolicyDto,
  ): Promise<LeavePolicyModel> {
    return this.leavePolicyService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  // @Roles('HR_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.leavePolicyService.remove(id);
  }
}
