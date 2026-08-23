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

## Architecture

npm workspaces monorepo:

```
marquee/
  frontend/         Vite + React + TypeScript + Tailwind, PWA via vite-plugin-pwa
  backend/          Express + TypeScript, SQLite (better-sqlite3 + drizzle-orm)
  packages/shared/  Type-only DTOs shared by both, zero runtime coupling
```

The backend is a standalone REST API (`backend/src/app.ts` is a pure Express factory; `backend/src/server.ts` is the only file that binds a port and registers the cron job) — deliberately structured so it can run behind Docker, be reached by a desktop client, or eventually be wrapped by a native shell without any rework.

## Getting started

Requirements: Node 20+, a [TMDB API key](https://www.themoviedb.org/settings/api) (required), and optionally a [Gemini API key](https://ai.google.dev/) (for AI search/playlists) and a [Tavily API key](https://tavily.com/) (for search disambiguation).

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit backend/.env: paste your TMDB_API_KEY (required), GEMINI_API_KEY / TAVILY_API_KEY
# (optional), and set a real ADMIN_PASSWORD
npm run dev
```

This starts the backend on `:8787` and the frontend on `:5175`. On first boot, the backend creates a bootstrap admin account from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env` — **change the default password before exposing the server beyond localhost.**

### Web push (optional)

```bash
npx web-push generate-vapid-keys
```

Paste the output into `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` in `backend/.env`.

### Deploying with Docker

A `docker-compose.yml` and `.env.stack.example` are included at the repo root — copy the example to `.env`, fill in your keys, and `docker compose up -d`. Works as-is in Portainer's stack editor too (paste the example file's contents into the environment-variables field).

## Tech stack

React Query, React Router, framer-motion, Tailwind · Express, Drizzle ORM, better-sqlite3, `@google/genai` (Gemini, structured output), `@tavily/core`, `web-push`, `node-cron` · Zod validation at every route boundary.

## License

MIT — see [LICENSE](./LICENSE).
