import type { AppDb } from '../db/types';
import { createFavoriteRepository } from './favorites';
import { createKvRepository } from './kv';
import { createPlanRepository } from './plans';
import { createProfileRepository } from './profile';
import { createReminderRepository } from './reminders';
import { createSessionRepository } from './sessions';
import { createSettingsRepository } from './settings';
import { createWeightRepository } from './weight';

/** Alle Repositories auf einer DB. Die App ruft DB-Zugriffe nur hierüber auf. */
export function createRepositories(db: AppDb) {
  const repos = {
    profile: createProfileRepository(db),
    settings: createSettingsRepository(db),
    plans: createPlanRepository(db),
    sessions: createSessionRepository(db),
    weight: createWeightRepository(db),
    reminders: createReminderRepository(db),
    favorites: createFavoriteRepository(db),
    kv: createKvRepository(db),
  };
  return {
    ...repos,
    /** Löscht alle Nutzerdaten (/F1150/, /T120/). */
    deleteAllData(): void {
      db.transaction(() => {
        repos.sessions.deleteAll();
        repos.plans.deleteAll();
        repos.weight.deleteAll();
        repos.reminders.deleteAll();
        repos.favorites.deleteAll();
        repos.kv.deleteAll();
        repos.settings.delete();
        repos.profile.delete();
      });
    },
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
