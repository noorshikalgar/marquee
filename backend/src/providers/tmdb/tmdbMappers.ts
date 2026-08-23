import type { MediaType } from "@movie-scout/shared";
import type { titles } from "../../db/schema.js";
import { genreIdsToNames } from "./genreMap.js";

type TitleInsert = typeof titles.$inferInsert;

export interface TmdbListItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  origin_country?: string[];
  original_language: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  runtime?: number;
  episode_run_time?: number[];
  external_ids?: { imdb_id?: string | null };
  media_type?: string;
}

export async function mapListItemToTitleInsert(raw: TmdbListItem, mediaType: MediaType): Promise<TitleInsert> {
  const genreNames = raw.genres ? raw.genres.map((g) => g.name) : await genreIdsToNames(raw.genre_ids ?? [], mediaType);

  return {
    tmdbId: raw.id,
    mediaType,
    title: raw.title ?? raw.name ?? "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    releaseDate: raw.release_date ?? raw.first_air_date ?? null,
    genres: genreNames,
    originCountry: raw.origin_country ?? [],
    originalLanguage: raw.original_language ?? "",
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    imdbId: raw.external_ids?.imdb_id ?? null,
    runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    popularity: raw.popularity ?? 0,
    rawJson: JSON.stringify(raw),
  };
}
