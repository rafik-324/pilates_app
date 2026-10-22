import { addDays, type DateKey } from './dates';

/**
 * Streak = aufeinanderfolgende Trainingstage (/F830/).
 * Abgeschlossene Ruhetage unterbrechen den Streak nicht (/F240/), zählen aber auch nicht mit.
 * Ist heute noch nicht trainiert worden, zählt der Streak bis gestern (der Tag läuft noch).
 */
export function currentStreak(
  trainingDays: Iterable<DateKey>,
  restDays: Iterable<DateKey>,
  today: DateKey,
): number {
  const training = new Set(trainingDays);
  const rest = new Set(restDays);
  let day = training.has(today) || rest.has(today) ? today : addDays(today, -1);
  let streak = 0;
  for (;;) {
    if (training.has(day)) streak++;
    else if (!rest.has(day)) break;
    day = addDays(day, -1);
  }
  return streak;
}

/** Längster Streak über alle Tage (Ruhetage verbinden, zählen aber nicht). */
export function longestStreak(
  trainingDays: Iterable<DateKey>,
  restDays: Iterable<DateKey>,
): number {
  const training = new Set(trainingDays);
  const rest = new Set(restDays);
  const all = [...new Set([...training, ...rest])].sort();
  let best = 0;
  let run = 0;
  let prev: DateKey | null = null;
  for (const day of all) {
    if (prev !== null && addDays(prev, 1) !== day) run = 0;
    if (training.has(day)) run++;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}
