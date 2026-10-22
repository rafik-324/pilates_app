import { bmi, bmiCategory } from '../bmi';
import { addDays, diffDays, isoWeekday, startOfWeek, toDateKey } from '../dates';
import { DEFAULT_WEIGHT_KG, kcalFor, kcalForSegments } from '../kcal';
import { ageFromBirthYear, isOldEnough } from '../profile';
import { currentStreak, longestStreak } from '../streak';
import { cmToFtIn, displayWeight, ftInToCm, kgToLb, lbToKg, weightToKg } from '../units';

describe('kcal', () => {
  it('berechnet MET x Gewicht x Stunden', () => {
    expect(kcalFor(3.5, 1800, 70)).toEqual({ kcal: 123, estimated: false });
  });
  it('verwendet 65 kg und kennzeichnet die Schätzung ohne Gewicht', () => {
    expect(kcalFor(3, 3600)).toEqual({ kcal: Math.round(3 * DEFAULT_WEIGHT_KG), estimated: true });
    expect(kcalFor(3, 3600, null).estimated).toBe(true);
    expect(kcalFor(3, 3600, 0).estimated).toBe(true);
  });
  it('summiert Abschnitte mit eigenem MET', () => {
    const r = kcalForSegments(
      [
        { met: 2.5, durationS: 600 },
        { met: 4, durationS: 600 },
      ],
      60,
    );
    expect(r).toEqual({
      kcal: Math.round(2.5 * 60 * (1 / 6) + 4 * 60 * (1 / 6)),
      estimated: false,
    });
  });
});

describe('bmi', () => {
  it('berechnet auf eine Nachkommastelle', () => {
    expect(bmi(70, 175)).toBe(22.9);
  });
  it('liefert null bei ungültigen Werten', () => {
    expect(bmi(0, 175)).toBeNull();
    expect(bmi(70, 0)).toBeNull();
  });
  it('ordnet nach WHO ein', () => {
    expect(bmiCategory(18.4)).toBe('underweight');
    expect(bmiCategory(18.5)).toBe('normal');
    expect(bmiCategory(24.9)).toBe('normal');
    expect(bmiCategory(25)).toBe('overweight');
    expect(bmiCategory(30)).toBe('obese');
  });
});

describe('units', () => {
  it('rechnet kg und lb um', () => {
    expect(kgToLb(70)).toBeCloseTo(154.32, 1);
    expect(lbToKg(154.3)).toBeCloseTo(69.99, 1);
  });
  it('rechnet cm und ft/in um', () => {
    expect(cmToFtIn(175)).toEqual({ ft: 5, in: 9 });
    expect(cmToFtIn(182.9)).toEqual({ ft: 6, in: 0 });
    expect(ftInToCm(5, 9)).toBeCloseTo(175.3, 1);
  });
  it('zeigt und speichert Gewicht im gewählten System', () => {
    expect(displayWeight(70, 'imperial')).toEqual({ value: 154.3, unit: 'lb' });
    expect(displayWeight(70, 'metrisch')).toEqual({ value: 70, unit: 'kg' });
    expect(weightToKg(154.3, 'imperial')).toBeCloseTo(70, 0);
    expect(weightToKg(70, 'metrisch')).toBe(70);
  });
});

describe('dates', () => {
  it('rechnet mit Kalendertagen über Monatsgrenzen', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDays('2026-10-22', '2026-11-01')).toBe(10);
  });
  it('liefert ISO-Wochentage', () => {
    expect(isoWeekday('2026-10-22')).toBe(4); // Donnerstag
    expect(startOfWeek('2026-10-22')).toBe('2026-10-19');
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('profile', () => {
  it('prüft das Mindestalter 16', () => {
    const now = new Date(2026, 9, 22);
    expect(ageFromBirthYear(2000, now)).toBe(26);
    expect(isOldEnough(2010, now)).toBe(true);
    expect(isOldEnough(2011, now)).toBe(false);
  });
});

describe('streak', () => {
  it('zählt aufeinanderfolgende Trainingstage bis heute', () => {
    expect(currentStreak(['2026-10-20', '2026-10-21', '2026-10-22'], [], '2026-10-22')).toBe(3);
  });
  it('heute noch nicht trainiert: Streak bis gestern bleibt erhalten', () => {
    expect(currentStreak(['2026-10-20', '2026-10-21'], [], '2026-10-22')).toBe(2);
  });
  it('eine Lücke ohne Ruhetag unterbricht den Streak', () => {
    expect(currentStreak(['2026-10-19', '2026-10-21'], [], '2026-10-21')).toBe(1);
    expect(currentStreak(['2026-10-19'], [], '2026-10-22')).toBe(0);
  });
  it('Ruhetage unterbrechen nicht und zählen nicht mit (/F240/, /T180/)', () => {
    const training = ['2026-10-19', '2026-10-20', '2026-10-22'];
    const rest = ['2026-10-21'];
    expect(currentStreak(training, rest, '2026-10-22')).toBe(3);
    expect(currentStreak(['2026-10-19', '2026-10-20'], ['2026-10-21'], '2026-10-22')).toBe(2);
  });
  it('ein abgeschlossener Ruhetag am Vortag erhält den Streak (/T180/)', () => {
    expect(currentStreak(['2026-10-20'], ['2026-10-21'], '2026-10-22')).toBe(1);
  });
  it('berechnet den längsten Streak', () => {
    const training = [
      '2026-10-01',
      '2026-10-02',
      '2026-10-04',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
    ];
    expect(longestStreak(training, [])).toBe(3);
    expect(longestStreak(training, ['2026-10-03'])).toBe(3);
    expect(longestStreak(['2026-10-01', '2026-10-02', '2026-10-04'], ['2026-10-03'])).toBe(3);
    expect(longestStreak([], [])).toBe(0);
  });
});
