import type { MediaType, NlSearchResponse, Title } from "@movie-scout/shared";
import { getCachedQuery, setCachedQuery } from "../db/repositories/aiCacheRepo.js";
import { getTitlesByIds, toTitleDtos, upsertTitles } from "../db/repositories/titlesRepo.js";
import { topPreferences } from "../db/repositories/preferencesRepo.js";
import { getSetting } from "../db/repositories/settingsRepo.js";
import { featureFlags } from "../config/env.js";
import { generateStructured } from "../providers/gemini/geminiClient.js";
import { buildNlSearchPrompt, buildRefinementPrompt, buildSearchRerankPrompt } from "../providers/gemini/prompts.js";
import { nlQuerySchema, searchRerankSchema, type NlQueryResult, type SearchRerankResult } from "../providers/gemini/schemas.js";
import { genreNamesToIds } from "../providers/tmdb/genreMap.js";
import { keywordNamesToIds, searchMulti } from "../providers/tmdb/tmdbSearch.js";
import { mapListItemToTitleInsert } from "../providers/tmdb/tmdbMappers.js";
import { watchProviderNamesToIds } from "../providers/tmdb/watchProviderMap.js";
import { searchSupplemental } from "../providers/tavily/tavilyClient.js";
import { sha256 } from "../utils/hash.js";
import { logger } from "../utils/logger.js";
import { getDiscover } from "./browseService.js";
import { getSimilarTitles } from "./titleService.js";

const DEFAULT_WATCH_REGION = "US";

export async function searchNaturalLanguage(userId: number, query: string): Promise<NlSearchResponse> {
  if (!featureFlags.aiSearchEnabled) {
    return literalFallbackSearch(query);
  }

  // Personalization changes what a given query resolves to, so the cache must be
  // scoped per-user — two users typing the same vague query can get different results.
  const queryHash = sha256(`${userId}:${query}`);
  const cached = getCachedQuery(queryHash);
  if (cached) {
    const rows = getTitlesByIds(cached.resolvedTitleIds);
    const results = await toTitleDtos(rows);
    const parsed = cached.parsedResult as NlQueryResult;
    return { query, interpreted: toInterpretation(parsed), results };
  }

  const topGenres = topPreferences(userId, "genre", 5).map((p) => p.value);

  let parsed: NlQueryResult;
  try {
    parsed = await generateStructured<NlQueryResult>(buildNlSearchPrompt(query, topGenres), nlQuerySchema);
  } catch (err) {
    logger.error({ err, query }, "Gemini NL search parse failed, falling back to literal search");
    return literalFallbackSearch(query);
  }

  if ((parsed.needsWebDisambiguation || parsed.confidence < 0.5) && featureFlags.tavilyEnabled) {
    const snippets = await searchSupplemental(query);
    if (snippets.length > 0) {
      try {
        parsed = await generateStructured<NlQueryResult>(buildRefinementPrompt(query, snippets, topGenres), nlQuerySchema);
      } catch (err) {
        logger.warn({ err }, "Gemini refinement pass failed, keeping initial interpretation");
      }
    }
  }

  const watchRegion = getSetting(userId, "preferredCountry") || DEFAULT_WATCH_REGION;
  const results = await resolveResults(query, parsed, watchRegion);
  setCachedQuery(
    queryHash,
    query,
    parsed,
    results.map((r) => r.id),
  );

  return { query, interpreted: toInterpretation(parsed), results };
}

const SORT_MAP: Record<NlQueryResult["sortBy"], (dateField: string) => string> = {
  popularity: () => "popularity.desc",
  rating: () => "vote_average.desc",
  newest: (dateField) => `${dateField}.desc`,
  oldest: (dateField) => `${dateField}.asc`,
};

