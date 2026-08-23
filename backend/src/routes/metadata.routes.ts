import { Router } from "express";
import { z } from "zod";
import { getCountries, getGenres, getLanguages } from "../services/metadataService.js";

export const metadataRouter = Router();

const genresQuery = z.object({ media_type: z.enum(["movie", "tv"]).default("movie") });

metadataRouter.get("/genres", async (req, res, next) => {
  try {
    const { media_type } = genresQuery.parse(req.query);
    res.json(await getGenres(media_type));
  } catch (err) {
    next(err);
  }
});

metadataRouter.get("/countries", async (_req, res, next) => {
  try {
    res.json(await getCountries());
  } catch (err) {
    next(err);
  }
});

metadataRouter.get("/languages", async (_req, res, next) => {
  try {
    res.json(await getLanguages());
  } catch (err) {
    next(err);
  }
});
