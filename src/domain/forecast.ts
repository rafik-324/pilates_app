import { bmi, bmiCategory, type BmiCategory } from './bmi';

/** Realistische Abnahme: höchstens ca. 0,5 kg pro Woche, nie mehr als 1 % des Körpergewichts. */
export const MAX_LOSS_KG_PER_WEEK = 0.5;

export type WeightForecast = {
  /** Nötige Gewichtsänderung in kg (negativ = Abnahme). */
  deltaKg: number;
  /** Geschätzte Wochen bis zum Ziel, 0 wenn kein Abnehmen nötig. */
  weeks: number;
  /** BMI beim Zielgewicht, wenn die Größe bekannt ist. */
  targetBmi: number | null;
  targetBmiCategory: BmiCategory | null;
  /** Zielgewicht liegt im Untergewicht: Hinweis anzeigen. */
  targetTooLow: boolean;
};

export function weightForecast(
  currentKg: number,
  targetKg: number,
  heightCm?: number | null,
): WeightForecast {
  const deltaKg = Math.round((targetKg - currentKg) * 10) / 10;
  const perWeek = Math.min(MAX_LOSS_KG_PER_WEEK, currentKg * 0.01);
  const weeks = deltaKg < 0 ? Math.ceil(Math.abs(deltaKg) / perWeek) : 0;
  const targetBmi = heightCm ? bmi(targetKg, heightCm) : null;
  const targetBmiCategory = targetBmi === null ? null : bmiCategory(targetBmi);
  return {
    deltaKg,
    weeks,
    targetBmi,
    targetBmiCategory,
    targetTooLow: targetBmiCategory === 'underweight',
  };
}
