import type { MediaType, Title } from "@movie-scout/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

interface PagedTitles {
  page: number;
  totalPages: number;
  results: Title[];
}

export type UpcomingBucket = "soon" | "this_year" | "next_year";

export function useUpcoming(mediaType: MediaType, bucket: UpcomingBucket) {
  return useQuery({
    queryKey: ["upcoming", mediaType, bucket],
    queryFn: () => api.get<PagedTitles>(`/browse/upcoming?media_type=${mediaType}&bucket=${bucket}&page=1`),
  });
}
