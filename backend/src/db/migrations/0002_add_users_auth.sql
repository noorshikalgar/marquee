CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `interactions` ADD `user_id` integer REFERENCES users(id);
--> statement-breakpoint
ALTER TABLE `preferences` ADD `user_id` integer REFERENCES users(id);
--> statement-breakpoint
DROP INDEX `preferences_type_value_unique`;
--> statement-breakpoint
CREATE UNIQUE INDEX `preferences_user_type_value_unique` ON `preferences` (`user_id`,`pref_type`,`value`);
--> statement-breakpoint
ALTER TABLE `playlists` ADD `user_id` integer REFERENCES users(id);
--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD `user_id` integer REFERENCES users(id);
--> statement-breakpoint
ALTER TABLE `digests` ADD `user_id` integer REFERENCES users(id);
--> statement-breakpoint
CREATE TABLE `settings_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer REFERENCES users(id),
	`key` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `settings_new` (`key`, `value`) SELECT `key`, `value` FROM `settings`;
--> statement-breakpoint
DROP TABLE `settings`;
--> statement-breakpoint
ALTER TABLE `settings_new` RENAME TO `settings`;
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_user_key_unique` ON `settings` (`user_id`,`key`);
