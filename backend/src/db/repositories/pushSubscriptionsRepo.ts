import { eq } from "drizzle-orm";
import { db } from "../client.js";
import { pushSubscriptions } from "../schema.js";

export function addSubscription(userId: number, endpoint: string, p256dh: string, auth: string, userAgent?: string) {
  db.insert(pushSubscriptions)
    .values({ userId, endpoint, p256dh, auth, userAgent })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, p256dh, auth, userAgent } })
    .run();
}

export function removeSubscription(endpoint: string) {
  db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).run();
}

export function listSubscriptions() {
  return db.select().from(pushSubscriptions).all();
}

export function listSubscriptionsForUser(userId: number) {
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).all();
}
