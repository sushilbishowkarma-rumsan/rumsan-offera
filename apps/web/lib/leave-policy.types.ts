// frontend/src/lib/types/leave-policy.types.ts

export interface LeavePolicy {
  id: string;
  leaveType: string;
  defaultQuota: number;
  carryForwardLimit: number;
  accrualRate: number;
  maxConsecutiveDays: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeavePolicyDto {
  leaveType: string;
  defaultQuota: number;
  carryForwardLimit?: number;
  accrualRate?: number;
  maxConsecutiveDays?: number;
  requiresApproval?: boolean;
  isActive?: boolean;
}

export interface UpdateLeavePolicyDto extends Partial<CreateLeavePolicyDto> {}