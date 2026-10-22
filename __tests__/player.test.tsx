import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import React from 'react';
import { getContent } from '@/data/content/loader';
import { createTestRepositories } from '@/data/testing/testDb';
import { defaultProfile } from '@/domain/profile';
import { PlayerScreen } from '@/features/player/PlayerScreen';
import { getPlayerService } from '@/features/player/store';
import { useWorkoutLaunch } from '@/features/workout/launch';
import { resolveWorkout } from '@/features/workout/resolve';
import '@/i18n';
import { useProfile } from '@/state/profile';
import { useSettings } from '@/state/settings';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-video', () => ({
  useVideoPlayer: () => ({ play: jest.fn(), pause: jest.fn() }),
  VideoView: () => null,
}));
jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  createAudioPlayer: () => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    loop: false,
    volume: 1,
  }),
}));
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

let mockRepos: Awaited<ReturnType<typeof createTestRepositories>>['repos'];
jest.mock('@/data/init', () => ({ getRepositories: () => mockRepos }));

/** Kurzes Testworkout: 2 Zeitübungen à 20 s, 1 Wiederholungsübung. */
function launch() {
  const w = resolveWorkout({ kind: 'library', id: 'beginner_first' }, [])!;
  const entries = [
    { uebung_id: 'ex01_breathing_standing', dauer_s: 20, reihenfolge: 1 },
    { uebung_id: 'ex02_shoulder_rolls', dauer_s: 20, reihenfolge: 2 },
  ];
  useWorkoutLaunch.getState().set({ ...w, entries });
  return { ...w, entries };
}

beforeEach(async () => {
  jest.useFakeTimers({ now: new Date('2026-10-22T08:00:00Z') });
  mockRepos = (await createTestRepositories()).repos;
  mockParams = {};
  useSettings.setState({ countdownS: 10, pauseS: 10, sprache: 'de', lautstaerkeStimme: 1 });
  useProfile.setState({ profile: { ...defaultProfile(), einwilligungGesundheitsdaten: false } });
  jest.clearAllMocks();
});

afterEach(() => jest.useRealTimers());

async function advance(ms: number) {
  for (let t = 0; t < ms; t += 200) {
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
  }
}

describe('Player', () => {
  it('/T030/: läuft ohne Eingriff durch, speichert die Session und öffnet den Abschluss', async () => {
    launch();
    await render(<PlayerScreen />);
    expect(screen.getByText("Gleich geht's los · als Nächstes")).toBeTruthy();
    // 10 Vorbereitung + 20 + 10 Pause + 20 = 60 s
    await advance(61_000);
    const sessions = mockRepos.sessions.list();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      abgeschlossen: true,
      uebungenErledigt: 2,
      uebungenGesamt: 2,
      dauerS: 60,
      kcalGeschaetzt: true,
    });
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/complete',
      params: { session: String(sessions[0].id) },
    });
    const said = (Speech.speak as jest.Mock).mock.calls.map((c) => c[0]);
    expect(said).toContain('Halbzeit.');
    expect(said[said.length - 1]).toBe('Geschafft! Workout abgeschlossen.');
    expect(getPlayerService().loadSnapshot()).toBeNull();
  });

  it('/T040/: Pause überspringen', async () => {
    launch();
    await render(<PlayerScreen />);
    await fireEvent.press(screen.getByText('Jetzt starten'));
    expect(screen.getByText('Übung 1 von 2')).toBeTruthy();
    await advance(20_200);
    expect(screen.getByText('Pause · als Nächstes')).toBeTruthy();
    await fireEvent.press(screen.getByText('Überspringen'));
    expect(screen.getByText('Übung 2 von 2')).toBeTruthy();
  });

  it('/F610/, /T070/: Abbruch speichert die Session und bietet Fortsetzen an', async () => {
    const w = launch();
    await render(<PlayerScreen />);
    await fireEvent.press(screen.getByText('Jetzt starten'));
    await advance(5_000);
    await fireEvent.press(screen.getByLabelText('Workout abbrechen'));
    await fireEvent.press(screen.getByText('Keine Zeit'));
    await fireEvent.press(screen.getByText('Workout beenden'));
    expect(router.back).toHaveBeenCalled();
    const [aborted] = mockRepos.sessions.list();
    expect(aborted).toMatchObject({ abgeschlossen: false, abbruchGrund: 'keine_zeit' });

    // "App-Neustart": Snapshot liegt in der DB
    const snap = getPlayerService().loadSnapshot();
    expect(snap?.workout.entries).toEqual(w.entries);
    expect(snap?.state.index).toBe(0);
    expect(snap?.sessionId).toBe(aborted.id);
  });

  it('setzt ein gespeichertes Workout fort und aktualisiert dieselbe Session', async () => {
    launch();
    const first = await render(<PlayerScreen />);
    await fireEvent.press(screen.getByText('Jetzt starten'));
    await advance(5_000);
    await fireEvent.press(screen.getByLabelText('Workout abbrechen'));
    await fireEvent.press(screen.getByText('Workout beenden'));
    await first.unmount();

    useWorkoutLaunch.getState().set(null);
    mockParams = { resume: '1' };
    await render(<PlayerScreen />);
    expect(screen.getByText('Übung 1 von 2')).toBeTruthy();
    expect(screen.getByText('0:15')).toBeTruthy();
    await advance(46_000);
    const sessions = mockRepos.sessions.list();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].abgeschlossen).toBe(true);
    expect(getPlayerService().loadSnapshot()).toBeNull();
  });

  it('markiert den Plantag als erledigt (/F750/)', async () => {
    const { exercises, workouts, challenges } = getContent();
    expect(exercises.length).toBe(50);
    const plan = mockRepos.plans.create({
      typ: 'challenge',
      challengeId: challenges[0].id,
      startdatum: '2026-10-22',
      days: [{ tagNr: 1, ruhetag: false, workoutId: workouts[0].id }],
    });
    const w = resolveWorkout({ kind: 'library', id: workouts[0].id }, [])!;
    useWorkoutLaunch.getState().set({
      ...w,
      ref: { kind: 'plan', planId: plan.id, tagNr: 1 },
      entries: [{ uebung_id: 'ex01_breathing_standing', dauer_s: 10, reihenfolge: 1 }],
    });
    await render(<PlayerScreen />);
    await advance(21_000);
    expect(mockRepos.plans.listDays(plan.id)[0].status).toBe('erledigt');
    expect(mockRepos.sessions.list()[0]).toMatchObject({ planId: plan.id, planTagNr: 1 });
  });
});
