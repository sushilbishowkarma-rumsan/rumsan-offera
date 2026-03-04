// hooks/use-auth-mutations.ts
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export const useLoginMutation = () => {
  const { login: setAuthContext } = useAuth();
const [idTokenn, setIdTokenn] = useState<string>("");
  return useMutation({
    mutationFn: async (idToken: string) => {
      setIdTokenn(idToken);
      const { data } = await api.post("/auth/google", { token: idToken });
      return data;
    },
    onSuccess: (data) => {
      setAuthContext(data.user, data.access_token);
      localStorage.setItem("auth_token", data.access_token); // Save for the interceptor
      localStorage.setItem("google token", idTokenn); // Save user info for persistence
      window.location.href = "/dashboard";
    },
  });
};