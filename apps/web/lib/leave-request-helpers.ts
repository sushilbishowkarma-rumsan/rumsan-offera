// lib/leave-request-helpers.ts
// All new helpers for leave request form — drop this alongside your existing leave-helpers.ts
// None of these modify existing exports; they are purely additive.

import { z, ZodIssue } from 'zod';
import type { LeaveRequest } from '@/lib/types'; // your real type
import type { LeaveBalanceSummary } from '@/lib/leave-balance.api'; // your real type

// ─────────────────────────────────────────────
// TYPES (mirror your existing LeaveRequest type)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// ZOD SCHEMAS
// ─────────────────────────────────────────────
export const leaveDaySchema = z.object({
  date: z.string(),
  dayType: z.enum(['FULL', 'FIRST_HALF', 'SECOND_HALF']),
});

export const leaveFormSchema = z
  .object({
    leaveType: z.string().min(1, 'Leave type is required'),
    useMultiDay: z.boolean(),
    isHalfDay: z.boolean(),
    halfDayPeriod: z.enum(['FIRST', 'SECOND']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    leaveDays: z.array(leaveDaySchema).optional(),
    reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.useMultiDay) {
      const days = data.leaveDays ?? [];
      const filled = days.filter((d) => d.date !== '');
      if (filled.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['leaveDays'],
          message: 'Add at least one day',
        });
      }
      const dates = filled.map((d) => d.date);
      if (dates.length !== new Set(dates).size) {
        ctx.addIssue({
          code: 'custom',
          path: ['leaveDays'],
          message:
            'Duplicate dates found — remove duplicates before submitting',
        });
      }
    } else {
      if (!data.startDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['startDate'],
          message: 'Start date is required',
        });
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'End date is required',
        });
      }
    }
  });

export const wfhFormSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
});

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;
export type WfhFormValues = z.infer<typeof wfhFormSchema>;

// ─────────────────────────────────────────────
// DATE VALIDATION — weekend + holiday check
// Only for the START and END dates the user explicitly picks.
// Holidays in between start/end are fine (handled by calculateBusinessDays).
// ─────────────────────────────────────────────
export function isSelectableDate(
  dateStr: string,
  holidayDateSet: Set<string>,
): { valid: boolean; reason?: string } {
  if (!dateStr) return { valid: true };
  // Parse as local midnight to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0=Sun, 6=Sat
  if (day === 0)
    return {
      valid: false,
      reason: 'Sunday cannot be selected as a leave date',
    };
  if (day === 6)
    return {
      valid: false,
      reason: 'Saturday cannot be selected as a leave date',
    };
  if (holidayDateSet.has(dateStr))
    return {
      valid: false,
      reason: 'This date is a public holiday and cannot be selected',
    };
  return { valid: true };
}

// ─────────────────────────────────────────────
// DUPLICATE LEAVE DETECTION
// Checks overlap against existing non-rejected requests of the same leave type.
// For multi-day mode, pass the sorted first/last date.
// ─────────────────────────────────────────────
export function findDuplicateLeave(
  existingRequests: LeaveRequest[],
  newStartDate: string,
  newEndDate: string,
  newLeaveType: string,
): LeaveRequest | undefined {
  if (!newStartDate || !newEndDate || !newLeaveType) return undefined;
  if (!existingRequests?.length) return undefined;

  const inStart = new Date(newStartDate.split('T')[0] + 'T00:00:00');
  const inEnd = new Date(newEndDate.split('T')[0] + 'T00:00:00');

  // ✅ uppercase BOTH sides — this was the bug
  const targetType = newLeaveType.toUpperCase().trim();

  return existingRequests.find((req) => {
    if (!req?.startDate || !req?.endDate || !req?.leaveType) return false;

    const reqStatus = (req.status ?? '').toUpperCase().trim();
    if (reqStatus === 'REJECTED' || reqStatus === 'CANCELLED') return false;

    const reqType = req.leaveType.toUpperCase().trim();
    if (reqType !== targetType) {
      return false;
    }
    const reqStart = new Date(req.startDate.split('T')[0] + 'T00:00:00');
    const reqEnd = new Date(req.endDate.split('T')[0] + 'T00:00:00');
    const inStart = new Date(newStartDate.split('T')[0] + 'T00:00:00');
    const inEnd = new Date(newEndDate.split('T')[0] + 'T00:00:00');
    const overlaps = inStart <= reqEnd && inEnd >= reqStart;
    return overlaps;
  });
}

