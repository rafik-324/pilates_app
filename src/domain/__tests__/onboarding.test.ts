import { weightForecast } from '../forecast';
import {
  isValidBirthYear,
  nextStep,
  STEP_ORDER,
  stepProgress,
  type FlowAnswers,
  type StepId,
} from '../onboarding';

const now = new Date(2026, 9, 22);
const base: FlowAnswers = {
  geburtsjahr: 1995,
  einwilligungGesundheitsdaten: true,
  einschraenkungen: [],
};

function walk(a: FlowAnswers): StepId[] {
  const path: StepId[] = ['welcome'];
  let step = nextStep('welcome', a, now);
  while (step && step !== 'done') {
    path.push(step);
    step = nextStep(step, a, now);
  }
  return path;
}

describe('Onboarding-Navigation', () => {
  it('Hauptpfad mit Einwilligung durchläuft alle Schritte in Reihenfolge (/T010/)', () => {
    expect(walk(base)).toEqual(STEP_ORDER);
  });

  it('ohne Einwilligung werden Körperdaten übersprungen (/T160/)', () => {
    const path = walk({ ...base, einwilligungGesundheitsdaten: false });
    expect(path).not.toContain('body');
    expect(path).toContain('experience');
    expect(path).toContain('preview');
  });

  it('unter 16: Hinweis, danach Ende ohne Abschluss (/T150/)', () => {
    const a = { ...base, geburtsjahr: 2012 };
    expect(nextStep('birthyear', a, now)).toBe('underage');
    expect(nextStep('underage', a, now)).toBeNull();
    expect(walk(a)).toEqual(['welcome', 'goal', 'gender', 'birthyear', 'underage']);
  });

  it('genau 16 Jahre (Geburtsjahr 2010) ist zugelassen', () => {
    expect(nextStep('birthyear', { ...base, geburtsjahr: 2010 }, now)).toBe('health_notice');
  });

  it('Schwangerschaft führt zu einem zusätzlichen Arzthinweis (/F070/)', () => {
    const path = walk({ ...base, einschraenkungen: ['knie', 'schwangerschaft'] });
    expect(path.indexOf('pregnancy_notice')).toBe(path.indexOf('limits') + 1);
    expect(walk(base)).not.toContain('pregnancy_notice');
  });

  it('ohne Geburtsjahr bleibt der Schritt stehen', () => {
    expect(nextStep('birthyear', { ...base, geburtsjahr: null }, now)).toBe('birthyear');
  });

  it('endet nach der Benachrichtigungsabfrage', () => {
    expect(nextStep('notifications', base, now)).toBe('done');
  });

  it('Fortschritt steigt entlang des Pfads monoton bis 1', () => {
    const values = STEP_ORDER.map(stepProgress);
    expect(values[values.length - 1]).toBe(1);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });

  it('validiert das Geburtsjahr', () => {
    expect(isValidBirthYear(1995, now)).toBe(true);
    expect(isValidBirthYear(1899, now)).toBe(false);
    expect(isValidBirthYear(2027, now)).toBe(false);
    expect(isValidBirthYear(1995.5, now)).toBe(false);
  });
});

describe('Gewichtsprognose (/F090/)', () => {
  it('schätzt die Dauer bei 0,5 kg pro Woche', () => {
    const f = weightForecast(70, 63, 170);
    expect(f.deltaKg).toBe(-7);
    expect(f.weeks).toBe(14);
    expect(f.targetBmi).toBe(21.8);
    expect(f.targetTooLow).toBe(false);
  });
  it('kein Abnehmen nötig bei höherem Zielgewicht', () => {
    expect(weightForecast(60, 62).weeks).toBe(0);
  });
  it('warnt bei Untergewicht als Ziel', () => {
    expect(weightForecast(55, 48, 170).targetTooLow).toBe(true);
  });
});
