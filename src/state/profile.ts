import { create } from 'zustand';
import type { ProfileRepository } from '@/data/repositories/profile';
import { defaultProfile, stripHealthDataWithoutConsent, type Profile } from '@/domain/profile';

type ProfileState = {
  profile: Profile | null;
  hydrated: boolean;
  hydrate: (repo: ProfileRepository) => void;
  /** Ersetzt das Profil vollständig (z. B. am Ende des Onboardings). */
  save: (profile: Profile) => void;
  update: (patch: Partial<Profile>) => void;
  /** Einwilligung widerrufen (/S100/): Körperdaten werden gelöscht. */
  revokeConsent: () => void;
  clear: () => void;
};

let repo: ProfileRepository | null = null;

export const useProfile = create<ProfileState>((set, get) => ({
  profile: null,
  hydrated: false,
  hydrate: (r) => {
    repo = r;
    set({ profile: r.get(), hydrated: true });
  },
  save: (profile) => {
    const stored = repo ? repo.save(profile) : stripHealthDataWithoutConsent(profile);
    set({ profile: stored });
  },
  update: (patch) => {
    const current = get().profile ?? defaultProfile();
    get().save({ ...current, ...patch });
  },
  revokeConsent: () => {
    repo?.clearHealthData();
    const current = get().profile;
    if (current) {
      set({
        profile: {
          ...current,
          groesseCm: null,
          gewichtKg: null,
          zielgewichtKg: null,
          einwilligungGesundheitsdaten: false,
          einwilligungAm: null,
        },
      });
    }
  },
  clear: () => {
    repo?.delete();
    set({ profile: null });
  },
}));
