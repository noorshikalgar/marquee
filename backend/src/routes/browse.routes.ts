import { Router } from "express";
import { z } from "zod";
import { getDiscover, getPersonalized, getTrending, getUpcoming } from "../services/browseService.js";

export const browseRouter = Router();

const trendingQuery = z.object({
  media_type: z.enum(["all", "movie", "tv"]).default("all"),
  window: z.enum(["day", "week"]).default("week"),
  page: z.coerce.number().min(1).default(1),
});

browseRouter.get("/trending", async (req, res, next) => {
  try {
    const { media_type, window, page } = trendingQuery.parse(req.query);
    res.json(await getTrending(media_type, window, page));
  } catch (err) {
    next(err);
  }
});

const SORT_ALIASES: Record<string, string> = {
  popularity: "popularity.desc",
  rating: "vote_average.desc",
  title: "original_title.asc",
};

const discoverQuery = z.object({
  media_type: z.enum(["movie", "tv"]).default("movie"),
  with_genres: z.string().optional(),
  genre_match: z.enum(["and", "or"]).default("or"),
  origin_country: z.string().optional(),
  original_language: z.string().optional(),
  from_year: z.coerce.number().optional(),
  to_year: z.coerce.number().optional(),
  min_rating: z.coerce.number().min(0).max(10).optional(),
  sort_by: z.string().default("popularity"),
  page: z.coerce.number().min(1).default(1),
});

browseRouter.get("/discover", async (req, res, next) => {
  try {
    const parsed = discoverQuery.parse(req.query);
    const withGenres = parsed.with_genres ? parsed.with_genres.split(",").map(Number) : undefined;
    const originCountry = parsed.origin_country ? parsed.origin_country.split(",") : undefined;
    const originalLanguage = parsed.original_language ? parsed.original_language.split(",") : undefined;
    const dateField = parsed.media_type === "movie" ? "primary_release_date" : "first_air_date";
    let sortBy = SORT_ALIASES[parsed.sort_by];
    if (!sortBy) {
      if (parsed.sort_by === "newest") sortBy = `${dateField}.desc`;
      else if (parsed.sort_by === "oldest") sortBy = `${dateField}.asc`;
      else sortBy = parsed.sort_by;
    }

    res.json(
      await getDiscover(parsed.media_type, parsed.page, {
        withGenres,
        genreMatch: parsed.genre_match,
        originCountry,
        originalLanguage,
        fromYear: parsed.from_year,
        toYear: parsed.to_year,
        minVoteAverage: parsed.min_rating,
        // A low floor still lets small-fanbase titles (a few hundred votes at 9+)
        // outrank genuinely well-regarded movies with a large, credible vote base.
        minVoteCount: parsed.min_rating || parsed.sort_by === "rating" ? 300 : undefined,
        sortBy,
      }),
    );
  } catch (err) {
    next(err);
  }
});

const upcomingQuery = z.object({
  media_type: z.enum(["movie", "tv"]).default("movie"),
  bucket: z.enum(["soon", "this_year", "next_year"]).default("soon"),
  page: z.coerce.number().min(1).default(1),
});

browseRouter.get("/upcoming", async (req, res, next) => {
  try {
    const { media_type, bucket, page } = upcomingQuery.parse(req.query);
    res.json(await getUpcoming(media_type, bucket, page));
  } catch (err) {
    next(err);
  }
});

const personalizedQuery = z.object({
  media_type: z.enum(["movie", "tv"]).default("movie"),
  page: z.coerce.number().min(1).default(1),
});

browseRouter.get("/personalized", async (req, res, next) => {
  try {
    const { media_type, page } = personalizedQuery.parse(req.query);
    res.json(await getPersonalized(req.user!.id, media_type, page));
  } catch (err) {
    next(err);
  }
});
