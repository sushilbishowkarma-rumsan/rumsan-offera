// frontend/src/lib/api/leave-policy.api.ts

import { api } from "./api";
import type {
  LeavePolicy,
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
} from "./leave-policy.types";

const BASE = "/leave-policies";

export const leavePolicyApi = {
  /** GET /leave-policies — fetch all policies */
  getAll: async (): Promise<LeavePolicy[]> => {
    const { data } = await api.get<LeavePolicy[]>(BASE);
    return data;
  },

  /** GET /leave-policies/:id — fetch one policy */
  getOne: async (id: string): Promise<LeavePolicy> => {
    const { data } = await api.get<LeavePolicy>(`${BASE}/${id}`);
    return data;
  },

  /** POST /leave-policies — create a new policy */
  create: async (dto: CreateLeavePolicyDto): Promise<LeavePolicy> => {
    const { data } = await api.post<LeavePolicy>(BASE, dto);
    return data;
  },

  /** PATCH /leave-policies/:id — update an existing policy */
  update: async (
    id: string,
    dto: UpdateLeavePolicyDto,
  ): Promise<LeavePolicy> => {
    const { data } = await api.patch<LeavePolicy>(`${BASE}/${id}`, dto);
    return data;
  },

  /** DELETE /leave-policies/:id — remove a policy */
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
