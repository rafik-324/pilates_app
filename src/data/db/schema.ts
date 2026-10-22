import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** /D010/ Nutzerprofil (genau eine Zeile, id = 1). */
export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  geschlecht: text('geschlecht'),
  geburtsjahr: integer('geburtsjahr'),
  groesseCm: real('groesse_cm'),
  gewichtKg: real('gewicht_kg'),
  zielgewichtKg: real('zielgewicht_kg'),
  ziel: text('ziel'),
  level: integer('level').notNull().default(1),
  zielzonen: text('zielzonen').notNull().default('[]'),
  einschraenkungen: text('einschraenkungen').notNull().default('[]'),
  trainingstageProWoche: integer('trainingstage_pro_woche').notNull().default(3),
  trainingUhrzeit: text('training_uhrzeit'),
  einheitensystem: text('einheitensystem').notNull().default('metrisch'),
  gesundheitshinweisBestaetigtAm: text('gesundheitshinweis_bestaetigt_am'),
  einwilligungGesundheitsdaten: integer('einwilligung_gesundheitsdaten', { mode: 'boolean' })
    .notNull()
    .default(false),
  einwilligungAm: text('einwilligung_am'),
  erstelltAm: text('erstellt_am').notNull(),
});

/** /D040/ Plan */
export const plans = sqliteTable('plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  typ: text('typ').notNull(), // persoenlich | challenge
  challengeId: text('challenge_id'),
  startdatum: text('startdatum').notNull(),
  seed: integer('seed').notNull().default(0),
  aktiv: integer('aktiv', { mode: 'boolean' }).notNull().default(true),
  erstelltAm: text('erstellt_am').notNull(),
});

/** /D050/ Plantag. `uebungen` enthält die Workout-Einträge als JSON (persönliche Pläne sind generiert). */
export const planDays = sqliteTable('plan_days', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  planId: integer('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  tagNr: integer('tag_nr').notNull(),
  workoutId: text('workout_id'),
  titel: text('titel'),
  uebungen: text('uebungen'),
  pauseS: integer('pause_s'),
  geschaetzteDauerMin: integer('geschaetzte_dauer_min'),
  ruhetag: integer('ruhetag', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('offen'), // offen | erledigt
  erledigtAm: text('erledigt_am'),
});

/** /D060/ Session */
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: text('workout_id'),
  titel: text('titel'),
  planId: integer('plan_id'),
  planTagNr: integer('plan_tag_nr'),
  start: text('start').notNull(),
  ende: text('ende'),
  dauerS: integer('dauer_s').notNull().default(0),
  kcal: real('kcal').notNull().default(0),
  kcalGeschaetzt: integer('kcal_geschaetzt', { mode: 'boolean' }).notNull().default(true),
  abgeschlossen: integer('abgeschlossen', { mode: 'boolean' }).notNull().default(false),
  uebungenErledigt: integer('uebungen_erledigt').notNull().default(0),
  feedback: text('feedback'), // zu_leicht | passend | zu_schwer
  uebungenGesamt: integer('uebungen_gesamt').notNull().default(0),
  abbruchGrund: text('abbruch_grund'), // zu_schwer | keine_zeit | sonstiges (/F610/)
});

/** /D070/ Gewichtseintrag */
export const weightEntries = sqliteTable('weight_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  datum: text('datum').notNull(), // YYYY-MM-DD
  gewichtKg: real('gewicht_kg').notNull(),
});

/** /D080/ Erinnerung */
export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uhrzeit: text('uhrzeit').notNull(), // HH:MM
  wochentage: text('wochentage').notNull().default('[]'), // 1 = Montag ... 7 = Sonntag
  aktiv: integer('aktiv', { mode: 'boolean' }).notNull().default(true),
  notificationIds: text('notification_ids').notNull().default('[]'),
});

/** /D090/ Einstellungen (genau eine Zeile, id = 1), plus Darstellung und Sprache. */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  stimme: text('stimme'),
  musikAn: integer('musik_an', { mode: 'boolean' }).notNull().default(true),
  lautstaerkeMusik: real('lautstaerke_musik').notNull().default(0.4),
  lautstaerkeStimme: real('lautstaerke_stimme').notNull().default(1),
  countdownS: integer('countdown_s').notNull().default(10),
  pauseS: integer('pause_s').notNull().default(10),
  schema: text('schema').notNull().default('system'), // system | light | dark
  sprache: text('sprache').notNull().default('system'), // system | de | en
});

/** Favoriten (/F340/) */
export const favorites = sqliteTable('favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemType: text('item_type').notNull(), // workout | exercise
  itemId: text('item_id').notNull(),
});

/** Einfacher Schlüssel-Wert-Speicher für Kleinkram (Dev-Schalter, Zähler). */
export const kv = sqliteTable('kv', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
