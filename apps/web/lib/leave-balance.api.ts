// frontend/src/lib/leave-balance.api.ts

import { api } from './api';
export interface LeaveBalance {
  leaveType: string;
  total: number;
  remaining: number;
   exceeded: number;
}
export interface ExceededHistoryRow {
  id:         string;
  employeeId: string;
  leaveType:  string;
  month:      number;  // 1-12
  year:       number;
  total:      number;
  used:       number;
  remaining:  number;
  exceeded:   number;
  createdAt:  string;
  employee: {
    id:         string;
    name:       string | null;
    email:      string;
    department: string | null;
    role:       string;
    avatar:     string | null;
  };
}
export interface YearEndResetResult {
  archived: number;
  deleted:  number;
  created:  number;
  year:     number;
  message:  string;
}
export interface LeaveBalanceSummary {
  leaveType: string;
  label: string;
  total: number;
  used: number;
  remaining: number;
  exceeded: number;
  hasExceeded: boolean;
  comments?: string;
}

export interface EmployeeWithBalances {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  role: string;
  leaveBalances: LeaveBalance[];
}

export interface ExceededLeaveEntry {
  leaveType: string;
  label: string;
  total: number;
  exceeded: number;
  remaining: number;
  usedWithinQuota: number;
}
export interface ExceededEmployeeRow {
  employee: {
    id: string;
    name: string | null;
    email: string;
    department: string | null;
    role: string;
    avatar: string | null;
  };
  leaves: ExceededLeaveEntry[];
  totalExceededDays: number;
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

    /**
   * Fetch all employees with exceeded leave days.
   * Calls GET /leave-balances/employees/exceeded
   */
  getAllExceededBalances: async () => {
    const res = await api.get('/leave-balances/employees/exceeded');
    return res.data as ExceededEmployeeRow[];
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

  getExceededHistory: async (params?: {
    year?:       number;
    month?:      number;
    employeeId?: string;
    search?:     string;
  }): Promise<ExceededHistoryRow[]> => {
    const query = new URLSearchParams();
    if (params?.year)       query.set('year',       String(params.year));
    if (params?.month)      query.set('month',      String(params.month));
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.search)     query.set('search',     params.search);
    const res = await api.get(
      `/leave-balances/history/exceeded?${query.toString()}`,
    );
    return res.data;
  },
 

   getExceededHistoryYears: async (): Promise<number[]> => {
    const res = await api.get('/leave-balances/history/exceeded/years');
    return res.data;
  },



  resetYearEnd: async (): Promise<YearEndResetResult> => {
    const res = await api.post('/leave-balances/reset/year-end');
    return res.data;
  },

  clearAllExceeded: async (): Promise<{ cleared: number; message: string }> => {
    const res = await api.delete('/leave-balances/employees/exceeded');
    return res.data;
  },
};