import challenges from '../../../../assets/content/challenges.json';
import exercises from '../../../../assets/content/exercises.json';
import workouts from '../../../../assets/content/workouts.json';
import { estimateWorkoutSeconds } from '../helpers';
import { CATEGORIES } from '../schemas';
import { findReferenceErrors, validateContent } from '../validate';

const content = validateContent({ exercises, workouts, challenges });

describe('Inhaltsdaten', () => {
  it('validiert gegen die Schemas und Referenzen', () => {
    expect(findReferenceErrors(content)).toEqual([]);
  });

  it('enthält 50 Übungen mit eindeutigen IDs', () => {
    expect(content.exercises).toHaveLength(50);
    expect(new Set(content.exercises.map((e) => e.id)).size).toBe(50);
  });

  it('hat mindestens 15 Übungen ohne Boden', () => {
    expect(content.exercises.filter((e) => !e.boden).length).toBeGreaterThanOrEqual(15);
  });

  it('entspricht der Übersicht: 17 ohne Boden, 11 Wand, 8 Aufwärmen, 3 Cool-down', () => {
    expect(content.exercises.filter((e) => !e.boden)).toHaveLength(17);
    expect(content.exercises.filter((e) => e.wand)).toHaveLength(11);
    expect(content.exercises.filter((e) => e.rolle === 'aufwaermen')).toHaveLength(8);
    expect(content.exercises.filter((e) => e.rolle === 'cooldown')).toHaveLength(3);
  });

  it('Varianten leichter / schwerer sind plausibel', () => {
    const byId = new Map(content.exercises.map((e) => [e.id, e]));
    for (const e of content.exercises) {
      if (e.variante_leicht_id)
        expect(byId.get(e.variante_leicht_id)!.level).toBeLessThanOrEqual(e.level);
      if (e.variante_schwer_id)
        expect(byId.get(e.variante_schwer_id)!.level).toBeGreaterThanOrEqual(e.level);
    }
  });

  it('alle Bauchlage-Übungen sind nicht schwangerschaftsgeeignet', () => {
    for (const e of content.exercises.filter((x) => x.belastungen.includes('bauchlage'))) {
      expect(e.schwangerschaft_geeignet).toBe(false);
    }
  });

  it('Workouts: mindestens 16, alle Kategorien belegt, 5 bis 20 Minuten', () => {
    expect(content.workouts.length).toBeGreaterThanOrEqual(16);
    for (const c of CATEGORIES) {
      expect(content.workouts.some((w) => w.kategorie === c)).toBe(true);
    }
    for (const w of content.workouts) {
      expect(w.geschaetzte_dauer).toBeGreaterThanOrEqual(5);
      expect(w.geschaetzte_dauer).toBeLessThanOrEqual(20);
      expect(Math.round(estimateWorkoutSeconds(w.uebungen, w.pause_s) / 60)).toBe(
        w.geschaetzte_dauer,
      );
    }
  });

  it('Premium-Zuordnung folgt /F1200/ (Anfänger, Ganzkörper, Wall Pilates frei)', () => {
    const free = ['anfaenger', 'ganzkoerper', 'wall_pilates'];
    for (const w of content.workouts) expect(w.premium).toBe(!free.includes(w.kategorie));
  });

  it('kostenlose Workouts enthalten keine Premium-Übungen', () => {
    const byId = new Map(content.exercises.map((e) => [e.id, e]));
    for (const w of content.workouts.filter((x) => !x.premium)) {
      for (const u of w.uebungen) expect(byId.get(u.uebung_id)!.premium).toBe(false);
    }
  });

  it('Übungstyp passt zu den Workout-Einträgen', () => {
    const byId = new Map(content.exercises.map((e) => [e.id, e]));
    for (const w of content.workouts) {
      for (const u of w.uebungen) {
        const ex = byId.get(u.uebung_id)!;
        expect(ex.typ === 'zeit' ? u.dauer_s !== undefined : u.wdh !== undefined).toBe(true);
      }
    }
  });

  it('Challenges: Wall Pilates 28 Tage gratis, Bauch 14 Tage Premium', () => {
    const wall = content.challenges.find((c) => c.id === 'wall_pilates_28')!;
    const core = content.challenges.find((c) => c.id === 'core_14')!;
    expect(wall.tage).toBe(28);
    expect(wall.premium).toBe(false);
    expect(core.tage).toBe(14);
    expect(core.premium).toBe(true);
  });

  it('erkennt ungültige Referenzen', () => {
    const broken = structuredClone(content);
    broken.workouts[0].uebungen[0].uebung_id = 'ex99_missing';
    expect(findReferenceErrors(broken).length).toBeGreaterThan(0);
  });

  it('lehnt ungültige Schemadaten ab', () => {
    expect(() => validateContent({ exercises: [{ id: 'x' }], workouts, challenges })).toThrow();
  });
});
