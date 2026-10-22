import { create } from 'zustand';

export type SchemePref = 'system' | 'light' | 'dark';
export type LanguagePref = 'system' | 'de' | 'en';

type PrefsState = {
  scheme: SchemePref;
  language: LanguagePref;
  setScheme: (s: SchemePref) => void;
  setLanguage: (l: LanguagePref) => void;
};

/** Darstellungs-Einstellungen. In Phase 2 wird der Store über die DB persistiert. */
export const usePrefs = create<PrefsState>((set) => ({
  scheme: 'system',
  language: 'system',
  setScheme: (scheme) => set({ scheme }),
  setLanguage: (language) => set({ language }),
}));
