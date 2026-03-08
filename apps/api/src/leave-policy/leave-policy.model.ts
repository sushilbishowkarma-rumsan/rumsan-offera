export interface LeavePolicyModel {
  id: string;
  leaveType: string;
  defaultQuota: number;
  carryForwardLimit: number;
  accrualRate: number;
  maxConsecutiveDays: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
