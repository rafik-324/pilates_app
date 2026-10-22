import { getContent, getWorkout } from '@/data/content/loader';
import type { WorkoutEntry } from '@/domain/content';
import type { DayView, PlanView } from '@/features/plan/service';

export type WorkoutRef =
  { kind: 'library'; id: string } | { kind: 'plan'; planId: number; tagNr: number };

export type ResolvedWorkout = {
  ref: WorkoutRef;
  /** Titel je Sprache; null bei Plantagen (Anzeige "Tag X") */
  title: { de: string; en: string } | null;
  tagNr: number | null;
  entries: WorkoutEntry[];
  pauseS: number;
  level: 1 | 2 | 3 | null;
  premium: boolean;
};

/** Löst einen Verweis (Bibliothek oder Plantag) in ein startbares Workout auf. */
export function resolveWorkout(
  ref: WorkoutRef,
  views: (PlanView | null)[],
): ResolvedWorkout | null {
  if (ref.kind === 'library') {
    const w = getWorkout(ref.id);
    if (!w) return null;
    return {
      ref,
      title: w.titel,
      tagNr: null,
      entries: w.uebungen,
      pauseS: w.pause_s,
      level: w.level,
      premium: w.premium,
    };
  }
  const view = views.find((v) => v?.plan.id === ref.planId);
  const day: DayView | undefined = view?.days.find((d) => d.tagNr === ref.tagNr);
  if (!view || !day || day.ruhetag) return null;
  const workout = day.workoutId
    ? getContent().workouts.find((w) => w.id === day.workoutId)
    : undefined;
  return {
    ref,
    title: workout?.titel ?? null,
    tagNr: day.tagNr,
    entries: day.entries,
    pauseS: day.pauseS,
    level: workout?.level ?? null,
    premium: workout?.premium ?? false,
  };
}

export function refToParams(ref: WorkoutRef): Record<string, string> {
  return ref.kind === 'library'
    ? { kind: 'library', id: ref.id }
    : { kind: 'plan', plan: String(ref.planId), tag: String(ref.tagNr) };
}

export function refFromParams(p: Record<string, string | string[] | undefined>): WorkoutRef | null {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  if (one(p.kind) === 'library' && one(p.id)) return { kind: 'library', id: one(p.id) as string };
  if (one(p.kind) === 'plan' && one(p.plan) && one(p.tag)) {
    return { kind: 'plan', planId: Number(one(p.plan)), tagNr: Number(one(p.tag)) };
  }
  return null;
}
