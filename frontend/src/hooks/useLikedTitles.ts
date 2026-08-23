import type { Title } from "@movie-scout/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

interface InteractionRow {
  id: number;
  titleId: number;
  interactionType: string;
  createdAt: string;
}

export function useLikedTitles() {
  const { data } = useQuery({
    queryKey: ["interactions", "like"],
    queryFn: () => api.get<InteractionRow[]>("/interactions?type=like"),
  });

  const likedTitleIds = new Map<number, number>();
  for (const row of data ?? []) {
    likedTitleIds.set(row.titleId, row.id);
  }
  return likedTitleIds;
}

export function useLikedTitlesFull() {
  return useQuery({
    queryKey: ["interactions", "like", "full"],
    queryFn: () => api.get<Title[]>("/interactions/titles?type=like"),
  });
}
