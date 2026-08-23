import { eq } from "drizzle-orm";
import { db } from "../client.js";
import { aiQueryCache } from "../schema.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function getCachedQuery(queryHash: string) {
  const row = db.select().from(aiQueryCache).where(eq(aiQueryCache.queryHash, queryHash)).get();
  if (!row) return undefined;
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) return undefined;
  return row;
}

export function setCachedQuery(queryHash: string, queryText: string, parsedResult: unknown, resolvedTitleIds: number[]) {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
  db.insert(aiQueryCache)
    .values({ queryHash, queryText, parsedResult, resolvedTitleIds, expiresAt })
    .onConflictDoUpdate({
      target: aiQueryCache.queryHash,
      set: { parsedResult, resolvedTitleIds, expiresAt, queryText },
    })
    .run();
}
