import type { Repositories } from '@/data/repositories';
import type { PlanDayRecord, PlanRecord } from '@/data/repositories/plans';
import type { Challenge, Exercise, Workout, WorkoutEntry } from '@/domain/content';
import { toDateKey, type DateKey } from '@/domain/dates';
import {
  adaptUpcomingDays,
  autoCompleteRestDays,
  dayStates,
  generatePlan,
  PAUSE_S,
  type DayState,
  type GeneratedDay,
} from '@/domain/plan';
import type { FeedbackValue, Profile } from '@/domain/profile';
import { workoutStats, type WorkoutStats } from '@/domain/workoutStats';

export type DayView = {
  tagNr: number;
  ruhetag: boolean;
  state: DayState;
  erledigtAm: DateKey | null;
  workoutId: string | null;
  entries: WorkoutEntry[];
  pauseS: number;
  stats: WorkoutStats | null;
};

export type PlanView = {
  plan: PlanRecord;
  challenge: Challenge | null;
  days: DayView[];
  /** Aktuell freigeschalteter Tag, null wenn der Plan abgeschlossen ist */
  current: DayView | null;
  doneCount: number;
};

type Deps = {
  repos: Repositories;
  exercises: Exercise[];
  workouts: Workout[];
  challenges: Challenge[];
  now?: () => Date;
};

function toGenerated(d: PlanDayRecord): GeneratedDay {
  return {
    tagNr: d.tagNr,
    ruhetag: d.ruhetag,
    uebungen: d.uebungen ?? [],
    pauseS: d.pauseS ?? PAUSE_S,
    geschaetzteDauerMin: d.geschaetzteDauerMin ?? 0,
  };
}

