import type { Title } from "@movie-scout/shared";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../client.js";
import { titles } from "../schema.js";
import { backdropUrl, posterUrl } from "../../providers/tmdb/imageConfig.js";

type TitleRow = typeof titles.$inferSelect;
type TitleInsert = typeof titles.$inferInsert;

export async function upsertTitle(insert: TitleInsert): Promise<TitleRow> {
  const existing = db
    .select()
    .from(titles)
    .where(and(eq(titles.tmdbId, insert.tmdbId), eq(titles.mediaType, insert.mediaType)))
    .get();

  if (existing) {
    db.update(titles)
      .set({ ...insert, cachedAt: new Date().toISOString() })
      .where(eq(titles.id, existing.id))
      .run();
    return { ...existing, ...insert };
  }

  const inserted = db.insert(titles).values(insert).returning().get();
  return inserted;
}

export async function upsertTitles(inserts: TitleInsert[]): Promise<TitleRow[]> {
  const rows: TitleRow[] = [];
  for (const insert of inserts) {
    rows.push(await upsertTitle(insert));
  }
  return rows;
}

export function getTitleById(id: number): TitleRow | undefined {
  return db.select().from(titles).where(eq(titles.id, id)).get();
}

export function getTitlesByIds(ids: number[]): TitleRow[] {
  if (ids.length === 0) return [];
  return db.select().from(titles).where(inArray(titles.id, ids)).all();
}

export function getTitleByTmdbId(tmdbId: number, mediaType: "movie" | "tv"): TitleRow | undefined {
  return db
    .select()
    .from(titles)
    .where(and(eq(titles.tmdbId, tmdbId), eq(titles.mediaType, mediaType)))
    .get();
}

export async function toTitleDto(row: TitleRow): Promise<Title> {
  const [poster, backdrop] = await Promise.all([posterUrl(row.posterPath), backdropUrl(row.backdropPath)]);
  return {
    id: row.id,
    tmdbId: row.tmdbId,
    mediaType: row.mediaType,
    title: row.title,
    overview: row.overview,
    posterUrl: poster,
    backdropUrl: backdrop,
    releaseDate: row.releaseDate,
    genres: row.genres,
    originCountry: row.originCountry,
    originalLanguage: row.originalLanguage,
    voteAverage: row.voteAverage,
    voteCount: row.voteCount,
    imdbId: row.imdbId,
    imdbUrl: row.imdbId ? `https://www.imdb.com/title/${row.imdbId}` : null,
    runtime: row.runtime,
    popularity: row.popularity,
  };
}

export async function toTitleDtos(rows: TitleRow[]): Promise<Title[]> {
  return Promise.all(rows.map(toTitleDto));
}
