import { tmdbGet } from "./tmdbClient.js";

interface TmdbConfiguration {
  images: {
    secure_base_url: string;
    poster_sizes: string[];
    backdrop_sizes: string[];
    profile_sizes: string[];
    logo_sizes: string[];
  };
}

let cached: TmdbConfiguration["images"] | null = null;

async function getImageConfig() {
  if (!cached) {
    const config = await tmdbGet<TmdbConfiguration>("/configuration");
    cached = config.images;
  }
  return cached;
}

function pickSize(sizes: string[], preferred: string, fallbackIndex: number) {
  return sizes.includes(preferred) ? preferred : (sizes[fallbackIndex] ?? "original");
}

export async function posterUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const cfg = await getImageConfig();
  const size = pickSize(cfg.poster_sizes, "w500", cfg.poster_sizes.length - 1);
  return `${cfg.secure_base_url}${size}${path}`;
}

export async function backdropUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const cfg = await getImageConfig();
  const size = pickSize(cfg.backdrop_sizes, "w1280", cfg.backdrop_sizes.length - 1);
  return `${cfg.secure_base_url}${size}${path}`;
}

export async function profileUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const cfg = await getImageConfig();
  const size = pickSize(cfg.profile_sizes, "w185", cfg.profile_sizes.length - 1);
  return `${cfg.secure_base_url}${size}${path}`;
}

export async function logoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const cfg = await getImageConfig();
  const size = pickSize(cfg.logo_sizes, "w92", 0);
  return `${cfg.secure_base_url}${size}${path}`;
}
