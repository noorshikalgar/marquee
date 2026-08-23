CREATE TABLE `title_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_id` integer NOT NULL,
	`lang` text NOT NULL,
	`translated_title` text,
	`translated_overview` text,
	`fetched_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `title_translations_unique` ON `title_translations` (`title_id`,`lang`);