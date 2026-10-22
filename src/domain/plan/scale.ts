import type { Exercise, WorkoutEntry } from '../content';
import { SECONDS_PER_REP } from '../content';

export const MIN_DURATION_S = 15;
export const MIN_REPS = 5;

/** Wendet einen Faktor auf Dauer (auf 5 s gerundet) bzw. Wiederholungen an. */
export function scaleEntry(entry: WorkoutEntry, factor: number): WorkoutEntry {
  if (entry.dauer_s !== undefined) {
    const scaled = Math.max(MIN_DURATION_S, Math.round((entry.dauer_s * factor) / 5) * 5);
    return { ...entry, dauer_s: scaled };
  }
  const reps = Math.max(MIN_REPS, Math.round((entry.wdh ?? 0) * factor));
  return { ...entry, wdh: reps };
}

export function defaultEntry(exercise: Exercise, reihenfolge: number, factor = 1): WorkoutEntry {
  const base: WorkoutEntry =
    exercise.typ === 'zeit'
      ? { uebung_id: exercise.id, dauer_s: exercise.standard_dauer_s, reihenfolge }
      : { uebung_id: exercise.id, wdh: exercise.standard_wdh, reihenfolge };
  return factor === 1 ? base : scaleEntry(base, factor);
}

export function entriesSeconds(entries: WorkoutEntry[], pauseS: number): number {
  const work = entries.reduce((s, e) => s + (e.dauer_s ?? (e.wdh ?? 0) * SECONDS_PER_REP), 0);
  return work + pauseS * Math.max(0, entries.length - 1);
}
