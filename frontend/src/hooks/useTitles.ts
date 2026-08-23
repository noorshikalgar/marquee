import type { InteractionType, Title, TitleDetail } from "@movie-scout/shared";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { useLanguage } from "../lib/i18n/LanguageContext";

interface PagedTitles {
  page: number;
  totalPages: number;
  results: Title[];
}

export function useTrending(mediaType: "all" | "movie" | "tv", window: "day" | "week") {
  return useInfiniteQuery({
    queryKey: ["trending", mediaType, window],
    queryFn: ({ pageParam }) =>
      api.get<PagedTitles>(`/browse/trending?media_type=${mediaType}&window=${window}&page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });
}

export function usePersonalized(mediaType: "movie" | "tv", page: number) {
  return useQuery({
    queryKey: ["personalized", mediaType, page],
    queryFn: () => api.get<PagedTitles>(`/browse/personalized?media_type=${mediaType}&page=${page}`),
  });
}

export function useTitleDetail(mediaType: "movie" | "tv", tmdbId: number) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ["title", mediaType, tmdbId, language],
    queryFn: () => api.get<TitleDetail>(`/titles/${mediaType}/${tmdbId}?lang=${language}`),
    enabled: !!tmdbId,
  });
}

export function useRecordInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ titleId, type }: { titleId: number; type: InteractionType }) =>
      api.post("/interactions", { titleId, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalized"] });
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      queryClient.invalidateQueries({ queryKey: ["title"] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
    },
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/interactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalized"] });
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      queryClient.invalidateQueries({ queryKey: ["title"] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
    },
  });
}
