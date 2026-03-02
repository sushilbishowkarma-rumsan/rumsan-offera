"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { AuthContextType, User, UserRole } from "./types";
import { api } from "./api";
import { useQueryClient } from "@tanstack/react-query";
const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to check storage
  const queryClient = useQueryClient();
  // --- PERSISTENCE: Check for logged in user on mount ---
  useEffect(() => {
    const savedUser = localStorage.getItem("auth_user");
    const savedToken = localStorage.getItem("auth_token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // This function runs whenever the Interceptor detects a role change
    const handleSync = (event: any) => {
      const updatedUser = event.detail;

      // Update Context State
      setUser(updatedUser);

      // Update TanStack Query Cache for 'useMe'
      // queryClient.setQueryData(["users", updatedUser.id], updatedUser);

      // Invalidate all other queries to ensure permissions are recalculated
      queryClient.invalidateQueries();
    };

    window.addEventListener("auth_user_updated", handleSync);
    return () => window.removeEventListener("auth_user_updated", handleSync);
  }, [queryClient]);

  /** * UPDATED LOGIN: Accepts the real user and token from your Backend
   */
  const login = useCallback((userData: User, token: string) => {
    setIsLoading(true);

    // 1. Update State
    setUser(userData);

    // 2. Persist to LocalStorage (so refresh doesn't log you out)
    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("auth_token", token);

    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  }, []);

  const switchRole = useCallback(
    (role: UserRole) => {
      if (user) {
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      }
    },
    [user],
  );

  // ── NEW: re-fetch user from /users/me and sync state + localStorage ──
  const refreshUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem("auth_user");
      const id = stored ? JSON.parse(stored)?.id : null;
      if (!id) return;

      const { data } = await api.get(`/users/${id}`);
      console.log("Refreshed user data:", data);
      setUser(data);
      localStorage.setItem("auth_user", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // silently fail — user stays as-is
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      switchRole,
      refreshUser,
    }),
    [user, isLoading, login, logout, switchRole, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
