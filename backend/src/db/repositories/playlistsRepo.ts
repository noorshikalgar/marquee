import type { PlaylistKind } from "@movie-scout/shared";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../client.js";
import { playlistItems, playlists, titles } from "../schema.js";

export function listPlaylists(userId: number, kind?: PlaylistKind) {
  const rows = kind
    ? db
        .select()
        .from(playlists)
        .where(and(eq(playlists.userId, userId), eq(playlists.kind, kind)))
        .orderBy(desc(playlists.updatedAt))
        .all()
    : db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(desc(playlists.updatedAt)).all();

  return rows.map((row) => {
    const count = db
      .select({ count: sql<number>`count(*)` })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, row.id))
      .get();
    return { ...row, itemCount: count?.count ?? 0 };
  });
}

export function getPlaylist(id: number) {
  return db.select().from(playlists).where(eq(playlists.id, id)).get();
}

export function getWatchlist(userId: number) {
  return db
    .select()
    .from(playlists)
    .where(and(eq(playlists.userId, userId), eq(playlists.kind, "watchlist")))
    .get();
}

export function createWatchlist(userId: number) {
  return db
    .insert(playlists)
    .values({ userId, name: "Watchlist", kind: "watchlist", isSystem: true, description: "Titles you want to watch" })
    .returning()
    .get();
}

export function createPlaylist(userId: number, name: string, description?: string) {
  return db.insert(playlists).values({ userId, name, kind: "manual", description: description ?? null }).returning().get();
}

export function updatePlaylist(id: number, patch: { name?: string; description?: string }) {
  db.update(playlists)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(playlists.id, id))
    .run();
  return getPlaylist(id);
}

export function deletePlaylist(id: number) {
  db.delete(playlists).where(eq(playlists.id, id)).run();
}

export function addItemToPlaylist(playlistId: number, titleId: number, reason?: string) {
  const maxPos = db
    .select({ max: sql<number>`coalesce(max(position), -1)` })
    .from(playlistItems)
    .where(eq(playlistItems.playlistId, playlistId))
    .get();

  db.insert(playlistItems)
    .values({ playlistId, titleId, position: (maxPos?.max ?? -1) + 1, reason: reason ?? null })
    .onConflictDoNothing()
    .run();

  db.update(playlists).set({ updatedAt: new Date().toISOString() }).where(eq(playlists.id, playlistId)).run();
}

export function removeItemFromPlaylist(playlistId: number, titleId: number) {
  db.delete(playlistItems)
    .where(and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.titleId, titleId)))
    .run();
}

export function getPlaylistItems(playlistId: number) {
  return db
    .select({ item: playlistItems, title: titles })
    .from(playlistItems)
    .innerJoin(titles, eq(playlistItems.titleId, titles.id))
    .where(eq(playlistItems.playlistId, playlistId))
    .orderBy(asc(playlistItems.position))
    .all();
}

export function isInPlaylist(playlistId: number, titleId: number): boolean {
  const row = db
    .select({ id: playlistItems.id })
    .from(playlistItems)
    .where(and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.titleId, titleId)))
    .get();
  return !!row;
}

export function clearPlaylistItems(playlistId: number) {
  db.delete(playlistItems).where(eq(playlistItems.playlistId, playlistId)).run();
}

export function upsertAiDynamicPlaylist(
  userId: number,
  name: string,
  description: string,
  aiPromptContext: string,
  refreshIntervalHours: number,
) {
  const existing = db
    .select()
    .from(playlists)
    .where(and(eq(playlists.userId, userId), eq(playlists.kind, "ai_dynamic"), eq(playlists.name, name)))
    .get();

  const now = new Date().toISOString();

  if (existing) {
    db.update(playlists)
      .set({ description, aiPromptContext, generatedAt: now, refreshIntervalHours, updatedAt: now })
      .where(eq(playlists.id, existing.id))
      .run();
    return getPlaylist(existing.id)!;
  }

  return db
    .insert(playlists)
    .values({
      userId,
      name,
      kind: "ai_dynamic",
      description,
      isSystem: true,
      aiPromptContext,
      generatedAt: now,
      refreshIntervalHours,
    })
    .returning()
    .get();
}
