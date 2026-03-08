import type { LeaveType, LeaveStatus } from "./types";

/** Map leave type keys to human-readable labels */
export function getLeaveTypeLabel(type: LeaveType): string {
  const labels: Record<LeaveType, string> = {
    annual: "Annual Leave",
    sick: "Sick Leave",
    casual: "Casual Leave",
    emergency: "Emergency Leave",
    unpaid: "Unpaid Leave",
  };
  return labels[type] ?? type;
}

/** Return a Tailwind badge color class based on leave status */
export function getStatusColor(status: LeaveStatus): string {
  const colors: Record<LeaveStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-muted text-muted-foreground",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
}

/** Return a Tailwind color class based on leave type (for chart legends and badges) */
export function getLeaveTypeColor(type: LeaveType): string {
  const colors: Record<LeaveType, string> = {
    annual: "bg-chart-1 text-foreground",
    sick: "bg-chart-2 text-foreground",
    casual: "bg-chart-3 text-foreground",
    emergency: "bg-chart-4 text-foreground",
    unpaid: "bg-chart-5 text-foreground",
  };
  return colors[type] ?? "bg-muted text-muted-foreground";
}

/** Format an ISO date string to a readable format (e.g. "Feb 14, 2026") */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Format an ISO date string to include time (e.g. "Feb 14, 2026, 9:00 AM") */
export function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/** Calculate business days between two dates (excludes weekends) */
export function calculateBusinessDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/** Get initials from a full name (e.g. "Sushil Bishowkarma" -> "SB") */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
