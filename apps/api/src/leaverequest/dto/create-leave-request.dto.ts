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
} from 'class-validator';

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
}
