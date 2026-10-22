import challenges from '../../../assets/content/challenges.json';
import exercises from '../../../assets/content/exercises.json';
import workouts from '../../../assets/content/workouts.json';
import { validateContent } from '../content';
import {
  durationBucket,
  filterExercises,
  filterWorkouts,
  isFilterActive,
  normalize,
  searchExercises,
  searchWorkouts,
  stepEntry,
  workoutTraits,
} from '../library';

const content = validateContent({ exercises, workouts, challenges });
const byId = new Map(content.exercises.map((e) => [e.id, e]));
const get = (id: string) => byId.get(id);

describe('Suche (/F320/)', () => {
  it('normalisiert Umlaute, Groß- / Kleinschreibung und Satzzeichen', () => {
    expect(normalize('Brücke')).toBe(normalize('BRUECKE'));
    expect(normalize('Brücke')).toBe(normalize('brucke'));
    expect(normalize('Straße')).toBe('strasse');
    expect(normalize('  Roll-Up! ')).toBe('roll up');
  });

  it('/T130/: "Brücke" findet die Brücken-Übungen', () => {
    for (const q of ['Brücke', 'brücke', 'BRUECKE', 'bridge']) {
      const ids = searchExercises(content.exercises, q).map((e) => e.id);
      expect(ids).toEqual(expect.arrayContaining(['ex21_bridge', 'ex22_bridge_leg_lift']));
    }
  });

  it('findet Workouts über Titel und enthaltene Übungen, DE und EN', () => {
    expect(searchWorkouts(content.workouts, 'wall', get).length).toBeGreaterThan(3);
    const viaExercise = searchWorkouts(content.workouts, 'Brücke', get);
    expect(viaExercise.length).toBeGreaterThan(0);
    for (const w of viaExercise) {
      const title = normalize(`${w.titel.de} ${w.titel.en}`);
      const hasBridge = w.uebungen.some((u) => u.uebung_id.includes('bridge'));
      expect(title.includes('bruck') || hasBridge).toBe(true);
    }
  });

  it('leere Suche: keine Übungen, alle Workouts; mehrere Wörter UND-verknüpft', () => {
    expect(searchExercises(content.exercises, '  ')).toEqual([]);
    expect(searchWorkouts(content.workouts, '', get)).toHaveLength(content.workouts.length);
    expect(searchExercises(content.exercises, 'wall plank').map((e) => e.id)).toEqual([
      'ex40_wall_plank',
    ]);
    expect(searchExercises(content.exercises, 'xyzxyz')).toEqual([]);
  });
});

describe('Filter (/F310/)', () => {
  it('ohne Boden: kein Workout enthält eine Bodenübung', () => {
    const list = filterWorkouts(content.workouts, { boden: false }, get);
    expect(list.length).toBeGreaterThan(0);
    for (const w of list) {
      for (const u of w.uebungen) expect(get(u.uebung_id)?.boden).toBe(false);
    }
  });

  it('Wand, Level, Zone, Dauer und Favoriten', () => {
    const wall = filterWorkouts(content.workouts, { wand: true }, get);
    expect(wall.every((w) => workoutTraits(w, get).wand)).toBe(true);
    expect(filterWorkouts(content.workouts, { level: 3 }, get).every((w) => w.level === 3)).toBe(
      true,
    );
    expect(
      filterWorkouts(content.workouts, { zone: 'arme' }, get).every((w) =>
        w.zielzonen.includes('arme'),
      ),
    ).toBe(true);
    expect(
      filterWorkouts(content.workouts, { duration: 'kurz' }, get).every(
        (w) => w.geschaetzte_dauer <= 7,
      ),
    ).toBe(true);
    expect(
      filterWorkouts(content.workouts, { favoritesOnly: true }, get, new Set(['core_flow'])).map(
        (w) => w.id,
      ),
    ).toEqual(['core_flow']);
  });

  it('Übungsfilter und Hilfsfunktionen', () => {
    expect(filterExercises(content.exercises, { boden: false })).toHaveLength(17);
    expect(filterExercises(content.exercises, { wand: true })).toHaveLength(11);
    expect(durationBucket(5)).toBe('kurz');
    expect(durationBucket(10)).toBe('mittel');
    expect(durationBucket(13)).toBe('lang');
    expect(isFilterActive({})).toBe(false);
    expect(isFilterActive({ boden: false })).toBe(true);
  });
});

describe('Anpassung vor dem Start (/F440/)', () => {
  it('ändert Zeit in 5-s-Schritten und Wiederholungen einzeln, mit Grenzen', () => {
    expect(stepEntry({ dauer_s: 30, reihenfolge: 1 }, 1).dauer_s).toBe(35);
    expect(stepEntry({ dauer_s: 10, reihenfolge: 1 }, -1).dauer_s).toBe(10);
    expect(stepEntry({ dauer_s: 180, reihenfolge: 1 }, 1).dauer_s).toBe(180);
    expect(stepEntry({ wdh: 10, reihenfolge: 1 }, 1).wdh).toBe(11);
    expect(stepEntry({ wdh: 1, reihenfolge: 1 }, -1).wdh).toBe(1);
  });
});
