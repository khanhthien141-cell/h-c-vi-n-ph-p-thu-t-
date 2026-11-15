CREATE TABLE `arcana_store` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
