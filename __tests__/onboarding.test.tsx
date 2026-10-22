import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { router } from 'expo-router';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useOnboarding } from '@/features/onboarding/store';
import '@/i18n';
import { useProfile } from '@/state/profile';
import { useSettings } from '@/state/settings';
import { ThemeProvider } from '@/ui/theme';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
}));

async function press(label: string) {
  await fireEvent.press(screen.getByText(label));
}

async function renderOnboarding() {
  await render(
    <ThemeProvider>
      <OnboardingScreen />
    </ThemeProvider>,
  );
}

async function untilBirthYear(year: string) {
  await press("Los geht's");
  await press('Abnehmen');
  await press('Weiter');
  await press('Weiblich');
  await press('Weiter');
  await fireEvent.changeText(screen.getByLabelText('Geburtsjahr'), year);
  await press('Weiter');
}

beforeEach(() => {
  useSettings.getState().setLanguage('de');
  useOnboarding.getState().reset();
  useProfile.setState({ profile: null });
  jest.clearAllMocks();
});

describe('Onboarding in der UI', () => {
  it('Durchlauf mit Einwilligung speichert Profil inkl. Körperdaten (/T010/)', async () => {
    await renderOnboarding();
    await untilBirthYear('1990');
    await press('Ich habe den Hinweis gelesen und verstanden.');
    await press('Weiter');
    await press('Ich willige ein');
    await fireEvent.changeText(screen.getByLabelText('Größe'), '170');
    await fireEvent.changeText(screen.getByLabelText('Gewicht'), '70');
    await fireEvent.changeText(screen.getByLabelText('Zielgewicht'), '65');
    await press('Weiter');
    await press('Etwas');
    await press('Weiter');
    await press('Bauch');
    await press('Weiter');
    await press('Knie');
    await press('Weiter');
    await press('4');
    await press('Abends (18:00)');
    await press('Weiter');
    expect(screen.getByText(/Dein BMI/)).toBeTruthy();
    await press('Weiter');
    await press('Später');

    const p = useProfile.getState().profile!;
    expect(p).toMatchObject({
      ziel: 'abnehmen',
      geburtsjahr: 1990,
      gewichtKg: 70,
      groesseCm: 170,
      zielgewichtKg: 65,
      level: 2,
      zielzonen: ['bauch'],
      einschraenkungen: ['knie'],
      trainingstageProWoche: 4,
      trainingUhrzeit: '18:00',
      einwilligungGesundheitsdaten: true,
    });
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('ohne Einwilligung keine Körperdaten-Abfrage, Plan wird trotzdem angelegt (/T160/)', async () => {
    await renderOnboarding();
    await untilBirthYear('1990');
    await press('Ich habe den Hinweis gelesen und verstanden.');
    await press('Weiter');
    await press('Ohne Körperdaten fortfahren');
    expect(screen.queryByText('Deine Körperdaten')).toBeNull();
    expect(screen.getByText('Wie viel Pilates-Erfahrung hast du?')).toBeTruthy();
    await press('Weiter');
    await press('Po');
    await press('Weiter');
    await press('Weiter');
    await press('Weiter');
    expect(screen.getByText(/ohne Körperdaten zeigen wir keine Gewichtsprognose/i)).toBeTruthy();
    await press('Weiter');
    await press('Später');
    const p = useProfile.getState().profile!;
    expect(p.gewichtKg).toBeNull();
    expect(p.einwilligungGesundheitsdaten).toBe(false);
    expect(p.zielzonen).toEqual(['po']);
  });

  it('unter 16: Hinweis, kein Profil gespeichert (/T150/)', async () => {
    await renderOnboarding();
    await untilBirthYear(String(new Date().getFullYear() - 12));
    expect(screen.getByText('Leider noch nicht')).toBeTruthy();
    expect(useProfile.getState().profile).toBeNull();
    // Korrektur führt zurück zum Geburtsjahr
    await press('Eingabe korrigieren');
    expect(screen.getByText('In welchem Jahr bist du geboren?')).toBeTruthy();
  });

  it('Schwangerschaft zeigt den zusätzlichen Arzthinweis (/F070/)', async () => {
    await renderOnboarding();
    await untilBirthYear('1990');
    await press('Ich habe den Hinweis gelesen und verstanden.');
    await press('Weiter');
    await press('Ohne Körperdaten fortfahren');
    await press('Weiter');
    await press('Po');
    await press('Weiter');
    await press('Schwanger / kürzlich entbunden');
    await press('Weiter');
    expect(screen.getByText('Schwangerschaft')).toBeTruthy();
  });
});
