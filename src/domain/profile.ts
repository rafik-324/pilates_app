/** Mindestalter (/S080/) */
export const MIN_AGE = 16;

export function ageFromBirthYear(birthYear: number, now: Date = new Date()): number {
  return now.getFullYear() - birthYear;
}

/** Konservativ über das Geburtsjahr: Wer in diesem Jahr 16 wird, gilt als alt genug (Jahresgenauigkeit). */
export function isOldEnough(birthYear: number, now: Date = new Date()): boolean {
  return ageFromBirthYear(birthYear, now) >= MIN_AGE;
}

export type Geschlecht = 'weiblich' | 'maennlich' | 'divers' | 'keine_angabe';
export type Ziel = 'abnehmen' | 'straffen' | 'flexibilitaet' | 'haltung' | 'stress';
export type Erfahrung = 1 | 2 | 3; // keine, etwas, regelmäßig (= Level)
export type Einschraenkung = 'knie' | 'ruecken' | 'handgelenke' | 'kein_boden' | 'schwangerschaft';
export type Zielzone = 'bauch' | 'arme' | 'brust' | 'po' | 'beine' | 'ganzkoerper';
export type Einheitensystem = 'metrisch' | 'imperial';

/** /D010/ Nutzerprofil */
export type Profile = {
  geschlecht: Geschlecht | null;
  geburtsjahr: number | null;
  groesseCm: number | null;
  gewichtKg: number | null;
  zielgewichtKg: number | null;
  ziel: Ziel | null;
  level: Erfahrung;
  zielzonen: Zielzone[];
  einschraenkungen: Einschraenkung[];
  trainingstageProWoche: number;
  trainingUhrzeit: string | null;
  einheitensystem: Einheitensystem;
  gesundheitshinweisBestaetigtAm: string | null;
  einwilligungGesundheitsdaten: boolean;
  einwilligungAm: string | null;
  erstelltAm: string;
};

/** Gesundheitsdaten (Größe, Gewicht) nur mit Einwilligung /F038/ behalten. */
export function stripHealthDataWithoutConsent(p: Profile): Profile {
  if (p.einwilligungGesundheitsdaten) return p;
  return { ...p, groesseCm: null, gewichtKg: null, zielgewichtKg: null };
}

export function defaultProfile(now: Date = new Date()): Profile {
  return {
    geschlecht: null,
    geburtsjahr: null,
    groesseCm: null,
    gewichtKg: null,
    zielgewichtKg: null,
    ziel: null,
    level: 1,
    zielzonen: [],
    einschraenkungen: [],
    trainingstageProWoche: 3,
    trainingUhrzeit: null,
    einheitensystem: 'metrisch',
    gesundheitshinweisBestaetigtAm: null,
    einwilligungGesundheitsdaten: false,
    einwilligungAm: null,
    erstelltAm: now.toISOString(),
  };
}

export type FeedbackValue = 'zu_leicht' | 'passend' | 'zu_schwer';
