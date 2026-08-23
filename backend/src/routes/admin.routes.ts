import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { createUser, deleteUser, listAllUsers, resetPassword, updateUserProfile } from "../services/authService.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/users", (_req, res) => {
  res.json(listAllUsers());
});

const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  displayName: z.string().min(1),
  role: z.enum(["admin", "member"]).default("member"),
});

adminRouter.post("/users", (req, res, next) => {
  try {
    const { username, password, displayName, role } = createUserSchema.parse(req.body);
    res.status(201).json(createUser(username, password, displayName, role));
  } catch (err) {
    next(err);
  }
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  role: z.enum(["admin", "member"]).optional(),
});

adminRouter.patch("/users/:id", (req, res, next) => {
  try {
    const patch = updateUserSchema.parse(req.body);
    res.json(updateUserProfile(Number(req.params.id), patch));
  } catch (err) {
    next(err);
  }
});

const resetPasswordSchema = z.object({ password: z.string().min(6) });

adminRouter.post("/users/:id/reset-password", (req, res, next) => {
  try {
    const { password } = resetPasswordSchema.parse(req.body);
    resetPassword(Number(req.params.id), password);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/users/:id", (req, res, next) => {
  try {
    deleteUser(Number(req.params.id), req.user!.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