/** Orchestriert Plan-Generator, Freischaltung, Ruhetage und Challenges über Repositories. */
export function createPlanService({
  repos,
  exercises,
  workouts,
  challenges,
  now = () => new Date(),
}: Deps) {
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const workoutById = new Map(workouts.map((w) => [w.id, w]));
  const today = (): DateKey => toDateKey(now());

  function seedFor(): number {
    return (now().getTime() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  }

  function createPersonalPlan(profile: Profile, seed = seedFor()): PlanRecord {
    const days = generatePlan(exercises, {
      level: profile.level,
      zielzonen: profile.zielzonen,
      einschraenkungen: profile.einschraenkungen,
      trainingstageProWoche: profile.trainingstageProWoche,
      seed,
    });
    return repos.plans.create({
      typ: 'persoenlich',
      startdatum: today(),
      seed,
      days: days.map((d) => ({
        tagNr: d.tagNr,
        ruhetag: d.ruhetag,
        uebungen: d.ruhetag ? null : d.uebungen,
        pauseS: d.pauseS,
        geschaetzteDauerMin: d.geschaetzteDauerMin,
      })),
    });
  }

  /** Liefert den aktiven persönlichen Plan und erzeugt ihn bei Bedarf (/F200/). */
  function ensurePersonalPlan(profile: Profile): PlanRecord {
    return repos.plans.getActive('persoenlich') ?? createPersonalPlan(profile);
  }

  /** Plan neu generieren (/F250/): neuer Seed, Fortschritt des alten Plans geht verloren. */
  function resetPersonalPlan(profile: Profile): PlanRecord {
    return createPersonalPlan(profile);
  }

  function startChallenge(challengeId: string): PlanRecord {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) throw new Error(`Unbekannte Challenge ${challengeId}`);
    return repos.plans.create({
      typ: 'challenge',
      challengeId,
      startdatum: today(),
      days: challenge.plan.map((d) => ({
        tagNr: d.tag,
        ruhetag: d.ruhetag,
        workoutId: d.workout_id ?? null,
      })),
    });
  }

  function endChallenge(): void {
    const active = repos.plans.getActive('challenge');
    if (active) repos.plans.deactivate(active.id);
  }

  /** Schließt fällige Ruhetage automatisch ab (/F240/, /T180/). Liefert die Anzahl. */
  function applyAutoRestDays(planId: number): number {
    const records = repos.plans.listDays(planId);
    const due = autoCompleteRestDays(
      records.map((d) => ({
        tagNr: d.tagNr,
        ruhetag: d.ruhetag,
        erledigt: d.status === 'erledigt',
        erledigtAm: d.erledigtAm,
      })),
      today(),
    );
    for (const d of due) repos.plans.markDayDone(planId, d.tagNr, d.datum);
    return due.length;
  }

  /** Markiert einen Tag als erledigt (nur der aktuell freigeschaltete Tag). */
  function completeDay(planId: number, tagNr: number, date: DateKey = today()): boolean {
    const records = repos.plans.listDays(planId);
    const states = dayStates(
      records.map((d) => ({
        tagNr: d.tagNr,
        ruhetag: d.ruhetag,
        erledigt: d.status === 'erledigt',
        erledigtAm: d.erledigtAm,
      })),
    );
    if (states.get(tagNr) !== 'aktuell') return false;
    repos.plans.markDayDone(planId, tagNr, date);
    return true;
  }

  /** Feedback einer Session auf die Folgetage anwenden (/F270/). Nur für persönliche Pläne. */
  function applyFeedback(
    planId: number,
    tagNr: number,
    feedback: FeedbackValue,
    profile: Profile,
  ): number {
    const plan = repos.plans.getActive('persoenlich');
    if (!plan || plan.id !== planId) return 0;
    const days = repos.plans.listDays(planId).map(toGenerated);
    const changed = adaptUpcomingDays(days, tagNr, feedback, {
      exercises,
      level: profile.level,
      einschraenkungen: profile.einschraenkungen,
    });
    for (const d of changed)
      repos.plans.replaceDayWorkout(planId, d.tagNr, { uebungen: d.uebungen });
    return changed.length;
  }

  function view(plan: PlanRecord, weightKg: number | null): PlanView {
    const records = repos.plans.listDays(plan.id);
    const states = dayStates(
      records.map((d) => ({
        tagNr: d.tagNr,
        ruhetag: d.ruhetag,
        erledigt: d.status === 'erledigt',
        erledigtAm: d.erledigtAm,
      })),
    );
    const challenge = plan.challengeId
      ? (challenges.find((c) => c.id === plan.challengeId) ?? null)
      : null;
    const days: DayView[] = records.map((d) => {
      const workout = d.workoutId ? workoutById.get(d.workoutId) : undefined;
      const entries = d.ruhetag ? [] : (d.uebungen ?? workout?.uebungen ?? []);
      const pauseS = d.pauseS ?? workout?.pause_s ?? PAUSE_S;
      return {
        tagNr: d.tagNr,
        ruhetag: d.ruhetag,
        state: states.get(d.tagNr) ?? 'gesperrt',
        erledigtAm: d.erledigtAm,
        workoutId: d.workoutId,
        entries,
        pauseS,
        stats: d.ruhetag
          ? null
          : workoutStats(entries, pauseS, (id) => exerciseById.get(id), weightKg),
      };
    });
    return {
      plan,
      challenge,
      days,
      current: days.find((d) => d.state === 'aktuell') ?? null,
      doneCount: days.filter((d) => d.state === 'erledigt').length,
    };
  }

  /** Plan-Tab-Daten: stellt Plan sicher, schließt Ruhetage ab und baut die Sichten. */
  function load(profile: Profile): { personal: PlanView; challenge: PlanView | null } {
    const personalPlan = ensurePersonalPlan(profile);
    applyAutoRestDays(personalPlan.id);
    const challengePlan = repos.plans.getActive('challenge');
    if (challengePlan) applyAutoRestDays(challengePlan.id);
    const weight = profile.einwilligungGesundheitsdaten ? profile.gewichtKg : null;
    return {
      personal: view(personalPlan, weight),
      challenge: challengePlan ? view(challengePlan, weight) : null,
    };
  }

  return {
    ensurePersonalPlan,
    resetPersonalPlan,
    startChallenge,
    endChallenge,
    applyAutoRestDays,
    completeDay,
    applyFeedback,
    view,
    load,
  };
}

export type PlanService = ReturnType<typeof createPlanService>;
