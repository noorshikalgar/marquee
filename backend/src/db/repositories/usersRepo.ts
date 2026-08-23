import { eq } from "drizzle-orm";
import { db, sqlite } from "../client.js";
import {
  digests,
  interactions,
  playlists,
  preferences,
  pushSubscriptions,
  sessions,
  settings,
  users,
} from "../schema.js";

export type UserRole = "admin" | "member";

export function getUserByUsername(username: string) {
  return db.select().from(users).where(eq(users.username, username)).get();
}

export function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function listUsers() {
  return db.select().from(users).orderBy(users.id).all();
}

export function countUsers(): number {
  return db.select().from(users).all().length;
}

export function createUser(input: {
  username: string;
  passwordHash: string;
  passwordSalt: string;
  displayName: string;
  role: UserRole;
}) {
  return db.insert(users).values(input).returning().get();
}

export function updateUserPassword(id: number, passwordHash: string, passwordSalt: string) {
  db.update(users).set({ passwordHash, passwordSalt }).where(eq(users.id, id)).run();
}

export function updateUser(id: number, patch: { displayName?: string; role?: UserRole }) {
  db.update(users).set(patch).where(eq(users.id, id)).run();
}

// The user_id columns added post-launch don't carry ON DELETE CASCADE at the
// SQLite level (they were added via ALTER TABLE), so each owning table is
// cleared explicitly here before the user row itself is removed.
export const deleteUser = sqlite.transaction((id: number) => {
  db.delete(sessions).where(eq(sessions.userId, id)).run();
  db.delete(interactions).where(eq(interactions.userId, id)).run();
  db.delete(preferences).where(eq(preferences.userId, id)).run();
  db.delete(playlists).where(eq(playlists.userId, id)).run();
  db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, id)).run();
  db.delete(digests).where(eq(digests.userId, id)).run();
  db.delete(settings).where(eq(settings.userId, id)).run();
  db.delete(users).where(eq(users.id, id)).run();
});
