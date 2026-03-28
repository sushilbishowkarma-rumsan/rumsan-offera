// rumsan-offera/apps/web/hooks/use-notifications.tsx
/**
 * Notifications Hook
 * Fetches and manages real-time notifications with WebSocket support
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { getSocket, isAudioUnlocked } from '@/lib/socket';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  linkTo?: string;
  createdAt: string;
  relatedRequestId?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  meta: PaginationMeta;
}

let _audio: HTMLAudioElement | null = null;
function getNotificationAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_audio) {
    _audio = new Audio('/sounds/notification.mp3');
    _audio.volume = 0.5;
  }
  return _audio;
}

export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  if (!isAudioUnlocked()) return;
  const audio = getNotificationAudio();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch((err) => {
    // silently ignore  });
  });
}

export function useNotificationSound() {
  return { playSound: playNotificationSound };
}

export const notifKeys = {
  all: (userId: string) => ['notifications', userId] as const,
  page: (userId: string, page: number, limit: number) =>
    ['notifications', userId, page, limit] as const,
  unread: (userId: string) => ['notifications-unread-count', userId] as const,
};

export function useNotifications(
  userId: string | undefined,
  { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
) {
  return useQuery<PaginatedNotifications>({
    queryKey: notifKeys.page(userId ?? '', page, limit),
    queryFn: async () => {
      const { data } = await api.get(
        `/notifications/user/${userId}?page=${page}&limit=${limit}`,
      );
      return data as PaginatedNotifications;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min — socket keeps it fresh
    placeholderData: (prev) => prev, // keep previous page visible while fetching
  });
}

export function useInfiniteNotifications(
  userId: string | undefined,
  limit = 20,
) {
  return useInfiniteQuery<PaginatedNotifications>({
    queryKey: ['notifications-infinite', userId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get(
        `/notifications/user/${userId}?page=${pageParam}&limit=${limit}`,
      );
      return data as PaginatedNotifications;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery<number>({
    queryKey: notifKeys.unread(userId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(
        `/notifications/user/${userId}/unread-count`,
      );
      return typeof data === 'number' ? data : (data?.count ?? 0);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
/**
 * Mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: (_, notificationId) => {
      // Optimistic: flip isRead in every cached page without refetching
      queryClient.setQueriesData<PaginatedNotifications>(
        { queryKey: ['notifications'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n,
            ),
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
  });
}

/**
 * Mark all as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/notifications/user/${userId}/mark-all-read`);
    },
    onSuccess: (_, userId) => {
      // Optimistic: mark everything read in cache
      queryClient.setQueriesData<PaginatedNotifications>(
        { queryKey: ['notifications', userId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => ({ ...n, isRead: true })),
          };
        },
      );
      // Set badge to 0 immediately
      queryClient.setQueryData(notifKeys.unread(userId), 0);
      toast.success('All notifications marked as read');
    },
  });
}

/**
 * Listen for new notifications in real-time
 */
export function useNotificationSocket(
  userId: string | undefined,
  token: string | undefined,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !token) return;

    const socket = getSocket(token);

    // Emit join — socket.io queues it if not yet connected, safe to call always
    socket.emit('join', { userId });

    const handleNew = (notification: Notification) => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', userId],
        exact: false,
      });

      queryClient.setQueryData<number>(
        notifKeys.unread(userId),
        (prev) => (prev ?? 0) + 1,
      );

      toast('🔔 You have a new notification', {
        duration: 4000,
        position: 'top-right',
      });

      playNotificationSound();
    };

    const handleUnreadCount = ({ count }: { count: number }) => {
      queryClient.setQueryData(notifKeys.unread(userId), count);
    };

    socket.on('new_notification', handleNew);
    socket.on('unread_count', handleUnreadCount);

    return () => {
      socket.off('new_notification', handleNew);
      socket.off('unread_count', handleUnreadCount);
    };
  }, [userId, token, queryClient]);
  // Note: playNotificationSound removed from deps — it's a stable module fn now
}
