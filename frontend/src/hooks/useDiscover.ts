import type { MediaType, Title } from "@movie-scout/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

interface PagedTitles {
  page: number;
  totalPages: number;
  results: Title[];
}

export interface DiscoverFilters {
  mediaType: MediaType;
  genreIds: number[];
  originCountry: string;
  originalLanguage: string;
  fromYear: string;
  toYear: string;
  minRating: string;
  sortBy: string;
}

export const defaultDiscoverFilters: DiscoverFilters = {
  mediaType: "movie",
  genreIds: [],
  originCountry: "",
  originalLanguage: "",
  fromYear: "",
  toYear: "",
  minRating: "",
  sortBy: "popularity",
};

function buildParams(filters: DiscoverFilters, page: number): string {
  const params = new URLSearchParams();
  params.set("media_type", filters.mediaType);
  params.set("page", String(page));
  params.set("sort_by", filters.sortBy);
  if (filters.genreIds.length > 0) params.set("with_genres", filters.genreIds.join(","));
  if (filters.originCountry) params.set("origin_country", filters.originCountry);
  if (filters.originalLanguage) params.set("original_language", filters.originalLanguage);
  if (filters.fromYear) params.set("from_year", filters.fromYear);
  if (filters.toYear) params.set("to_year", filters.toYear);
  if (filters.minRating) params.set("min_rating", filters.minRating);
  return params.toString();
}

export function useDiscover(filters: DiscoverFilters, options: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: ["discover", filters],
    queryFn: ({ pageParam }) => api.get<PagedTitles>(`/browse/discover?${buildParams(filters, pageParam)}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled: options.enabled ?? true,
  });
}
