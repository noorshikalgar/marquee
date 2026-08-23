import type { Playlist, PlaylistItem } from "@movie-scout/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function usePlaylists(kind?: "manual" | "watchlist" | "ai_dynamic") {
  return useQuery({
    queryKey: ["playlists", kind ?? "all"],
    queryFn: () => api.get<Playlist[]>(`/playlists${kind ? `?kind=${kind}` : ""}`),
  });
}

export function useWatchlist() {
  const { data: playlists } = usePlaylists("watchlist");
  const watchlistId = playlists?.[0]?.id;

  const detail = useQuery({
    queryKey: ["playlist", watchlistId],
    queryFn: () => api.get<{ playlist: Playlist; items: PlaylistItem[] }>(`/playlists/${watchlistId}`),
    enabled: !!watchlistId,
  });

  return { watchlistId, ...detail };
}

export function usePlaylistDetail(id: number | undefined) {
  return useQuery({
    queryKey: ["playlist", id],
    queryFn: () => api.get<{ playlist: Playlist; items: PlaylistItem[] }>(`/playlists/${id}`),
    enabled: !!id,
  });
}

export function useAddToPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, titleId }: { playlistId: number; titleId: number }) =>
      api.post(`/playlists/${playlistId}/items`, { titleId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["playlist", variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useAiPlaylists() {
  return useQuery({
    queryKey: ["playlists", "ai"],
    queryFn: () => api.get<Playlist[]>("/playlists/ai"),
  });
}

export function useRefreshAiPlaylists() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Playlist[]>("/playlists/ai/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useRemoveFromPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, titleId }: { playlistId: number; titleId: number }) =>
      api.delete(`/playlists/${playlistId}/items/${titleId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["playlist", variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}
