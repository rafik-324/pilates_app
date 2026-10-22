import { isOldEnough, type Einschraenkung } from './profile';

export type StepId =
  | 'welcome'
  | 'goal'
  | 'gender'
  | 'birthyear'
  | 'underage'
  | 'health_notice'
  | 'consent'
  | 'body'
  | 'experience'
  | 'zones'
  | 'limits'
  | 'pregnancy_notice'
  | 'schedule'
  | 'preview'
  | 'notifications';

/** Antworten, die den Ablauf beeinflussen. */
export type FlowAnswers = {
  geburtsjahr: number | null;
  einwilligungGesundheitsdaten: boolean;
  einschraenkungen: Einschraenkung[];
};

/** Reihenfolge des Hauptpfads (Pflichtenheft /F010/ bis /F100/). Grundlage für den Fortschrittsbalken. */
export const STEP_ORDER: StepId[] = [
  'welcome',
  'goal',
  'gender',
  'birthyear',
  'health_notice',
  'consent',
  'body',
  'experience',
  'zones',
  'limits',
  'schedule',
  'preview',
  'notifications',
];

export type NextStep = StepId | 'done' | null;

/** Welcher Schritt folgt auf `step`? `null` = Ende ohne Abschluss (unter 16, /T150/). */
export function nextStep(step: StepId, a: FlowAnswers, now: Date = new Date()): NextStep {
  switch (step) {
    case 'welcome':
      return 'goal';
    case 'goal':
      return 'gender';
    case 'gender':
      return 'birthyear';
    case 'birthyear':
      if (a.geburtsjahr === null) return 'birthyear';
      return isOldEnough(a.geburtsjahr, now) ? 'health_notice' : 'underage';
    case 'underage':
      return null;
    case 'health_notice':
      return 'consent';
    case 'consent':
      return a.einwilligungGesundheitsdaten ? 'body' : 'experience'; // /T160/
    case 'body':
      return 'experience';
    case 'experience':
      return 'zones';
    case 'zones':
      return 'limits';
    case 'limits':
      return a.einschraenkungen.includes('schwangerschaft') ? 'pregnancy_notice' : 'schedule';
    case 'pregnancy_notice':
      return 'schedule';
    case 'schedule':
      return 'preview';
    case 'preview':
      return 'notifications';
    case 'notifications':
      return 'done';
  }
}

/** Fortschritt 0..1 für den Fortschrittsbalken. */
export function stepProgress(step: StepId): number {
  const idx = STEP_ORDER.indexOf(
    step === 'underage' ? 'birthyear' : step === 'pregnancy_notice' ? 'limits' : step,
  );
  return (idx + 1) / STEP_ORDER.length;
}

export function isValidBirthYear(year: number, now: Date = new Date()): boolean {
  return Number.isInteger(year) && year >= 1900 && year <= now.getFullYear();
}
