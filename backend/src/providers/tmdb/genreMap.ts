import type { MediaType } from "@movie-scout/shared";
import { tmdbGet } from "./tmdbClient.js";

interface GenreListResponse {
  genres: { id: number; name: string }[];
}

let movieGenres: Map<number, string> | null = null;
let tvGenres: Map<number, string> | null = null;
let movieGenresByName: Map<string, number> | null = null;
let tvGenresByName: Map<string, number> | null = null;

async function load() {
  if (movieGenres && tvGenres) return;
  const [movie, tv] = await Promise.all([
    tmdbGet<GenreListResponse>("/genre/movie/list"),
    tmdbGet<GenreListResponse>("/genre/tv/list"),
  ]);
  movieGenres = new Map(movie.genres.map((g) => [g.id, g.name]));
  tvGenres = new Map(tv.genres.map((g) => [g.id, g.name]));
  movieGenresByName = new Map(movie.genres.map((g) => [g.name.toLowerCase(), g.id]));
  tvGenresByName = new Map(tv.genres.map((g) => [g.name.toLowerCase(), g.id]));
}

export async function genreIdsToNames(ids: number[], mediaType: MediaType): Promise<string[]> {
  await load();
  const map = mediaType === "movie" ? movieGenres! : tvGenres!;
  return ids.map((id) => map.get(id)).filter((n): n is string => !!n);
}

export async function genreNameToId(name: string, mediaType: MediaType): Promise<number | undefined> {
  await load();
  const map = mediaType === "movie" ? movieGenresByName! : tvGenresByName!;
  return map.get(name.toLowerCase());
}

export async function genreNamesToIds(names: string[], mediaType: MediaType): Promise<number[]> {
  await load();
  const map = mediaType === "movie" ? movieGenresByName! : tvGenresByName!;
  const ids: number[] = [];
  for (const name of names) {
    const id = map.get(name.toLowerCase());
    if (id) ids.push(id);
  }
  return ids;
}

export async function getGenreList(mediaType: MediaType): Promise<{ id: number; name: string }[]> {
  await load();
  const map = mediaType === "movie" ? movieGenres! : tvGenres!;
  return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}
