// hooks/use-holiday-queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isOptional: boolean;
  createdAt: string;
}

export function useHolidays() {
  return useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data } = await api.get('/holidays');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 min — holidays don't change often
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; date: string; isOptional: boolean }) => {
      const { data } = await api.post('/holidays', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday added', { description: `${data.name} has been added.` });
    },
    onError: (err: any) => {
      toast.error('Failed to add holiday', {
        description: err.response?.data?.message ?? 'Please try again.',
      });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/holidays/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday removed');
    },
    onError: (err: any) => {
      toast.error('Failed to remove holiday', {
        description: err.response?.data?.message ?? 'Please try again.',
      });
    },
  });
}