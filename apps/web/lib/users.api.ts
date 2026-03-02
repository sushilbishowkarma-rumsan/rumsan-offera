// src/lib/api/users.api.ts

import { api } from "./api";
import type { User, UpdateRoleDto } from "./types/user.types";

const BASE = "/users";

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>(BASE);
    return data;
  },

  updateRole: async (id: string, dto: UpdateRoleDto): Promise<User> => {
    const { data } = await api.patch<User>(`${BASE}/${id}/role`, dto);
    return data;
  },
  getMe: async (): Promise<User> => {
  const { data } = await api.get<User>('/users/me');
  return data;
},
};
