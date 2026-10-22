import { openDb } from './db/client';
import { createRepositories, type Repositories } from './repositories';
import { useProfile } from '@/state/profile';
import { useSettings } from '@/state/settings';

let repos: Repositories | null = null;
let starting: Promise<Repositories> | null = null;

/** Öffnet die DB, führt Migrationen aus und lädt die Stores. Einmal beim App-Start aufrufen. */
export function initData(): Promise<Repositories> {
  starting ??= (async () => {
    const db = await openDb();
    repos = createRepositories(db);
    useSettings.getState().hydrate(repos.settings);
    useProfile.getState().hydrate(repos.profile);
    return repos;
  })();
  return starting;
}

/** Repositories nach `initData()`. */
export function getRepositories(): Repositories {
  if (!repos) throw new Error('Datenbank nicht initialisiert (initData() zuerst aufrufen)');
  return repos;
}
