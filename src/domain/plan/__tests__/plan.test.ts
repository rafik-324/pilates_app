import exercisesJson from '../../../../assets/content/exercises.json';
import { exercisesFileSchema, type Exercise } from '../../content';
import type { Einschraenkung, Erfahrung } from '../../profile';
import { adaptUpcomingDays } from '../adapt';
import { generatePlan, isRestDay, progressionFactor, PLAN_DAYS } from '../generator';
import { entriesSeconds } from '../scale';
import { autoCompleteRestDays, currentDay, dayStates, type DayStatus } from '../unlock';

const exercises: Exercise[] = exercisesFileSchema.parse(exercisesJson);
const byId = new Map(exercises.map((e) => [e.id, e]));
const ALL: Einschraenkung[] = ['knie', 'ruecken', 'handgelenke', 'kein_boden', 'schwangerschaft'];
const base = {
  zielzonen: ['bauch', 'po'] as ('bauch' | 'po')[],
  trainingstageProWoche: 3,
  seed: 42,
};

function subsets<T>(items: T[]): T[][] {
  return items.reduce<T[][]>((acc, item) => [...acc, ...acc.map((s) => [...s, item])], [[]]);
}

describe('Plan-Generator', () => {
  it('erzeugt einen 30-Tage-Plan (/T010/)', () => {
    const plan = generatePlan(exercises, { ...base, level: 1, einschraenkungen: [] });
    expect(plan).toHaveLength(PLAN_DAYS);
    expect(plan.map((d) => d.tagNr)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it('enthält keine Bodenübung bei "keine Bodenübungen" (/T020/)', () => {
    for (const level of [1, 2, 3] as Erfahrung[]) {
      const plan = generatePlan(exercises, { ...base, level, einschraenkungen: ['kein_boden'] });
      for (const d of plan)
        for (const u of d.uebungen) expect(byId.get(u.uebung_id)!.boden).toBe(false);
    }
  });

  it('enthält keine ungeeignete Übung bei Schwangerschaft (/T170/)', () => {
    for (const level of [1, 2, 3] as Erfahrung[]) {
      const plan = generatePlan(exercises, {
        ...base,
        level,
        einschraenkungen: ['schwangerschaft'],
      });
      for (const d of plan)
        for (const u of d.uebungen)
          expect(byId.get(u.uebung_id)!.schwangerschaft_geeignet).toBe(true);
    }
  });

  it('beachtet Knie, Rücken und Handgelenke', () => {
    const plan = generatePlan(exercises, {
      ...base,
      level: 3,
      einschraenkungen: ['knie', 'ruecken', 'handgelenke'],
    });
    for (const d of plan) {
      for (const u of d.uebungen) {
        const b = byId.get(u.uebung_id)!.belastungen;
        expect(b).not.toContain('knie');
        expect(b).not.toContain('ruecken');
        expect(b).not.toContain('handgelenke');
      }
    }
  });

  it('jede Kombination aus Level und Einschränkungen ergibt einen gültigen Plan ohne leere Tage', () => {
    for (const level of [1, 2, 3] as Erfahrung[]) {
      for (const einschraenkungen of subsets(ALL)) {
        const plan = generatePlan(exercises, { ...base, level, einschraenkungen });
        expect(plan).toHaveLength(30);
        for (const d of plan) {
          if (d.ruhetag) {
            expect(d.uebungen).toHaveLength(0);
            continue;
          }
          const roles = d.uebungen.map((u) => byId.get(u.uebung_id)!.rolle);
          expect(roles.filter((r) => r === 'haupt').length).toBeGreaterThanOrEqual(3);
          expect(roles).toContain('aufwaermen');
          expect(roles).toContain('cooldown');
          expect(d.geschaetzteDauerMin).toBeGreaterThanOrEqual(5);
          // Aufwärmen zuerst, Cool-down zuletzt
          expect(roles[0]).toBe('aufwaermen');
          expect(roles[roles.length - 1]).toBe('cooldown');
          for (const u of d.uebungen)
            expect(u.dauer_s !== undefined || u.wdh !== undefined).toBe(true);
        }
      }
    }
  });

  it('ist über den Seed deterministisch, andere Seeds liefern andere Pläne', () => {
    const a = generatePlan(exercises, { ...base, level: 2, einschraenkungen: [] });
    const b = generatePlan(exercises, { ...base, level: 2, einschraenkungen: [] });
    const c = generatePlan(exercises, { ...base, level: 2, einschraenkungen: [], seed: 43 });
    expect(b).toEqual(a);
    expect(c).not.toEqual(a);
  });

  it('gewichtet Zielzonen: Bauch-Plan enthält mehr Bauchübungen als Arm-Plan', () => {
    const count = (zones: ('bauch' | 'arme')[]) => {
      const plan = generatePlan(exercises, {
        ...base,
        zielzonen: zones,
        level: 1,
        einschraenkungen: [],
      });
      return plan
        .flatMap((d) => d.uebungen)
        .filter((u) => byId.get(u.uebung_id)!.zielzonen.includes('bauch')).length;
    };
    expect(count(['bauch'])).toBeGreaterThan(count(['arme']));
  });

  it('setzt Ruhetage (Standard jeder 4. Tag) und endet mit einem Trainingstag', () => {
    const plan = generatePlan(exercises, { ...base, level: 1, einschraenkungen: [] });
    const rest = plan.filter((d) => d.ruhetag).map((d) => d.tagNr);
    expect(rest).toEqual([4, 8, 12, 16, 20, 24, 28]);
    expect(plan[29].ruhetag).toBe(false);
    expect(isRestDay(30, 30, 2)).toBe(false);
  });

  it('steigert Dauer und Wiederholungen ca. 10 % alle 6 Tage', () => {
    expect(progressionFactor(1)).toBe(1);
    expect(progressionFactor(6)).toBe(1);
    expect(progressionFactor(7)).toBeCloseTo(1.1);
    expect(progressionFactor(13)).toBeCloseTo(1.21);
    const plan = generatePlan(exercises, { ...base, level: 1, einschraenkungen: [] });
    const total = (from: number, to: number) => {
      const days = plan.filter((d) => !d.ruhetag && d.tagNr >= from && d.tagNr <= to);
      return days.reduce((s, d) => s + entriesSeconds(d.uebungen, d.pauseS), 0) / days.length;
    };
    expect(total(25, 30)).toBeGreaterThan(total(1, 6));
  });

  it('verwendet höhere Level-Übungen erst in der zweiten Planhälfte', () => {
    const plan = generatePlan(exercises, { ...base, level: 1, einschraenkungen: [] });
    const first = plan.filter((d) => d.tagNr <= 15).flatMap((d) => d.uebungen);
    for (const u of first) expect(byId.get(u.uebung_id)!.level).toBe(1);
  });
});

describe('Freischaltung (/F230/)', () => {
  const mk = (n: number, done: number, rest: number[] = []): DayStatus[] =>
    Array.from({ length: n }, (_, i) => ({
      tagNr: i + 1,
      ruhetag: rest.includes(i + 1),
      erledigt: i + 1 <= done,
      erledigtAm: i + 1 <= done ? '2026-10-20' : null,
    }));

  it('schaltet den Folgetag frei, sobald der vorherige erledigt ist', () => {
    const states = dayStates(mk(5, 2));
    expect([1, 2, 3, 4, 5].map((n) => states.get(n))).toEqual([
      'erledigt',
      'erledigt',
      'aktuell',
      'gesperrt',
      'gesperrt',
    ]);
    expect(currentDay(mk(5, 2))!.tagNr).toBe(3);
    expect(currentDay(mk(5, 5))).toBeNull();
  });
});

describe('Ruhetage (/F240/, /T180/)', () => {
  const days = (restDone: boolean): DayStatus[] => [
    { tagNr: 3, ruhetag: false, erledigt: true, erledigtAm: '2026-10-20' },
    { tagNr: 4, ruhetag: true, erledigt: restDone, erledigtAm: restDone ? '2026-10-21' : null },
    { tagNr: 5, ruhetag: false, erledigt: false, erledigtAm: null },
  ];

  it('schließt den Ruhetag automatisch am nächsten Kalendertag ab', () => {
    expect(autoCompleteRestDays(days(false), '2026-10-21')).toEqual([
      { tagNr: 4, datum: '2026-10-21' },
    ]);
  });

  it('schließt den Ruhetag nicht am selben Kalendertag ab', () => {
    expect(autoCompleteRestDays(days(false), '2026-10-20')).toEqual([]);
  });

  it('datiert den Ruhetag auf den Folgetag, auch wenn die App erst später geöffnet wird', () => {
    expect(autoCompleteRestDays(days(false), '2026-10-24')).toEqual([
      { tagNr: 4, datum: '2026-10-21' },
    ]);
  });

  it('tut nichts, wenn der aktuelle Tag kein Ruhetag ist oder alles erledigt ist', () => {
    expect(autoCompleteRestDays(days(true), '2026-10-25')).toEqual([]);
  });
});

describe('Adaptive Anpassung (/F270/)', () => {
  const plan = generatePlan(exercises, { ...base, level: 2, einschraenkungen: [] });
  const ctx = { exercises, level: 2 as Erfahrung, einschraenkungen: [] as Einschraenkung[] };

  it('passend ändert nichts', () => {
    expect(adaptUpcomingDays(plan, 1, 'passend', ctx)).toEqual([]);
  });

  it('wirkt nur auf die nächsten 3 Trainingstage nach dem Abschluss', () => {
    const changed = adaptUpcomingDays(plan, 1, 'zu_schwer', ctx);
    expect(changed.map((d) => d.tagNr)).toEqual([2, 3, 5]);
  });

  it('zu schwer: weniger Dauer / Wiederholungen in Hauptübungen', () => {
    const changed = adaptUpcomingDays(plan, 1, 'zu_schwer', ctx)[0];
    const original = plan.find((d) => d.tagNr === changed.tagNr)!;
    const seconds = (d: typeof changed) => entriesSeconds(d.uebungen, d.pauseS);
    expect(seconds(changed)).toBeLessThan(seconds(original));
  });

  it('zu leicht: mehr Dauer / Wiederholungen', () => {
    const changed = adaptUpcomingDays(plan, 1, 'zu_leicht', ctx)[0];
    const original = plan.find((d) => d.tagNr === changed.tagNr)!;
    expect(entriesSeconds(changed.uebungen, changed.pauseS)).toBeGreaterThan(
      entriesSeconds(original.uebungen, original.pauseS),
    );
  });

  it('tauscht gegen leichtere Varianten und beachtet Einschränkungen', () => {
    const custom = [
      {
        tagNr: 2,
        ruhetag: false,
        pauseS: 10,
        geschaetzteDauerMin: 5,
        uebungen: [{ uebung_id: 'ex08_single_leg_stretch', wdh: 10, reihenfolge: 1 }],
      },
    ];
    const easier = adaptUpcomingDays(custom, 1, 'zu_schwer', ctx);
    expect(easier[0].uebungen[0].uebung_id).toBe('ex12_dead_bug');
    const harder = adaptUpcomingDays(custom, 1, 'zu_leicht', ctx);
    expect(harder[0].uebungen[0].uebung_id).toBe('ex09_double_leg_stretch');
    // schwangerschaft verbietet ex12 (Rückenlage, nicht geeignet): keine Ersetzung
    const preg = adaptUpcomingDays(custom, 1, 'zu_schwer', {
      ...ctx,
      einschraenkungen: ['schwangerschaft'],
    });
    expect(preg[0].uebungen[0].uebung_id).toBe('ex08_single_leg_stretch');
  });
});
