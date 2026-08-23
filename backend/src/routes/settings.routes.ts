import { Router } from "express";
import { z } from "zod";
import { getAllSettings, setSetting } from "../db/repositories/settingsRepo.js";

export const settingsRouter = Router();

settingsRouter.get("/", (req, res) => {
  res.json(getAllSettings(req.user!.id));
});

const patchSchema = z.record(z.string(), z.string());

settingsRouter.patch("/", (req, res, next) => {
  try {
    const patch = patchSchema.parse(req.body);
    for (const [key, value] of Object.entries(patch)) {
      setSetting(req.user!.id, key, value);
    }
    res.json(getAllSettings(req.user!.id));
  } catch (err) {
    next(err);
  }
});
