// exceeded-leave/dto/create-exceeded-leave.dto.ts
// Place this file at: src/exceeded-leave/dto/create-exceeded-leave.dto.ts

export class CreateExceededLeaveDto {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason?: string;
  totalDays: number;
  exceededDays: number; // how many days go beyond available balance
  isHalfDay?: boolean;
  halfDayPeriod?: string;
  department?: string;
  employeeId: string;
  managerId?: string;
}
