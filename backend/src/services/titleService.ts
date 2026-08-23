import type { CastMember, CrewMember, MediaType, TitleDetail, WatchProviders } from "@movie-scout/shared";
import { getInteractionsForTitle } from "../db/repositories/interactionsRepo.js";
import { getSetting } from "../db/repositories/settingsRepo.js";
import { getTitleByTmdbId, toTitleDto, toTitleDtos, upsertTitle, upsertTitles } from "../db/repositories/titlesRepo.js";
import { backdropUrl, logoUrl, profileUrl } from "../providers/tmdb/imageConfig.js";
import { tmdbGet } from "../providers/tmdb/tmdbClient.js";
import { mapListItemToTitleInsert, type TmdbListItem } from "../providers/tmdb/tmdbMappers.js";

interface TmdbVideo {
  type: string;
  site: string;
  key: string;
  official?: boolean;
}

interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

interface TmdbCreatedBy {
  id: number;
  name: string;
  profile_path: string | null;
}

interface TmdbWatchProviderEntry {
  provider_name: string;
  logo_path: string;
}

interface TmdbWatchProvidersResponse {
  results: Record<
    string,
    { link?: string; flatrate?: TmdbWatchProviderEntry[]; rent?: TmdbWatchProviderEntry[]; buy?: TmdbWatchProviderEntry[] }
  >;
}

interface TmdbImage {
  file_path: string;
  vote_average: number;
  width: number;
  height: number;
}

interface TmdbDetailResponse extends TmdbListItem {
  external_ids?: { imdb_id?: string | null };
  credits?: { cast: TmdbCastMember[]; crew: TmdbCrewMember[] };
  created_by?: TmdbCreatedBy[];
  videos?: { results: TmdbVideo[] };
  similar?: { results: TmdbListItem[] };
  images?: { backdrops: TmdbImage[] };
  "watch/providers"?: TmdbWatchProvidersResponse;
}

const WRITER_JOBS = new Set(["Writer", "Screenplay", "Story"]);
const PRODUCER_JOBS = new Set(["Producer", "Executive Producer"]);

async function buildCrew(raw: TmdbDetailResponse): Promise<CrewMember[]> {
  const crew: CrewMember[] = [];
  const seenKeys = new Set<string>();

  function add(personId: number, name: string, job: string, profilePath: string | null) {
    const key = `${personId}-${job}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    crew.push({ personId, name, job, profileUrl: profilePath });
  }

  for (const creator of raw.created_by ?? []) {
    add(creator.id, creator.name, "Creator", creator.profile_path);
  }

  const rawCrew = raw.credits?.crew ?? [];
  for (const c of rawCrew.filter((c) => c.job === "Director")) add(c.id, c.name, "Director", c.profile_path);
  for (const c of rawCrew.filter((c) => WRITER_JOBS.has(c.job))) add(c.id, c.name, "Writer", c.profile_path);
  for (const c of rawCrew.filter((c) => PRODUCER_JOBS.has(c.job)).slice(0, 3)) add(c.id, c.name, "Producer", c.profile_path);

  return Promise.all(crew.map(async (m) => ({ ...m, profileUrl: await profileUrl(m.profileUrl) })));
}

const DEFAULT_WATCH_REGION = "US";

export async function getTitleDetail(userId: number, mediaType: MediaType, tmdbId: number): Promise<TitleDetail> {
  const watchRegion = getSetting(userId, "preferredCountry") || DEFAULT_WATCH_REGION;
  const raw = await tmdbGet<TmdbDetailResponse>(`/${mediaType}/${tmdbId}`, {
    append_to_response: "external_ids,credits,videos,similar,images,watch/providers",
    include_image_language: "null,en",
  });

  const insert = await mapListItemToTitleInsert({ ...raw, external_ids: raw.external_ids }, mediaType);
  const row = await upsertTitle(insert);
  const base = await toTitleDto(row);

  const cast: CastMember[] = await Promise.all(
    (raw.credits?.cast ?? [])
      .slice(0, 12)
      .sort((a, b) => a.order - b.order)
      .map(async (c) => ({
        personId: c.id,
        name: c.name,
        character: c.character,
        profileUrl: await profileUrl(c.profile_path),
      })),
  );

  const crew = await buildCrew(raw);

  const providersRaw = raw["watch/providers"]?.results[watchRegion] ?? raw["watch/providers"]?.results[DEFAULT_WATCH_REGION];
  const watchProviders: WatchProviders = {
    link: providersRaw?.link ?? null,
    flatrate: await mapProviders(providersRaw?.flatrate),
    rent: await mapProviders(providersRaw?.rent),
    buy: await mapProviders(providersRaw?.buy),
  };

  const trailer = (raw.videos?.results ?? []).find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official)
    ?? (raw.videos?.results ?? []).find((v) => v.site === "YouTube" && v.type === "Trailer");

  const similarInserts = await Promise.all(
    (raw.similar?.results ?? []).slice(0, 12).map((item) => mapListItemToTitleInsert(item, mediaType)),
  );
  const similarRows = await upsertTitles(similarInserts);
  const similar = await toTitleDtos(similarRows);

  const sortedBackdrops = [...(raw.images?.backdrops ?? [])].sort((a, b) => b.vote_average - a.vote_average);
  const images = (
    await Promise.all(sortedBackdrops.slice(0, 20).map((img) => backdropUrl(img.file_path)))
  ).filter((url): url is string => !!url);

  const userInteractions = getInteractionsForTitle(userId, row.id).map((i) => ({ id: i.id, type: i.interactionType }));

  return {
    ...base,
    cast,
    crew,
    watchProviders,
    trailerYoutubeKey: trailer?.key ?? null,
    similar,
    images,
    userInteractions,
  };
}

async function mapProviders(entries?: TmdbWatchProviderEntry[]) {
  if (!entries) return [];
  return Promise.all(
    entries.map(async (e) => ({
      providerName: e.provider_name,
      logoUrl: (await logoUrl(e.logo_path)) ?? "",
    })),
  );
}

export async function getSimilarTitles(mediaType: MediaType, tmdbId: number) {
  const existing = getTitleByTmdbId(tmdbId, mediaType);
  if (existing) {
    const raw = await tmdbGet<{ results: TmdbListItem[] }>(`/${mediaType}/${tmdbId}/similar`);
    const inserts = await Promise.all(raw.results.slice(0, 20).map((item) => mapListItemToTitleInsert(item, mediaType)));
    const rows = await upsertTitles(inserts);
    return toTitleDtos(rows);
  }
  return [];
}
