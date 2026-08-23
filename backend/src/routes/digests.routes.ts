import { Router } from "express";
import { z } from "zod";
import { ApiHttpError } from "../middleware/errorHandler.js";
import { getDigestById, getUnreadCount, listDigests, markDigestRead } from "../db/repositories/digestsRepo.js";
import { runDailyDigestForUser } from "../services/digestService.js";

export const digestsRouter = Router();

const listQuery = z.object({ since: z.string().optional() });

digestsRouter.get("/", (req, res, next) => {
  try {
    const { since } = listQuery.parse(req.query);
    res.json(listDigests(req.user!.id, since));
  } catch (err) {
    next(err);
  }
});

digestsRouter.get("/unread-count", (req, res) => {
  res.json({ count: getUnreadCount(req.user!.id) });
});

digestsRouter.post("/:id/read", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const digest = getDigestById(id);
    if (!digest || digest.userId !== req.user!.id) throw new ApiHttpError(404, "not_found", "Digest not found");
    markDigestRead(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

digestsRouter.post("/generate-now", async (req, res, next) => {
  try {
    res.json(await runDailyDigestForUser(req.user!.id));
  } catch (err) {
    next(err);
  }
});
