// hooks/use-auth-mutations.ts
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const useLoginMutation = () => {
  const { login: setAuthContext } = useAuth();

  return useMutation({
    mutationFn: async (idToken: string) => {
      const { data } = await api.post("/auth/google", { token: idToken });
      return data;
    },
    onSuccess: (data) => {
      setAuthContext(data.user, data.access_token);
      localStorage.setItem("auth_token", data.access_token); // Save for the interceptor
      window.location.href = "/dashboard";
    },
  });
};