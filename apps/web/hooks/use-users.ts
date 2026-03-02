// src/hooks/use-users.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/users.api";
import type { UpdateRoleDto } from "@/lib/types/user.types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const userKeys = {
  all: ["users"] as const,
  me: (id: string) => ["users", id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: usersApi.getAll,
    staleTime: 3000,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { user: currentUser, refreshUser } = useAuth();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRoleDto }) =>
      usersApi.updateRole(id, dto),

    onSuccess: async (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      if (currentUser?.id === variables.id) {
        await refreshUser();
      }
    },
  });
}

// export function useMe() {
//   const user = JSON.parse(localStorage.getItem("auth_user") || "null");
//   const id = user?.id;

//   return useQuery({
//     queryKey: ["users", id],
//     queryFn: async () => {
//       const { data } = await api.get(`/users/${id}`);
//       return data;
//     },
//     enabled: !!id, // ← only runs when id exists
//     staleTime: 1000 * 60 * 5,
//   });
// }
export function useMe() {
  const { user } = useAuth(); // Get the ID from context instead of manual localStorage parse
  const id = user?.id;

  return useQuery({
    // queryKey: ["users", id],
    queryKey: userKeys.me(id ?? ""),
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 3000,
  });
}

//   return useQuery({
//     queryKey: ['users', 'me', id],
//     queryFn: async () => {
//       const { data } = await api.get('/users/me/');
//       return data;
//     },
//     enabled: !!id,
//     staleTime: 1000 * 60 * 5,
//   });
// }
// queryKey: ['users', 'me', id],
// queryFn: () => usersApi.getMe(id),
