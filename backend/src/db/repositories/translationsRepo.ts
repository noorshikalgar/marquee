import { and, eq, inArray } from "drizzle-orm";
import { db } from "../client.js";
import { titleTranslations } from "../schema.js";

export function getTranslation(titleId: number, lang: string) {
  return db
    .select()
    .from(titleTranslations)
    .where(and(eq(titleTranslations.titleId, titleId), eq(titleTranslations.lang, lang)))
    .get();
}

export function getTranslations(titleIds: number[], lang: string) {
  if (titleIds.length === 0) return [];
  return db
    .select()
    .from(titleTranslations)
    .where(and(inArray(titleTranslations.titleId, titleIds), eq(titleTranslations.lang, lang)))
    .all();
}

export function upsertTranslation(
  titleId: number,
  lang: string,
  translatedTitle: string | null,
  translatedOverview: string | null,
) {
  db.insert(titleTranslations)
    .values({ titleId, lang, translatedTitle, translatedOverview })
    .onConflictDoUpdate({
      target: [titleTranslations.titleId, titleTranslations.lang],
      set: { translatedTitle, translatedOverview, fetchedAt: new Date().toISOString() },
    })
    .run();
}
