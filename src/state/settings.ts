import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  type Settings,
  type SettingsRepository,
} from '@/data/repositories/settings';

export type SchemePref = Settings['schema'];
export type LanguagePref = Settings['sprache'];

type SettingsState = Settings & {
  hydrated: boolean;
  /** Lädt die gespeicherten Einstellungen und aktiviert das Schreiben in die DB. */
  hydrate: (repo: SettingsRepository) => void;
  update: (patch: Partial<Settings>) => void;
  setScheme: (s: SchemePref) => void;
  setLanguage: (l: LanguagePref) => void;
  /** Auf Standardwerte zurücksetzen (nach Datenlöschung). */
  reset: () => void;
};

let repo: SettingsRepository | null = null;

/** Einstellungen (/D090/) inkl. Farbschema und Sprache; Änderungen werden in der DB persistiert. */
export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: (r) => {
    repo = r;
    set({ ...r.get(), hydrated: true });
  },
  update: (patch) => {
    set(patch);
    repo?.save(patch);
  },
  setScheme: (schema) => get().update({ schema }),
  setLanguage: (sprache) => get().update({ sprache }),
  reset: () => set({ ...DEFAULT_SETTINGS }),
}));
