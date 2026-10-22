/**
 * Player-Engine als reine Zustandsmaschine (/F500/ bis /F590/, /L060/).
 *
 * Zeit wird ausschließlich aus Zeitstempeln berechnet (`now` in ms wird übergeben), nie über
 * gezählte Ticks. `tick` kann beliebig selten aufgerufen werden: Nach Hintergrund oder Sperre
 * holt die Engine alle verpassten Phasenwechsel exakt nach.
 */

export type PlayerItem = {
  exerciseId: string;
  kind: 'time' | 'reps';
  /** Sekunden bei Zeitübungen */
  durationS: number | null;
  /** Wiederholungen bei Wiederholungsübungen */
  reps: number | null;
};

export type Phase = 'prepare' | 'exercise' | 'rest' | 'done';

export type PlayerState = {
  items: PlayerItem[];
  /** Aktuelle Übung; in `rest` die als Nächstes folgende Übung */
  index: number;
  phase: Phase;
  /** Beginn der aktuellen Phase (ms) */
  phaseStart: number;
  /** Länge der Phase in s; null = ohne Zeitlimit (Wiederholungsübung) */
  phaseLength: number | null;
  pausedAt: number | null;
  /** Pausenzeit innerhalb der aktuellen Phase (ms) */
  phasePausedMs: number;
  /** Pausenzeit gesamt (ms), für die Trainingsdauer */
  totalPausedMs: number;
  startedAt: number;
  endedAt: number | null;
  /** In dieser Phase bereits ausgelöste Ereignisse (Halbzeit, Countdown) */
  fired: string[];
  /** Tatsächlich trainierte Sekunden je Übung (für kcal) */
  workS: number[];
  /** Übungen, die regulär beendet wurden */
  done: boolean[];
  countdownS: number;
  restS: number;
};

export type PlayerEvent =
  | { type: 'phase'; phase: Phase; index: number }
  | { type: 'halfway'; index: number }
  | { type: 'countdown'; seconds: 1 | 2 | 3; phase: Phase }
  | { type: 'done' };

export type Step = { state: PlayerState; events: PlayerEvent[] };

/** Halbzeit-Ansage nur bei Übungen ab dieser Länge (s). */
const MIN_HALFWAY_S = 10;

export function createPlayer(
  items: PlayerItem[],
  opts: { countdownS: number; restS: number },
  now: number,
): PlayerState {
  if (items.length === 0) throw new Error('Workout ohne Übungen');
  const base: PlayerState = {
    items,
    index: 0,
    phase: 'prepare',
    phaseStart: now,
    phaseLength: Math.max(0, opts.countdownS),
    pausedAt: null,
    phasePausedMs: 0,
    totalPausedMs: 0,
    startedAt: now,
    endedAt: null,
    fired: [],
    workS: items.map(() => 0),
    done: items.map(() => false),
    countdownS: opts.countdownS,
    restS: opts.restS,
  };
  return base.phaseLength === 0 ? enterExercise(base, 0, now) : base;
}

export function isPaused(s: PlayerState): boolean {
  return s.pausedAt !== null;
}

/** Vergangene Zeit in der Phase (ms), ohne Pausen. */
export function elapsedMs(s: PlayerState, now: number): number {
  const ref = s.pausedAt ?? s.endedAt ?? now;
  return Math.max(0, ref - s.phaseStart - s.phasePausedMs);
}

/** Restzeit der Phase in s (gebrochen); null bei Phasen ohne Zeitlimit. */
export function remainingS(s: PlayerState, now: number): number | null {
  if (s.phaseLength === null || s.phase === 'done') return null;
  return Math.max(0, s.phaseLength - elapsedMs(s, now) / 1000);
}

/** Gesamtfortschritt 0..1 über alle Übungen. */
export function progress(s: PlayerState, now: number): number {
  if (s.phase === 'done') return 1;
  const n = s.items.length;
  if (s.phase === 'prepare') return 0;
  if (s.phase === 'rest') return s.index / n;
  const part =
    s.phaseLength && s.phaseLength > 0 ? Math.min(1, elapsedMs(s, now) / 1000 / s.phaseLength) : 0;
  return (s.index + part) / n;
}

/** Trainingsdauer in s (Wanduhr ohne Pausen). */
export function activeSeconds(s: PlayerState, now: number): number {
  const end = s.endedAt ?? s.pausedAt ?? now;
  return Math.max(0, Math.round((end - s.startedAt - s.totalPausedMs) / 1000));
}

function enterExercise(s: PlayerState, index: number, at: number): PlayerState {
  const item = s.items[index];
  return {
    ...s,
    index,
    phase: 'exercise',
    phaseStart: at,
    phaseLength: item.kind === 'time' ? (item.durationS ?? 0) : null,
    phasePausedMs: 0,
    fired: [],
  };
}

function enterRest(s: PlayerState, nextIndex: number, at: number): PlayerState {
  if (s.restS <= 0) return enterExercise(s, nextIndex, at);
  return {
    ...s,
    index: nextIndex,
    phase: 'rest',
    phaseStart: at,
    phaseLength: s.restS,
    phasePausedMs: 0,
    fired: [],
  };
}

function finish(s: PlayerState, at: number): PlayerState {
  return {
    ...s,
    phase: 'done',
    phaseStart: at,
    phaseLength: null,
    phasePausedMs: 0,
    pausedAt: null,
    endedAt: at,
    fired: [],
  };
}

/** Verbucht die Übungszeit der laufenden Übung, bevor sie verlassen wird. */
function bookWork(s: PlayerState, at: number, completed: boolean): PlayerState {
  if (s.phase !== 'exercise') return s;
  const workS = [...s.workS];
  const done = [...s.done];
  const ms = Math.max(0, at - s.phaseStart - s.phasePausedMs);
  const cap = s.phaseLength ?? Infinity;
  workS[s.index] += Math.min(cap, ms / 1000);
  if (completed) done[s.index] = true;
  return { ...s, workS, done };
}

