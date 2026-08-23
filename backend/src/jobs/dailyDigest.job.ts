import cron from "node-cron";
import { env } from "../config/env.js";
import { runDailyDigestForAllUsers } from "../services/digestService.js";
import { logger } from "../utils/logger.js";

export function registerDailyDigestJob() {
  cron.schedule(env.NOTIFICATION_CRON, async () => {
    try {
      const result = await runDailyDigestForAllUsers();
      logger.info({ result }, "Daily digest job completed");
    } catch (err) {
      logger.error({ err }, "Daily digest job failed");
    }
  });
  logger.info(`Daily digest cron registered: "${env.NOTIFICATION_CRON}"`);
}
