// rumsan-offera/apps/web/hooks/use-leave-balance.ts

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
  export function useAllExceededBalances() {
  return useQuery({
    queryKey: ['leave-balances', 'employees', 'exceeded'] as const,
    queryFn: () => leaveBalanceApi.getAllExceededBalances(),
    staleTime: 1000 * 60 * 2, // re-fetch after 2 minutes
  });
}

export function useClearAllExceeded() {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: () => leaveBalanceApi.clearAllExceeded(),
    onSuccess: () => {
      // Refetch the exceeded list so the page immediately shows empty state
      queryClient.invalidateQueries({
        queryKey: ['leave-balances', 'employees', 'exceeded'],
      });
      // Also invalidate per-employee summaries so balances elsewhere update
      queryClient.invalidateQueries({
        queryKey: ['leave-balances'],
      });
    },
  });
}

export function useExceededHistory(params?: {
  year?:       number;
  month?:      number;
  employeeId?: string;
  search?:     string;
}) {
  return useQuery({
    queryKey: ['leave-balances', 'history', 'exceeded', params ?? {}] as const,
    queryFn:  () => leaveBalanceApi.getExceededHistory(params),
    staleTime: 1000 * 60 * 5, // 5 minutes — history doesn't change often
  });
}

/**
 * HR Admin: fetch the list of years that have exceeded history records.
 * Used to populate the year filter dropdown.
 */
export function useExceededHistoryYears() {
  return useQuery({
    queryKey: ['leave-balances', 'history', 'exceeded', 'years'] as const,
    queryFn:  leaveBalanceApi.getExceededHistoryYears,
    staleTime: 1000 * 60 * 10,
  });
}


/**
 * HR Admin: year-end reset — archive all balances then re-seed from policies.
 * Invalidates all leave-balance caches on success.
 *
 * Usage:
 *   const { mutate: yearEndReset, isPending } = useYearEndReset();
 *   yearEndReset(undefined, { onSuccess: (data) => toast(data.message) });
 */
export function useYearEndReset() {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: () => leaveBalanceApi.resetYearEnd(),
    onSuccess: () => {
      // Wipe every leave-balance cache entry so all pages reflect fresh data
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}
 