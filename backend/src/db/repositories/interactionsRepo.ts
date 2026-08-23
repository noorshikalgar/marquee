import type { InteractionType } from "@movie-scout/shared";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../client.js";
import { interactions } from "../schema.js";

export function addInteraction(userId: number, titleId: number, type: InteractionType) {
  return db.insert(interactions).values({ userId, titleId, interactionType: type }).returning().get();
}

export function getInteractionById(id: number) {
  return db.select().from(interactions).where(eq(interactions.id, id)).get();
}

export function removeInteraction(id: number) {
  db.delete(interactions).where(eq(interactions.id, id)).run();
}

export function listInteractions(userId: number, type?: InteractionType) {
  const query = db.select().from(interactions).orderBy(desc(interactions.createdAt));
  if (type) return query.where(and(eq(interactions.userId, userId), eq(interactions.interactionType, type))).all();
  return query.where(eq(interactions.userId, userId)).all();
}

export function getInteractionsForTitle(userId: number, titleId: number) {
  return db
    .select()
    .from(interactions)
    .where(and(eq(interactions.userId, userId), eq(interactions.titleId, titleId)))
    .all();
}

export function excludedTitleIds(userId: number): Set<number> {
  const rows = db.select({ titleId: interactions.titleId }).from(interactions).where(eq(interactions.userId, userId)).all();
  return new Set(rows.map((r) => r.titleId));
}
