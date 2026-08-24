import type { MediaType, Title } from "@movie-scout/shared";
import { toTitleDtos, upsertTitles } from "../db/repositories/titlesRepo.js";
import { topPreferences } from "../db/repositories/preferencesRepo.js";
import { genreNameToId } from "../providers/tmdb/genreMap.js";
import { tmdbGet } from "../providers/tmdb/tmdbClient.js";
import { mapListItemToTitleInsert, type TmdbListItem } from "../providers/tmdb/tmdbMappers.js";

interface TmdbListResponse {
  page: number;
  results: TmdbListItem[];
  total_pages: number;
  total_results: number;
}

export interface PagedTitles {
  page: number;
  totalPages: number;
  results: Title[];
}

async function toPagedTitles(raw: TmdbListResponse, mediaType: MediaType | "movie" | "tv"): Promise<PagedTitles> {
  const inserts = await Promise.all(
    raw.results.map((item) => mapListItemToTitleInsert(item, resolveMediaType(item, mediaType))),
  );
  const rows = await upsertTitles(inserts);
  const results = await toTitleDtos(rows);
  return { page: raw.page, totalPages: raw.total_pages, results };
}

function resolveMediaType(item: TmdbListItem, fallback: MediaType | "movie" | "tv"): MediaType {
  if (item.media_type === "movie" || item.media_type === "tv") return item.media_type;
  return fallback as MediaType;
}

export async function getTrending(mediaType: "all" | MediaType, window: "day" | "week", page: number) {
  const raw = await tmdbGet<TmdbListResponse>(`/trending/${mediaType}/${window}`, { page });
  return toPagedTitles(raw, mediaType === "all" ? "movie" : mediaType);
}

export async function getDiscover(
  mediaType: MediaType,
  page: number,
  opts: {
    withGenres?: number[];
    genreMatch?: "and" | "or";
    withoutGenres?: number[];
    withKeywords?: number[];
    sortBy?: string;
    originCountry?: string[];
    originalLanguage?: string[];
    fromYear?: number | null;
    toYear?: number | null;
    minVoteAverage?: number | null;
    minVoteCount?: number;
    maxPopularity?: number;
    watchProviderIds?: number[];
    watchRegion?: string;
  } = {},
) {
  const dateField = mediaType === "movie" ? "primary_release_date" : "first_air_date";
  const genreSeparator = opts.genreMatch === "or" ? "|" : ",";
  const raw = await tmdbGet<TmdbListResponse>(`/discover/${mediaType}`, {
    page,
    sort_by: opts.sortBy ?? "popularity.desc",
    with_genres: opts.withGenres?.length ? opts.withGenres.join(genreSeparator) : undefined,
    without_genres: opts.withoutGenres?.length ? opts.withoutGenres.join(",") : undefined,
    with_keywords: opts.withKeywords?.length ? opts.withKeywords.join("|") : undefined,
    with_origin_country: opts.originCountry?.length ? opts.originCountry.join("|") : undefined,
    with_original_language: opts.originalLanguage?.length ? opts.originalLanguage.join("|") : undefined,
    [`${dateField}.gte`]: opts.fromYear ? `${opts.fromYear}-01-01` : undefined,
    [`${dateField}.lte`]: opts.toYear ? `${opts.toYear}-12-31` : undefined,
    "vote_average.gte": opts.minVoteAverage ?? undefined,
    "vote_count.gte": opts.minVoteCount ?? undefined,
    "popularity.lte": opts.maxPopularity ?? undefined,
    with_watch_providers: opts.watchProviderIds?.length ? opts.watchProviderIds.join("|") : undefined,
    watch_region: opts.watchProviderIds?.length ? opts.watchRegion : undefined,
  });
  return toPagedTitles(raw, mediaType);
}

export type UpcomingBucket = "soon" | "this_year" | "next_year";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function bucketDateRange(bucket: UpcomingBucket): { gte: string; lte: string } {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (bucket === "soon") {
    const in30Days = new Date(today);
    in30Days.setUTCDate(in30Days.getUTCDate() + 30);
    return { gte: toIsoDate(today), lte: toIsoDate(in30Days) };
  }

  if (bucket === "this_year") {
    const in31Days = new Date(today);
    in31Days.setUTCDate(in31Days.getUTCDate() + 31);
    const endOfYear = new Date(Date.UTC(today.getUTCFullYear(), 11, 31));
    return { gte: toIsoDate(in31Days), lte: toIsoDate(endOfYear) };
  }

  const startOfNextYear = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
  const endOfNextYear = new Date(Date.UTC(today.getUTCFullYear() + 1, 11, 31));
  return { gte: toIsoDate(startOfNextYear), lte: toIsoDate(endOfNextYear) };
}

export async function getUpcoming(mediaType: MediaType, bucket: UpcomingBucket, page: number): Promise<PagedTitles> {
  const dateField = mediaType === "movie" ? "primary_release_date" : "first_air_date";
  const { gte, lte } = bucketDateRange(bucket);

  const raw = await tmdbGet<TmdbListResponse>(`/discover/${mediaType}`, {
    page,
    sort_by: "popularity.desc",
    [`${dateField}.gte`]: gte,
    [`${dateField}.lte`]: lte,
  });
  return toPagedTitles(raw, mediaType);
}

export async function getPersonalized(userId: number, mediaType: MediaType, page: number): Promise<PagedTitles> {
  const topGenres = topPreferences(userId, "genre", 3);

  if (topGenres.length === 0) {
    return getDiscover(mediaType, page, { sortBy: "popularity.desc" });
  }

  const genreIds: number[] = [];
  for (const pref of topGenres) {
    const id = await genreNameToId(pref.value, mediaType);
    if (id) genreIds.push(id);
  }

  if (genreIds.length === 0) {
    return getDiscover(mediaType, page);
  }

  return getDiscover(mediaType, page, { withGenres: genreIds, sortBy: "popularity.desc" });
}
