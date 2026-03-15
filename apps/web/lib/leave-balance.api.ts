// frontend/src/lib/leave-balance.api.ts

import { api } from './api';

export interface LeaveBalance {
  leaveType: string;
  total: number;
  remaining: number;
   exceeded: number;
}
export interface LeaveBalanceSummary {
  leaveType: string;
  label: string;
  total: number;
  used: number;
  remaining: number;
  exceeded: number;
  hasExceeded: boolean;
}

export interface EmployeeWithBalances {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  role: string;
  leaveBalances: LeaveBalance[];
}

export const leaveBalanceApi = {
  /** GET /leave-balances/employee/:id */
  getByEmployee: async (employeeId: string): Promise<LeaveBalance[]> => {
    const { data } = await api.get(`/leave-balances/employee/${employeeId}`);
    return data;
  },

  getBalanceSummary: async (
    employeeId: string,
  ): Promise<LeaveBalanceSummary[]> => {
    const { data } = await api.get(
      `/leave-balances/employee/${employeeId}/summary`,
    );
    return data;
  },
  
  /** GET /leave-balances/employees/all — HR use: all users + their balances */
  getAllEmployeesWithBalances: async (): Promise<EmployeeWithBalances[]> => {
    const { data } = await api.get('/leave-balances/employees/all');
    return data;
  },

  /** PATCH /leave-balances/employee/:id/quota — set one type for one employee */
  setEmployeeQuota: async (
    employeeId: string,
    leaveType: string,
    quota: number,
  ): Promise<void> => {
    await api.patch(`/leave-balances/employee/${employeeId}/quota`, {
      leaveType,
      quota,
    });
  },

  /** PATCH /leave-balances/employee/:id/quota/bulk — set all types at once */
  setEmployeeQuotaBulk: async (
    employeeId: string,
    entries: { leaveType: string; quota: number }[],
  ): Promise<void> => {
    await api.patch(`/leave-balances/employee/${employeeId}/quota/bulk`, {
      entries,
    });
  },
};