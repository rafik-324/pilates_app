import {
  buildCsv,
  monthGrid,
  parseWeightInput,
  shiftMonth,
  totals,
  trainingDays,
  weekMinutes,
  weightSeries,
  type SessionLike,
} from '../progress';

const at = (day: string, hour = 8) =>
  new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).toISOString();

const s = (day: string, min: number, extra: Partial<SessionLike> = {}): SessionLike => ({
  start: at(day),
  ende: null,
  dauerS: min * 60,
  kcal: min * 4,
  kcalGeschaetzt: false,
  abgeschlossen: true,
  ...extra,
});

describe('Fortschritt', () => {
  const sessions = [
    s('2026-10-19', 10),
    s('2026-10-19', 5),
    s('2026-10-21', 12, { kcalGeschaetzt: true }),
    s('2026-10-22', 8, { abgeschlossen: false }),
    s('2026-10-12', 20),
  ];

  it('Gesamtstatistik zählt nur abgeschlossene Workouts (/F800/)', () => {
    expect(totals(sessions)).toEqual({
      workouts: 4,
      minutes: 47,
      kcal: 188,
      kcalEstimated: true,
    });
    expect(totals([])).toEqual({ workouts: 0, minutes: 0, kcal: 0, kcalEstimated: false });
  });

  it('Trainingstage ohne Doppelte und ohne Abbrüche (/F820/)', () => {
    expect(trainingDays(sessions)).toEqual(['2026-10-12', '2026-10-19', '2026-10-21']);
  });

  it('Wochenminuten Montag bis Sonntag (/F810/)', () => {
    expect(weekMinutes(sessions, '2026-10-22')).toEqual([15, 0, 12, 0, 0, 0, 0]);
    expect(weekMinutes(sessions, '2026-10-12')).toEqual([20, 0, 0, 0, 0, 0, 0]);
  });

  it('Monatsraster beginnt am Montag', () => {
    const grid = monthGrid(2026, 9); // Oktober 2026, 1.10. ist ein Donnerstag
    expect(grid[0]).toEqual([
      null,
      null,
      null,
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(grid.flat().filter(Boolean)).toHaveLength(31);
    expect(grid.every((row) => row.length === 7)).toBe(true);
    expect(shiftMonth(2026, 11, 1)).toEqual([2027, 0]);
    expect(shiftMonth(2026, 0, -1)).toEqual([2025, 11]);
  });

  it('Gewichtsverlauf: ein Wert je Tag, chronologisch', () => {
    expect(
      weightSeries([
        { datum: '2026-10-03', gewichtKg: 64 },
        { datum: '2026-10-01', gewichtKg: 66 },
        { datum: '2026-10-03', gewichtKg: 63.5 },
      ]),
    ).toEqual([
      { datum: '2026-10-01', gewichtKg: 66 },
      { datum: '2026-10-03', gewichtKg: 63.5 },
    ]);
  });

  it('CSV-Export mit Sessions und Gewicht (/F880/)', () => {
    const csv = buildCsv(
      [s('2026-10-19', 10, { titel: 'Bauch; "Basics"', feedback: 'passend', uebungenErledigt: 9 })],
      [{ datum: '2026-10-19', gewichtKg: 64.2 }],
    );
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(
      'start;ende;workout;dauer_s;kcal;kcal_geschaetzt;abgeschlossen;uebungen_erledigt;feedback',
    );
    expect(lines[1]).toContain(';"Bauch; ""Basics""";600;40;0;1;9;passend');
    expect(lines.slice(2)).toEqual(['', 'datum;gewicht_kg', '2026-10-19;64.2']);
    expect(buildCsv([], []).trim().split('\n')).toHaveLength(1);
  });
});

describe('Gewichtseingabe', () => {
  it('akzeptiert Komma und Punkt, prüft den Bereich', () => {
    const id = (v: number) => v;
    expect(parseWeightInput('64,5', id)).toBe(64.5);
    expect(parseWeightInput(' 70.04 ', id)).toBe(70);
    expect(parseWeightInput('abc', id)).toBeNull();
    expect(parseWeightInput('5', id)).toBeNull();
    expect(parseWeightInput('150', (lb) => lb * 0.45359237)).toBe(68);
  });
});
