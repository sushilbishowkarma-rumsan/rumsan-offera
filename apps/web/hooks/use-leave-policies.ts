// rumsan-offera/apps/web/hooks/use-leave-policies.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leavePolicyApi } from '@/lib/leave-policy.api';
import type {
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
} from '@/lib/leave-policy.types';

/** Stable query key factory — keeps cache keys consistent */
export const leavePolicyKeys = {
  all: ['leave-policies'] as const,
  detail: (id: string) => ['leave-policies', id] as const,
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────

export function useLeavePolicies() {
  return useQuery({
    queryKey: leavePolicyKeys.all,
    queryFn: leavePolicyApi.getAll,
    staleTime: 1000 * 60 * 1, // 1 minute — policies don't change often
  });
}

// ─── GET ONE ─────────────────────────────────────────────────────────────────

export function useLeavePolicy(id: string) {
  return useQuery({
    queryKey: leavePolicyKeys.detail(id),
    queryFn: () => leavePolicyApi.getOne(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export function useCreateLeavePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLeavePolicyDto) => leavePolicyApi.create(dto),
    onSuccess: () => {
      // Invalidate the list so the table re-fetches
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export function useUpdateLeavePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeavePolicyDto }) =>
      leavePolicyApi.update(id, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.all });
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: ['employees'] }); 

    },
  });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export function useDeleteLeavePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leavePolicyApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.all });
    },
  });
}
