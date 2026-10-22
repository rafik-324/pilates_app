import type { Exercise, Level, Workout, Zone } from './content';

/**
 * Suche und Filter der Bibliothek (/F310/, /F320/). Rein funktional, ohne React.
 */

/** Vereinheitlicht Text für die Suche: klein, Umlaute wie "ae" / "ä" gleich, ohne Akzente. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/ae/g, 'a')
    .replace(/oe/g, 'o')
    .replace(/ue/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function haystackExercise(e: Exercise): string {
  return normalize(
    [e.name.de, e.name.en, e.beschreibung.de, e.beschreibung.en, e.id.replace(/_/g, ' ')].join(' '),
  );
}

/** Alle Suchwörter müssen vorkommen (UND-Verknüpfung). Leere Suche trifft alles. */
export function matches(haystack: string, query: string): boolean {
  const words = normalize(query).split(' ').filter(Boolean);
  return words.every((w) => haystack.includes(w));
}

export function searchExercises(exercises: Exercise[], query: string): Exercise[] {
  if (!normalize(query)) return [];
  return exercises.filter((e) => matches(haystackExercise(e), query));
}

/** Ein Workout passt, wenn Titel passt oder eine enthaltene Übung passt. */
export function searchWorkouts(
  workouts: Workout[],
  query: string,
  exerciseById: (id: string) => Exercise | undefined,
): Workout[] {
  if (!normalize(query)) return workouts;
  return workouts.filter((w) => {
    const title = normalize(`${w.titel.de} ${w.titel.en}`);
    if (matches(title, query)) return true;
    return w.uebungen.some((u) => {
      const ex = exerciseById(u.uebung_id);
      return ex ? matches(haystackExercise(ex), query) : false;
    });
  });
}

export type DurationBucket = 'kurz' | 'mittel' | 'lang';

export function durationBucket(minutes: number): DurationBucket {
  if (minutes <= 7) return 'kurz';
  if (minutes <= 10) return 'mittel';
  return 'lang';
}

export type LibraryFilter = {
  level?: Level | null;
  duration?: DurationBucket | null;
  zone?: Zone | null;
  /** true: nur mit Wand, false: nur ohne Wand */
  wand?: boolean | null;
  /** true: nur mit Boden, false: nur ohne Bodenübungen */
  boden?: boolean | null;
  favoritesOnly?: boolean;
};

export type WorkoutTraits = { wand: boolean; boden: boolean };

/** Ein Workout nutzt Wand / Boden, sobald eine enthaltene Übung das tut. */
export function workoutTraits(
  w: Workout,
  exerciseById: (id: string) => Exercise | undefined,
): WorkoutTraits {
  const list = w.uebungen.map((u) => exerciseById(u.uebung_id)).filter(Boolean) as Exercise[];
  return { wand: list.some((e) => e.wand), boden: list.some((e) => e.boden) };
}

export function filterWorkouts(
  workouts: Workout[],
  f: LibraryFilter,
  exerciseById: (id: string) => Exercise | undefined,
  favorites: ReadonlySet<string> = new Set(),
): Workout[] {
  return workouts.filter((w) => {
    if (f.level && w.level !== f.level) return false;
    if (f.duration && durationBucket(w.geschaetzte_dauer) !== f.duration) return false;
    if (f.zone && !w.zielzonen.includes(f.zone)) return false;
    if (f.favoritesOnly && !favorites.has(w.id)) return false;
    if (f.wand != null || f.boden != null) {
      const t = workoutTraits(w, exerciseById);
      if (f.wand != null && t.wand !== f.wand) return false;
      if (f.boden != null && t.boden !== f.boden) return false;
    }
    return true;
  });
}

export function filterExercises(exercises: Exercise[], f: LibraryFilter): Exercise[] {
  return exercises.filter((e) => {
    if (f.level && e.level !== f.level) return false;
    if (f.zone && !e.zielzonen.includes(f.zone)) return false;
    if (f.wand != null && e.wand !== f.wand) return false;
    if (f.boden != null && e.boden !== f.boden) return false;
    return true;
  });
}

export function isFilterActive(f: LibraryFilter): boolean {
  return Boolean(
    f.level || f.duration || f.zone || f.wand != null || f.boden != null || f.favoritesOnly,
  );
}

/** Anpassung einer Übung vor dem Start (/F440/): Zeit in 5-s-Schritten, Wiederholungen einzeln. */
export function stepEntry<T extends { dauer_s?: number; wdh?: number }>(entry: T, dir: 1 | -1): T {
  if (entry.dauer_s !== undefined) {
    return { ...entry, dauer_s: Math.min(180, Math.max(10, entry.dauer_s + dir * 5)) };
  }
  return { ...entry, wdh: Math.min(50, Math.max(1, (entry.wdh ?? 1) + dir)) };
}
