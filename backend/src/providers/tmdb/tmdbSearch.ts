import { tmdbGet } from "./tmdbClient.js";
import type { TmdbListItem } from "./tmdbMappers.js";

interface KeywordSearchResponse {
  results: { id: number; name: string }[];
}

export async function keywordNamesToIds(names: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const name of names) {
    const res = await tmdbGet<KeywordSearchResponse>("/search/keyword", { query: name });
    const match = res.results[0];
    if (match) ids.push(match.id);
  }
  return ids;
}

interface MultiSearchResponse {
  results: (TmdbListItem & { media_type: "movie" | "tv" | "person" })[];
}

export async function searchMulti(query: string): Promise<TmdbListItem[]> {
  const res = await tmdbGet<MultiSearchResponse>("/search/multi", { query, include_adult: "false" });
  return res.results.filter((r) => r.media_type === "movie" || r.media_type === "tv");
}
