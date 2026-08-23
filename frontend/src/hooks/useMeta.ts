import type { MediaType } from "@movie-scout/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

interface Genre {
  id: number;
  name: string;
}

interface CodeName {
  code: string;
  name: string;
}

export function useGenres(mediaType: MediaType) {
  return useQuery({
    queryKey: ["meta", "genres", mediaType],
    queryFn: () => api.get<Genre[]>(`/meta/genres?media_type=${mediaType}`),
    staleTime: Infinity,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ["meta", "countries"],
    queryFn: () => api.get<CodeName[]>("/meta/countries"),
    staleTime: Infinity,
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: ["meta", "languages"],
    queryFn: () => api.get<CodeName[]>("/meta/languages"),
    staleTime: Infinity,
  });
}
