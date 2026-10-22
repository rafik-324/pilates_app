import { create } from 'zustand';
import { getRepositories } from '@/data/init';
import type { FavoriteType } from '@/data/repositories/favorites';

const PREMIUM_FREE_KEY = 'dev.premiumFree';

type LibraryState = {
  loaded: boolean;
  favoriteWorkouts: ReadonlySet<string>;
  favoriteExercises: ReadonlySet<string>;
  /** Stufe 1: Premium-Inhalte nutzbar (Entwicklerschalter, Standard an). */
  premiumFree: boolean;
  load: () => void;
  toggleFavorite: (type: FavoriteType, id: string) => void;
  setPremiumFree: (value: boolean) => void;
  clear: () => void;
};

/** Favoriten (/F340/) und Premium-Schalter (/F360/), persistiert über Repositories. */
export const useLibrary = create<LibraryState>((set, get) => ({
  loaded: false,
  favoriteWorkouts: new Set(),
  favoriteExercises: new Set(),
  premiumFree: true,
  load: () => {
    const repos = getRepositories();
    set({
      loaded: true,
      favoriteWorkouts: new Set(repos.favorites.list('workout')),
      favoriteExercises: new Set(repos.favorites.list('exercise')),
      premiumFree: repos.kv.get(PREMIUM_FREE_KEY) !== 'false',
    });
  },
  toggleFavorite: (type, id) => {
    const on = getRepositories().favorites.toggle(type, id);
    const key = type === 'workout' ? 'favoriteWorkouts' : 'favoriteExercises';
    const next = new Set(get()[key]);
    if (on) next.add(id);
    else next.delete(id);
    set({ [key]: next } as Partial<LibraryState>);
  },
  setPremiumFree: (value) => {
    getRepositories().kv.set(PREMIUM_FREE_KEY, String(value));
    set({ premiumFree: value });
  },
  clear: () =>
    set({
      loaded: false,
      favoriteWorkouts: new Set(),
      favoriteExercises: new Set(),
      premiumFree: true,
    }),
}));

/** Lädt die Bibliotheksdaten beim ersten Zugriff. */
export function ensureLibraryLoaded(): void {
  if (!useLibrary.getState().loaded) useLibrary.getState().load();
}
