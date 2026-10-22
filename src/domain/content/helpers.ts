import type { Lang, WorkoutEntry } from './types';

/** Sekunden pro Wiederholung für Zeitschätzungen bei Wiederholungsübungen. */
export const SECONDS_PER_REP = 4;

export function localized<T>(value: { de: T; en: T }, lang: Lang): T {
  return value[lang] ?? value.de;
}

export function entrySeconds(entry: WorkoutEntry): number {
  return entry.dauer_s ?? (entry.wdh ?? 0) * SECONDS_PER_REP;
}

/** Geschätzte Gesamtdauer eines Workouts in Sekunden (Übungen + Pausen dazwischen). */
export function estimateWorkoutSeconds(entries: WorkoutEntry[], pauseS: number): number {
  const work = entries.reduce((sum, e) => sum + entrySeconds(e), 0);
  return work + pauseS * Math.max(0, entries.length - 1);
}