async function resolveResults(query: string, parsed: NlQueryResult, watchRegion: string): Promise<Title[]> {
  const mediaTypes: MediaType[] = parsed.mediaType === "all" ? ["movie", "tv"] : [parsed.mediaType];
  const collected: Title[] = [];
  const seen = new Set<string>();
  let usedDiscover = false;

  const watchProviderIds = parsed.watchProviders.length > 0 ? await watchProviderNamesToIds(parsed.watchProviders) : [];

  for (const mediaType of mediaTypes) {
    const genreIds = await genreNamesToIds(parsed.genres, mediaType);
    const excludeGenreIds = parsed.excludeGenres.length > 0 ? await genreNamesToIds(parsed.excludeGenres, mediaType) : [];
    const keywordIds = parsed.keywords.length > 0 ? await keywordNamesToIds(parsed.keywords) : [];
    const dateField = mediaType === "movie" ? "primary_release_date" : "first_air_date";

    if (
      genreIds.length > 0 ||
      keywordIds.length > 0 ||
      parsed.originCountry.length > 0 ||
      parsed.originalLanguage.length > 0 ||
      parsed.eraFromYear != null ||
      parsed.eraToYear != null ||
      watchProviderIds.length > 0 ||
      parsed.sortBy !== "popularity"
    ) {
      usedDiscover = true;
      const paged = await getDiscover(mediaType, 1, {
        withGenres: genreIds,
        withoutGenres: excludeGenreIds,
        withKeywords: keywordIds,
        originCountry: parsed.originCountry,
        originalLanguage: parsed.originalLanguage,
        fromYear: parsed.eraFromYear,
        toYear: parsed.eraToYear,
        sortBy: SORT_MAP[parsed.sortBy](dateField),
        minVoteAverage: parsed.minRating,
        // Rating sort needs a much higher floor so small-fanbase titles can't outrank
        // genuinely well-regarded movies; other sorts still need a low floor so
        // zero/near-zero-vote noise (obscure regional catalog entries) doesn't crowd
        // out real results on narrow queries (e.g. a single country + year).
        minVoteCount: parsed.sortBy === "rating" ? 300 : 5,
        watchProviderIds,
        watchRegion,
      });
      for (const title of paged.results) {
        const key = `${title.mediaType}-${title.tmdbId}`;
        if (!seen.has(key)) {
          seen.add(key);
          collected.push(title);
        }
      }
    }
  }

  for (const candidate of parsed.candidateTitles) {
    const found = await searchMulti(candidate);
    const top = found[0];
    const mediaType = top?.media_type as MediaType | undefined;
    if (!top || !mediaType) continue;
    const key = `${mediaType}-${top.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const insert = await mapListItemToTitleInsert(top, mediaType);
    const [row] = await upsertTitles([insert]);
    const [dto] = await toTitleDtos([row]);
    collected.push(dto);
  }

  if (parsed.wantsSimilarTo) {
    const found = await searchMulti(parsed.wantsSimilarTo);
    const anchor = found[0];
    const anchorMediaType = anchor?.media_type as MediaType | undefined;
    if (anchor && anchorMediaType) {
      // getSimilarTitles only looks in our local cache, so make sure the anchor is upserted first.
      const insert = await mapListItemToTitleInsert(anchor, anchorMediaType);
      await upsertTitles([insert]);
      const similar = await getSimilarTitles(anchorMediaType, anchor.id);
      for (const title of similar) {
        const key = `${title.mediaType}-${title.tmdbId}`;
        if (!seen.has(key)) {
          seen.add(key);
          collected.push(title);
        }
      }
    }
  }

  const cap = parsed.resultCount ? Math.min(Math.max(parsed.resultCount, 1), 40) : 40;

  // Discover-based results match filters mechanically (genre/country/year) with no
  // sense of whether a title is actually a good, recognizable answer to the query —
  // TMDB's catalog has a long tail of obscure/low-quality entries that pass the
  // filters. A direct-title lookup (candidateTitles) is already precise and doesn't
  // need this, so it's skipped when discover wasn't used.
  if ((usedDiscover || parsed.wantsSimilarTo) && collected.length > 0) {
    const ranked = await rerankResults(query, collected);
    return ranked.slice(0, cap);
  }

  return collected.slice(0, cap);
}

async function rerankResults(query: string, candidates: Title[]): Promise<Title[]> {
  const rerankCandidates = candidates.map((t) => ({
    tmdbId: t.tmdbId,
    mediaType: t.mediaType,
    title: t.title,
    year: t.releaseDate ? t.releaseDate.slice(0, 4) : null,
    genres: t.genres,
    overview: t.overview,
  }));

  try {
    const result = await generateStructured<SearchRerankResult>(
      buildSearchRerankPrompt(query, rerankCandidates),
      searchRerankSchema,
    );
    if (result.picks.length === 0) return candidates;

    const byKey = new Map(candidates.map((t) => [`${t.mediaType}-${t.tmdbId}`, t]));
    const ranked: Title[] = [];
    for (const pick of result.picks) {
      const match = byKey.get(`${pick.mediaType}-${pick.tmdbId}`);
      if (match) ranked.push({ ...match, matchReason: pick.reason });
    }
    return ranked.length > 0 ? ranked : candidates;
  } catch (err) {
    logger.warn({ err, query }, "Gemini search re-rank failed, keeping unranked results");
    return candidates;
  }
}

async function literalFallbackSearch(query: string): Promise<NlSearchResponse> {
  const raw = await searchMulti(query);
  const inserts = await Promise.all(
    raw
      .filter((item): item is typeof item & { media_type: MediaType } => !!item.media_type)
      .slice(0, 24)
      .map((item) => mapListItemToTitleInsert(item, item.media_type)),
  );
  const rows = await upsertTitles(inserts);
  const results = await toTitleDtos(rows);

  return {
    query,
    interpreted: {
      mediaType: "all",
      genres: [],
      excludeGenres: [],
      keywords: [],
      originCountry: [],
      originalLanguage: [],
      era: { fromYear: null, toYear: null },
      sortBy: "popularity",
      minRating: null,
      resultCount: null,
      watchProviders: [],
      wantsSimilarTo: null,
    },
    results,
    aiUnavailable: true,
  };
}

function toInterpretation(parsed: NlQueryResult) {
  return {
    mediaType: parsed.mediaType,
    genres: parsed.genres,
    excludeGenres: parsed.excludeGenres,
    keywords: parsed.keywords,
    originCountry: parsed.originCountry,
    originalLanguage: parsed.originalLanguage,
    era: { fromYear: parsed.eraFromYear, toYear: parsed.eraToYear },
    sortBy: parsed.sortBy,
    minRating: parsed.minRating,
    resultCount: parsed.resultCount,
    watchProviders: parsed.watchProviders,
    wantsSimilarTo: parsed.wantsSimilarTo,
  };
}
