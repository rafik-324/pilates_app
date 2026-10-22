import type { Exercise, WorkoutEntry } from '../content';
import type { Zielzone } from '../profile';
import { filterExercises } from './filter';
import { createRng, weightedSample } from './random';
import { defaultEntry, entriesSeconds } from './scale';
import type { GeneratedDay, GeneratorInput } from './types';

export const PLAN_DAYS = 30;
export const PAUSE_S = 10;
/** Progression: alle PROGRESSION_EVERY_DAYS Tage ca. 10 % mehr Dauer bzw. Wiederholungen (Kapitel 10, Schritt 4). */
export const PROGRESSION_EVERY_DAYS = 6;
export const PROGRESSION_STEP = 1.1;
const MAIN_PER_ROUND: Record<1 | 2 | 3, number> = { 1: 4, 2: 5, 3: 6 };
const ROUNDS = 2;

export function progressionFactor(tagNr: number): number {
  return Math.pow(PROGRESSION_STEP, Math.floor((tagNr - 1) / PROGRESSION_EVERY_DAYS));
}

/** Jeder n-te Tag ist ein Ruhetag; abhängig von den gewünschten Trainingstagen pro Woche (Standard: jeder 4. Tag). */
export function restEvery(trainingstageProWoche: number): number {
  if (trainingstageProWoche <= 2) return 3;
  if (trainingstageProWoche <= 4) return 4;
  return 5;
}

export function isRestDay(tagNr: number, tage: number, trainingstageProWoche: number): boolean {
  if (tagNr === tage) return false; // der Plan endet mit einem Trainingstag
  return tagNr % restEvery(trainingstageProWoche) === 0;
}

function zoneWeight(ex: Exercise, zones: Zielzone[]): number {
  if (zones.length === 0 || zones.includes('ganzkoerper')) return 2;
  const hit = ex.zielzonen.some(
    (z) => (z as string) !== 'ruecken' && zones.includes(z as Zielzone),
  );
  return hit ? 4 : 1;
}

/** Stehende Übungen zuerst, danach Bodenübungen: weniger Auf und Ab. */
function orderByPosition(list: Exercise[]): Exercise[] {
  return [...list].sort((a, b) => Number(a.boden) - Number(b.boden));
}

/**
 * Plan-Generator (Pflichtenheft Kapitel 10): Pool nach Level und Einschränkungen filtern, pro Trainingstag
 * Aufwärmen, Hauptteil (Zielzonen gewichtet, zwei Runden) und Cool-down, Progression, Ruhetage.
 * Deterministisch über `seed`.
 */
export function generatePlan(exercises: Exercise[], input: GeneratorInput): GeneratedDay[] {
  const tage = input.tage ?? PLAN_DAYS;
  const rng = createRng(input.seed);
  const allowed = filterExercises(exercises, input.einschraenkungen);
  const warmups = allowed.filter((e) => e.rolle === 'aufwaermen' && e.level <= input.level);
  const cooldowns = allowed.filter((e) => e.rolle === 'cooldown' && e.level <= input.level);
  const mainFor = (tagNr: number) => {
    const maxLevel = Math.min(3, input.level + (tagNr > tage / 2 ? 1 : 0));
    return allowed.filter((e) => e.rolle === 'haupt' && e.level <= maxLevel);
  };

  const days: GeneratedDay[] = [];
  let previousMain = new Set<string>();

  for (let tagNr = 1; tagNr <= tage; tagNr++) {
    if (isRestDay(tagNr, tage, input.trainingstageProWoche)) {
      days.push({ tagNr, ruhetag: true, uebungen: [], pauseS: PAUSE_S, geschaetzteDauerMin: 0 });
      continue;
    }
    const factor = progressionFactor(tagNr);
    const mainPool = mainFor(tagNr);
    const count = Math.min(MAIN_PER_ROUND[input.level], mainPool.length);
    const main = orderByPosition(
      weightedSample(
        mainPool,
        (e) =>
          zoneWeight(e, input.zielzonen) *
          (previousMain.has(e.id) ? 0.3 : 1) *
          (e.level > input.level ? 0.5 : 1),
        count,
        rng,
      ),
    );
    previousMain = new Set(main.map((e) => e.id));
    const warm = orderByPosition(
      weightedSample(warmups, (e) => zoneWeight(e, input.zielzonen), 2, rng),
    );
    const cool = weightedSample(
      cooldowns,
      (e) => zoneWeight(e, input.zielzonen),
      input.level === 3 ? 2 : 1,
      rng,
    );

    const sequence: { ex: Exercise; scale: number }[] = [
      ...warm.map((ex) => ({ ex, scale: 1 })),
      ...Array.from({ length: ROUNDS }, () => main.map((ex) => ({ ex, scale: factor }))).flat(),
      ...cool.map((ex) => ({ ex, scale: 1 })),
    ];
    const uebungen: WorkoutEntry[] = sequence.map((s, i) => defaultEntry(s.ex, i + 1, s.scale));
    days.push({
      tagNr,
      ruhetag: false,
      uebungen,
      pauseS: PAUSE_S,
      geschaetzteDauerMin: Math.max(1, Math.round(entriesSeconds(uebungen, PAUSE_S) / 60)),
    });
  }
  return days;
}
