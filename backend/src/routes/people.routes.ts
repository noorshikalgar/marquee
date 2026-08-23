import { Router } from "express";
import { z } from "zod";
import { getPersonDetail } from "../services/personService.js";

export const peopleRouter = Router();

const paramsSchema = z.object({ personId: z.coerce.number() });

peopleRouter.get("/:personId", async (req, res, next) => {
  try {
    const { personId } = paramsSchema.parse(req.params);
    res.json(await getPersonDetail(personId));
  } catch (err) {
    next(err);
  }
});
