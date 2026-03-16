import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SetEmployeeLeaveQuotaDto {
  @IsString()
  @IsNotEmpty()
  leaveType: string;

  @IsNumber()
  @Min(0)
  quota: number;
}

export class SetEmployeeLeaveQuotaBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetEmployeeLeaveQuotaDto)
  entries: SetEmployeeLeaveQuotaDto[];
}
