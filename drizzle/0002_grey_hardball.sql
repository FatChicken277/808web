CREATE TABLE `artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_code_unique` ON `artists` (`code`);--> statement-breakpoint
ALTER TABLE `tickets` ADD `ref_code` text;