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
import { genreNamesToIds } from "../providers/tmdb/genreMap.js";
import { getDiscover, getTrending } from "./browseService.js";
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

const REFRESH_INTERVAL_HOURS = 24;
// Heuristic ceiling: TMDB's trending list rarely dips below this for its bottom
// entries, so anything under it plus a real rating/vote floor reads as a genuine
// find rather than "less popular than the other blockbusters".
const HIDDEN_GEMS_MAX_POPULARITY = 30;
const HIDDEN_GEMS_MIN_VOTE_COUNT = 50;
const HIDDEN_GEMS_MIN_RATING = 7;

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

  // Don't just repeat whatever was already shown — fold titles from the current
  // AI-dynamic playlists into the exclusion set too, on top of actual dislikes/
  // watched/not-interested, so a refresh doesn't return the same picks by default.
  const recentlyShown = new Set<number>();
  for (const p of listPlaylists(userId, "ai_dynamic")) {
    for (const { item } of getPlaylistItems(p.id)) {
      recentlyShown.add(item.titleId);
    }
  }
  const excludedAll = new Set([...excluded, ...recentlyShown]);

  const [trendingPage1, trendingPage2] = await Promise.all([getTrending("all", "week", 1), getTrending("all", "week", 2)]);
  const trendingPool = [...trendingPage1.results, ...trendingPage2.results].filter((t) => !excludedAll.has(t.id));

  if (trendingPool.length === 0) {
    throw new ApiHttpError(400, "no_candidates", "No candidate titles available to build playlists from");
  }

  const trendingKeys = new Set(trendingPool.map((t) => `${t.mediaType}-${t.tmdbId}`));

  // Hidden Gems needs its own pool, sorted by rating with a popularity ceiling —
  // reusing the trending pool for this slot (as before) meant "hidden gems" was
  // never actually less mainstream, just further down the same trending list.
  const gemsResults = await Promise.all(
    (["movie", "tv"] as const).map(async (mediaType) => {
      const genreIds = topGenres.length > 0 ? await genreNamesToIds(topGenres, mediaType) : [];
      return getDiscover(mediaType, 1, {
        withGenres: genreIds,
        sortBy: "vote_average.desc",
        minVoteAverage: HIDDEN_GEMS_MIN_RATING,
        minVoteCount: HIDDEN_GEMS_MIN_VOTE_COUNT,
        maxPopularity: HIDDEN_GEMS_MAX_POPULARITY,
      });
    }),
  );
  const gemsPool = gemsResults
    .flatMap((p) => p.results)
    .filter((t) => !excludedAll.has(t.id) && !trendingKeys.has(`${t.mediaType}-${t.tmdbId}`));

  const candidateByKey = new Map([...trendingPool, ...gemsPool].map((c) => [`${c.mediaType}-${c.tmdbId}`, c]));
  const gemsKeys = new Set(gemsPool.map((c) => `${c.mediaType}-${c.tmdbId}`));

  const toSummary = (c: (typeof trendingPool)[number]) => ({
    tmdbId: c.tmdbId,
    mediaType: c.mediaType,
    title: c.title,
    year: c.releaseDate?.slice(0, 4) ?? "?",
    genres: c.genres,
    overview: c.overview,
  });

  const prompt = buildPlaylistPrompt(
    likedTitles.map((t) => ({ title: t.title, mediaType: t.mediaType, year: t.releaseDate?.slice(0, 4) ?? "?", genres: t.genres })),
    topGenres,
    trendingPool.map(toSummary),
    gemsPool.map(toSummary),
  );

  let result: PlaylistSlotsResult;
  try {
    result = await generateStructured<PlaylistSlotsResult>(prompt, playlistSlotsSchema);
  } catch (err) {
    logger.error({ err }, "Gemini playlist generation failed");
    throw new ApiHttpError(502, "ai_error", "Failed to generate AI playlists");
  }

  const created: Playlist[] = [];

  for (const slot of result.slots) {
    const meta = SLOT_META[slot.slot];
    if (!meta) continue;

    const description = slot.slotReason?.trim() || meta.description;
    const playlistRow = upsertAiDynamicPlaylist(userId, meta.name, description, slot.slot, REFRESH_INTERVAL_HOURS);
    clearPlaylistItems(playlistRow.id);

    let position = 0;
    for (const pick of slot.picks) {
      const key = `${pick.mediaType}-${pick.tmdbId}`;
      // Hidden gems must actually come from the gems pool — enforced here too, not
      // just via the prompt instruction, in case the model picks from the wrong list.
      if (slot.slot === "hidden_gems" && !gemsKeys.has(key)) continue;
      const candidate = candidateByKey.get(key);
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

function isStalePlaylist(row: ReturnType<typeof getPlaylist>): boolean {
  if (!row?.generatedAt || !row.refreshIntervalHours) return true;
  const ageMs = Date.now() - new Date(row.generatedAt).getTime();
  return ageMs > row.refreshIntervalHours * 60 * 60 * 1000;
}

export async function listAiPlaylists(userId: number): Promise<Playlist[]> {
  const existingRows = listPlaylists(userId, "ai_dynamic");
  const existing = existingRows.map(toPlaylistDto);

  if (!featureFlags.aiSearchEnabled) return existing;
  if (existingRows.length > 0 && existingRows.every((row) => !isStalePlaylist(row))) return existing;

  try {
    const refreshed = await generateAiPlaylists(userId);
    return refreshed.length > 0 ? refreshed : existing;
  } catch (err) {
    // Serve whatever's already there (even if stale/empty) rather than failing the
    // page — a quota-exhausted or briefly-down Gemini shouldn't blank the section.
    logger.warn({ err, userId }, "Auto-refresh of AI playlists failed, serving existing data");
    return existing;
  }
}
