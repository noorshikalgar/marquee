import { and, eq } from "drizzle-orm";
import { db } from "../client.js";
import { settings } from "../schema.js";

export function getSetting(userId: number, key: string): string | undefined {
  return db
    .select()
    .from(settings)
    .where(and(eq(settings.userId, userId), eq(settings.key, key)))
    .get()?.value;
}

export function setSetting(userId: number, key: string, value: string) {
  db.insert(settings)
    .values({ userId, key, value })
    .onConflictDoUpdate({ target: [settings.userId, settings.key], set: { value } })
    .run();
}

export function getAllSettings(userId: number): Record<string, string> {
  const rows = db.select().from(settings).where(eq(settings.userId, userId)).all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
