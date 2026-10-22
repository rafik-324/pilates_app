import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { createTestRepositories } from '@/data/testing/testDb';
import { PlanScreen } from '@/features/plan/PlanScreen';
import { usePlan } from '@/features/plan/store';
import '@/i18n';
import { defaultProfile } from '@/domain/profile';
import { useProfile } from '@/state/profile';
import { useSettings } from '@/state/settings';
import { ThemeProvider } from '@/ui/theme';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  return {
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
    useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]),
    useLocalSearchParams: () => ({}),
    Stack: { Screen: () => null },
  };
});

let mockRepos: Awaited<ReturnType<typeof createTestRepositories>>['repos'];
jest.mock('@/data/init', () => ({ getRepositories: () => mockRepos }));

beforeEach(async () => {
  mockRepos = (await createTestRepositories()).repos;
  useSettings.getState().setLanguage('de');
  usePlan.getState().clear();
  useProfile.setState({
    profile: { ...defaultProfile(), level: 1, zielzonen: ['bauch'], trainingstageProWoche: 3 },
  });
  jest.clearAllMocks();
});

async function renderPlan() {
  await render(
    <ThemeProvider>
      <PlanScreen />
    </ThemeProvider>,
  );
}

describe('Plan-Tab', () => {
  it('zeigt nach dem Onboarding Tag 1, Raster mit 30 Tagen und Challenges', async () => {
    await renderPlan();
    expect(await screen.findByText('Tag 1')).toBeTruthy();
    expect(screen.getByText('0 von 30 Tagen erledigt')).toBeTruthy();
    expect(screen.getByText('Wall Pilates 28 Tage')).toBeTruthy();
    expect(screen.getByText('Bauch 14 Tage')).toBeTruthy();
    expect(screen.getByLabelText('Tag 30, gesperrt')).toBeTruthy();
    expect(screen.getByLabelText('Tag 4, Ruhetag')).toBeTruthy();
  });

  it('Start öffnet die Workout-Details des Plantags', async () => {
    await renderPlan();
    await fireEvent.press(await screen.findByText('Start'));
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/workout',
        params: expect.objectContaining({ kind: 'plan', tag: '1' }),
      }),
    );
  });

  it('startet eine Challenge und zeigt sie als Auswahl neben dem persönlichen Plan (/F260/)', async () => {
    await renderPlan();
    await screen.findByText('Tag 1');
    const buttons = screen.getAllByText('Starten');
    await fireEvent.press(buttons[0]);
    expect(await screen.findByText('Aktiv')).toBeTruthy();
    expect(screen.getByText('Mein Plan')).toBeTruthy();
    expect(screen.getByText('0 von 28 Tagen erledigt')).toBeTruthy();
  });

  it('Plan zurücksetzen verlangt eine Bestätigung (/F250/)', async () => {
    await renderPlan();
    await screen.findByText('Tag 1');
    const firstPlanId = mockRepos.plans.getActive('persoenlich')!.id;
    await fireEvent.press(screen.getByText('Plan zurücksetzen'));
    expect(screen.getByText('Plan neu generieren?')).toBeTruthy();
    expect(mockRepos.plans.getActive('persoenlich')!.id).toBe(firstPlanId);
    await fireEvent.press(screen.getByText('Neu generieren'));
    expect(mockRepos.plans.getActive('persoenlich')!.id).not.toBe(firstPlanId);
  });
});
