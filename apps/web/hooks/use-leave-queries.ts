/**
 * hooks/use-leave-queries.ts
 * React Query hooks for fetching leave data from the NestJS backend.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LeaveBalance, LeaveRequest } from '@/lib/types';

// ─── Recent Leave Requests ───────────────────────────────────────────────────
// Backend endpoint: GET /api/v1/leaverequests/employee/:employeeId
// Your controller already has this: @Get('employee/:id')

export function useRecentLeaveRequests(
  employeeId: string | undefined,
  limit: number = 5,
) {
  return useQuery<LeaveRequest[]>({
    queryKey: ['leave-history', employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/leaverequests/employee/${employeeId}`);
      // Backend returns all; slice on client to the requested limit
      return (data as LeaveRequest[]).slice(0, limit);
    },
    enabled: !!employeeId,
    staleTime: 1000 * 30, // 30 seconds — requests change more frequently
  });
}

// hooks/use-leave-queries.ts — add these two hooks
//rumsan-offera/apps/web/src/hooks/use-leave-queries.ts
export function useLeavePolicies(userId?: string) {
  return useQuery({
    queryKey: userId ? ['leave-policies', userId] : ['leave-policies'],
    queryFn: async () => {
      const url = userId
        ? `/leave-policies?userId=${userId}`
        : '/leave-policies';
      const { data } = await api.get(url);
      return data as { id: string; leaveType: string; isActive: boolean }[];
    },
    // enabled: userId !== undefined ? !!userId : true,
    enabled:
      userId === undefined || // HR Admin: always fetch
      (userId !== undefined && userId.length > 0),
    staleTime: 1000 * 60 * 1, // 1 min — policies rarely change
  });
}

export function useManagers() {
  return useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const { data } = await api.get('/users/managers');
      return data as { id: string; name: string }[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
export function useManagerLeaveRequests(managerId: string | undefined) {
  return useQuery({
    queryKey: ['manager-leave-requests', managerId],
    queryFn: async () => {
      const { data } = await api.get(`/leaverequests/manager/${managerId}`);
      return data as any[];
    },
    enabled: !!managerId,
    staleTime: 1000 * 30,
  });
}
export function useLeaveBalances(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['leave-balances', employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/leave-balances/employee/${employeeId}`);
      // Handle both array response and wrapped { data: [] } response
      const balances = Array.isArray(data) ? data : (data?.data ?? []);

      return balances as {
        id: string;
        leaveType: string;
        total: number;
        remaining: number;
        exceeded: number;
      }[];
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 2,
  });
}

// Add these hooks to use-leave-queries.ts

export function useAllEmployeesHistory(month?: number, year?: number) {
  return useQuery({
    queryKey: ['balance-history-all', month, year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      const { data } = await api.get(`/leave-balances/history/all?${params}`);
      return data as {
        id: string;
        employeeId: string;
        leaveType: string;
        month: number;
        year: number;
        total: number;
        used: number;
        remaining: number;
        employee: {
          id: string;
          name: string | null;
          email: string;
          role: string;
        };
      }[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeaveRequestsHistory(
  month?: number,
  year?: number,
  employeeId?: string,
) {
  return useQuery({
    queryKey: ['leave-requests-history', month, year, employeeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      if (employeeId) params.append('employeeId', employeeId);
      const { data } = await api.get(
        `/leave-balances/requests/history?${params}`,
      );
      return data as any[];
    },
    staleTime: 1000 * 60 * 1,
  });
}

export function useEmployeeBalanceHistory(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['balance-history', employeeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/leave-balances/employee/${employeeId}/history`,
      );
      return data as {
        id: string;
        leaveType: string;
        month: number;
        year: number;
        total: number;
        used: number;
        remaining: number;
      }[];
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5,
  });
}
export function useWfhRequests(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['wfh-requests', employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/wfh-requests/employee/${employeeId}`);
      return data as {
        id: string;
        startDate: string;
        endDate: string;
        totalDays: number;
        reason?: string;
        status: string;
        createdAt: string;
      }[];
    },
    enabled: !!employeeId,
    staleTime: 1000 * 30,
  });
}

export function useManagerWfhRequests(managerId: string | undefined) {
  return useQuery({
    queryKey: ['manager-wfh-requests', managerId],
    queryFn: async () => {
      const { data } = await api.get(`/wfh-requests/manager/${managerId}`);
      return data as {
        id: string;
        startDate: string;
        endDate: string;
        totalDays: number;
        reason?: string;
        status: string;
        createdAt: string;
        approverComment?: string;
        employee: { id: string; name: string; email: string; avatar?: string };
      }[];
    },
    enabled: !!managerId,
    staleTime: 1000 * 30,
  });
}
