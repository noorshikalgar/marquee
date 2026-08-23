import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const BASE_URL = "https://api.themoviedb.org/3";

// TMDB's public rate limit is generous, but we throttle to ~35 req/10s to stay well clear of it.
const MAX_REQUESTS_PER_WINDOW = 35;
const WINDOW_MS = 10_000;
let windowStart = Date.now();
let requestsInWindow = 0;

async function throttle() {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    requestsInWindow = 0;
  }
  if (requestsInWindow >= MAX_REQUESTS_PER_WINDOW) {
    const waitMs = WINDOW_MS - (now - windowStart);
    await new Promise((r) => setTimeout(r, Math.max(waitMs, 0)));
    windowStart = Date.now();
    requestsInWindow = 0;
  }
  requestsInWindow++;
}

export class TmdbError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function tmdbGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  await throttle();

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", env.TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.warn({ path, status: res.status, body }, "TMDB request failed");
    throw new TmdbError(res.status, `TMDB ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}
