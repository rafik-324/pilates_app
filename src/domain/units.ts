export type UnitSystem = 'metrisch' | 'imperial';

const LB_PER_KG = 2.2046226218;
const CM_PER_INCH = 2.54;

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalIn = Math.round(cm / CM_PER_INCH);
  return { ft: Math.floor(totalIn / 12), in: totalIn % 12 };
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * CM_PER_INCH * 10) / 10;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Gewicht für die Anzeige im gewählten Einheitensystem (eine Nachkommastelle). */
export function displayWeight(
  kg: number,
  system: UnitSystem,
): { value: number; unit: 'kg' | 'lb' } {
  return system === 'imperial'
    ? { value: round1(kgToLb(kg)), unit: 'lb' }
    : { value: round1(kg), unit: 'kg' };
}

/** Eingegebenes Gewicht in kg umrechnen. */
export function weightToKg(value: number, system: UnitSystem): number {
  return system === 'imperial' ? round1(lbToKg(value)) : value;
}
