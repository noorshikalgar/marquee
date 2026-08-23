# Marquee

A self-hosted, multi-user movie & TV companion: browse and search with an AI that understands plain-English requests ("crime series from Japan", "a warrior story from ancient legends"), build a watchlist, get AI-curated picks with explanations, and receive a daily digest of what's new — all running on your own server, under your own accounts.

## Features

- **AI natural-language search** — describe a mood, genre, country, or era in plain English; a structured-output Gemini call turns it into TMDB filters, with a Tavily-backed disambiguation pass for ambiguous or very recent queries.
- **AI-curated playlists** — "Weekend Picks", "Because You Liked…", and "Hidden Gems" generated from your like/watch history, each pick with a one-line reason.
- **Manual filters** — genre, country, language, year range, rating, and sort, for when you'd rather drive.
- **Multi-user accounts** — every family member gets their own login, watchlist, likes, and recommendations, fully isolated. An admin panel manages accounts (create, change role, reset password, delete).
- **Daily digest** — a background job scans upcoming/now-playing titles, scores them against your taste, and (optionally) sends a web push notification.
- **6 themes** — 3 dark, 3 light, switchable per-user.
- **Bilingual** — English and Hindi UI, with localized title/overview data where TMDB provides it.
- **Installable PWA** — offline shell, cached TMDB images, installable to your home screen or desktop.
- **First-run onboarding** — a short welcome flow (theme + country preference) and a guided tour, skippable and replayable from Settings.

## AI features

AI is used in three places, all through the official [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK talking to **Google Gemini** — no other model provider is supported:

- **Natural-language search** (`/search`) — your query is sent to Gemini with a structured-output schema (`responseMimeType: application/json` + a JSON schema), which returns genres, origin country, language, era, sort, and a confidence score. Low-confidence or very-recent-sounding queries get a second pass: a [Tavily](https://tavily.com/) web search feeds a few live snippets back into a refinement call before the final TMDB lookup.
- **AI-curated playlists** (For You → Weekend Picks / Because You Liked… / Hidden Gems) — one Gemini call takes your liked titles, weighted genre preferences, and a trending/discover candidate pool, and returns picks per slot plus a one-line reason for each.
- **Daily digest blurbs** — the nightly job asks Gemini to write a short headline + one-liner for each recommended title; if this call fails, it falls back to the title's own overview text.

**Both AI providers are optional.** Without `GEMINI_API_KEY`, AI search silently degrades to a plain TMDB text-match search, AI playlists are unavailable (the UI says so), and digest blurbs fall back to overview text. Without `TAVILY_API_KEY`, search just skips the disambiguation pass. TMDB is the only hard requirement.

**Setup:** get a free key from [Google AI Studio](https://aistudio.google.com/) and put it in `GEMINI_API_KEY` in `backend/.env`. The model is pinned in code (`backend/src/providers/gemini/geminiClient.ts`) rather than env-configurable — Google periodically retires older Gemini model names, so if AI features start failing with a `404 NOT_FOUND` mentioning a model name, that file is the one line to update. A Tavily key (also free-tier) goes in `TAVILY_API_KEY` the same way.

## Architecture

npm workspaces monorepo:

```
marquee/
  frontend/         Vite + React + TypeScript + Tailwind, PWA via vite-plugin-pwa
  backend/          Express + TypeScript, SQLite (better-sqlite3 + drizzle-orm)
  packages/shared/  Type-only DTOs shared by both, zero runtime coupling
  desktop/          Tauri shell wrapping the same frontend build (see below)
```

The backend is a standalone REST API (`backend/src/app.ts` is a pure Express factory; `backend/src/server.ts` is the only file that binds a port and registers the cron job) — deliberately structured so it can run behind Docker and be reached by any number of clients: the web frontend, the desktop app, or your own.

## Getting started

Requirements: Node 20+, and a [TMDB API key](https://www.themoviedb.org/settings/api) (required — everything else is optional, see [AI features](#ai-features) below).

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit backend/.env: paste your TMDB_API_KEY (required), and set a real ADMIN_PASSWORD
npm run dev
```

This starts the backend on `:8787` and the frontend on `:5175`. On first boot, the backend creates a bootstrap admin account from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env` — **change the default password before exposing the server beyond localhost.**

### Web push (optional)

```bash
npx web-push generate-vapid-keys
```

Paste the output into `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` in `backend/.env`.

### Deploying with Docker

Two stacks are included at the repo root, both usable directly with `docker compose` or pasted into Portainer's stack editor (compose file as the stack, example file's contents as the environment variables):

- **`docker-compose.yml`** + **`.env.stack.example`** — backend + web frontend (nginx). Use this if anyone will use Marquee in a browser or install the PWA.
- **`docker-compose.server-only.yml`** + **`.env.stack.server-only.example`** — backend only, no bundled frontend. Use this if every client is the [Marquee desktop app](#desktop-app) — the desktop app talks directly to this API, so there's no reason to also run the web frontend container.

```bash
# full stack
cp .env.stack.example .env
docker compose up -d

# server-only (desktop clients)
cp .env.stack.server-only.example .env
docker compose -f docker-compose.server-only.yml up -d
```

## Desktop app

`desktop/` is a [Tauri](https://tauri.app/) shell around the same frontend — no separate UI to maintain, just the existing React app running in the OS's native WebView instead of a browser tab. The server stays wherever you deployed it; the desktop app is a thin client.

On first launch it asks for a server address, like Jellyfin/Plex desktop clients — you can save several servers and switch between them later from Settings. The frontend's API base URL is resolved at runtime (`frontend/src/lib/serverConfig.ts`), not baked in at build time, so one desktop build works against anyone's self-hosted instance.

```bash
npm run desktop:dev    # launches a native window against the Vite dev server
npm run desktop:build  # produces a signed(ish)/unsigned installer for your OS
```

Requires the [Rust toolchain](https://www.rust-lang.org/tools/install) in addition to Node.

## Tech stack

React Query, React Router, framer-motion, Tailwind · Express, Drizzle ORM, better-sqlite3, `@google/genai` (Gemini, structured output), `@tavily/core`, `web-push`, `node-cron` · Zod validation at every route boundary.

## License

MIT — see [LICENSE](./LICENSE).
