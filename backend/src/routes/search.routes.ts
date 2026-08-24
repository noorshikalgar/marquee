import { Router } from "express";
import { z } from "zod";
import { toTitleDtos, upsertTitles } from "../db/repositories/titlesRepo.js";
import { searchMulti } from "../providers/tmdb/tmdbSearch.js";
import { mapListItemToTitleInsert } from "../providers/tmdb/tmdbMappers.js";
import { searchNaturalLanguage } from "../services/searchService.js";
import type { MediaType } from "@movie-scout/shared";

export const searchRouter = Router();

const nlSchema = z.object({ query: z.string().min(1).max(300) });

searchRouter.post("/nl", async (req, res, next) => {
  try {
    const { query } = nlSchema.parse(req.body);
    res.json(await searchNaturalLanguage(req.user!.id, query));
  } catch (err) {
    next(err);
  }
});

const textQuery = z.object({ q: z.string().min(1).max(300) });

searchRouter.get("/text", async (req, res, next) => {
  try {
    const { q } = textQuery.parse(req.query);
    const raw = await searchMulti(q);
    const inserts = await Promise.all(
      raw
        .filter((item): item is typeof item & { media_type: MediaType } => !!item.media_type)
        .slice(0, 24)
        .map((item) => mapListItemToTitleInsert(item, item.media_type)),
    );
    const rows = await upsertTitles(inserts);
    res.json({ query: q, results: await toTitleDtos(rows) });
  } catch (err) {
    next(err);
  }
});
