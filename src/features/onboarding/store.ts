import { create } from 'zustand';
import { nextStep, type StepId } from '@/domain/onboarding';
import type {
  Einheitensystem,
  Einschraenkung,
  Erfahrung,
  Geschlecht,
  Ziel,
  Zielzone,
} from '@/domain/profile';

export type Answers = {
  ziel: Ziel | null;
  geschlecht: Geschlecht | null;
  geburtsjahr: number | null;
  gesundheitshinweisBestaetigt: boolean;
  einwilligungGesundheitsdaten: boolean;
  einheitensystem: Einheitensystem;
  groesseCm: number | null;
  gewichtKg: number | null;
  zielgewichtKg: number | null;
  level: Erfahrung;
  zielzonen: Zielzone[];
  einschraenkungen: Einschraenkung[];
  trainingstageProWoche: number;
  trainingUhrzeit: string | null;
};

export const initialAnswers: Answers = {
  ziel: null,
  geschlecht: null,
  geburtsjahr: null,
  gesundheitshinweisBestaetigt: false,
  einwilligungGesundheitsdaten: false,
  einheitensystem: 'metrisch',
  groesseCm: null,
  gewichtKg: null,
  zielgewichtKg: null,
  level: 1,
  zielzonen: [],
  einschraenkungen: [],
  trainingstageProWoche: 3,
  trainingUhrzeit: null,
};

type OnboardingState = {
  step: StepId;
  history: StepId[];
  answers: Answers;
  set: (patch: Partial<Answers>) => void;
  /** Wechselt zum nächsten Schritt gemäß der Navigationslogik. */
  next: () => void;
  back: () => void;
  reset: () => void;
};

/** Zwischenstand des Onboardings. Nur im Speicher: erst am Ende wird das Profil gespeichert (/T150/). */
export const useOnboarding = create<OnboardingState>((set, get) => ({
  step: 'welcome',
  history: [],
  answers: initialAnswers,
  set: (patch) => set((s) => ({ answers: { ...s.answers, ...patch } })),
  next: () => {
    const { step, answers, history } = get();
    const target = nextStep(step, answers);
    if (target && target !== 'done' && target !== step)
      set({ step: target, history: [...history, step] });
  },
  back: () => {
    const { history } = get();
    if (history.length === 0) return;
    set({ step: history[history.length - 1], history: history.slice(0, -1) });
  },
  reset: () => set({ step: 'welcome', history: [], answers: initialAnswers }),
}));
