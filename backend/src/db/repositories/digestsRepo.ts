import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../client.js";
import { digests } from "../schema.js";
import type { DigestItem } from "@movie-scout/shared";

export function createDigest(userId: number, title: string, items: DigestItem[]) {
  return db.insert(digests).values({ userId, title, items }).returning().get();
}

export function markDigestPushed(id: number) {
  db.update(digests).set({ pushed: true }).where(eq(digests.id, id)).run();
}

export function listDigests(userId: number, sinceIso?: string) {
  const query = db.select().from(digests).orderBy(desc(digests.generatedAt));
  if (sinceIso) return query.where(and(eq(digests.userId, userId), sql`${digests.generatedAt} >= ${sinceIso}`)).all();
  return query.where(eq(digests.userId, userId)).all();
}

export function getUnreadCount(userId: number): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(digests)
    .where(and(eq(digests.userId, userId), sql`${digests.readAt} is null`))
    .get();
  return row?.count ?? 0;
}

export function markDigestRead(id: number) {
  db.update(digests).set({ readAt: new Date().toISOString() }).where(eq(digests.id, id)).run();
}

export function getDigestById(id: number) {
  return db.select().from(digests).where(eq(digests.id, id)).get();
}
