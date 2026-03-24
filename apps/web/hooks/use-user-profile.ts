// rumsan-offera/apps/web/src/hooks/use-user-profile.ts
/**
 * User Profile Data Fetching Hooks
 * For viewing detailed user information (HR Admin & Manager only)
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UserProfile {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  rsofficeId: string | null;
  department: string | null;
  jobTitle: string | null;
  role: string;
  employmentType: string | null;
  orgUnit: string | null;
  gender: string | null;
  phoneWork: string | null;
  phoneHome: string | null;
  phoneRecovery: string | null;
  managerCuid: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserLeaveBalance {
  id: string;
  leaveType: string;
  total: number;
  remaining: number;
  used: number;
}

export interface UserLeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string | null;
  status: string;
  isHalfDay: boolean;
  halfDayPeriod: string | null;
  totalDays: number;
  department: string | null;
  approverComment: string | null;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Get user profile details
 */
export function useUserProfile(userId: string | undefined) {
  return useQuery<UserProfile>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get user leave balances
 */
export function useUserLeaveBalances(userId: string | undefined) {
  return useQuery<UserLeaveBalance[]>({
    queryKey: ['user-leave-balances', userId],
    queryFn: async () => {
      const { data } = await api.get(`/leave-balances/employee/${userId}`);
      return Array.isArray(data)
        ? data.map((bal: any) => ({
            ...bal,
            used: bal.total - bal.remaining,
          }))
        : [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get user leave request history
 */
export function useUserLeaveHistory(userId: string | undefined) {
  return useQuery<UserLeaveRequest[]>({
    queryKey: ['user-leave-history', userId],
    queryFn: async () => {
      const { data } = await api.get(`/leaverequests/employee/${userId}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUserWfhHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-wfh-history', userId],
    queryFn: async () => {
      const { data } = await api.get(`/wfh-requests/employee/${userId}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userId,
  });
}
