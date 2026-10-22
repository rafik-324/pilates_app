import { create } from 'zustand';
import { getContent } from '@/data/content/loader';
import { getRepositories } from '@/data/init';
import { useProfile } from '@/state/profile';
import { createPlanService, type PlanService, type PlanView } from './service';

type PlanState = {
  personal: PlanView | null;
  challenge: PlanView | null;
  /** Lädt Pläne neu (erzeugt den persönlichen Plan beim ersten Aufruf, schließt Ruhetage ab). */
  refresh: () => void;
  clear: () => void;
};

export function getPlanService(): PlanService {
  const { exercises, workouts, challenges } = getContent();
  return createPlanService({ repos: getRepositories(), exercises, workouts, challenges });
}

export const usePlan = create<PlanState>((set) => ({
  personal: null,
  challenge: null,
  refresh: () => {
    const profile = useProfile.getState().profile;
    if (!profile) return;
    set(getPlanService().load(profile));
  },
  clear: () => set({ personal: null, challenge: null }),
}));
