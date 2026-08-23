import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export type Settings = Record<string, string>;

export function useSettings(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Settings>("/settings"),
    enabled: options.enabled ?? true,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Settings) => api.patch<Settings>("/settings", patch),
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data);
    },
  });
}
