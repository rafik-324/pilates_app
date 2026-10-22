import { challengesFileSchema, exercisesFileSchema, workoutsFileSchema } from './schemas';
import type { Content } from './types';

/** Schema- und Referenzprüfung aller Inhaltsdaten. Wirft bei Fehlern mit gesammelter Meldung. */
export function validateContent(raw: {
  exercises: unknown;
  workouts: unknown;
  challenges: unknown;
}): Content {
  const exercises = exercisesFileSchema.parse(raw.exercises);
  const workouts = workoutsFileSchema.parse(raw.workouts);
  const challenges = challengesFileSchema.parse(raw.challenges);
  const errors = findReferenceErrors({ exercises, workouts, challenges });
  if (errors.length > 0) throw new Error(`Ungültige Inhaltsdaten:\n- ${errors.join('\n- ')}`);
  return { exercises, workouts, challenges };
}

export function findReferenceErrors(c: Content): string[] {
  const errors: string[] = [];
  const exIds = new Set<string>();
  for (const e of c.exercises) {
    if (exIds.has(e.id)) errors.push(`Doppelte Übungs-ID ${e.id}`);
    exIds.add(e.id);
  }
  for (const e of c.exercises) {
    for (const ref of [e.variante_leicht_id, e.variante_schwer_id]) {
      if (ref && !exIds.has(ref)) errors.push(`${e.id}: Variante ${ref} existiert nicht`);
    }
  }
  const woIds = new Set<string>();
  for (const w of c.workouts) {
    if (woIds.has(w.id)) errors.push(`Doppelte Workout-ID ${w.id}`);
    woIds.add(w.id);
    for (const u of w.uebungen) {
      if (!exIds.has(u.uebung_id)) errors.push(`${w.id}: Übung ${u.uebung_id} existiert nicht`);
    }
  }
  for (const ch of c.challenges) {
    if (ch.plan.length !== ch.tage)
      errors.push(`${ch.id}: plan hat ${ch.plan.length} statt ${ch.tage} Tage`);
    for (const d of ch.plan) {
      if (!d.ruhetag && (!d.workout_id || !woIds.has(d.workout_id))) {
        errors.push(`${ch.id}: Tag ${d.tag} verweist auf unbekanntes Workout`);
      }
    }
  }
  return errors;
}
