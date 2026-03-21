// rumsan-offera/apps/web/hooks/use-calendar-queries.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CalendarUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

export interface CalendarLeaveDay {
  id: string;
  date: string;
  dayType: 'FULL' | 'FIRST_HALF' | 'SECOND_HALF';
}
export interface CalendarLeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  isHalfDay: boolean;
  halfDayPeriod: string | null;
  totalDays: number;
  employeeId: string;
  department: string;
  leaveDays: CalendarLeaveDay[];
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
}
export interface CalendarWfhRequest {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  employeeId: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
}
export interface CalendarHoliday {
  id: string;
  name: string;
  date: string;
  isOptional: boolean;
  createdAt: string;
}

// ✅ Updated: Role-based users fetching
export function useCalendarUsers(userRole: string | undefined) {
  return useQuery<CalendarUser[]>({
    queryKey: ['calendar-users', userRole],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: !!userRole,
    staleTime: 1000 * 60 * 5,
  });
}

// ✅ Updated: Role-based leave requests (uses new /calendar endpoint)
export function useCalendarLeaveRequests() {
  return useQuery<CalendarLeaveRequest[]>({
    queryKey: ['calendar-leave-requests'],
    queryFn: async () => {
      const { data } = await api.get('/leaverequests/calendar');
      

      return data;
    },
    // refetchInterval: 3000,
    // Optional: ensures the data updates even if the window isn't focused
    // refetchIntervalInBackground: true,
    // Keep staleTime low or 0 if you want it to always be considered "old"
    // staleTime: 0,
     staleTime: 1000 * 60,
  });
}
export function useCalendarWfhRequests() {
  return useQuery<CalendarWfhRequest[]>({
    queryKey: ['calendar-wfh-requests'],
    queryFn: async () => {
      const { data } = await api.get('/wfh-requests/calendar');
      return data;
    },
    // staleTime: 1000 * 60 * 2,
    // refetchInterval: 3000,
    // Optional: ensures the data updates even if the window isn't focused
    // refetchIntervalInBackground: true,
    // Keep staleTime low or 0 if you want it to always be considered "old"
    staleTime: 1000 * 60,
  });
}
export function useCalendarHolidays() {
  return useQuery<CalendarHoliday[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data } = await api.get('/holidays');
      return data;
    },
    // staleTime: 1000 * 60 * 10,
    // refetchInterval: 5000,
    // Optional: ensures the data updates even if the window isn't focused
    // refetchIntervalInBackground: true,
    // Keep staleTime low or 0 if you want it to always be considered "old"
    staleTime: 1000 * 60,
  });
}

// ✅ New: Get filtered users by department
export function useCalendarUsersByDepartment(department: string | undefined) {
  return useQuery<CalendarUser[]>({
    queryKey: ['calendar-users-department', department],
    queryFn: async () => {
      const { data } = await api.get('/users');
      if (!department) return data;
      return (data as CalendarUser[]).filter(
        (u) => u.department === department,
      );
    },
    enabled: !!department,
    // staleTime: 1000 * 60 * 5,
    // refetchInterval: 5000,
    // Optional: ensures the data updates even if the window isn't focused
    // refetchIntervalInBackground: true,
    // Keep staleTime low or 0 if you want it to always be considered "old"
    staleTime: 1000 * 60,
  });
}
