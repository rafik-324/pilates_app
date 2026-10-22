import type { Exercise, WorkoutEntry } from '../content';
import type { PlayerItem } from './engine';

export * from './engine';

/** Workout-Einträge in Player-Schritte übersetzen. */
export function toPlayerItems(
  entries: WorkoutEntry[],
  exerciseById: (id: string) => Exercise | undefined,
): PlayerItem[] {
  return entries.map((e) => {
    const ex = exerciseById(e.uebung_id);
    const reps = e.wdh ?? null;
    const durationS = e.dauer_s ?? null;
    const kind =
      durationS !== null ? 'time' : reps !== null ? 'reps' : ex?.typ === 'zeit' ? 'time' : 'reps';
    return {
      exerciseId: e.uebung_id,
      kind,
      durationS: kind === 'time' ? (durationS ?? ex?.standard_dauer_s ?? 30) : null,
      reps: kind === 'reps' ? (reps ?? ex?.standard_wdh ?? 10) : null,
    };
  });
}
