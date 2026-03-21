import type { LeaveType, LeaveStatus } from './types';

/** Map leave type keys to human-readable labels */
export function getLeaveTypeLabel(type: LeaveType): string {
  const labels: Record<LeaveType, string> = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    casual: 'Casual Leave',
    emergency: 'Emergency Leave',
    unpaid: 'Unpaid Leave',
  };
  return labels[type] ?? type;
}

/** Return a Tailwind badge color class based on leave status */
export function getStatusColor(status: LeaveStatus): string {
  const colors: Record<LeaveStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-muted text-muted-foreground',
  };
  return colors[status] ?? 'bg-muted text-muted-foreground';
}

/** Return a Tailwind color class based on leave type (for chart legends and badges) */
export function getLeaveTypeColor(type: LeaveType): string {
  const colors: Record<LeaveType, string> = {
    annual: 'bg-chart-1 text-foreground',
    sick: 'bg-chart-2 text-foreground',
    casual: 'bg-chart-3 text-foreground',
    emergency: 'bg-chart-4 text-foreground',
    unpaid: 'bg-chart-5 text-foreground',
  };
  return colors[type] ?? 'bg-muted text-muted-foreground';
}

/** Format an ISO date string to a readable format (e.g. "Feb 14, 2026") */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Format an ISO date string to include time (e.g. "Feb 14, 2026, 9:00 AM") */
export function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/** Calculate business days between two dates (excludes weekends) */
export function calculateBusinessDays(
  start: string,
  end: string,
  holidayDateSet: Set<string> = new Set(),
  leaveType?: string,
): number {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);

  let count = 0;
  const current = new Date(startDate);

  const continuousKeywords = [
    'maternity',
    'maternity leave',
    'paternity',
    'paternity leave',
    'mourning leave',
    'mourning',
  ];

  const type = leaveType?.toLowerCase() || '';
  const isContinuous = continuousKeywords.some((keyword) =>
    type.includes(keyword),
  );
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const y = current.getFullYear();
    const m = current.getMonth();
    const d = current.getDate();
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDateSet.has(dateStr)) {
    //   count++;
    // }
    if (isContinuous) {
      // For these types, count every single day regardless of weekends/holidays
      count++;
    } else {
      // For other types, skip Saturday (6), Sunday (0), and Holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDateSet.has(dateStr)) {
        count++;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/** Get initials from a full name (e.g. "Sushil Bishowkarma" -> "SB") */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
