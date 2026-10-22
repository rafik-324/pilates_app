import { createTestRepositories } from '@/data/testing/testDb';
import { defaultProfile } from '@/domain/profile';
import { useProfile } from '../profile';
import { useSettings } from '../settings';

describe('Stores persistieren über die DB', () => {
  it('Einstellungen: hydrate lädt, update schreibt', async () => {
    const { repos, close } = await createTestRepositories();
    repos.settings.save({ countdownS: 3 });
    useSettings.getState().hydrate(repos.settings);
    expect(useSettings.getState().countdownS).toBe(3);
    useSettings.getState().setScheme('dark');
    expect(repos.settings.get().schema).toBe('dark');
    close();
  });

  it('Profil: save, update, Widerruf der Einwilligung', async () => {
    const { repos, close } = await createTestRepositories();
    useProfile.getState().hydrate(repos.profile);
    expect(useProfile.getState().profile).toBeNull();
    useProfile.getState().save({
      ...defaultProfile(),
      gewichtKg: 70,
      groesseCm: 170,
      einwilligungGesundheitsdaten: true,
    });
    expect(repos.profile.get()!.gewichtKg).toBe(70);
    useProfile.getState().revokeConsent();
    expect(useProfile.getState().profile!.gewichtKg).toBeNull();
    expect(repos.profile.get()!.gewichtKg).toBeNull();
    useProfile.getState().update({ gewichtKg: 71 }); // ohne Einwilligung nicht speicherbar
    expect(repos.profile.get()!.gewichtKg).toBeNull();
    useProfile.getState().clear();
    expect(repos.profile.get()).toBeNull();
    close();
  });
});
