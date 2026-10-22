import { addDays, type DateKey } from '../dates';
import type { DayState } from './types';

export type DayStatus = {
  tagNr: number;
  ruhetag: boolean;
  erledigt: boolean;
  erledigtAm: DateKey | null;
};

/**
 * Freischaltung (/F230/): Ein Tag ist freigeschaltet, sobald der vorherige erledigt ist.
 * Es gibt keine Sperre nach Kalendertag; mehrere Tage am selben Kalendertag sind erlaubt.
 */
export function dayStates(days: DayStatus[]): Map<number, DayState> {
  const result = new Map<number, DayState>();
  let currentSet = false;
  for (const d of [...days].sort((a, b) => a.tagNr - b.tagNr)) {
    if (d.erledigt) result.set(d.tagNr, 'erledigt');
    else if (!currentSet) {
      result.set(d.tagNr, 'aktuell');
      currentSet = true;
    } else result.set(d.tagNr, 'gesperrt');
  }
  return result;
}

/** Der aktuell freigeschaltete Tag, `null` wenn der Plan abgeschlossen ist. */
export function currentDay(days: DayStatus[]): DayStatus | null {
  const states = dayStates(days);
  return days.find((d) => states.get(d.tagNr) === 'aktuell') ?? null;
}

/**
 * Ruhetage (/F240/): Ein Ruhetag gilt als erledigt, wenn "Ruhetag abschließen" getippt wird oder automatisch beim
 * ersten App-Start an einem späteren Kalendertag als dem Abschluss des vorherigen Tages. Das Datum des Ruhetags ist
 * der Kalendertag nach dem vorherigen Abschluss, damit der Streak (/F830/) nicht unterbrochen wird.
 * Liefert die automatisch abzuschließenden Ruhetage in Reihenfolge.
 */
export function autoCompleteRestDays(
  days: DayStatus[],
  today: DateKey,
): { tagNr: number; datum: DateKey }[] {
  const sorted = [...days].sort((a, b) => a.tagNr - b.tagNr);
  const completed: { tagNr: number; datum: DateKey }[] = [];
  let prevDate: DateKey | null = null;
  for (const d of sorted) {
    if (d.erledigt) {
      prevDate = d.erledigtAm;
      continue;
    }
    if (!d.ruhetag || prevDate === null || prevDate >= today) break;
    const datum = addDays(prevDate, 1);
    completed.push({ tagNr: d.tagNr, datum });
    prevDate = datum;
  }
  return completed;
}
