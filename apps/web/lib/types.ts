// apps/web/lib/types.ts
/* ── User Roles ── */
export type UserRole = 'MANAGER' | 'HRADMIN' | 'EMPLOYEE';

/* ── User Profile ── */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department?: string; // ← optional: DB can return null for new users
  designation?: string; // ← optional: not always set
  orgUnit: string;
  managerCuid: string;
  joinDate?: string; // ← optional: backend uses createdAt, not joinDate
  createdAt?: string; // ← ADD: backend returns this
  updatedAt?: string; // ← ADD: backend returns this
  employmentType: string | null;
  phoneWork: string | null;
  phoneHome: string | null;
  phoneRecovery: string | null;
  jobTitle: string | null;
  gender: string | null;
  rsofficeId: string | null;
}

/* ── Leave Types ── */
export type LeaveType =
  | 'annual'
  | 'sick'
  | 'casual'
  | 'emergency'
  | 'unpaid'
  | string;

/* ── Leave Request Status ── */
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/* ── Leave Request ── */
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  leaveType: LeaveType;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  department: string;
  leaveDays: [] | null;
  isHalfDay: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  approvedBy?: string; // Manager ID
  approverComment?: string;
  attachmentUrl?: string;
  halfDayPeriod?: string;
  // backend relation fields
  employee?: User;
}

/* ── Leave Balance per type ── */
export interface LeaveBalance {
  leaveType: LeaveType;
  total: number; // Total allocated days
  used: number; // Days already used
  pending: number; // Days in pending requests
  remaining: number; // total - used - pending
}

/* ── Leave Policy Configuration ── */
export interface LeavePolicy {
  id: string;
  leaveType: LeaveType;
  defaultQuota: number; // Default annual quota
  carryForwardLimit: number; // Max days that can be carried forward
  accrualRate: number; // Days accrued per month
  requiresApproval: boolean;
  maxConsecutiveDays: number;
  isActive: boolean;
}

/* ── Public Holiday ── */
export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // ISO date string
  isOptional: boolean;
}

/* ── Notification ── */
export type NotificationType =
  | 'leave_submitted'
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_cancelled'
  | 'new_request'
  | 'reminder'
  | 'balance_low'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO date string
  linkTo?: string; // Optional navigation link
}

/* ── Audit Trail Entry ── */
export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string; // ISO date string
}

/* ── Dashboard Statistics ── */
export interface DashboardStats {
  totalEmployees: number;
  pendingRequests: number;
  approvedToday: number;
  onLeaveToday: number;
  upcomingLeaves: number;
  rejectedThisMonth: number;
}

/* ── Team Member (for calendar/availability views) ── */
export interface TeamMember {
  id: string;
  name: string;
  department: string;
  designation: string;
  avatar?: string;
  isOnLeave: boolean;
  currentLeave?: {
    leaveType: LeaveType;
    endDate: string;
  };
}

/* ── Report Data Types ── */
export interface MonthlyLeaveData {
  month: string;
  annual: number;
  sick: number;
  casual: number;
  emergency: number;
  unpaid: number;
}

export interface DepartmentLeaveData {
  department: string;
  totalLeaves: number;
  avgPerEmployee: number;
}

/* ── Auth Context Type ── */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void; // For demo purposes
  refreshUser: () => Promise<void>;
}
