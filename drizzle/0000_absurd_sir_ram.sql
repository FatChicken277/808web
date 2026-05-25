CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`cedula` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`qr_token` text NOT NULL,
	`attended` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_cedula_unique` ON `tickets` (`cedula`);--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_email_unique` ON `tickets` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_qr_token_unique` ON `tickets` (`qr_token`);