import type { MediaType } from "@movie-scout/shared";
import { getGenreList } from "../providers/tmdb/genreMap.js";
import { tmdbGet } from "../providers/tmdb/tmdbClient.js";

interface TmdbCountry {
  iso_3166_1: string;
  english_name: string;
}

interface TmdbLanguage {
  iso_639_1: string;
  english_name: string;
  name: string;
}

let countriesCache: { code: string; name: string }[] | null = null;
let languagesCache: { code: string; name: string }[] | null = null;

const POPULAR_COUNTRY_CODES = ["US", "GB", "IN", "JP", "KR", "FR", "DE", "CA", "AU", "CN", "ES", "IT", "BR", "MX"];
const POPULAR_LANGUAGE_CODES = ["en", "hi", "ja", "ko", "fr", "de", "es", "zh", "ta", "te", "pt", "it", "ru"];

export async function getCountries(): Promise<{ code: string; name: string }[]> {
  if (!countriesCache) {
    const raw = await tmdbGet<TmdbCountry[]>("/configuration/countries");
    countriesCache = raw
      .map((c) => ({ code: c.iso_3166_1, name: c.english_name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const popular = POPULAR_COUNTRY_CODES.map((code) => countriesCache!.find((c) => c.code === code)).filter(
    (c): c is { code: string; name: string } => !!c,
  );
  const rest = countriesCache.filter((c) => !POPULAR_COUNTRY_CODES.includes(c.code));
  return [...popular, ...rest];
}

export async function getLanguages(): Promise<{ code: string; name: string }[]> {
  if (!languagesCache) {
    const raw = await tmdbGet<TmdbLanguage[]>("/configuration/languages");
    languagesCache = raw
      .map((l) => ({ code: l.iso_639_1, name: l.english_name || l.name || l.iso_639_1 }))
      .filter((l) => l.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const popular = POPULAR_LANGUAGE_CODES.map((code) => languagesCache!.find((l) => l.code === code)).filter(
    (l): l is { code: string; name: string } => !!l,
  );
  const rest = languagesCache.filter((l) => !POPULAR_LANGUAGE_CODES.includes(l.code));
  return [...popular, ...rest];
}

export async function getGenres(mediaType: MediaType) {
  return getGenreList(mediaType);
}
