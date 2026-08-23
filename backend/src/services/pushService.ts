import webpush from "web-push";
import { env, featureFlags } from "../config/env.js";
import {
  addSubscription,
  listSubscriptionsForUser,
  removeSubscription,
} from "../db/repositories/pushSubscriptionsRepo.js";
import { logger } from "../utils/logger.js";

let configured = false;

function ensureConfigured() {
  if (!featureFlags.pushEnabled || configured) return;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  configured = true;
}

export function subscribe(userId: number, endpoint: string, p256dh: string, auth: string, userAgent?: string) {
  addSubscription(userId, endpoint, p256dh, auth, userAgent);
}

export function unsubscribe(endpoint: string) {
  removeSubscription(endpoint);
}

export async function pushToUser(
  userId: number,
  payload: Record<string, unknown>,
): Promise<{ sent: number; pruned: number }> {
  if (!featureFlags.pushEnabled) {
    logger.info("Push disabled (no VAPID keys configured) — skipping send");
    return { sent: 0, pruned: 0 };
  }

  ensureConfigured();
  const subscriptions = listSubscriptionsForUser(userId);
  let sent = 0;
  let pruned = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        removeSubscription(sub.endpoint);
        pruned++;
      } else {
        logger.warn({ err, endpoint: sub.endpoint }, "Push send failed");
      }
    }
  }

  return { sent, pruned };
}
