import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { login, logout, SESSION_COOKIE_NAME } from "../services/authService.js";

export const authRouter = Router();

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

authRouter.post("/login", (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const { token, expiresAt, user } = login(username, password);
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      expires: new Date(expiresAt),
      path: "/",
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) logout(token);
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
