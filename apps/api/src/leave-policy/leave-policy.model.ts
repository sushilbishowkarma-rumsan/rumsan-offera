export interface LeavePolicyModel {
  id: string;
  leaveType: string;
  defaultQuota: number;
  comments: string;
  accrualRate: number;
  maxConsecutiveDays: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
