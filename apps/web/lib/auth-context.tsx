'use client';
// lib/auth-context.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { AuthContextType, User, UserRole } from './types';
import { api } from './api';
import { useQueryClient } from '@tanstack/react-query';
const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  // --- PERSISTENCE: Check for logged in user on mount ---
 
 
   const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('google token');

    if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  }, []);
  
  useEffect(() => {
    const validateSession = async () => {
      const savedUser = localStorage.getItem('auth_user');
      const savedToken = localStorage.getItem('auth_token');

      if (!savedUser || !savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        const { data } = await api.get(`/users/${parsedUser.id}`);
        setUser(data);
        localStorage.setItem('auth_user', JSON.stringify(data));
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 401) {
          console.warn('Session invalid or user deleted. Logging out.');
          logout(); // Call your existing logout function
        }
      } finally {
        setIsLoading(false);
      }
    };
    validateSession();
  }, [logout]);

  useEffect(() => {
    // This function runs whenever the Interceptor detects a role change
    const handleSync = (event: any) => {
      const updatedUser = event.detail;

      // Update Context State
      setUser(updatedUser);

      queryClient.invalidateQueries();
    };

    window.addEventListener('auth_user_updated', handleSync);
    return () => window.removeEventListener('auth_user_updated', handleSync);
  }, [queryClient]);

  /** * UPDATED LOGIN: Accepts the real user and token from your Backend
   */
  const login = useCallback((userData: User, token: string) => {
    setIsLoading(true);

    // 1. Update State
    setUser(userData);

    // 2. Persist to LocalStorage (so refresh doesn't log you out)
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', token);

    setIsLoading(false);
  }, []);

 

  const switchRole = useCallback(
    (role: UserRole) => {
      if (user) {
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }
    },
    [user],
  );

  // ── NEW: re-fetch user from /users/me and sync state + localStorage ──
  const refreshUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem('auth_user');
      const id = stored ? JSON.parse(stored)?.id : null;
      if (!id) return;

      const { data } = await api.get(`/users/${id}`);
      setUser(data);
      localStorage.setItem('auth_user', JSON.stringify(data));
    } catch (error) {
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
