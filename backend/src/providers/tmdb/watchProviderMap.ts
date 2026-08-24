import { tmdbGet } from "./tmdbClient.js";

interface WatchProviderListResponse {
  results: { provider_id: number; provider_name: string }[];
}

// A few common names people actually type vs. TMDB's exact provider_name string.
const ALIASES: Record<string, string> = {
  prime: "amazon prime video",
  "amazon prime": "amazon prime video",
  "amazon video": "amazon prime video",
  disney: "disney plus",
  "disney+": "disney plus",
  hbo: "max",
  "hbo max": "max",
  "apple tv": "apple tv plus",
  "apple tv+": "apple tv plus",
  hotstar: "jiohotstar",
};

let byName: Map<string, number> | null = null;

async function load() {
  if (byName) return;
  // TMDB's provider list isn't region-scoped for this endpoint — one global catalog covers all regions.
  const [movie, tv] = await Promise.all([
    tmdbGet<WatchProviderListResponse>("/watch/providers/movie"),
    tmdbGet<WatchProviderListResponse>("/watch/providers/tv"),
  ]);
  byName = new Map();
  for (const p of [...movie.results, ...tv.results]) {
    byName.set(p.provider_name.toLowerCase(), p.provider_id);
  }
}

export async function watchProviderNamesToIds(names: string[]): Promise<number[]> {
  await load();
  const map = byName!;
  const ids: number[] = [];
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    const resolved = ALIASES[name] ?? name;
    let id = map.get(resolved);
    if (!id) {
      // Fall back to a substring match (e.g. "netflix kids" vs TMDB's plain "Netflix").
      for (const [providerName, providerId] of map) {
        if (providerName.includes(resolved) || resolved.includes(providerName)) {
          id = providerId;
          break;
        }
      }
    }
    if (id) ids.push(id);
  }
  return ids;
}
