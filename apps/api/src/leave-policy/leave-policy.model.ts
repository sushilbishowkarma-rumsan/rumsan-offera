// backend/src/leave-policy/leave-policy.model.ts
// Represents the shape of a LeavePolicy record returned from Prisma.
// Used for typing service return values throughout the module.

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
