import { buildProfile } from '../buildProfile';
import { initialAnswers, type Answers } from '../store';

const now = new Date('2026-10-22T10:00:00.000Z');
const answers: Answers = {
  ...initialAnswers,
  ziel: 'straffen',
  geschlecht: 'weiblich',
  geburtsjahr: 1992,
  gesundheitshinweisBestaetigt: true,
  einwilligungGesundheitsdaten: true,
  groesseCm: 170,
  gewichtKg: 68,
  zielgewichtKg: 63,
  level: 2,
  zielzonen: ['bauch'],
  einschraenkungen: ['knie'],
  trainingstageProWoche: 4,
  trainingUhrzeit: '18:00',
};

describe('buildProfile', () => {
  it('übernimmt Antworten und Zeitstempel', () => {
    const p = buildProfile(answers, now);
    expect(p).toMatchObject({
      ziel: 'straffen',
      level: 2,
      gewichtKg: 68,
      groesseCm: 170,
      zielgewichtKg: 63,
      einwilligungGesundheitsdaten: true,
      einwilligungAm: now.toISOString(),
      gesundheitshinweisBestaetigtAm: now.toISOString(),
      trainingUhrzeit: '18:00',
    });
  });

  it('ohne Einwilligung keine Körperdaten und kein Einwilligungsdatum (/T160/)', () => {
    const p = buildProfile({ ...answers, einwilligungGesundheitsdaten: false }, now);
    expect(p.gewichtKg).toBeNull();
    expect(p.groesseCm).toBeNull();
    expect(p.zielgewichtKg).toBeNull();
    expect(p.einwilligungAm).toBeNull();
  });
});
