import { getRepositories } from '@/data/init';
import { useOnboarding } from '@/features/onboarding/store';
import { usePlan } from '@/features/plan/store';
import { useProfile } from '@/state/profile';
import { useSettings } from '@/state/settings';

/** Löscht alle lokalen Nutzerdaten und setzt die Stores zurück (/F1150/). Die App startet danach im Onboarding. */
export function deleteAllLocalData(): void {
  getRepositories().deleteAllData();
  useProfile.setState({ profile: null });
  useSettings.getState().reset();
  usePlan.getState().clear();
  useOnboarding.getState().reset();
}
