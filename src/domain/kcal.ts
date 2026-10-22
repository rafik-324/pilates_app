/** Kalorienberechnung: kcal = MET x Gewicht (kg) x Dauer (h). */

export const DEFAULT_WEIGHT_KG = 65;

export type KcalResult = {
  kcal: number;
  /** true, wenn das Standardgewicht verwendet wurde (keine Gewichtsangabe / Einwilligung). */
  estimated: boolean;
};

export function kcalFor(met: number, durationS: number, weightKg?: number | null): KcalResult {
  const hasWeight = typeof weightKg === 'number' && weightKg > 0;
  const weight = hasWeight ? weightKg : DEFAULT_WEIGHT_KG;
  return { kcal: Math.round(met * weight * (durationS / 3600)), estimated: !hasWeight };
}

/** Summe über mehrere Abschnitte mit jeweils eigenem MET (z. B. Übungen eines Workouts). */
export function kcalForSegments(
  segments: { met: number; durationS: number }[],
  weightKg?: number | null,
): KcalResult {
  const hasWeight = typeof weightKg === 'number' && weightKg > 0;
  const weight = hasWeight ? weightKg : DEFAULT_WEIGHT_KG;
  const total = segments.reduce((sum, s) => sum + s.met * weight * (s.durationS / 3600), 0);
  return { kcal: Math.round(total), estimated: !hasWeight };
}
