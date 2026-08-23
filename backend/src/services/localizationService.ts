import { getTitlesByIds } from "../db/repositories/titlesRepo.js";
import { getTranslation, getTranslations, upsertTranslation } from "../db/repositories/translationsRepo.js";
import { tmdbGet } from "../providers/tmdb/tmdbClient.js";
import { logger } from "../utils/logger.js";

interface TmdbTranslationsResponse {
  translations: {
    iso_639_1: string;
    data: { title?: string; name?: string; overview?: string };
  }[];
}

export interface LocalizedText {
  title: string | null;
  overview: string | null;
}

export async function getLocalizedTitles(titleIds: number[], lang: string): Promise<Record<number, LocalizedText>> {
  const result: Record<number, LocalizedText> = {};
  if (lang === "en" || titleIds.length === 0) return result;

  const cached = getTranslations(titleIds, lang);
  const cachedIds = new Set(cached.map((c) => c.titleId));
  for (const c of cached) {
    result[c.titleId] = { title: c.translatedTitle, overview: c.translatedOverview };
  }

  const missingIds = titleIds.filter((id) => !cachedIds.has(id));
  if (missingIds.length === 0) return result;

  const rows = getTitlesByIds(missingIds);
  await Promise.all(
    rows.map(async (row) => {
      try {
        const raw = await tmdbGet<TmdbTranslationsResponse>(`/${row.mediaType}/${row.tmdbId}/translations`);
        const match = raw.translations.find((t) => t.iso_639_1 === lang);
        const translatedTitle = match?.data.title ?? match?.data.name ?? null;
        const translatedOverview = match?.data.overview || null;
        upsertTranslation(row.id, lang, translatedTitle, translatedOverview);
        result[row.id] = { title: translatedTitle, overview: translatedOverview };
      } catch (err) {
        logger.warn({ err, titleId: row.id, lang }, "Failed to fetch translation, skipping");
        result[row.id] = { title: null, overview: null };
      }
    }),
  );

  return result;
}

export async function getLocalizedTitle(titleId: number, lang: string): Promise<LocalizedText | null> {
  if (lang === "en") return null;
  const cached = getTranslation(titleId, lang);
  if (cached) return { title: cached.translatedTitle, overview: cached.translatedOverview };

  const map = await getLocalizedTitles([titleId], lang);
  return map[titleId] ?? null;
}
