import type { Profile } from '@/domain/profile';
import type { Answers } from './store';

/** Erzeugt aus den Onboarding-Antworten das Profil (/D010/). Körperdaten nur mit Einwilligung (/F038/). */
export function buildProfile(a: Answers, now: Date = new Date()): Profile {
  const consent = a.einwilligungGesundheitsdaten;
  const iso = now.toISOString();
  return {
    geschlecht: a.geschlecht,
    geburtsjahr: a.geburtsjahr,
    groesseCm: consent ? a.groesseCm : null,
    gewichtKg: consent ? a.gewichtKg : null,
    zielgewichtKg: consent ? a.zielgewichtKg : null,
    ziel: a.ziel,
    level: a.level,
    zielzonen: a.zielzonen,
    einschraenkungen: a.einschraenkungen,
    trainingstageProWoche: a.trainingstageProWoche,
    trainingUhrzeit: a.trainingUhrzeit,
    einheitensystem: a.einheitensystem,
    gesundheitshinweisBestaetigtAm: a.gesundheitshinweisBestaetigt ? iso : null,
    einwilligungGesundheitsdaten: consent,
    einwilligungAm: consent ? iso : null,
    erstelltAm: iso,
  };
}
