// frontend/src/hooks/use-leave-balance.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveBalanceApi } from '@/lib/leave-balance.api';

export const leaveBalanceKeys = {
  byEmployee: (id: string) => ['leave-balances', 'employee', id] as const,
  summaryByEmployee: (id: string) =>
    ['leave-balances', 'employee', id, 'summary'] as const,
  allWithBalances: ['leave-balances', 'employees', 'all'] as const,
};

/** Get one employee's leave balances */
export function useEmployeeLeaveBalances(employeeId: string) {
  return useQuery({
    queryKey: leaveBalanceKeys.byEmployee(employeeId),
    queryFn: () => leaveBalanceApi.getByEmployee(employeeId),
    enabled: Boolean(employeeId),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Rich leave summary: total, used, remaining, exceeded per leave type.
 * Use this on the employee dashboard and HR user profile page.
 */
export function useEmployeeLeaveBalanceSummary(employeeId: string) {
  return useQuery({
    queryKey: leaveBalanceKeys.summaryByEmployee(employeeId),
    queryFn: () => leaveBalanceApi.getBalanceSummary(employeeId),
    enabled: Boolean(employeeId),
    staleTime: 1000 * 60 * 2,
  });
}

/** HR: get ALL employees with their current leave balances */
export function useAllEmployeesWithBalances() {
  return useQuery({
    queryKey: leaveBalanceKeys.allWithBalances,
    queryFn: leaveBalanceApi.getAllEmployeesWithBalances,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/** HR: bulk-update all leave quotas for one employee */
export function useSetEmployeeLeaveQuotaBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      entries,
    }: {
      employeeId: string;
      entries: { leaveType: string; quota: number }[];
    }) => leaveBalanceApi.setEmployeeQuotaBulk(employeeId, entries),
    onSuccess: (_data, { employeeId }) => {
      // Invalidate both the individual employee cache and the full list
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.byEmployee(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.summaryByEmployee(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.allWithBalances,
      });
    },
  });
}
