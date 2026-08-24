import type { MediaType, NlSearchResponse, Title } from "@movie-scout/shared";
import { getCachedQuery, setCachedQuery } from "../db/repositories/aiCacheRepo.js";
import { getTitlesByIds, toTitleDtos, upsertTitles } from "../db/repositories/titlesRepo.js";
import { featureFlags } from "../config/env.js";
import { generateStructured } from "../providers/gemini/geminiClient.js";
import { buildNlSearchPrompt, buildRefinementPrompt } from "../providers/gemini/prompts.js";
import { nlQuerySchema, type NlQueryResult } from "../providers/gemini/schemas.js";
import { genreNamesToIds } from "../providers/tmdb/genreMap.js";
import { keywordNamesToIds, searchMulti } from "../providers/tmdb/tmdbSearch.js";
import { mapListItemToTitleInsert } from "../providers/tmdb/tmdbMappers.js";
import { searchSupplemental } from "../providers/tavily/tavilyClient.js";
import { sha256 } from "../utils/hash.js";
import { logger } from "../utils/logger.js";
import { getDiscover } from "./browseService.js";

export async function searchNaturalLanguage(query: string): Promise<NlSearchResponse> {
  if (!featureFlags.aiSearchEnabled) {
    return literalFallbackSearch(query);
  }

  const queryHash = sha256(query);
  const cached = getCachedQuery(queryHash);
  if (cached) {
    const rows = getTitlesByIds(cached.resolvedTitleIds);
    const results = await toTitleDtos(rows);
    const parsed = cached.parsedResult as NlQueryResult;
    return { query, interpreted: toInterpretation(parsed), results };
  }

  let parsed: NlQueryResult;
  try {
    parsed = await generateStructured<NlQueryResult>(buildNlSearchPrompt(query), nlQuerySchema);
  } catch (err) {
    logger.error({ err, query }, "Gemini NL search parse failed, falling back to literal search");
    return literalFallbackSearch(query);
  }

  if ((parsed.needsWebDisambiguation || parsed.confidence < 0.5) && featureFlags.tavilyEnabled) {
    const snippets = await searchSupplemental(query);
    if (snippets.length > 0) {
      try {
        parsed = await generateStructured<NlQueryResult>(buildRefinementPrompt(query, snippets), nlQuerySchema);
      } catch (err) {
        logger.warn({ err }, "Gemini refinement pass failed, keeping initial interpretation");
      }
    }
  }

  const results = await resolveResults(parsed);
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

async function resolveResults(parsed: NlQueryResult): Promise<Title[]> {
  const mediaTypes: MediaType[] = parsed.mediaType === "all" ? ["movie", "tv"] : [parsed.mediaType];
  const collected: Title[] = [];
  const seen = new Set<string>();

  for (const mediaType of mediaTypes) {
    const genreIds = await genreNamesToIds(parsed.genres, mediaType);
    const keywordIds = parsed.keywords.length > 0 ? await keywordNamesToIds(parsed.keywords) : [];
    const dateField = mediaType === "movie" ? "primary_release_date" : "first_air_date";

    if (
      genreIds.length > 0 ||
      keywordIds.length > 0 ||
      parsed.originCountry.length > 0 ||
      parsed.originalLanguage.length > 0 ||
      parsed.eraFromYear != null ||
      parsed.eraToYear != null ||
      parsed.sortBy !== "popularity"
    ) {
      const paged = await getDiscover(mediaType, 1, {
        withGenres: genreIds,
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

  const cap = parsed.resultCount ? Math.min(Math.max(parsed.resultCount, 1), 40) : 40;
  return collected.slice(0, cap);
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
      keywords: [],
      originCountry: [],
      originalLanguage: [],
      era: { fromYear: null, toYear: null },
      sortBy: "popularity",
      minRating: null,
      resultCount: null,
    },
    results,
    aiUnavailable: true,
  };
}

function toInterpretation(parsed: NlQueryResult) {
  return {
    mediaType: parsed.mediaType,
    genres: parsed.genres,
    keywords: parsed.keywords,
    originCountry: parsed.originCountry,
    originalLanguage: parsed.originalLanguage,
    era: { fromYear: parsed.eraFromYear, toYear: parsed.eraToYear },
    sortBy: parsed.sortBy,
    minRating: parsed.minRating,
    resultCount: parsed.resultCount,
  };
}
