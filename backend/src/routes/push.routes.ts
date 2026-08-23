import { Router } from "express";
import { z } from "zod";
import { subscribe, unsubscribe } from "../services/pushService.js";

export const pushRouter = Router();

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }),
  }),
});

pushRouter.post("/subscribe", (req, res, next) => {
  try {
    const { subscription } = subscribeSchema.parse(req.body);
    subscribe(req.user!.id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, req.headers["user-agent"]);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

pushRouter.delete("/subscribe", (req, res, next) => {
  try {
    const { endpoint } = unsubscribeSchema.parse(req.body);
    unsubscribe(endpoint);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
