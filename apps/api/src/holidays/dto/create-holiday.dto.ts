import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}
