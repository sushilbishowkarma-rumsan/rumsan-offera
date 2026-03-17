/**
 * hooks/use-leave-mutations.ts
 * React Query mutation hooks for leave request actions.
 *
 * FIX: Controller uses @Controller('leaverequests') so URL is /leaverequests (plural).
 * Your original hook had /leaverequest (singular) — that would 404.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface CreateLeaveRequestPayload {
  employeeId: string;
  department?: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  isHalfDay?: boolean;
  halfDayPeriod?: string;
  managerId?: string;
  leaveDays?: {
    date: string;
    dayType: 'FULL' | 'FIRST_HALF' | 'SECOND_HALF';
  }[];
}
export interface CreateWfhRequestPayload {
  employeeId: string;
  startDate: string; // ← changed from date
  endDate: string;
  reason?: string;
  managerId?: string;
}
export const useCreateLeaveRequest = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLeaveRequestPayload) => {
      // ✅ Correct path: matches @Controller('leaverequests')
      const { data } = await api.post('/leaverequests', {
        ...payload,
        leaveType: payload.leaveType.toUpperCase(),
        isHalfDay: payload.isHalfDay ?? false,
      });
      // const { data } = await api.post("/leaverequests", payload);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Leave request submitted!', {
        description: `Your request has been sent for approval.`,
      });

      // Invalidate both caches so the sidebar list & balances refresh
      queryClient.invalidateQueries({
        queryKey: ['leave-history', variables.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ['leave-balances', variables.employeeId],
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-leave-requests'] });

      router.push('/dashboard/leave/history');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        'Failed to submit leave request. Please try again.';
      toast.error('Submission failed', { description: message });
    },
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      managerId,
      action,
      approverComment,
    }: {
      requestId: string;
      managerId: string;
      action: 'APPROVED' | 'REJECTED';
      approverComment?: string;
    }) => {
      const { data } = await api.patch(`/leaverequests/${requestId}/status`, {
        managerId,
        action,
        approverComment,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.action.toLowerCase()} successfully.`);
      queryClient.invalidateQueries({
        queryKey: ['manager-leave-requests', variables.managerId],
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-leave-requests'] });

    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Action failed. Please try again.';
      toast.error('Error', { description: message });
    },
  });
};
export const useCreateWfhRequest = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateWfhRequestPayload) => {
      const { data } = await api.post('/wfh-requests', payload);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('WFH request submitted!', {
        description: 'Your request has been sent for approval.',
      });
      queryClient.invalidateQueries({
        queryKey: ['wfh-requests', variables.employeeId],
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-wfh-requests'] });
      router.push('/dashboard/leave/history');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to submit WFH request.';
      toast.error('Submission failed', { description: message });
    },
  });
};
export const useUpdateWfhStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      managerId,
      action,
      approverComment,
    }: {
      requestId: string;
      managerId: string;
      action: 'APPROVED' | 'REJECTED';
      approverComment?: string;
    }) => {
      const { data } = await api.patch(`/wfh-requests/${requestId}/status`, {
        managerId,
        action,
        approverComment,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        `WFH request ${variables.action.toLowerCase()} successfully.`,
      );
      queryClient.invalidateQueries({
        queryKey: ['manager-wfh-requests', variables.managerId],
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-wfh-requests'] });

    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Action failed.';
      toast.error('Error', { description: message });
    },
  });
};
