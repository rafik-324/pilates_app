import challengesJson from '../../../assets/content/challenges.json';
import exercisesJson from '../../../assets/content/exercises.json';
import workoutsJson from '../../../assets/content/workouts.json';
import { validateContent, type Content, type Exercise, type Workout } from '@/domain/content';
import { exerciseMedia, type ExerciseMedia } from './media.generated';

let cached: Content | null = null;
let exerciseIndex: Map<string, Exercise> | null = null;
let workoutIndex: Map<string, Workout> | null = null;

/**
 * Lädt und validiert die Inhaltsdaten einmalig beim ersten Zugriff.
 * Im Dev-Modus führen ungültige Daten zu einem Fehler; in Produktion wird er nur geloggt.
 */
export function getContent(): Content {
  if (cached) return cached;
  const raw = { exercises: exercisesJson, workouts: workoutsJson, challenges: challengesJson };
  try {
    cached = validateContent(raw);
  } catch (e) {
    if (__DEV__) throw e;
    console.error(e);
    cached = raw as unknown as Content;
  }
  return cached;
}

export function getExercise(id: string): Exercise | undefined {
  exerciseIndex ??= new Map(getContent().exercises.map((e) => [e.id, e]));
  return exerciseIndex.get(id);
}

export function getWorkout(id: string): Workout | undefined {
  workoutIndex ??= new Map(getContent().workouts.map((w) => [w.id, w]));
  return workoutIndex.get(id);
}

export function getMedia(exerciseId: string): ExerciseMedia | undefined {
  return exerciseMedia[exerciseId];
}

/** Thumbnail eines Workouts: erste Hauptübung, sonst erste Übung. */
export function getWorkoutThumbnail(workout: Workout): ExerciseMedia['thumbnail'] | undefined {
  const main = workout.uebungen.find((u) => getExercise(u.uebung_id)?.rolle === 'haupt');
  return getMedia((main ?? workout.uebungen[0]).uebung_id)?.thumbnail;
}