/** Übergang nach dem Ende der aktuellen Phase zum Zeitpunkt `at`. */
function advance(s: PlayerState, at: number, completed: boolean): PlayerState {
  switch (s.phase) {
    case 'prepare':
      return enterExercise(s, s.index, at);
    case 'exercise': {
      const booked = bookWork(s, at, completed);
      const next = s.index + 1;
      return next >= s.items.length ? finish(booked, at) : enterRest(booked, next, at);
    }
    case 'rest':
      return enterExercise(s, s.index, at);
    default:
      return s;
  }
}

function phaseEvents(prev: PlayerState, next: PlayerState): PlayerEvent[] {
  if (prev.phase === next.phase && prev.index === next.index && prev.phaseStart === next.phaseStart)
    return [];
  if (next.phase === 'done') return [{ type: 'done' }];
  return [{ type: 'phase', phase: next.phase, index: next.index }];
}

/**
 * Wertet die Uhr aus: löst Halbzeit / Countdown aus und schaltet abgelaufene Phasen weiter
 * (auch mehrere, falls `tick` lange nicht aufgerufen wurde).
 */
export function tick(state: PlayerState, now: number): Step {
  let s = state;
  const events: PlayerEvent[] = [];
  for (let guard = 0; guard < 1000; guard++) {
    if (s.pausedAt !== null || s.phase === 'done' || s.phaseLength === null) break;
    const length = s.phaseLength;
    const elapsedS = elapsedMs(s, now) / 1000;
    const fired = [...s.fired];
    const fire = (key: string, ev: PlayerEvent) => {
      if (!fired.includes(key)) {
        fired.push(key);
        events.push(ev);
      }
    };
    if (elapsedS < length) {
      const remaining = length - elapsedS;
      if (
        s.phase === 'exercise' &&
        length >= MIN_HALFWAY_S &&
        elapsedS >= length / 2 &&
        remaining > 3
      ) {
        fire('halfway', { type: 'halfway', index: s.index });
      }
      for (const n of [3, 2, 1] as const) {
        if (length > n && remaining <= n && remaining > n - 1) {
          fire(`c${n}`, { type: 'countdown', seconds: n, phase: s.phase });
        }
      }
      s = fired.length === s.fired.length ? s : { ...s, fired };
      break;
    }
    // Phase ist abgelaufen: exakt am Ende weiterschalten, Restzeit läuft in der neuen Phase
    const endAt = s.phaseStart + s.phasePausedMs + length * 1000;
    const next = advance(s, endAt, true);
    events.push(...phaseEvents(s, next));
    s = next;
  }
  return { state: s, events };
}

export function pause(s: PlayerState, now: number): PlayerState {
  if (s.pausedAt !== null || s.phase === 'done') return s;
  return { ...s, pausedAt: now };
}

export function resume(s: PlayerState, now: number): PlayerState {
  if (s.pausedAt === null) return s;
  const pausedMs = Math.max(0, now - s.pausedAt);
  return {
    ...s,
    pausedAt: null,
    phasePausedMs: s.phasePausedMs + pausedMs,
    totalPausedMs: s.totalPausedMs + pausedMs,
  };
}

/** Pausiert ohne Zeitverlust, z. B. für die Speicherung zum Fortsetzen (/F620/). */
export function suspend(s: PlayerState, now: number): PlayerState {
  return pause(s, now);
}

/** Wechsel unter Beibehaltung des Pausenstatus. */
function jump(s: PlayerState, now: number, fn: (s: PlayerState, at: number) => PlayerState): Step {
  const wasPaused = s.pausedAt !== null;
  const running = resume(s, now);
  const next = fn(running, now);
  const result = wasPaused && next.phase !== 'done' ? pause(next, now) : next;
  return { state: result, events: phaseEvents(s, result) };
}

/**
 * Weiter / Überspringen (/F580/, /F590/): Vorbereitung und Pause enden sofort (/T040/),
 * eine Übung wird übersprungen (zählt nicht als erledigt).
 */
export function next(s: PlayerState, now: number): Step {
  if (s.phase === 'done') return { state: s, events: [] };
  return jump(s, now, (r, at) => advance(r, at, false));
}

/** Wiederholungsübung bestätigen ("Weiter", /F530/): zählt als erledigt. */
export function completeReps(s: PlayerState, now: number): Step {
  if (s.phase !== 'exercise') return next(s, now);
  return jump(s, now, (r, at) => advance(r, at, true));
}

/** Vorherige Übung (/F590/): in einer Übung zurück zur vorherigen, sonst Neustart der aktuellen. */
export function previous(s: PlayerState, now: number): Step {
  if (s.phase === 'done') return { state: s, events: [] };
  return jump(s, now, (r, at) => {
    if (r.phase === 'prepare') return { ...r, phaseStart: at, phasePausedMs: 0, fired: [] };
    const booked = bookWork(r, at, false);
    const target = r.phase === 'rest' ? r.index - 1 : r.index - 1;
    return enterExercise(booked, Math.max(0, target), at);
  });
}

/** Pause verlängern (+20 s, /F580/). */
export function extendRest(s: PlayerState, seconds = 20): PlayerState {
  if (s.phase !== 'rest' || s.phaseLength === null) return s;
  return { ...s, phaseLength: s.phaseLength + seconds, fired: [] };
}

/** Anzahl regulär beendeter Übungen. */
export function completedCount(s: PlayerState): number {
  return s.done.filter(Boolean).length;
}
