import type { Digest } from "@movie-scout/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function useDigests() {
  return useQuery({
    queryKey: ["digests"],
    queryFn: () => api.get<Digest[]>("/digests"),
  });
}

export function useDigest(id: number) {
  return useQuery({
    queryKey: ["digests"],
    queryFn: () => api.get<Digest[]>("/digests"),
    select: (digests) => digests.find((d) => d.id === id),
  });
}

export function useUnreadDigestCount() {
  return useQuery({
    queryKey: ["digests", "unread-count"],
    queryFn: () => api.get<{ count: number }>("/digests/unread-count"),
    refetchInterval: 60_000,
  });
}

export function useMarkDigestRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/digests/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digests"] });
    },
  });
}

export function useGenerateDigestNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/digests/generate-now"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digests"] });
    },
  });
}
