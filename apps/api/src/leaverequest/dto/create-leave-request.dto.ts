// dto/create-leave-request.dto.ts
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  Min,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
export class CreateLeaveRequestDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  leaveType: string; // ← plain string now, no enum

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  isHalfDay?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['FIRST', 'SECOND'])
  halfDayPeriod?: 'FIRST' | 'SECOND'; // ← NEW

  @IsString()
  @IsOptional()
  department?: string;

  @IsNumber()
  @Min(0.5)
  totalDays: number;

  @IsString()
  @IsOptional()
  managerId?: string;

  // ← NEW: optional per-day breakdown
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LeaveDayDto)
  leaveDays?: LeaveDayDto[];
}

export class LeaveDayDto {
  @IsString()
  @IsNotEmpty()
  date: string; // "2026-03-10"

  @IsString()
  @IsIn(['FULL', 'FIRST_HALF', 'SECOND_HALF'])
  dayType: 'FULL' | 'FIRST_HALF' | 'SECOND_HALF';
}
