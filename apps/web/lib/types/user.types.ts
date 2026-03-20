// src/lib/types/user.types.ts

export type UserRole = 'MANAGER' | 'HRADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  googleId: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department?: string; // ← optional: DB can return null for new users
  designation?: string; // ← optional: not always set
  org_unit: string;
  managerCuid: string;
  joinDate?: string; // ← optional: backend uses createdAt, not joinDate
  createdAt?: string | undefined; // ← ADD: backend returns this
  updatedAt?: string; // ← ADD: backend returns this
  employment_type: string | null;
  phone_work: string | null;
  phone_home: string | null;
  phone_recovery: string | null;
  job_title: string | null;
  gender: string | null;
  rsofficeId: string | null;
}

// 2. Add `refreshUser` to AuthContextType:
export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>; // ← ADD THIS
};

export interface UpdateRoleDto {
  role: UserRole;
}
