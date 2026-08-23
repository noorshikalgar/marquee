import type { DigestItem, Title } from "@movie-scout/shared";
import { featureFlags } from "../config/env.js";
import { createDigest, markDigestPushed } from "../db/repositories/digestsRepo.js";
import { excludedTitleIds } from "../db/repositories/interactionsRepo.js";
import { topPreferences } from "../db/repositories/preferencesRepo.js";
import { listUsers } from "../db/repositories/usersRepo.js";
import { toTitleDtos, upsertTitles } from "../db/repositories/titlesRepo.js";
import { generateStructured } from "../providers/gemini/geminiClient.js";
import { buildDigestPrompt } from "../providers/gemini/digestPrompts.js";
import { digestBlurbSchema, type DigestBlurbResult } from "../providers/gemini/schemas.js";
import { tmdbGet } from "../providers/tmdb/tmdbClient.js";
import { mapListItemToTitleInsert, type TmdbListItem } from "../providers/tmdb/tmdbMappers.js";
import { logger } from "../utils/logger.js";
import { pushToUser } from "./pushService.js";

interface TmdbListResponse {
  results: TmdbListItem[];
}

type Category = "upcoming" | "now_playing" | "on_the_air" | "airing_today";

async function fetchCategory(mediaType: "movie" | "tv", category: Category): Promise<Title[]> {
  const raw = await tmdbGet<TmdbListResponse>(`/${mediaType}/${category}`);
  const inserts = await Promise.all(raw.results.slice(0, 15).map((item) => mapListItemToTitleInsert(item, mediaType)));
  const rows = await upsertTitles(inserts);
  return toTitleDtos(rows);
}

function scoreByPreference(title: Title, weightedGenres: Map<string, number>): number {
  let score = title.popularity / 100;
  for (const genre of title.genres) {
    score += weightedGenres.get(genre) ?? 0;
  }
  return score;
}

export async function runDailyDigestForUser(
  userId: number,
): Promise<{ digestId: number | null; itemCount: number; pushed: number }> {
  const [upcoming, nowPlaying, onTheAir, airingToday] = await Promise.all([
    fetchCategory("movie", "upcoming"),
    fetchCategory("movie", "now_playing"),
    fetchCategory("tv", "on_the_air"),
    fetchCategory("tv", "airing_today"),
  ]);

  const excluded = excludedTitleIds(userId);
  const pools: { category: DigestItem["category"]; titles: Title[] }[] = [
    { category: "upcoming", titles: upcoming },
    { category: "now_playing", titles: nowPlaying },
    { category: "on_the_air", titles: onTheAir },
  ];

  const seen = new Set<number>();
  const weightedGenres = new Map(topPreferences(userId, "genre", 10).map((p) => [p.value, p.weight]));

  const scored: { title: Title; category: DigestItem["category"]; score: number }[] = [];
  for (const pool of pools) {
    for (const title of pool.titles) {
      if (excluded.has(title.id) || seen.has(title.id)) continue;
      seen.add(title.id);
      scored.push({ title, category: pool.category, score: scoreByPreference(title, weightedGenres) });
    }
  }
  for (const title of airingToday) {
    if (excluded.has(title.id) || seen.has(title.id)) continue;
    seen.add(title.id);
    scored.push({ title, category: "airing_today", score: scoreByPreference(title, weightedGenres) });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  if (top.length === 0) {
    return { digestId: null, itemCount: 0, pushed: 0 };
  }

  const items = await buildDigestItems(top);

  const digest = createDigest(userId, `${items.length} new picks for you`, items);

  const pushResult = await pushToUser(userId, {
    title: "Marquee",
    body: `${items.length} new picks matching your taste — tap to see`,
    url: "/notifications",
  });

  if (pushResult.sent > 0) markDigestPushed(digest.id);

  return { digestId: digest.id, itemCount: items.length, pushed: pushResult.sent };
}

export async function runDailyDigestForAllUsers() {
  const results: { userId: number; digestId: number | null; itemCount: number; pushed: number }[] = [];
  for (const user of listUsers()) {
    try {
      const result = await runDailyDigestForUser(user.id);
      results.push({ userId: user.id, ...result });
    } catch (err) {
      logger.error({ err, userId: user.id }, "Daily digest failed for user");
    }
  }
  return results;
}

async function buildDigestItems(
  top: { title: Title; category: DigestItem["category"]; score: number }[],
): Promise<DigestItem[]> {
  if (!featureFlags.aiSearchEnabled) {
    return top.map(({ title, category }) => ({
      titleId: title.id,
      title,
      headline: category === "upcoming" ? "Coming soon" : "New for you",
      body: title.overview.slice(0, 160) || `${title.title} just showed up in your feed.`,
      category,
    }));
  }

  const prompt = buildDigestPrompt(
    top.map(({ title, category }) => ({
      tmdbId: title.tmdbId,
      mediaType: title.mediaType,
      title: title.title,
      category,
      overview: title.overview,
    })),
  );

  try {
    const result = await generateStructured<DigestBlurbResult>(prompt, digestBlurbSchema);
    const byKey = new Map(result.items.map((i) => [`${i.mediaType}-${i.tmdbId}`, i]));

    return top.map(({ title, category }) => {
      const blurb = byKey.get(`${title.mediaType}-${title.tmdbId}`);
      return {
        titleId: title.id,
        title,
        headline: blurb?.headline ?? "New for you",
        body: blurb?.body ?? title.overview.slice(0, 160),
        category,
      };
    });
  } catch (err) {
    logger.warn({ err }, "Gemini digest blurb generation failed, using overview fallback");
    return top.map(({ title, category }) => ({
      titleId: title.id,
      title,
      headline: "New for you",
      body: title.overview.slice(0, 160),
      category,
    }));
  }
}
