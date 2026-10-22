import { render, screen } from '@testing-library/react-native';
import React from 'react';
import DiscoverScreen from '../app/(tabs)/discover';
import ProfileScreen from '../app/(tabs)/profile';
import ThemePreviewScreen from '../app/dev/theme-preview';
import '@/i18n';
import { usePrefs } from '@/state/prefs';
import { ThemeProvider } from '@/ui/theme';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}));

function wrap(node: React.ReactElement) {
  return render(<ThemeProvider>{node}</ThemeProvider>);
}

describe('Smoke', () => {
  beforeAll(() => usePrefs.getState().setLanguage('de'));

  it('rendert den Profil-Tab', async () => {
    await wrap(<ProfileScreen />);
    expect(screen.getAllByText(/Profil|Profile/).length).toBeGreaterThan(0);
  });

  it('rendert Entdecken mit allen Workouts', async () => {
    await wrap(<DiscoverScreen />);
    expect(screen.getAllByText(/Wall Pilates/).length).toBeGreaterThan(0);
    expect(screen.getByText('Erstes Pilates-Workout')).toBeTruthy();
  });

  it('rendert die Theme-Vorschau mit allen Komponenten', async () => {
    await wrap(<ThemePreviewScreen />);
    expect(screen.getAllByText('Display').length).toBeGreaterThan(0);
  });
});
