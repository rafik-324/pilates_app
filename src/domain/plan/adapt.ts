import type { Exercise, WorkoutEntry } from '../content';
import type { Einschraenkung, Erfahrung, FeedbackValue } from '../profile';
import { isAllowed } from './filter';
import { defaultEntry, scaleEntry } from './scale';
import type { GeneratedDay } from './types';

/** Anzahl der folgenden Trainingstage, auf die Feedback wirkt. */
export const ADAPT_DAYS = 3;
const EASIER = 0.9;
const HARDER = 1.1;

type Ctx = {
  exercises: Exercise[];
  level: Erfahrung;
  einschraenkungen: Einschraenkung[];
};

/**
 * Adaptive Anpassung (/F270/, Kapitel 10 Schritt 6): Feedback der letzten Session wirkt auf die nächsten Trainingstage.
 * - zu schwer: Steigerung aussetzen (Dauer / Wiederholungen -10 %) und leichtere Varianten verwenden
 * - zu leicht: Dauer / Wiederholungen +10 % und schwerere Varianten verwenden (höchstens ein Level über dem Profil)
 * - passend: keine Änderung
 * Rein funktional: liefert nur die geänderten Tage zurück.
 */
export function adaptUpcomingDays(
  days: GeneratedDay[],
  afterTagNr: number,
  feedback: FeedbackValue,
  ctx: Ctx,
): GeneratedDay[] {
  if (feedback === 'passend') return [];
  const byId = new Map(ctx.exercises.map((e) => [e.id, e]));
  const upcoming = days
    .filter((d) => d.tagNr > afterTagNr && !d.ruhetag && d.uebungen.length > 0)
    .sort((a, b) => a.tagNr - b.tagNr)
    .slice(0, ADAPT_DAYS);

  /** Tauscht eine Hauptübung gegen ihre leichtere / schwerere Variante und behält die bisherige Progression bei. */
  const swap = (entry: WorkoutEntry, ex: Exercise): WorkoutEntry => {
    const targetId = feedback === 'zu_schwer' ? ex.variante_leicht_id : ex.variante_schwer_id;
    const target = targetId ? byId.get(targetId) : undefined;
    if (!target || !isAllowed(target, ctx.einschraenkungen)) return entry;
    if (feedback === 'zu_leicht' && target.level > Math.min(3, ctx.level + 1)) return entry;
    const ratio =
      entry.dauer_s !== undefined
        ? entry.dauer_s / (ex.standard_dauer_s ?? entry.dauer_s)
        : (entry.wdh ?? 1) / (ex.standard_wdh ?? entry.wdh ?? 1);
    return defaultEntry(target, entry.reihenfolge, Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
  };

  return upcoming.map((d) => ({
    ...d,
    uebungen: d.uebungen.map((e) => {
      const ex = byId.get(e.uebung_id);
      if (!ex || ex.rolle !== 'haupt') return e;
      return scaleEntry(swap(e, ex), feedback === 'zu_schwer' ? EASIER : HARDER);
    }),
  }));
}
