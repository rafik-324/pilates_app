import {
  activeSeconds,
  completedCount,
  completeReps,
  createPlayer,
  extendRest,
  next,
  pause,
  previous,
  progress,
  remainingS,
  resume,
  suspend,
  tick,
  type PlayerEvent,
  type PlayerItem,
  type PlayerState,
} from '../engine';
import { toPlayerItems } from '../index';

const T0 = 1_000_000;
const time = (s: number, id = 'a'): PlayerItem => ({
  exerciseId: id,
  kind: 'time',
  durationS: s,
  reps: null,
});
const reps = (n: number, id = 'r'): PlayerItem => ({
  exerciseId: id,
  kind: 'reps',
  durationS: null,
  reps: n,
});

/** Fake-Uhr: ruft tick in festen Schritten auf und sammelt alle Ereignisse. */
function run(state: PlayerState, fromMs: number, toMs: number, stepMs = 100) {
  let s = state;
  const events: { at: number; ev: PlayerEvent }[] = [];
  for (let t = fromMs; t <= toMs; t += stepMs) {
    const r = tick(s, t);
    s = r.state;
    for (const ev of r.events) events.push({ at: t, ev });
  }
  return { state: s, events };
}

describe('Player-Engine', () => {
  it('/T030/: läuft ohne Eingriff bis zum Ende (Vorbereitung, Übungen, Pausen)', () => {
    const p = createPlayer([time(30, 'a'), time(20, 'b')], { countdownS: 10, restS: 10 }, T0);
    expect(p.phase).toBe('prepare');
    // 10 + 30 + 10 + 20 = 70 s
    const { state, events } = run(p, T0, T0 + 71_000);
    expect(state.phase).toBe('done');
    expect(state.endedAt).toBe(T0 + 70_000);
    expect(completedCount(state)).toBe(2);
    expect(state.workS).toEqual([30, 20]);
    expect(activeSeconds(state, T0 + 999_999)).toBe(70);
    const phases = events
      .filter((e) => e.ev.type === 'phase' || e.ev.type === 'done')
      .map((e) => (e.ev.type === 'phase' ? `${e.ev.phase}${e.ev.index}` : 'done'));
    expect(phases).toEqual(['exercise0', 'rest1', 'exercise1', 'done']);
  });

  it('holt nach langem Hintergrund alle Phasen exakt nach (/L060/, /T060/)', () => {
    const p = createPlayer([time(30), time(30)], { countdownS: 10, restS: 10 }, T0);
    // ein einziger tick nach 55 s: 10 Vorbereitung + 30 Übung + 10 Pause + 5 s in Übung 2
    const { state, events } = tick(p, T0 + 55_000);
    expect(state.phase).toBe('exercise');
    expect(state.index).toBe(1);
    expect(remainingS(state, T0 + 55_000)).toBeCloseTo(25, 5);
    expect(events.filter((e) => e.type === 'phase')).toHaveLength(3);
  });

  it('/T050/: Halbzeit-Ansage bei 15 s einer 30-s-Übung', () => {
    const p = createPlayer([time(30)], { countdownS: 0, restS: 10 }, T0);
    expect(p.phase).toBe('exercise');
    const { events } = run(p, T0, T0 + 20_000);
    const half = events.find((e) => e.ev.type === 'halfway');
    expect(half?.at).toBe(T0 + 15_000);
    expect(events.filter((e) => e.ev.type === 'halfway')).toHaveLength(1);
  });

  it('Countdown-Signal in den letzten 3 Sekunden (/F520/)', () => {
    const p = createPlayer([time(30)], { countdownS: 0, restS: 0 }, T0);
    const { events } = run(p, T0, T0 + 31_000);
    const cd = events.filter((e) => e.ev.type === 'countdown');
    expect(cd.map((e) => (e.ev as { seconds: number }).seconds)).toEqual([3, 2, 1]);
    expect(cd.map((e) => e.at)).toEqual([T0 + 27_000, T0 + 28_000, T0 + 29_000]);
  });

  it('/T040/: Pause überspringen startet die nächste Übung sofort', () => {
    let s = createPlayer([time(10), time(10)], { countdownS: 0, restS: 15 }, T0);
    s = tick(s, T0 + 10_000).state;
    expect(s.phase).toBe('rest');
    const r = next(s, T0 + 12_000);
    expect(r.state.phase).toBe('exercise');
    expect(r.state.index).toBe(1);
    expect(r.state.phaseStart).toBe(T0 + 12_000);
    expect(r.events).toEqual([{ type: 'phase', phase: 'exercise', index: 1 }]);
  });

  it('+20 s verlängert die Pause', () => {
    let s = createPlayer([time(10), time(10)], { countdownS: 0, restS: 10 }, T0);
    s = tick(s, T0 + 10_000).state;
    s = extendRest(s, 20);
    expect(remainingS(s, T0 + 15_000)).toBeCloseTo(25, 5);
    s = tick(s, T0 + 39_000).state;
    expect(s.phase).toBe('rest');
    s = tick(s, T0 + 40_000).state;
    expect(s.phase).toBe('exercise');
  });

  it('Pause / Fortsetzen hält die Zeit an', () => {
    let s = createPlayer([time(30)], { countdownS: 0, restS: 0 }, T0);
    s = pause(s, T0 + 10_000);
    s = tick(s, T0 + 100_000).state;
    expect(s.phase).toBe('exercise');
    expect(remainingS(s, T0 + 100_000)).toBeCloseTo(20, 5);
    s = resume(s, T0 + 100_000);
    expect(remainingS(s, T0 + 105_000)).toBeCloseTo(15, 5);
    s = tick(s, T0 + 120_000).state;
    expect(s.phase).toBe('done');
    expect(activeSeconds(s, T0 + 120_000)).toBe(30);
  });

  it('vorherige / nächste Übung', () => {
    let s = createPlayer(
      [time(30, 'a'), time(30, 'b'), time(30, 'c')],
      { countdownS: 0, restS: 10 },
      T0,
    );
    s = next(s, T0 + 5_000).state; // a übersprungen -> Pause vor b
    expect(s.phase).toBe('rest');
    expect(s.index).toBe(1);
    expect(s.done[0]).toBe(false);
    s = next(s, T0 + 6_000).state; // Pause übersprungen -> b
    expect(s.phase).toBe('exercise');
    expect(s.index).toBe(1);
    s = previous(s, T0 + 8_000).state; // zurück zu a
    expect(s.index).toBe(0);
    expect(s.phaseStart).toBe(T0 + 8_000);
    s = previous(s, T0 + 9_000).state; // a neu starten
    expect(s.index).toBe(0);
    expect(s.phaseStart).toBe(T0 + 9_000);
  });

  it('Wiederholungsübung wartet auf "Weiter" und zählt dann als erledigt (/F530/)', () => {
    let s = createPlayer([reps(10), time(10)], { countdownS: 0, restS: 5 }, T0);
    expect(remainingS(s, T0)).toBeNull();
    s = tick(s, T0 + 600_000).state;
    expect(s.phase).toBe('exercise');
    expect(s.index).toBe(0);
    const r = completeReps(s, T0 + 40_000);
    expect(r.state.phase).toBe('rest');
    expect(r.state.done[0]).toBe(true);
    expect(r.state.workS[0]).toBe(40);
  });

  it('Navigation im Pausenzustand bleibt pausiert', () => {
    let s = createPlayer([time(30), time(30)], { countdownS: 0, restS: 10 }, T0);
    s = pause(s, T0 + 1_000);
    s = next(s, T0 + 2_000).state;
    expect(s.phase).toBe('rest');
    expect(s.pausedAt).toBe(T0 + 2_000);
    expect(remainingS(s, T0 + 50_000)).toBeCloseTo(10, 5);
  });

  it('/T070/: gesicherter Zustand lässt sich nach Neustart fortsetzen', () => {
    let s = createPlayer([time(30), time(30)], { countdownS: 10, restS: 10 }, T0);
    s = tick(s, T0 + 20_000).state; // 10 s in Übung 1
    const saved = JSON.parse(JSON.stringify(suspend(s, T0 + 20_000))) as PlayerState;
    // App eine Stunde später wieder geöffnet
    const later = T0 + 3_600_000;
    let restored = resume(saved, later);
    expect(restored.phase).toBe('exercise');
    expect(remainingS(restored, later)).toBeCloseTo(20, 5);
    restored = run(restored, later, later + 61_000).state;
    expect(restored.phase).toBe('done');
    expect(activeSeconds(restored, later + 61_000)).toBe(80);
  });

  it('Fortschritt über das ganze Workout', () => {
    let s = createPlayer([time(10), time(10)], { countdownS: 0, restS: 0 }, T0);
    expect(progress(s, T0)).toBe(0);
    expect(progress(s, T0 + 5_000)).toBeCloseTo(0.25);
    s = tick(s, T0 + 15_000).state;
    expect(progress(s, T0 + 15_000)).toBeCloseTo(0.75);
    s = tick(s, T0 + 25_000).state;
    expect(progress(s, T0 + 25_000)).toBe(1);
  });

  it('übersetzt Workout-Einträge in Player-Schritte', () => {
    const items = toPlayerItems(
      [
        { uebung_id: 'x', dauer_s: 40, reihenfolge: 1 },
        { uebung_id: 'y', wdh: 12, reihenfolge: 2 },
      ],
      () => undefined,
    );
    expect(items).toEqual([
      { exerciseId: 'x', kind: 'time', durationS: 40, reps: null },
      { exerciseId: 'y', kind: 'reps', durationS: null, reps: 12 },
    ]);
  });
});
