import type { z } from 'zod';
import type {
  challengeSchema,
  exerciseSchema,
  workoutEntrySchema,
  workoutSchema,
  zoneSchema,
  belastungSchema,
  categorySchema,
} from './schemas';

export type Exercise = z.infer<typeof exerciseSchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type WorkoutEntry = z.infer<typeof workoutEntrySchema>;
export type Challenge = z.infer<typeof challengeSchema>;
export type Zone = z.infer<typeof zoneSchema>;
export type Belastung = z.infer<typeof belastungSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Level = 1 | 2 | 3;
export type Lang = 'de' | 'en';

export type Content = {
  exercises: Exercise[];
  workouts: Workout[];
  challenges: Challenge[];
};
