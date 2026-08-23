import type { NlSearchResponse } from "@movie-scout/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function useNlSearch(query: string) {
  return useQuery({
    queryKey: ["nlSearch", query],
    queryFn: () => api.post<NlSearchResponse>("/search/nl", { query }),
    enabled: query.trim().length > 0,
    staleTime: 5 * 60_000,
  });
}
