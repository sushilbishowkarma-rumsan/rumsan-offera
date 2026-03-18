// rumsan-offera/apps/web/hooks/use-wfh-queries.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAllWfhRequests() {
  return useQuery({
    queryKey: ["admin-all-wfh-requests"],
    queryFn: async () => {
      const { data } = await api.get("/wfh-requests/all");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 30,
  });
}