import { Router } from "express";
import { z } from "zod";
import {
  addTitleToPlaylist,
  createManualPlaylist,
  generateAiPlaylists,
  getPlaylistDetail,
  listAiPlaylists,
  listAllPlaylists,
  patchPlaylist,
  removePlaylist,
  removeTitleFromPlaylist,
} from "../services/playlistService.js";

export const playlistsRouter = Router();

playlistsRouter.post("/ai/refresh", async (req, res, next) => {
  try {
    res.json(await generateAiPlaylists(req.user!.id));
  } catch (err) {
    next(err);
  }
});

playlistsRouter.get("/ai", async (req, res, next) => {
  try {
    res.json(await listAiPlaylists(req.user!.id));
  } catch (err) {
    next(err);
  }
});

playlistsRouter.get("/", (req, res, next) => {
  try {
    const kind = req.query.kind as "manual" | "watchlist" | "ai_dynamic" | undefined;
    res.json(listAllPlaylists(req.user!.id, kind));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({ name: z.string().min(1), description: z.string().optional() });

playlistsRouter.post("/", (req, res, next) => {
  try {
    const { name, description } = createSchema.parse(req.body);
    res.status(201).json(createManualPlaylist(req.user!.id, name, description));
  } catch (err) {
    next(err);
  }
});

playlistsRouter.get("/:id", async (req, res, next) => {
  try {
    res.json(await getPlaylistDetail(req.user!.id, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
});

const patchSchema = z.object({ name: z.string().min(1).optional(), description: z.string().optional() });

playlistsRouter.patch("/:id", (req, res, next) => {
  try {
    const patch = patchSchema.parse(req.body);
    res.json(patchPlaylist(req.user!.id, Number(req.params.id), patch));
  } catch (err) {
    next(err);
  }
});

playlistsRouter.delete("/:id", (req, res, next) => {
  try {
    removePlaylist(req.user!.id, Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

const addItemSchema = z.object({ titleId: z.number(), reason: z.string().optional() });

playlistsRouter.post("/:id/items", (req, res, next) => {
  try {
    const { titleId, reason } = addItemSchema.parse(req.body);
    addTitleToPlaylist(req.user!.id, Number(req.params.id), titleId, reason);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

playlistsRouter.delete("/:id/items/:titleId", (req, res, next) => {
  try {
    removeTitleFromPlaylist(req.user!.id, Number(req.params.id), Number(req.params.titleId));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
