import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { getContent } from '@/data/content/loader';
import { createTestRepositories } from '@/data/testing/testDb';
import type { NewSession } from '@/data/repositories/sessions';
import { toDateKey, addDays } from '@/domain/dates';
import { defaultProfile, type Profile } from '@/domain/profile';
import { createPlanService } from '@/features/plan/service';
import { CompleteScreen } from '@/features/player/CompleteScreen';
import { ProgressScreen } from '@/features/progress/ProgressScreen';
import { loadProgress } from '@/features/progress/service';
import '@/i18n';
import { useProfile } from '@/state/profile';
import { useSettings } from '@/state/settings';
import { ThemeProvider } from '@/ui/theme';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
const mockWrite = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: jest.fn().mockImplementation((_dir: string, name: string) => ({
    uri: `file:///cache/${name}`,
    exists: false,
    create: jest.fn(),
    delete: jest.fn(),
    write: mockWrite,
  })),
}));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn().mockResolvedValue(undefined) }));
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  return {
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]),
  };
});

let mockRepos: Awaited<ReturnType<typeof createTestRepositories>>['repos'];
jest.mock('@/data/init', () => ({ getRepositories: () => mockRepos }));

const today = toDateKey(new Date());

function session(day: string, patch: Partial<NewSession> = {}): NewSession {
  return {
    workoutId: 'beginner_first',
    titel: 'Erstes Pilates-Workout',
    planId: null,
    planTagNr: null,
    start: new Date(`${day}T08:00:00`).toISOString(),
    ende: new Date(`${day}T08:10:00`).toISOString(),
    dauerS: 600,
    kcal: 30,
    kcalGeschaetzt: false,
    abgeschlossen: true,
    uebungenErledigt: 10,
    uebungenGesamt: 10,
    feedback: null,
    abbruchGrund: null,
    ...patch,
  };
}

function setProfile(p: Partial<Profile>) {
  // Profil-Store an die Test-DB binden, damit update() persistiert
  useProfile.getState().hydrate(mockRepos.profile);
  useProfile.getState().save({ ...defaultProfile(), ...p });
}

const wrap = (node: React.ReactElement) => render(<ThemeProvider>{node}</ThemeProvider>);

beforeEach(async () => {
  mockRepos = (await createTestRepositories()).repos;
  useSettings.getState().setLanguage('de');
  mockParams = {};
  jest.clearAllMocks();
});

describe('Abschluss', () => {
  it('zeigt Kennzahlen und speichert Feedback, wendet es auf den Plan an (/F720/, /F270/)', async () => {
    setProfile({ level: 2, zielzonen: ['bauch'], einwilligungGesundheitsdaten: false });
    const { exercises, workouts, challenges } = getContent();
    const plans = createPlanService({ repos: mockRepos, exercises, workouts, challenges });
    const plan = plans.ensurePersonalPlan(useProfile.getState().profile!);
    plans.completeDay(plan.id, 1);
    const before = JSON.stringify(mockRepos.plans.listDays(plan.id).map((d) => d.uebungen));
    const s = mockRepos.sessions.add(
      session(today, { planId: plan.id, planTagNr: 1, kcalGeschaetzt: true }),
    );
    mockParams = { session: String(s.id) };

    await wrap(<CompleteScreen />);
    expect(screen.getByText('Workout geschafft!')).toBeTruthy();
    expect(screen.getByText('10:00')).toBeTruthy();
    expect(screen.getByText('~30')).toBeTruthy();
    expect(screen.getByText('Tage Streak')).toBeTruthy();
    // ohne Einwilligung keine Gewichtseingabe
    expect(screen.queryByText('Gewicht eintragen (optional)')).toBeNull();

    await fireEvent.press(screen.getByText('Zu schwer'));
    expect(mockRepos.sessions.get(s.id)?.feedback).toBe('zu_schwer');
    const after = JSON.stringify(mockRepos.plans.listDays(plan.id).map((d) => d.uebungen));
    expect(after).not.toBe(before);
    expect(screen.getByText('Die nächsten Trainingstage werden etwas leichter.')).toBeTruthy();
  });

  it('Gewicht eintragen nur mit Einwilligung (/F730/)', async () => {
    setProfile({ einwilligungGesundheitsdaten: true, gewichtKg: 70, groesseCm: 170 });
    const s = mockRepos.sessions.add(session(today));
    mockParams = { session: String(s.id) };
    await wrap(<CompleteScreen />);
    await fireEvent.changeText(screen.getByLabelText('Aktuelles Gewicht'), '68,5');
    await fireEvent.press(screen.getByText('Speichern'));
    expect(screen.getByText('Gewicht gespeichert.')).toBeTruthy();
    expect(mockRepos.weight.list()).toEqual([
      expect.objectContaining({ datum: today, gewichtKg: 68.5 }),
    ]);
    expect(useProfile.getState().profile?.gewichtKg).toBe(68.5);
  });
});

