import { eq } from 'drizzle-orm';
import { settings as table } from '../db/schema';
import type { AppDb } from '../db/types';

const ID = 1;

export type Settings = {
  stimme: string | null;
  musikAn: boolean;
  lautstaerkeMusik: number;
  lautstaerkeStimme: number;
  countdownS: number;
  pauseS: number;
  schema: 'system' | 'light' | 'dark';
  sprache: 'system' | 'de' | 'en';
};

export const DEFAULT_SETTINGS: Settings = {
  stimme: null,
  musikAn: true,
  lautstaerkeMusik: 0.4,
  lautstaerkeStimme: 1,
  countdownS: 10,
  pauseS: 10,
  schema: 'system',
  sprache: 'system',
};

export function createSettingsRepository(db: AppDb) {
  const get = (): Settings => {
    const row = db.select().from(table).where(eq(table.id, ID)).get();
    if (!row) return { ...DEFAULT_SETTINGS };
    const { id: _id, ...rest } = row;
    return rest as Settings;
  };
  return {
    get,
    save(patch: Partial<Settings>): Settings {
      const merged: Settings = { ...get(), ...patch };
      db.insert(table)
        .values({ id: ID, ...merged })
        .onConflictDoUpdate({ target: table.id, set: merged })
        .run();
      return merged;
    },
    delete(): void {
      db.delete(table).run();
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