// ─────────────────────────────────────────────
// DATE RANGE LABEL  e.g. "Mon, Mar 20 → Wed, Mar 22"
// ─────────────────────────────────────────────
export function formatDateRangeLabel(
  startDate: string,
  endDate: string,
): string {
  if (!startDate || !endDate) return '';
  const fmt = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} → ${fmt(endDate)}`;
}

// ─────────────────────────────────────────────
// LEAVE BALANCE IMPACT CALCULATOR
// Returns how many days will be deducted from payroll.
// Takes into account already-exceeded days on the balance.
// ─────────────────────────────────────────────
export interface LeaveImpact {
  willExceed: boolean;
  exceedDays: number; // days that go beyond balance (payroll deducted)
  totalExceedDays: number;
  remainingAfter: number; // remaining balance after this request (can be negative)
  assigned: number;
  used: number;
  currentRemaining: number;
  alreadyExceeded: number; // from previous requests
  hasAlreadyExceeded: boolean;
}

export function calculateLeaveImpact(
  balance: LeaveBalanceSummary,
  newRequestDays: number,
): LeaveImpact {
  // remaining can already be 0 if they've used it all
  const currentRemaining = Math.max(0, balance.remaining);
  const newExceedDays = Math.max(0, newRequestDays - currentRemaining);
  const totalExceedDays = balance.exceeded + newExceedDays;
  const willExceed = totalExceedDays > 0;

  //   const remainingAfter = currentRemaining - newRequestDays;
  //   const exceedDays = willExceed ? Math.abs(remainingAfter) : 0;

  return {
    willExceed,
    exceedDays: parseFloat(newExceedDays.toFixed(1)),
    totalExceedDays: parseFloat(totalExceedDays.toFixed(1)), // cumulative for payroll
    remainingAfter: parseFloat((currentRemaining - newRequestDays).toFixed(1)),
    assigned: balance.total,
    used: balance.used,
    currentRemaining,
    alreadyExceeded: balance.exceeded, // existing exceeded days
    hasAlreadyExceeded: balance.hasExceeded,
  };
}

// ─────────────────────────────────────────────
// LEAVE TYPE SPECIAL LIMITS (your existing logic, centralised)
// ─────────────────────────────────────────────
const LEAVE_TYPE_LIMITS: Record<string, number> = {
  'MATERNITY LEAVE': 98,
  MATERNITY: 98,
  'PATERNITY LEAVE': 15,
  PATERNITY: 15,
  'MOURNING LEAVE': 13,
  MOURNING: 13,
};

interface WfhRequestMinimal {
  startDate: string;
  endDate: string;
  status?: string;
}

export function checkLeaveTypeLimit(
  leaveType: string,
  totalDays: number,
): string | null {
  const upper = leaveType.toUpperCase().trim();
  const limit = LEAVE_TYPE_LIMITS[upper];
  if (limit !== undefined && totalDays > limit) {
    return `${leaveType} is limited to ${limit} days`;
  }
  return null;
}

export function findDuplicateWfh<T extends WfhRequestMinimal>(
  existingRequests: T[],
  newStartDate: string,
  newEndDate: string,
): T | undefined {
  if (!newStartDate || !newEndDate) return undefined;
  if (!existingRequests?.length) return undefined;

  const inStart = new Date(newStartDate.split('T')[0] + 'T00:00:00');
  const inEnd = new Date(newEndDate.split('T')[0] + 'T00:00:00');

  return existingRequests.find((req) => {
    if (!req?.startDate || !req?.endDate) return false;

    const reqStatus = (req.status ?? '').toUpperCase().trim();
    if (reqStatus === 'REJECTED' || reqStatus === 'CANCELLED') return false;

    const reqStart = new Date(req.startDate.split('T')[0] + 'T00:00:00');
    const reqEnd = new Date(req.endDate.split('T')[0] + 'T00:00:00');

    return inStart <= reqEnd && inEnd >= reqStart;
  });
}
