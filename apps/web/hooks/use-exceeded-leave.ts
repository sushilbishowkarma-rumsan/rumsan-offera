// hooks/use-exceeded-leave.ts
// REPLACE your existing hooks/use-exceeded-leave.ts
//
// ALL hooks return safe empty defaults on 404 / any error.
// No crash, no error boundary triggered — components render nothing gracefully.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExceededLeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason?: string;
  totalDays: number;
  exceededDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: string;
  department?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  employeeId: string;
  managerId?: string;
  approverComment?: string;
  createdAt: string;
  updatedAt: string;
  // Relations (present when fetched by manager/admin)
  employee?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    department?: string | null;
    avatar?: string | null;
  };
  manager?: { id: string; name: string | null; email: string };
  // Mark request type for unified lists
  _type?: "exceeded";
}

export interface ExceededSummaryByType {
  totalExceeded: number;
  count: number;
}

export interface EmployeeExceededSummary {
  employeeId: string;
  grandTotalExceededDays: number;
  byLeaveType: Record<string, ExceededSummaryByType>;
  requests: ExceededLeaveRequest[];
}

export interface AdminExceededSummaryItem {
  employee: {
    id: string;
    name: string | null;
    email: string;
    department: string | null;
    role: string;
  };
  totalExceededDays: number;
  byLeaveType: Record<string, number>;
  requests: ExceededLeaveRequest[];
}

// ── Safe fetch helper ─────────────────────────────────────────────────────────
// Returns fallback on ANY error (404, 400, 500, network).
// Prevents React Query from marking queries as errored for "no data" cases.
async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const { data } = await api.get(url);
    if (data === null || data === undefined) return fallback;
    return data as T;
  } catch {
    // Silently return fallback — no exceeded data is a valid state
    return fallback;
  }
}

// ── Empty summary constant ────────────────────────────────────────────────────
const makeEmptySummary = (employeeId: string): EmployeeExceededSummary => ({
  employeeId,
  grandTotalExceededDays: 0,
  byLeaveType: {},
  requests: [],
});

// ── Employee: own exceeded leave list ─────────────────────────────────────────
export function useEmployeeExceededLeaves(employeeId: string | undefined) {
  return useQuery<ExceededLeaveRequest[]>({
    queryKey: ["exceeded-leave", "employee", employeeId],
    queryFn: () =>
      safeFetch<ExceededLeaveRequest[]>(
        `/exceeded-leave/employee/${employeeId}`,
        []
      ),
    enabled: !!employeeId,
    staleTime: 1000 * 60,
    retry: false,
  });
}

// ── Employee: own exceeded summary (totals per leave type) ────────────────────
export function useEmployeeExceededSummary(employeeId: string | undefined) {
  return useQuery<EmployeeExceededSummary>({
    queryKey: ["exceeded-leave", "employee-summary", employeeId],
    queryFn: async () => {
      const data = await safeFetch<EmployeeExceededSummary | null>(
        `/exceeded-leave/employee/${employeeId}/summary`,
        null
      );
      if (!data) return makeEmptySummary(employeeId ?? "");
      // Ensure all required fields exist (backend might return partial data)
      return {
        ...makeEmptySummary(employeeId ?? ""),
        ...data,
        byLeaveType: data.byLeaveType ?? {},
        requests: data.requests ?? [],
      };
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60,
    retry: false,
  });
}

// ── Manager: exceeded requests assigned to them ───────────────────────────────
// These are the exceeded requests that appear in the approvals page.
// The manager needs to approve/reject them just like normal leave.
export function useManagerExceededRequests(managerId: string | undefined) {
  return useQuery<ExceededLeaveRequest[]>({
    queryKey: ["exceeded-leave", "manager", managerId],
    queryFn: () =>
      safeFetch<ExceededLeaveRequest[]>(
        `/exceeded-leave/manager/${managerId}`,
        []
      ),
    enabled: !!managerId,
    staleTime: 1000 * 30,
    retry: false,
  });
}

// ── HR Admin: all employees exceeded summary ──────────────────────────────────
export function useAdminExceededSummary() {
  return useQuery<AdminExceededSummaryItem[]>({
    queryKey: ["exceeded-leave", "admin-summary"],
    queryFn: () =>
      safeFetch<AdminExceededSummaryItem[]>(`/exceeded-leave/admin/summary`, []),
    staleTime: 1000 * 60,
    retry: false,
  });
}

// ── HR Admin: all exceeded leave requests flat list ───────────────────────────
export function useAdminAllExceededLeaves() {
  return useQuery<ExceededLeaveRequest[]>({
    queryKey: ["exceeded-leave", "admin-all"],
    queryFn: () =>
      safeFetch<ExceededLeaveRequest[]>(`/exceeded-leave/admin/all`, []),
    staleTime: 1000 * 60,
    retry: false,
  });
}

// ── Mutation: update exceeded leave status (manager or admin) ─────────────────
// Used from the approvals page — same interface as useUpdateLeaveStatus
export function useUpdateExceededLeaveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      managerId,
      action,
      approverComment,
      isAdmin = false,
    }: {
      requestId: string;
      managerId: string;
      action: "APPROVED" | "REJECTED";
      approverComment?: string;
      isAdmin?: boolean;
    }) => {
      const endpoint = isAdmin
        ? `/exceeded-leave/${requestId}/admin-status`
        : `/exceeded-leave/${requestId}/status`;

      const { data } = await api.patch(endpoint, {
        action,
        managerId, // included for manager route, ignored for admin route
        approverComment,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate all exceeded leave queries so lists refresh
      queryClient.invalidateQueries({ queryKey: ["exceeded-leave"] });
    },
  });
}

// ── Yearly balance snapshots for one employee ─────────────────────────────────
export interface YearlySnapshot {
  id: string;
  employeeId: string;
  leaveType: string;
  year: number;
  total: number;
  used: number;
  remaining: number;
  createdAt: string;
}

export function useYearlySnapshots(employeeId: string | undefined) {
  return useQuery<YearlySnapshot[]>({
    queryKey: ["yearly-snapshots", employeeId],
    queryFn: () =>
      safeFetch<YearlySnapshot[]>(`/leave-balance/yearly/${employeeId}`, []),
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// ── HR Admin: all employees yearly snapshots ──────────────────────────────────
export function useAdminYearlySnapshots(year?: number) {
  return useQuery<
    (YearlySnapshot & {
      employee: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        department: string | null;
      };
    })[]
  >({
    queryKey: ["yearly-snapshots", "admin", year],
    queryFn: () => {
      const params = year ? `?year=${year}` : "";
      return safeFetch(`/leave-balance/yearly-all${params}`, []);
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}