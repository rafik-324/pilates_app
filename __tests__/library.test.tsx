import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { createTestRepositories } from '@/data/testing/testDb';
import { DiscoverScreen } from '@/features/library/DiscoverScreen';
import { ExerciseDetailScreen } from '@/features/library/ExerciseDetailScreen';
import { useLibrary } from '@/features/library/store';
import { WorkoutDetailScreen } from '@/features/workout/WorkoutDetailScreen';
import { useWorkoutLaunch } from '@/features/workout/launch';
import '@/i18n';
import { useSettings } from '@/state/settings';
import { ThemeProvider } from '@/ui/theme';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-video', () => ({
  useVideoPlayer: () => ({ play: jest.fn(), pause: jest.fn() }),
  VideoView: () => null,
}));
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => undefined,
  Stack: { Screen: () => null },
}));

let mockRepos: Awaited<ReturnType<typeof createTestRepositories>>['repos'];
jest.mock('@/data/init', () => ({ getRepositories: () => mockRepos }));

beforeEach(async () => {
  mockRepos = (await createTestRepositories()).repos;
  useSettings.getState().setLanguage('de');
  useLibrary.getState().clear();
  mockParams = {};
  jest.clearAllMocks();
});

const wrap = (node: React.ReactElement) => render(<ThemeProvider>{node}</ThemeProvider>);

describe('Entdecken', () => {
  it('/T130/: Suche "Brücke" zeigt passende Übungen', async () => {
    await wrap(<DiscoverScreen />);
    await fireEvent.changeText(screen.getByLabelText('Suche'), 'Brücke');
    expect(screen.getByText(/^Übungen \(\d+\)$/)).toBeTruthy();
    expect(screen.getAllByText(/Brücke/).length).toBeGreaterThan(0);
  });

  it('Filter "Ohne Boden" listet nur Workouts ohne Bodenübungen', async () => {
    await wrap(<DiscoverScreen />);
    await fireEvent.press(screen.getByText('Ohne Boden'));
    expect(screen.getByText(/^Workouts \(\d+\)$/)).toBeTruthy();
    expect(screen.queryByText('Bauch Basics')).toBeNull();
    await fireEvent.press(screen.getByText('Suche und Filter zurücksetzen'));
    expect(screen.getByText('Erstes Pilates-Workout')).toBeTruthy();
  });

  it('öffnet Übungsdetails aus den Suchergebnissen', async () => {
    await wrap(<DiscoverScreen />);
    await fireEvent.changeText(screen.getByLabelText('Suche'), 'wall plank');
    await fireEvent.press(screen.getByText('Schrägstütz an der Wand'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/exercise',
      params: { id: 'ex40_wall_plank' },
    });
  });
});

describe('Übungsdetail', () => {
  it('zeigt Schritte, Atmung, Fehler, Fokus und Varianten; Favorit wird gespeichert', async () => {
    mockParams = { id: 'ex21_bridge' };
    await wrap(<ExerciseDetailScreen />);
    expect(screen.getByText('Ausführung')).toBeTruthy();
    expect(screen.getByText('Atmung')).toBeTruthy();
    expect(screen.getByText('Häufige Fehler')).toBeTruthy();
    expect(screen.getByText('Fokusbereiche')).toBeTruthy();
    expect(screen.getByText('Schwerere Variante')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Zu Favoriten hinzufügen'));
    expect(mockRepos.favorites.list('exercise')).toEqual(['ex21_bridge']);
  });
});

describe('Workout-Detail', () => {
  it('passt Wiederholungen vor dem Start an und übergibt sie dem Player (/F440/)', async () => {
    mockParams = { kind: 'library', id: 'beginner_first' };
    await wrap(<WorkoutDetailScreen />);
    await fireEvent.press(screen.getByText('Anpassen'));
    const plus = screen.getAllByLabelText(/ mehr$/);
    await fireEvent.press(plus[0]);
    await fireEvent.press(screen.getByText('Workout starten'));
    const pending = useWorkoutLaunch.getState().pending;
    expect(pending?.entries[0]).toEqual({
      uebung_id: 'ex01_breathing_standing',
      dauer_s: 35,
      reihenfolge: 1,
    });
    expect(router.push).toHaveBeenCalledWith('/player');
  });

  it('Favorit für Bibliotheks-Workouts', async () => {
    mockParams = { kind: 'library', id: 'beginner_first' };
    await wrap(<WorkoutDetailScreen />);
    await fireEvent.press(screen.getByLabelText('Zu Favoriten hinzufügen'));
    expect(mockRepos.favorites.list('workout')).toEqual(['beginner_first']);
  });
});
