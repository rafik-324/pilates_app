/** Datumshilfen auf Basis lokaler Kalendertage ("YYYY-MM-DD"), ohne Zeitzonen-Fallen. */

export type DateKey = string;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Anzahl Kalendertage von a nach b (b - a). */
export function diffDays(a: DateKey, b: DateKey): number {
  const utc = (key: DateKey) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/** Montag = 1 ... Sonntag = 7 */
export function isoWeekday(key: DateKey): number {
  const js = fromDateKey(key).getDay();
  return js === 0 ? 7 : js;
}

/** Montag der Woche, in der `key` liegt. */
export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -(isoWeekday(key) - 1));
}
