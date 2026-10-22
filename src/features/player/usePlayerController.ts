import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  createPlayer,
  resume as resumeState,
  tick,
  toPlayerItems,
  type PlayerEvent,
  type PlayerState,
  type Step,
} from '@/domain/player';
import type { ResolvedWorkout } from '@/features/workout/resolve';

/** Bildschirm-Aktualisierung; die Zeit selbst kommt immer aus Zeitstempeln. */
const FRAME_MS = 200;

type Options = {
  workout: ResolvedWorkout;
  initial: PlayerState | null;
  countdownS: number;
  restS: number;
  getExercise: Parameters<typeof toPlayerItems>[1];
  onEvents: (events: PlayerEvent[], state: PlayerState) => void;
  /** Wird bei Phasenwechseln und beim Wechsel in den Hintergrund aufgerufen. */
  onPersist: (state: PlayerState) => void;
};

/** Verbindet die reine Player-Engine mit React: Takt, App-Zustand, Aktionen. */
export function usePlayerController(o: Options) {
  const opts = useRef(o);
  useEffect(() => {
    opts.current = o;
  });

  const [state, setState] = useState<PlayerState>(() => {
    const now = Date.now();
    return o.initial
      ? resumeState(o.initial, now)
      : createPlayer(
          toPlayerItems(o.workout.entries, o.getExercise),
          { countdownS: o.countdownS, restS: o.restS },
          now,
        );
  });
  const [now, setNow] = useState(() => Date.now());
  const ref = useRef(state);

  const commit = useCallback((step: Step) => {
    const changed = step.state !== ref.current;
    ref.current = step.state;
    if (changed) setState(step.state);
    if (step.events.length) {
      opts.current.onEvents(step.events, step.state);
      if (step.events.some((e) => e.type === 'phase' || e.type === 'done')) {
        opts.current.onPersist(step.state);
      }
    }
    setNow(Date.now());
  }, []);

  useEffect(() => {
    // Start: aktuelle Phase ansagen und Zustand sichern
    opts.current.onEvents(
      [{ type: 'phase', phase: ref.current.phase, index: ref.current.index }],
      ref.current,
    );
    opts.current.onPersist(ref.current);
    const id = setInterval(() => commit(tick(ref.current, Date.now())), FRAME_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') commit(tick(ref.current, Date.now()));
      else opts.current.onPersist(ref.current);
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [commit]);

  /** Führt eine Engine-Aktion aus (z. B. next, previous, pause). */
  const act = useCallback(
    (fn: (s: PlayerState, now: number) => Step | PlayerState) => {
      const t = Date.now();
      const r = fn(ref.current, t);
      const step: Step = 'events' in r ? r : { state: r, events: [] };
      commit(step);
      if (step.events.length === 0) opts.current.onPersist(step.state);
    },
    [commit],
  );

  return { state, now, act };
}
