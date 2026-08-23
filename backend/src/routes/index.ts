import { Router } from "express";
import { env, featureFlags } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { browseRouter } from "./browse.routes.js";
import { interactionsRouter } from "./interactions.routes.js";
import { digestsRouter } from "./digests.routes.js";
import { playlistsRouter } from "./playlists.routes.js";
import { preferencesRouter } from "./preferences.routes.js";
import { metadataRouter } from "./metadata.routes.js";
import { peopleRouter } from "./people.routes.js";
import { pushRouter } from "./push.routes.js";
import { searchRouter } from "./search.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { titlesRouter } from "./titles.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

apiRouter.get("/config/public", (_req, res) => {
  res.json({
    vapidPublicKey: env.VAPID_PUBLIC_KEY || null,
    features: featureFlags,
  });
});

apiRouter.use("/auth", authRouter);

apiRouter.use(requireAuth);

apiRouter.use("/browse", browseRouter);
apiRouter.use("/meta", metadataRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/titles", titlesRouter);
apiRouter.use("/people", peopleRouter);
apiRouter.use("/interactions", interactionsRouter);
apiRouter.use("/preferences", preferencesRouter);
apiRouter.use("/playlists", playlistsRouter);
apiRouter.use("/digests", digestsRouter);
apiRouter.use("/push", pushRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/admin", adminRouter);
