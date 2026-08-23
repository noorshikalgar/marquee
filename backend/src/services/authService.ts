import { randomBytes } from "node:crypto";
import { ApiHttpError } from "../middleware/errorHandler.js";
import { createSession, deleteSession, deleteSessionsForUser, getSession } from "../db/repositories/sessionsRepo.js";
import {
  countUsers,
  createUser as createUserRow,
  deleteUser as deleteUserRow,
  getUserByUsername,
  getUserById,
  listUsers,
  updateUser as updateUserRow,
  updateUserPassword,
  type UserRole,
} from "../db/repositories/usersRepo.js";
import { createWatchlist, getWatchlist } from "../db/repositories/playlistsRepo.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export const SESSION_COOKIE_NAME = "marquee_session";

function toPublicUser(row: { id: number; username: string; displayName: string; role: UserRole }) {
  return { id: row.id, username: row.username, displayName: row.displayName, role: row.role };
}

function createUserRecord(username: string, password: string, displayName: string, role: UserRole) {
  if (getUserByUsername(username)) {
    throw new ApiHttpError(409, "username_taken", "That username is already in use");
  }
  if (password.length < 6) {
    throw new ApiHttpError(400, "weak_password", "Password must be at least 6 characters");
  }
  const { hash, salt } = hashPassword(password);
  return createUserRow({ username, passwordHash: hash, passwordSalt: salt, displayName, role });
}

export function createUser(username: string, password: string, displayName: string, role: UserRole) {
  const user = createUserRecord(username, password, displayName, role);
  if (!getWatchlist(user.id)) createWatchlist(user.id);
  return toPublicUser(user);
}

/**
 * Creates the first admin account without provisioning a watchlist — on a fresh
 * install migrate.ts backfills any pre-auth data (including a legacy watchlist)
 * onto this user right after, then provisions one only if none was backfilled.
 */
export function bootstrapAdminUser(defaultUsername: string, defaultPassword: string) {
  if (countUsers() > 0) return undefined;
  return createUserRecord(defaultUsername, defaultPassword, "Admin", "admin");
}

export function ensureWatchlist(userId: number) {
  if (!getWatchlist(userId)) createWatchlist(userId);
}

export function login(username: string, password: string) {
  const user = getUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    throw new ApiHttpError(401, "invalid_credentials", "Incorrect username or password");
  }
  const token = randomBytes(32).toString("hex");
  const expiresAt = createSession(token, user.id);
  return { token, expiresAt, user: toPublicUser(user) };
}

export function logout(token: string) {
  deleteSession(token);
}

export function getUserForToken(token: string) {
  const session = getSession(token);
  if (!session) return undefined;
  const user = getUserById(session.userId);
  if (!user) return undefined;
  return toPublicUser(user);
}

export function listAllUsers() {
  return listUsers().map(toPublicUser);
}

export function resetPassword(userId: number, newPassword: string) {
  if (newPassword.length < 6) {
    throw new ApiHttpError(400, "weak_password", "Password must be at least 6 characters");
  }
  const { hash, salt } = hashPassword(newPassword);
  updateUserPassword(userId, hash, salt);
  deleteSessionsForUser(userId);
}

export function updateUserProfile(userId: number, patch: { displayName?: string; role?: UserRole }) {
  if (!getUserById(userId)) throw new ApiHttpError(404, "not_found", "User not found");
  updateUserRow(userId, patch);
  return toPublicUser(getUserById(userId)!);
}

export function deleteUser(userId: number, requestingUserId: number) {
  if (userId === requestingUserId) {
    throw new ApiHttpError(400, "cannot_delete_self", "You can't delete your own account");
  }
  if (!getUserById(userId)) throw new ApiHttpError(404, "not_found", "User not found");
  deleteUserRow(userId);
}
