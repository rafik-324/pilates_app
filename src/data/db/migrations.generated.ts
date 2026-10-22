// AUTOMATISCH ERZEUGT von scripts/build-migrations.mjs. Nicht von Hand ändern.
export const journal = {
  "version": "7",
  "dialect": "sqlite",
  "entries": [
    {
      "idx": 0,
      "version": "6",
      "when": 1792662442682,
      "tag": "0000_omniscient_microbe",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "6",
      "when": 1792664214685,
      "tag": "0001_flowery_echo",
      "breakpoints": true
    }
  ]
};

export const migrations: Record<string, string> = {
  "m0000": "CREATE TABLE `favorites` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`item_type` text NOT NULL,\n\t`item_id` text NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `kv` (\n\t`key` text PRIMARY KEY NOT NULL,\n\t`value` text NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `plan_days` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`plan_id` integer NOT NULL,\n\t`tag_nr` integer NOT NULL,\n\t`workout_id` text,\n\t`titel` text,\n\t`uebungen` text,\n\t`pause_s` integer,\n\t`geschaetzte_dauer_min` integer,\n\t`ruhetag` integer DEFAULT false NOT NULL,\n\t`status` text DEFAULT 'offen' NOT NULL,\n\t`erledigt_am` text,\n\tFOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade\n);\n--> statement-breakpoint\nCREATE TABLE `plans` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`typ` text NOT NULL,\n\t`challenge_id` text,\n\t`startdatum` text NOT NULL,\n\t`seed` integer DEFAULT 0 NOT NULL,\n\t`aktiv` integer DEFAULT true NOT NULL,\n\t`erstellt_am` text NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `profile` (\n\t`id` integer PRIMARY KEY NOT NULL,\n\t`geschlecht` text,\n\t`geburtsjahr` integer,\n\t`groesse_cm` real,\n\t`gewicht_kg` real,\n\t`zielgewicht_kg` real,\n\t`ziel` text,\n\t`level` integer DEFAULT 1 NOT NULL,\n\t`zielzonen` text DEFAULT '[]' NOT NULL,\n\t`einschraenkungen` text DEFAULT '[]' NOT NULL,\n\t`trainingstage_pro_woche` integer DEFAULT 3 NOT NULL,\n\t`training_uhrzeit` text,\n\t`einheitensystem` text DEFAULT 'metrisch' NOT NULL,\n\t`gesundheitshinweis_bestaetigt_am` text,\n\t`einwilligung_gesundheitsdaten` integer DEFAULT false NOT NULL,\n\t`einwilligung_am` text,\n\t`erstellt_am` text NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `reminders` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`uhrzeit` text NOT NULL,\n\t`wochentage` text DEFAULT '[]' NOT NULL,\n\t`aktiv` integer DEFAULT true NOT NULL,\n\t`notification_ids` text DEFAULT '[]' NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `sessions` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`workout_id` text,\n\t`titel` text,\n\t`plan_id` integer,\n\t`plan_tag_nr` integer,\n\t`start` text NOT NULL,\n\t`ende` text,\n\t`dauer_s` integer DEFAULT 0 NOT NULL,\n\t`kcal` real DEFAULT 0 NOT NULL,\n\t`kcal_geschaetzt` integer DEFAULT true NOT NULL,\n\t`abgeschlossen` integer DEFAULT false NOT NULL,\n\t`uebungen_erledigt` integer DEFAULT 0 NOT NULL,\n\t`feedback` text\n);\n--> statement-breakpoint\nCREATE TABLE `settings` (\n\t`id` integer PRIMARY KEY NOT NULL,\n\t`stimme` text,\n\t`musik_an` integer DEFAULT true NOT NULL,\n\t`lautstaerke_musik` real DEFAULT 0.4 NOT NULL,\n\t`lautstaerke_stimme` real DEFAULT 1 NOT NULL,\n\t`countdown_s` integer DEFAULT 10 NOT NULL,\n\t`pause_s` integer DEFAULT 10 NOT NULL,\n\t`schema` text DEFAULT 'system' NOT NULL,\n\t`sprache` text DEFAULT 'system' NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE `weight_entries` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`datum` text NOT NULL,\n\t`gewicht_kg` real NOT NULL\n);\n",
  "m0001": "ALTER TABLE `sessions` ADD `uebungen_gesamt` integer DEFAULT 0 NOT NULL;--> statement-breakpoint\nALTER TABLE `sessions` ADD `abbruch_grund` text;"
};

export default { journal, migrations };
