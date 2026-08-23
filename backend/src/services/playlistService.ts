import type { Playlist, PlaylistItem, PlaylistKind } from "@movie-scout/shared";
import { ApiHttpError } from "../middleware/errorHandler.js";
import {
  addItemToPlaylist,
  clearPlaylistItems,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  getPlaylistItems,
  listPlaylists,
  removeItemFromPlaylist,
  updatePlaylist,
  upsertAiDynamicPlaylist,
} from "../db/repositories/playlistsRepo.js";
import { excludedTitleIds, listInteractions } from "../db/repositories/interactionsRepo.js";
import { topPreferences } from "../db/repositories/preferencesRepo.js";
import { getTitleById, toTitleDto } from "../db/repositories/titlesRepo.js";
import { featureFlags } from "../config/env.js";
import { generateStructured } from "../providers/gemini/geminiClient.js";
import { buildPlaylistPrompt } from "../providers/gemini/playlistPrompts.js";
import { playlistSlotsSchema, type PlaylistSlotsResult } from "../providers/gemini/schemas.js";
import { getTrending } from "./browseService.js";
import { logger } from "../utils/logger.js";

function toPlaylistDto(row: ReturnType<typeof listPlaylists>[number]): Playlist {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    description: row.description,
    isSystem: row.isSystem,
    generatedAt: row.generatedAt,
    itemCount: row.itemCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function assertOwned(userId: number, id: number) {
  const row = getPlaylist(id);
  if (!row || row.userId !== userId) throw new ApiHttpError(404, "not_found", "Playlist not found");
  return row;
}

export function listAllPlaylists(userId: number, kind?: PlaylistKind): Playlist[] {
  return listPlaylists(userId, kind).map(toPlaylistDto);
}

export async function getPlaylistDetail(userId: number, id: number): Promise<{ playlist: Playlist; items: PlaylistItem[] }> {
  const row = assertOwned(userId, id);

  const itemRows = getPlaylistItems(id);
  const items = await Promise.all(
    itemRows.map(async (r) => ({
      id: r.item.id,
      playlistId: r.item.playlistId,
      title: await toTitleDto(r.title),
      position: r.item.position,
      reason: r.item.reason,
      addedAt: r.item.addedAt,
    })),
  );

  const playlist = toPlaylistDto({ ...row, itemCount: items.length });
  return { playlist, items };
}

export function createManualPlaylist(userId: number, name: string, description?: string): Playlist {
  return toPlaylistDto({ ...createPlaylist(userId, name, description), itemCount: 0 });
}

export function patchPlaylist(userId: number, id: number, patch: { name?: string; description?: string }): Playlist {
  assertOwned(userId, id);
  const updated = updatePlaylist(id, patch)!;
  return toPlaylistDto({ ...updated, itemCount: getPlaylistItems(id).length });
}

export function removePlaylist(userId: number, id: number) {
  const row = assertOwned(userId, id);
  if (row.isSystem) throw new ApiHttpError(400, "system_playlist", "Cannot delete a system playlist");
  deletePlaylist(id);
}

export function addTitleToPlaylist(userId: number, playlistId: number, titleId: number, reason?: string) {
  assertOwned(userId, playlistId);
  addItemToPlaylist(playlistId, titleId, reason);
}

export function removeTitleFromPlaylist(userId: number, playlistId: number, titleId: number) {
  assertOwned(userId, playlistId);
  removeItemFromPlaylist(playlistId, titleId);
}

const SLOT_META: Record<string, { name: string; description: string }> = {
  weekend_picks: { name: "Weekend Picks", description: "A well-rounded mix for a weekend of watching" },
  because_you_liked: { name: "Because You Liked…", description: "Picks that echo titles you've liked" },
  hidden_gems: { name: "Hidden Gems", description: "Lower-profile picks that still match your taste" },
};

export async function generateAiPlaylists(userId: number): Promise<Playlist[]> {
  if (!featureFlags.aiSearchEnabled) {
    throw new ApiHttpError(400, "ai_disabled", "Gemini is not configured (GEMINI_API_KEY missing)");
  }

  const likeRows = listInteractions(userId, "like").slice(0, 20);
  const likedTitles = likeRows
    .map((r) => getTitleById(r.titleId))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const topGenres = topPreferences(userId, "genre", 5).map((p) => p.value);
  const excluded = excludedTitleIds(userId);

  const [trendingPage1, trendingPage2] = await Promise.all([getTrending("all", "week", 1), getTrending("all", "week", 2)]);
  const candidatePool = [...trendingPage1.results, ...trendingPage2.results].filter((t) => !excluded.has(t.id));

  if (candidatePool.length === 0) {
    throw new ApiHttpError(400, "no_candidates", "No candidate titles available to build playlists from");
  }

  const prompt = buildPlaylistPrompt(
    likedTitles.map((t) => ({ title: t.title, mediaType: t.mediaType, year: t.releaseDate?.slice(0, 4) ?? "?", genres: t.genres })),
    topGenres,
    candidatePool.map((c) => ({
      tmdbId: c.tmdbId,
      mediaType: c.mediaType,
      title: c.title,
      year: c.releaseDate?.slice(0, 4) ?? "?",
      genres: c.genres,
      overview: c.overview,
    })),
  );

  let result: PlaylistSlotsResult;
  try {
    result = await generateStructured<PlaylistSlotsResult>(prompt, playlistSlotsSchema);
  } catch (err) {
    logger.error({ err }, "Gemini playlist generation failed");
    throw new ApiHttpError(502, "ai_error", "Failed to generate AI playlists");
  }

  const candidateByKey = new Map(candidatePool.map((c) => [`${c.mediaType}-${c.tmdbId}`, c]));
  const created: Playlist[] = [];

  for (const slot of result.slots) {
    const meta = SLOT_META[slot.slot];
    if (!meta) continue;

    const playlistRow = upsertAiDynamicPlaylist(userId, meta.name, meta.description, slot.slot, 24);
    clearPlaylistItems(playlistRow.id);

    let position = 0;
    for (const pick of slot.picks) {
      const candidate = candidateByKey.get(`${pick.mediaType}-${pick.tmdbId}`);
      if (!candidate) continue;
      addItemToPlaylist(playlistRow.id, candidate.id, pick.reason);
      position++;
    }

    if (position > 0) {
      created.push(toPlaylistDto({ ...playlistRow, itemCount: position }));
    }
  }

  return created;
}

export function listAiPlaylists(userId: number): Playlist[] {
  return listPlaylists(userId, "ai_dynamic").map(toPlaylistDto);
}
