import { addDays, fromDateKey, isoWeekday, startOfWeek, toDateKey, type DateKey } from './dates';

/** Fortschritt und Bericht (/F800/ bis /F880/), rein funktional. */

export type SessionLike = {
  start: string;
  ende?: string | null;
  dauerS: number;
  kcal: number;
  kcalGeschaetzt: boolean;
  abgeschlossen: boolean;
  titel?: string | null;
  uebungenErledigt?: number;
  feedback?: string | null;
};

export type Totals = { workouts: number; minutes: number; kcal: number; kcalEstimated: boolean };

/** Gesamtstatistik über abgeschlossene Sessions (/F800/). */
export function totals(sessions: SessionLike[]): Totals {
  const done = sessions.filter((s) => s.abgeschlossen);
  return {
    workouts: done.length,
    minutes: Math.round(done.reduce((sum, s) => sum + s.dauerS, 0) / 60),
    kcal: Math.round(done.reduce((sum, s) => sum + s.kcal, 0)),
    kcalEstimated: done.some((s) => s.kcalGeschaetzt),
  };
}

export function sessionDay(s: SessionLike): DateKey {
  return toDateKey(new Date(s.start));
}

/** Kalendertage mit mindestens einem abgeschlossenen Workout (/F820/). */
export function trainingDays(sessions: SessionLike[]): DateKey[] {
  return [...new Set(sessions.filter((s) => s.abgeschlossen).map(sessionDay))].sort();
}

/** Trainingsminuten je Wochentag (Montag bis Sonntag) der Woche ab `weekStart` (/F810/). */
export function weekMinutes(sessions: SessionLike[], weekStart: DateKey): number[] {
  const start = startOfWeek(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const minutes = days.map(() => 0);
  for (const s of sessions) {
    if (!s.abgeschlossen) continue;
    const i = days.indexOf(sessionDay(s));
    if (i >= 0) minutes[i] += s.dauerS / 60;
  }
  return minutes.map((m) => Math.round(m));
}

/** Monatsraster mit Wochen ab Montag; Tage außerhalb des Monats sind null. */
export function monthGrid(year: number, month: number): (DateKey | null)[][] {
  const first = toDateKey(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (DateKey | null)[] = Array.from({ length: isoWeekday(first) - 1 }, () => null);
  for (let d = 0; d < daysInMonth; d++) cells.push(addDays(first, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (DateKey | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function shiftMonth(year: number, month: number, delta: number): [number, number] {
  const d = new Date(year, month + delta, 1);
  return [d.getFullYear(), d.getMonth()];
}

export function dayOfMonth(key: DateKey): number {
  return fromDateKey(key).getDate();
}

/** Gewichtsverlauf: ein Wert je Tag (letzter Eintrag des Tages), chronologisch. */
export function weightSeries(
  entries: { datum: DateKey; gewichtKg: number }[],
): { datum: DateKey; gewichtKg: number }[] {
  const byDay = new Map<DateKey, number>();
  for (const e of [...entries].sort((a, b) => a.datum.localeCompare(b.datum)))
    byDay.set(e.datum, e.gewichtKg);
  return [...byDay.entries()].map(([datum, gewichtKg]) => ({ datum, gewichtKg }));
}

function csvField(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvLine(values: unknown[]): string {
  return values.map(csvField).join(';');
}

/**
 * CSV-Export (/F880/): Abschnitt Sessions und, falls vorhanden, Abschnitt Gewicht.
 * Semikolon als Trenner (Excel in DE), Dezimalpunkt, Datum ISO.
 */
export function buildCsv(
  sessions: SessionLike[],
  weights: { datum: DateKey; gewichtKg: number }[],
): string {
  const lines = [
    csvLine([
      'start',
      'ende',
      'workout',
      'dauer_s',
      'kcal',
      'kcal_geschaetzt',
      'abgeschlossen',
      'uebungen_erledigt',
      'feedback',
    ]),
  ];
  for (const s of [...sessions].sort((a, b) => a.start.localeCompare(b.start))) {
    lines.push(
      csvLine([
        s.start,
        s.ende ?? '',
        s.titel ?? '',
        s.dauerS,
        Math.round(s.kcal),
        s.kcalGeschaetzt ? 1 : 0,
        s.abgeschlossen ? 1 : 0,
        s.uebungenErledigt ?? '',
        s.feedback ?? '',
      ]),
    );
  }
  if (weights.length > 0) {
    lines.push('', csvLine(['datum', 'gewicht_kg']));
    for (const w of weightSeries(weights)) lines.push(csvLine([w.datum, w.gewichtKg]));
  }
  return lines.join('\n') + '\n';
}

/** Gewichtseingabe ("64,5" oder "64.5") in kg; null bei ungültiger Eingabe. */
export function parseWeightInput(text: string, toKg: (v: number) => number): number | null {
  const v = Number(text.trim().replace(',', '.'));
  if (!Number.isFinite(v) || v <= 0) return null;
  const kg = toKg(v);
  return kg >= 20 && kg <= 400 ? Math.round(kg * 10) / 10 : null;
}
