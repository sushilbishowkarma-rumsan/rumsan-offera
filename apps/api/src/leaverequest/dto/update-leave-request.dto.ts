// leaverequest/dto/update-leave-request.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum LeaveAction {
  APPROVE = 'APPROVED',
  REJECT = 'REJECTED',
}

export class UpdateLeaveStatusDto {
  @IsEnum(LeaveAction)
  action: LeaveAction;

  @IsOptional()
  @IsString()
  approverComment?: string;
}
