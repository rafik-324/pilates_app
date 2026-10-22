import type { Exercise, WorkoutEntry } from './content';
import { SECONDS_PER_REP } from './content';
import { kcalForSegments } from './kcal';

export type WorkoutStats = {
  durationS: number;
  minutes: number;
  exerciseCount: number;
  kcal: number;
  /** true bei Standardgewicht (/F038/ nicht erteilt oder kein Gewicht) */
  kcalEstimated: boolean;
};

export function entrySecondsOf(e: WorkoutEntry): number {
  return e.dauer_s ?? (e.wdh ?? 0) * SECONDS_PER_REP;
}

/** Dauer, Übungsanzahl und kcal-Schätzung (MET x Gewicht x Stunden pro Übung, /F220/, /F330/). */
export function workoutStats(
  entries: WorkoutEntry[],
  pauseS: number,
  exerciseById: (id: string) => Exercise | undefined,
  weightKg?: number | null,
): WorkoutStats {
  const work = entries.reduce((s, e) => s + entrySecondsOf(e), 0);
  const durationS = work + pauseS * Math.max(0, entries.length - 1);
  const kcal = kcalForSegments(
    entries.map((e) => ({
      met: exerciseById(e.uebung_id)?.met_wert ?? 3,
      durationS: entrySecondsOf(e),
    })),
    weightKg,
  );
  return {
    durationS,
    minutes: Math.max(1, Math.round(durationS / 60)),
    exerciseCount: entries.length,
    kcal: kcal.kcal,
    kcalEstimated: kcal.estimated,
  };
}
