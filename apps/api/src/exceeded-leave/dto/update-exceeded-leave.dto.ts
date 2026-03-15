// exceeded-leave/dto/update-exceeded-leave.dto.ts
// Place this file at: src/exceeded-leave/dto/update-exceeded-leave.dto.ts

export enum ExceededLeaveAction {
  APPROVE = 'APPROVED',
  REJECT = 'REJECTED',
}

export class UpdateExceededLeaveDto {
  action: ExceededLeaveAction;
  approverComment?: string;
}
