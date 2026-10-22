import { eq } from 'drizzle-orm';
import { stripHealthDataWithoutConsent, type Profile } from '@/domain/profile';
import type { AppDb } from '../db/types';
import { profile as table } from '../db/schema';
import { parseJsonArray } from './json';

const ID = 1;

type Row = typeof table.$inferSelect;

function fromRow(r: Row): Profile {
  return {
    geschlecht: r.geschlecht as Profile['geschlecht'],
    geburtsjahr: r.geburtsjahr,
    groesseCm: r.groesseCm,
    gewichtKg: r.gewichtKg,
    zielgewichtKg: r.zielgewichtKg,
    ziel: r.ziel as Profile['ziel'],
    level: r.level as Profile['level'],
    zielzonen: parseJsonArray(r.zielzonen),
    einschraenkungen: parseJsonArray(r.einschraenkungen),
    trainingstageProWoche: r.trainingstageProWoche,
    trainingUhrzeit: r.trainingUhrzeit,
    einheitensystem: r.einheitensystem as Profile['einheitensystem'],
    gesundheitshinweisBestaetigtAm: r.gesundheitshinweisBestaetigtAm,
    einwilligungGesundheitsdaten: r.einwilligungGesundheitsdaten,
    einwilligungAm: r.einwilligungAm,
    erstelltAm: r.erstelltAm,
  };
}

function toRow(p: Profile): Row {
  return {
    id: ID,
    geschlecht: p.geschlecht,
    geburtsjahr: p.geburtsjahr,
    groesseCm: p.groesseCm,
    gewichtKg: p.gewichtKg,
    zielgewichtKg: p.zielgewichtKg,
    ziel: p.ziel,
    level: p.level,
    zielzonen: JSON.stringify(p.zielzonen),
    einschraenkungen: JSON.stringify(p.einschraenkungen),
    trainingstageProWoche: p.trainingstageProWoche,
    trainingUhrzeit: p.trainingUhrzeit,
    einheitensystem: p.einheitensystem,
    gesundheitshinweisBestaetigtAm: p.gesundheitshinweisBestaetigtAm,
    einwilligungGesundheitsdaten: p.einwilligungGesundheitsdaten,
    einwilligungAm: p.einwilligungAm,
    erstelltAm: p.erstelltAm,
  };
}

export function createProfileRepository(db: AppDb) {
  return {
    get(): Profile | null {
      const row = db.select().from(table).where(eq(table.id, ID)).get();
      return row ? fromRow(row) : null;
    },
    /** Speichert das Profil. Größe und Gewicht werden ohne Einwilligung (/F038/) nie gespeichert. */
    save(profile: Profile): Profile {
      const safe = stripHealthDataWithoutConsent(profile);
      const row = toRow(safe);
      db.insert(table).values(row).onConflictDoUpdate({ target: table.id, set: row }).run();
      return safe;
    },
    /** Widerruf der Einwilligung (/S100/): Körperdaten löschen. */
    clearHealthData(): void {
      db.update(table)
        .set({
          groesseCm: null,
          gewichtKg: null,
          zielgewichtKg: null,
          einwilligungGesundheitsdaten: false,
          einwilligungAm: null,
        })
        .where(eq(table.id, ID))
        .run();
    },
    delete(): void {
      db.delete(table).run();
    },
  };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
