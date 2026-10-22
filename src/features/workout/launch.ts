import { router } from 'expo-router';
import { create } from 'zustand';
import type { ResolvedWorkout } from './resolve';

type LaunchState = {
  /** Workout, das der Player als Nächstes startet (inkl. Anpassungen /F440/). */
  pending: ResolvedWorkout | null;
  set: (w: ResolvedWorkout | null) => void;
};

export const useWorkoutLaunch = create<LaunchState>((set) => ({
  pending: null,
  set: (pending) => set({ pending }),
}));

/** Übergibt ein Workout an den Player und öffnet ihn. */
export function startWorkout(workout: ResolvedWorkout): void {
  useWorkoutLaunch.getState().set(workout);
  router.push('/player');
}
