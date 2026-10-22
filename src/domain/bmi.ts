export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export function bmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** Einordnung nach WHO für Erwachsene. */
export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal';
  if (value < 30) return 'overweight';
  return 'obese';
}
