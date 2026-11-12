CREATE TABLE `montage_film_versions` (
	`owner_id` text NOT NULL,
	`project_id` text NOT NULL,
	`revision` integer NOT NULL,
	`project_json` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `project_id`, `revision`)
);
