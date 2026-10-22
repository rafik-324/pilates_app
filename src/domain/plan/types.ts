import type { Einschraenkung, Erfahrung, Zielzone } from '../profile';
import type { WorkoutEntry } from '../content';

export type GeneratorInput = {
  level: Erfahrung;
  zielzonen: Zielzone[];
  einschraenkungen: Einschraenkung[];
  trainingstageProWoche: number;
  /** Für deterministische Ergebnisse (Tests, "Plan neu generieren"). */
  seed: number;
  tage?: number;
};

export type GeneratedDay = {
  tagNr: number;
  ruhetag: boolean;
  uebungen: WorkoutEntry[];
  pauseS: number;
  geschaetzteDauerMin: number;
};

export type DayState = 'erledigt' | 'aktuell' | 'gesperrt';
