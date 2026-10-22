import type { Repositories } from '@/data/repositories';
import type { SessionRecord } from '@/data/repositories/sessions';
import type { WeightEntry } from '@/data/repositories/weight';
import { bmi as calcBmi, bmiCategory, type BmiCategory } from '@/domain/bmi';
import { toDateKey, type DateKey } from '@/domain/dates';
import { totals, trainingDays, weightSeries, type Totals } from '@/domain/progress';
import type { Profile } from '@/domain/profile';
import { currentStreak, longestStreak } from '@/domain/streak';

export type ProgressData = {
  sessions: SessionRecord[];
  weights: WeightEntry[];
  totals: Totals;
  trainingDays: DateKey[];
  streak: number;
  bestStreak: number;
  bmi: { value: number; category: BmiCategory } | null;
  latestWeightKg: number | null;
};

/** Liest alle Daten des Fortschritt-Tabs (/F800/ bis /F860/). */
export function loadProgress(
  repos: Repositories,
  profile: Profile | null,
  now: Date = new Date(),
): ProgressData {
  const sessions = repos.sessions.list();
  const consent = !!profile?.einwilligungGesundheitsdaten;
  const weights = consent ? repos.weight.list() : [];
  const days = trainingDays(sessions);
  const rest = repos.plans.listCompletedRestDates();
  const series = weightSeries(weights);
  const latestWeightKg = consent
    ? (series[series.length - 1]?.gewichtKg ?? profile?.gewichtKg ?? null)
    : null;
  const bmiValue =
    consent && latestWeightKg && profile?.groesseCm
      ? calcBmi(latestWeightKg, profile.groesseCm)
      : null;
  const bmi = bmiValue === null ? null : { value: bmiValue, category: bmiCategory(bmiValue) };
  return {
    sessions,
    weights,
    totals: totals(sessions),
    trainingDays: days,
    streak: currentStreak(days, rest, toDateKey(now)),
    bestStreak: longestStreak(days, rest),
    bmi,
    latestWeightKg,
  };
}
