import { Router } from "express";
import { z } from "zod";
import { getLocalizedTitle, getLocalizedTitles } from "../services/localizationService.js";
import { getSimilarTitles, getTitleDetail } from "../services/titleService.js";

export const titlesRouter = Router();

const paramsSchema = z.object({
  mediaType: z.enum(["movie", "tv"]),
  tmdbId: z.coerce.number(),
});

const langQuery = z.object({ lang: z.string().default("en") });

const localizeSchema = z.object({
  titleIds: z.array(z.number()).max(200),
  lang: z.string(),
});

titlesRouter.post("/localize", async (req, res, next) => {
  try {
    const { titleIds, lang } = localizeSchema.parse(req.body);
    res.json(await getLocalizedTitles(titleIds, lang));
  } catch (err) {
    next(err);
  }
});

titlesRouter.get("/:mediaType/:tmdbId", async (req, res, next) => {
  try {
    const { mediaType, tmdbId } = paramsSchema.parse(req.params);
    const { lang } = langQuery.parse(req.query);
    const detail = await getTitleDetail(req.user!.id, mediaType, tmdbId);
    const localized = await getLocalizedTitle(detail.id, lang);
    res.json({ ...detail, localizedTitle: localized?.title ?? null, localizedOverview: localized?.overview ?? null });
  } catch (err) {
    next(err);
  }
});

titlesRouter.get("/:mediaType/:tmdbId/similar", async (req, res, next) => {
  try {
    const { mediaType, tmdbId } = paramsSchema.parse(req.params);
    res.json(await getSimilarTitles(mediaType, tmdbId));
  } catch (err) {
    next(err);
  }
});
