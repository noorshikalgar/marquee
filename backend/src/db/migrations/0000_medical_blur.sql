CREATE TABLE `ai_query_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`query_hash` text NOT NULL,
	`query_text` text NOT NULL,
	`parsed_result` text NOT NULL,
	`resolved_title_ids` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`expires_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_query_cache_query_hash_unique` ON `ai_query_cache` (`query_hash`);--> statement-breakpoint
CREATE TABLE `digests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`generated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`title` text NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`pushed` integer DEFAULT false NOT NULL,
	`read_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_id` integer NOT NULL,
	`interaction_type` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `playlist_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`playlist_id` integer NOT NULL,
	`title_id` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`reason` text,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playlist_items_unique` ON `playlist_items` (`playlist_id`,`title_id`);--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`ai_prompt_context` text,
	`generated_at` text,
	`refresh_interval_hours` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pref_type` text NOT NULL,
	`value` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `preferences_type_value_unique` ON `preferences` (`pref_type`,`value`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`user_agent` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `titles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`title` text NOT NULL,
	`overview` text DEFAULT '' NOT NULL,
	`poster_path` text,
	`backdrop_path` text,
	`release_date` text,
	`genres` text DEFAULT '[]' NOT NULL,
	`origin_country` text DEFAULT '[]' NOT NULL,
	`original_language` text DEFAULT '' NOT NULL,
	`vote_average` real DEFAULT 0 NOT NULL,
	`vote_count` integer DEFAULT 0 NOT NULL,
	`imdb_id` text,
	`runtime` integer,
	`popularity` real DEFAULT 0 NOT NULL,
	`raw_json` text,
	`cached_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `titles_tmdb_media_unique` ON `titles` (`tmdb_id`,`media_type`);