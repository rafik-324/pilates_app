CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kv` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`tag_nr` integer NOT NULL,
	`workout_id` text,
	`titel` text,
	`uebungen` text,
	`pause_s` integer,
	`geschaetzte_dauer_min` integer,
	`ruhetag` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'offen' NOT NULL,
	`erledigt_am` text,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`typ` text NOT NULL,
	`challenge_id` text,
	`startdatum` text NOT NULL,
	`seed` integer DEFAULT 0 NOT NULL,
	`aktiv` integer DEFAULT true NOT NULL,
	`erstellt_am` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`geschlecht` text,
	`geburtsjahr` integer,
	`groesse_cm` real,
	`gewicht_kg` real,
	`zielgewicht_kg` real,
	`ziel` text,
	`level` integer DEFAULT 1 NOT NULL,
	`zielzonen` text DEFAULT '[]' NOT NULL,
	`einschraenkungen` text DEFAULT '[]' NOT NULL,
	`trainingstage_pro_woche` integer DEFAULT 3 NOT NULL,
	`training_uhrzeit` text,
	`einheitensystem` text DEFAULT 'metrisch' NOT NULL,
	`gesundheitshinweis_bestaetigt_am` text,
	`einwilligung_gesundheitsdaten` integer DEFAULT false NOT NULL,
	`einwilligung_am` text,
	`erstellt_am` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uhrzeit` text NOT NULL,
	`wochentage` text DEFAULT '[]' NOT NULL,
	`aktiv` integer DEFAULT true NOT NULL,
	`notification_ids` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_id` text,
	`titel` text,
	`plan_id` integer,
	`plan_tag_nr` integer,
	`start` text NOT NULL,
	`ende` text,
	`dauer_s` integer DEFAULT 0 NOT NULL,
	`kcal` real DEFAULT 0 NOT NULL,
	`kcal_geschaetzt` integer DEFAULT true NOT NULL,
	`abgeschlossen` integer DEFAULT false NOT NULL,
	`uebungen_erledigt` integer DEFAULT 0 NOT NULL,
	`feedback` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`stimme` text,
	`musik_an` integer DEFAULT true NOT NULL,
	`lautstaerke_musik` real DEFAULT 0.4 NOT NULL,
	`lautstaerke_stimme` real DEFAULT 1 NOT NULL,
	`countdown_s` integer DEFAULT 10 NOT NULL,
	`pause_s` integer DEFAULT 10 NOT NULL,
	`schema` text DEFAULT 'system' NOT NULL,
	`sprache` text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weight_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`datum` text NOT NULL,
	`gewicht_kg` real NOT NULL
);
