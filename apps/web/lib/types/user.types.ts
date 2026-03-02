// src/lib/types/user.types.ts

export type Role = "EMPLOYEE" | "MANAGER" | "HRADMIN";

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: Role;
  department?: string | null;
  createdAt: string;
  updatedAt: string;
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
  role: Role;
}
