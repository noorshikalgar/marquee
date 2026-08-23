import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";
import { registerDailyDigestJob } from "./jobs/dailyDigest.job.js";
import { logger } from "./utils/logger.js";

runMigrations();

if (env.ADMIN_PASSWORD === "changeme123") {
  logger.warn(
    "ADMIN_PASSWORD is still the default value — set a real one in your .env and reset the admin password before exposing this server beyond localhost.",
  );
}

const app = createApp();

app.listen(env.PORT, "127.0.0.1", () => {
  logger.info(`Marquee backend listening on http://127.0.0.1:${env.PORT}`);
  registerDailyDigestJob();
});
