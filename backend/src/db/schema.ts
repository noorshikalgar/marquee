import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: text("expires_at").notNull(),
});

export const titles = sqliteTable(
  "titles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: text("media_type", { enum: ["movie", "tv"] }).notNull(),
    title: text("title").notNull(),
    overview: text("overview").notNull().default(""),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    releaseDate: text("release_date"),
    genres: text("genres", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    originCountry: text("origin_country", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    originalLanguage: text("original_language").notNull().default(""),
    voteAverage: real("vote_average").notNull().default(0),
    voteCount: integer("vote_count").notNull().default(0),
    imdbId: text("imdb_id"),
    runtime: integer("runtime"),
    popularity: real("popularity").notNull().default(0),
    rawJson: text("raw_json"),
    cachedAt: text("cached_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [uniqueIndex("titles_tmdb_media_unique").on(t.tmdbId, t.mediaType)],
);

export const titleTranslations = sqliteTable(
  "title_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    titleId: integer("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    lang: text("lang").notNull(),
    translatedTitle: text("translated_title"),
    translatedOverview: text("translated_overview"),
    fetchedAt: text("fetched_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [uniqueIndex("title_translations_unique").on(t.titleId, t.lang)],
);

export const interactions = sqliteTable("interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  titleId: integer("title_id")
    .notNull()
    .references(() => titles.id, { onDelete: "cascade" }),
  interactionType: text("interaction_type", {
    enum: ["like", "dislike", "watched", "not_interested"],
  }).notNull(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const preferences = sqliteTable(
  "preferences",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    prefType: text("pref_type", { enum: ["genre", "person", "keyword", "origin_country"] }).notNull(),
    value: text("value").notNull(),
    weight: real("weight").notNull().default(1.0),
    updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [uniqueIndex("preferences_user_type_value_unique").on(t.userId, t.prefType, t.value)],
);

export const playlists = sqliteTable("playlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["manual", "watchlist", "ai_dynamic"] }).notNull(),
  description: text("description"),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  aiPromptContext: text("ai_prompt_context"),
  generatedAt: text("generated_at"),
  refreshIntervalHours: integer("refresh_interval_hours"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const playlistItems = sqliteTable(
  "playlist_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    titleId: integer("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    reason: text("reason"),
    addedAt: text("added_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [uniqueIndex("playlist_items_unique").on(t.playlistId, t.titleId)],
);

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const aiQueryCache = sqliteTable("ai_query_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  queryHash: text("query_hash").notNull().unique(),
  queryText: text("query_text").notNull(),
  parsedResult: text("parsed_result", { mode: "json" }).notNull(),
  resolvedTitleIds: text("resolved_title_ids", { mode: "json" }).$type<number[]>().notNull().default(sql`'[]'`),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  expiresAt: text("expires_at"),
});

export const digests = sqliteTable("digests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  generatedAt: text("generated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  title: text("title").notNull(),
  items: text("items", { mode: "json" }).notNull().default(sql`'[]'`),
  pushed: integer("pushed", { mode: "boolean" }).notNull().default(false),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (t) => [uniqueIndex("settings_user_key_unique").on(t.userId, t.key)],
);
