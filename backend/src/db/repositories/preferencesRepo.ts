import { and, desc, eq } from "drizzle-orm";
import { db } from "../client.js";
import { preferences } from "../schema.js";

type PrefType = "genre" | "person" | "keyword" | "origin_country";

export function listPreferences(userId: number) {
  return db.select().from(preferences).where(eq(preferences.userId, userId)).orderBy(desc(preferences.weight)).all();
}

export function replaceAllPreferences(userId: number, entries: { prefType: PrefType; value: string; weight: number }[]) {
  db.delete(preferences).where(eq(preferences.userId, userId)).run();
  if (entries.length === 0) return;
  db.insert(preferences)
    .values(entries.map((e) => ({ ...e, userId, updatedAt: new Date().toISOString() })))
    .run();
}

export function topPreferences(userId: number, prefType: PrefType, limit = 10) {
  return db
    .select()
    .from(preferences)
    .where(and(eq(preferences.userId, userId), eq(preferences.prefType, prefType)))
    .orderBy(desc(preferences.weight))
    .limit(limit)
    .all();
}