describe('Fortschritt-Tab', () => {
  it('Statistik, Streak, Historie und CSV-Export (/F800/ bis /F880/)', async () => {
    setProfile({ einwilligungGesundheitsdaten: false });
    mockRepos.sessions.add(session(addDays(today, -1)));
    mockRepos.sessions.add(session(today, { dauerS: 1200, kcal: 60 }));
    mockRepos.sessions.add(session(today, { abgeschlossen: false, abbruchGrund: 'keine_zeit' }));
    await wrap(<ProgressScreen />);
    expect(screen.getByLabelText('Workouts: 2')).toBeTruthy();
    expect(screen.getByLabelText('Minuten: 30')).toBeTruthy();
    expect(screen.getByLabelText('kcal: 90')).toBeTruthy();
    expect(screen.getByLabelText('Tage Streak: 2')).toBeTruthy();
    expect(screen.getAllByText('Erstes Pilates-Workout')).toHaveLength(3);
    expect(screen.getByText(/abgebrochen/)).toBeTruthy();
    expect(screen.getByText(/Gewicht und BMI sind nur mit Einwilligung/)).toBeTruthy();

    await fireEvent.press(screen.getByText('Daten als CSV exportieren'));
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('start;ende;workout'));
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      expect.stringMatching(/pilates-export-.*\.csv$/),
      expect.objectContaining({ mimeType: 'text/csv' }),
    );
  });

  it('/T110/: Gewicht eintragen aktualisiert Diagramm und BMI', async () => {
    setProfile({ einwilligungGesundheitsdaten: true, gewichtKg: 70, groesseCm: 170 });
    await wrap(<ProgressScreen />);
    expect(screen.getByText('24,2 · Normalgewicht')).toBeTruthy();
    await fireEvent.press(screen.getByText('Gewicht hinzufügen'));
    await fireEvent.changeText(screen.getByLabelText('Aktuelles Gewicht'), '80');
    await fireEvent.press(screen.getByText('Speichern'));
    expect(screen.getAllByText('80 kg')).toHaveLength(2);
    expect(screen.getByText('27,7 · Übergewicht')).toBeTruthy();
    expect(screen.getByLabelText(/Gewichtsverlauf: 80 kg/)).toBeTruthy();

    // bearbeiten und löschen
    await fireEvent.press(screen.getAllByText('80 kg')[1]);
    await fireEvent.changeText(screen.getByLabelText('Aktuelles Gewicht'), '79');
    await fireEvent.press(screen.getByText('Speichern'));
    expect(mockRepos.weight.list()[0].gewichtKg).toBe(79);
    await fireEvent.press(screen.getAllByText('79 kg')[1]);
    await fireEvent.press(screen.getByText('Löschen'));
    await fireEvent.press(screen.getAllByText('Löschen')[1]);
    expect(mockRepos.weight.list()).toEqual([]);
  });
});

describe('Streak über Ruhetage (/T180/)', () => {
  it('ein erledigter Ruhetag verbindet zwei Trainingstage', async () => {
    setProfile({});
    const plan = mockRepos.plans.create({
      typ: 'persoenlich',
      startdatum: addDays(today, -2),
      days: [
        { tagNr: 1, ruhetag: false },
        { tagNr: 2, ruhetag: true },
        { tagNr: 3, ruhetag: false },
      ],
    });
    mockRepos.plans.markDayDone(plan.id, 2, addDays(today, -1));
    mockRepos.sessions.add(session(addDays(today, -2)));
    mockRepos.sessions.add(session(today));
    const data = loadProgress(mockRepos, useProfile.getState().profile);
    expect(data.streak).toBe(2);
    expect(data.bestStreak).toBe(2);
  });
});
