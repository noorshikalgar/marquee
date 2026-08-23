import { isNull } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { env } from "../config/env.js";
import { db, sqlite } from "./client.js";
import { digests, interactions, playlists, preferences, pushSubscriptions, settings, users } from "./schema.js";
import { bootstrapAdminUser, ensureWatchlist } from "../services/authService.js";
import { logger } from "../utils/logger.js";

export function runMigrations() {
  migrate(db, { migrationsFolder: "./src/db/migrations" });
  bootstrapAdminAndBackfill();
}

// Wrapped in a single write transaction so concurrent server instances (e.g. a
// stray dev-server watcher restarting mid-edit) can't race the check-then-create
// sequence below — SQLite serializes writers, so only one caller ever wins.
const bootstrapAdminAndBackfill = sqlite.transaction(() => {
  const hadNoUsers = db.select().from(users).all().length === 0;
  if (!hadNoUsers) return;

  const admin = bootstrapAdminUser(env.ADMIN_USERNAME, env.ADMIN_PASSWORD);
  if (!admin) return;

  for (const table of [interactions, preferences, playlists, pushSubscriptions, digests, settings]) {
    db.update(table).set({ userId: admin.id }).where(isNull(table.userId)).run();
  }

  ensureWatchlist(admin.id);

  logger.info(
    { username: admin.username },
    "Bootstrap admin created. If this is a fresh install, sign in with ADMIN_USERNAME/ADMIN_PASSWORD from your .env.",
  );
});

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
  console.log("Migrations applied.");
  sqlite.close();
}
