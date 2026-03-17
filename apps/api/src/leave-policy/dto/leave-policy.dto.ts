// backend/src/leave-policy/dto/leave-policy.dto.ts

import {
  IsString,
  IsInt,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateLeavePolicyDto {
  @IsString()
  @IsNotEmpty()
  leaveType: string;

  @IsInt()
  @Min(0)
  defaultQuota: number;

  @IsString()
  @IsOptional()
  comments?: string = '';

  @IsNumber()
  @Min(0)
  @IsOptional()
  accrualRate?: number = 0;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxConsecutiveDays?: number = 1;

  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateLeavePolicyDto extends PartialType(CreateLeavePolicyDto) {}
