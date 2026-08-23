import { Router } from "express";
import { z } from "zod";
import { deleteInteraction, getInteractedTitles, getInteractions, recordInteraction } from "../services/interactionService.js";

export const interactionsRouter = Router();

const createSchema = z.object({
  titleId: z.number(),
  type: z.enum(["like", "dislike", "watched", "not_interested"]),
});

interactionsRouter.post("/", (req, res, next) => {
  try {
    const { titleId, type } = createSchema.parse(req.body);
    res.status(201).json(recordInteraction(req.user!.id, titleId, type));
  } catch (err) {
    next(err);
  }
});

interactionsRouter.delete("/:id", (req, res, next) => {
  try {
    deleteInteraction(req.user!.id, Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

const listQuery = z.object({
  type: z.enum(["like", "dislike", "watched", "not_interested"]).optional(),
});

interactionsRouter.get("/", (req, res, next) => {
  try {
    const { type } = listQuery.parse(req.query);
    res.json(getInteractions(req.user!.id, type));
  } catch (err) {
    next(err);
  }
});

const titlesQuery = z.object({
  type: z.enum(["like", "dislike", "watched", "not_interested"]),
});

interactionsRouter.get("/titles", async (req, res, next) => {
  try {
    const { type } = titlesQuery.parse(req.query);
    res.json(await getInteractedTitles(req.user!.id, type));
  } catch (err) {
    next(err);
  }
});
