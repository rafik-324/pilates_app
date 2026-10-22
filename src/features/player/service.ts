import type { Repositories } from '@/data/repositories';
import type { AbortReason } from '@/data/repositories/sessions';
import type { Challenge, Exercise, Workout } from '@/domain/content';
import { toDateKey } from '@/domain/dates';
import { kcalForSegments } from '@/domain/kcal';
import { activeSeconds, completedCount, suspend, type PlayerState } from '@/domain/player';
import { createPlanService } from '@/features/plan/service';
import type { ResolvedWorkout } from '@/features/workout/resolve';

const RESUME_KEY = 'player.resume';

/** Gesicherter Player-Zustand zum Fortsetzen nach Abbruch oder Neustart (/F620/, /T070/). */
export type ResumeSnapshot = {
  workout: ResolvedWorkout;
  state: PlayerState;
  /** Session-Datensatz eines abgebrochenen Laufs, der beim Abschluss aktualisiert wird */
  sessionId: number | null;
  savedAt: string;
};

type Deps = {
  repos: Repositories;
  exercises: Exercise[];
  workouts: Workout[];
  challenges: Challenge[];
};

/** Speichert Sessions und den Fortsetzen-Zustand; markiert Plantage als erledigt (/F700/, /F750/). */
export function createPlayerService(deps: Deps) {
  const { repos, exercises } = deps;
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  function saveSnapshot(snap: Omit<ResumeSnapshot, 'savedAt'>, now: number): void {
    const state = suspend(snap.state, now);
    const value: ResumeSnapshot = { ...snap, state, savedAt: new Date(now).toISOString() };
    repos.kv.set(RESUME_KEY, JSON.stringify(value));
  }

  function loadSnapshot(): ResumeSnapshot | null {
    const raw = repos.kv.get(RESUME_KEY);
    if (!raw) return null;
    try {
      const snap = JSON.parse(raw) as ResumeSnapshot;
      return snap.state?.phase && snap.state.phase !== 'done' ? snap : null;
    } catch {
      return null;
    }
  }

  function clearSnapshot(): void {
    repos.kv.delete(RESUME_KEY);
  }

  /**
   * Schreibt die Session. Bei regulärem Ende wird der Plantag erledigt und der
   * Fortsetzen-Zustand gelöscht. Liefert die Session-ID.
   */
  function recordSession(input: {
    workout: ResolvedWorkout;
    state: PlayerState;
    now: number;
    weightKg: number | null;
    aborted: boolean;
    reason?: AbortReason | null;
    sessionId?: number | null;
  }): number {
    const { workout, state, now } = input;
    const kcal = kcalForSegments(
      state.items.map((it, i) => ({
        met: exerciseById.get(it.exerciseId)?.met_wert ?? 3,
        durationS: state.workS[i],
      })),
      input.weightKg,
    );
    const end = state.endedAt ?? now;
    const ref = workout.ref;
    const values = {
      workoutId: ref.kind === 'library' ? ref.id : null,
      titel: workout.title ? workout.title.de : null,
      planId: ref.kind === 'plan' ? ref.planId : null,
      planTagNr: ref.kind === 'plan' ? ref.tagNr : null,
      start: new Date(state.startedAt).toISOString(),
      ende: new Date(end).toISOString(),
      dauerS: activeSeconds(state, now),
      kcal: kcal.kcal,
      kcalGeschaetzt: kcal.estimated,
      abgeschlossen: !input.aborted,
      uebungenErledigt: completedCount(state),
      uebungenGesamt: state.items.length,
      feedback: null,
      abbruchGrund: input.aborted ? (input.reason ?? null) : null,
    };
    let id: number;
    if (input.sessionId != null && repos.sessions.get(input.sessionId)) {
      repos.sessions.update(input.sessionId, values);
      id = input.sessionId;
    } else {
      id = repos.sessions.add(values).id;
    }
    if (!input.aborted) {
      clearSnapshot();
      if (ref.kind === 'plan') {
        createPlanService(deps).completeDay(ref.planId, ref.tagNr, toDateKey(new Date(end)));
      }
    }
    return id;
  }

  return { saveSnapshot, loadSnapshot, clearSnapshot, recordSession };
}

export type PlayerService = ReturnType<typeof createPlayerService>;
