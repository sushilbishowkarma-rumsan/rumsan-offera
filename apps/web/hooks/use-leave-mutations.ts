//rumsan-offera/apps/web/hooks/use-leave-mutation
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
  totalDays: number;
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

      router.push('/leave/history');
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

export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateLeaveRequestPayload;
    }) => {
      const { data } = await api.patch(`/leaverequests/${id}`, {
        ...payload,
        leaveType: payload.leaveType.toUpperCase(),
        isHalfDay: payload.isHalfDay ?? false,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Leave request updated!', {
        description: 'Your changes have been saved.',
      });
      queryClient.invalidateQueries({
        queryKey: ['leave-history', variables.payload.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ['leave-balances', variables.payload.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ['calendar-leave-requests'],
      });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to update leave request.';
      toast.error('Update failed', { description: message });
    },
  });
};

// ── DELETE leave request (employee deletes PENDING request) ──
export const useDeleteLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      employeeId,
    }: {
      id: string;
      employeeId: string;
    }) => {
      await api.delete(`/leaverequests/${id}`);
      return { id, employeeId };
    },
    onSuccess: (variables) => {
      toast.success('Request deleted successfully.');
      queryClient.invalidateQueries({
        queryKey: ['leave-history', variables.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ['leave-balances', variables.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ['calendar-leave-requests'],
      });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to delete leave request.';
      toast.error('Delete failed', { description: message });
    },
  });
};

export const useAdminDeleteLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leaverequests/admin/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Leave request deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-all-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to delete request.';
      toast.error('Delete failed', { description: message });
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
        // queryKey: ['wfh-requests', variables.employeeId],
        queryKey: ['wfh-history', variables.employeeId],
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-wfh-requests'] });
      router.push('/leave/history');
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

// ── DELETE WFH request ──
export const useDeleteWfhRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      employeeId,
    }: {
      id: string;
      employeeId: string;
    }) => {
      await api.delete(`/wfh-requests/${id}`);
      return { id, employeeId };
    },
    onSuccess: (variables) => {
      toast.success('WFH request deleted successfully.');
      queryClient.invalidateQueries({
        queryKey: ['wfh-history', variables.employeeId],
      });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to delete WFH request.';
      toast.error('Delete failed', { description: message });
    },
  });
};

export const useAdminDeleteWfhRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wfh-requests/admin/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('WFH request deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-all-wfh-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-wfh-requests'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to delete WFH request.';
      toast.error('Delete failed', { description: message });
    },
  });
};

// ── UPDATE WFH request ──
// Payload type for WFH update — adjust to match your CreateWfhRequestPayload
interface UpdateWfhPayload {
  employeeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  managerId: string;
}

export const useUpdateWfhRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateWfhPayload;
    }) => {
      const { data } = await api.patch(`/wfh-requests/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('WFH request updated!', {
        description: 'Your changes have been saved.',
      });
      queryClient.invalidateQueries({
        queryKey: ['wfh-history', variables.payload.employeeId],
      });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to update WFH request.';
      toast.error('Update failed', { description: message });
    },
  });
};
