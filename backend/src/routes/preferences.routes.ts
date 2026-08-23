import { Router } from "express";
import { listPreferences } from "../db/repositories/preferencesRepo.js";
import { recalculatePreferences } from "../services/preferenceService.js";

export const preferencesRouter = Router();

preferencesRouter.get("/", (req, res) => {
  res.json(listPreferences(req.user!.id));
});

preferencesRouter.post("/recalculate", (req, res) => {
  res.json(recalculatePreferences(req.user!.id));
});
