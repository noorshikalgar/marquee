import type { MediaType, Title } from "@movie-scout/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

interface PagedTitles {
  page: number;
  totalPages: number;
  results: Title[];
}

export type UpcomingBucket = "soon" | "this_year" | "next_year";

export function useUpcoming(mediaType: MediaType, bucket: UpcomingBucket) {
  return useInfiniteQuery({
    queryKey: ["upcoming", mediaType, bucket],
    queryFn: ({ pageParam }) =>
      api.get<PagedTitles>(`/browse/upcoming?media_type=${mediaType}&bucket=${bucket}&page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });
}
