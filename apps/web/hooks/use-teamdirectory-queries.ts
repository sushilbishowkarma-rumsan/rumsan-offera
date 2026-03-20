import { useQuery } from '@tanstack/react-query';
import { departmentApi, employeeApi } from '../lib/rumsan.api';

export interface Employee {
  cuid: string;
  name: string;
  email: string;
  gender: string | null;
  active: boolean;
  job_title: string | null;
  department: string | null;
  employment_type: string | null;
  phone_work: string | null;
  phone_home: string | null;
  manager_cuid: string | null;
  org_unit_path: string | null;
  thumbnail_photo_url: string | null;
  recovery_phone: string | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  displayName: string;
  orgUnitPath: string;
}

// ─── TanStack hooks ───────────────────────────────────────────────────────────

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ['employees-all'],
    queryFn: async () => {
      const { data } = await employeeApi.get(
        `${process.env.NEXT_PUBLIC_BASE_RUMSAN_URL}/employees`,
      );
      return data.data?.users ?? [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await departmentApi.get(
        `${process.env.NEXT_PUBLIC_BASE_RUMSAN_USER_DEP_URL}/departments`,
      );
      return data.data ?? [];
    },
    staleTime: 1000 * 60 * 50, // 50 minutes
  });
}

