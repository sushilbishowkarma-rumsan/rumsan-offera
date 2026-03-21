// rumsan-offera/apps/web/hooks/use-notifications.tsx
/**
 * Notifications Hook
 * Fetches and manages real-time notifications with WebSocket support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

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

/**
 * Get unread count
 */
export function useUnreadCount(userId: string | undefined) {
  return useQuery<number>({
    queryKey: ['notifications-unread-count', userId],
    queryFn: async () => {
      const { data } = await api.get(
        `/notifications/user/${userId}/unread-count`,
      );
      return typeof data === 'number' ? data : data?.count || 0;
    },
    enabled: !!userId,
    // refetchInterval: 3000, // 3 seconds is safer for background polling than 1s
     refetchIntervalInBackground: true,
    // refetchOnWindowFocus: false, // Prevents a sudden jump when switching back
    staleTime: 30000,
  });
}

/**
 * Fetch all notifications for current user
 */
export function useNotifications(userId: string | undefined) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data } = await api.get(`/notifications/user/${userId}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userId,
    // refetchInterval: 3000,
    // Optional: ensures the data updates even if the window isn't focused
    // refetchIntervalInBackground: true,
    // Keep staleTime low or 0 if you want it to always be considered "old"
    staleTime: 60000,
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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
      toast.success('All notifications marked as read');
    },
  });
}

/**
 * Play notification sound
 */
export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5; // 50% volume

    return () => {
      audioRef.current = null;
    };
  }, []);

  // Use useCallback so this function reference stays the same
  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn(
          'Audio play blocked. User must interact with the page first.',
          err,
        );
      });
    }
  }, []);

  return { playSound };
}

/**
 * Listen for new notifications in real-time
 */
export function useNotificationListener(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { playSound } = useNotificationSound();
  const previousCountRef = useRef<number | undefined>(undefined);

  const { data: unreadCount } = useUnreadCount(userId);

  useEffect(() => {
    if (
      unreadCount !== undefined &&
      previousCountRef.current !== undefined &&
      unreadCount > previousCountRef.current
    ) {
      // New notification received
      playSound();

      // Show toast
      toast('🔔 You have new notifications', {
        duration: 4000,
        position: 'top-right',
      });
      // Refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
if (unreadCount !== undefined) {
      previousCountRef.current = unreadCount;
    }
    // previousCountRef.current = unreadCount || 0;
  }, [unreadCount, playSound, queryClient]);
}
