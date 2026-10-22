import { defaultProfile, type Profile } from '@/domain/profile';
import { createTestRepositories } from '../testing/testDb';

type Ctx = Awaited<ReturnType<typeof createTestRepositories>>;
let ctx: Ctx;

beforeEach(async () => {
  ctx = await createTestRepositories();
});
afterEach(() => ctx.close());

const base = (): Profile => ({
  ...defaultProfile(new Date('2026-10-22T10:00:00Z')),
  geschlecht: 'weiblich',
  geburtsjahr: 1995,
  ziel: 'straffen',
  zielzonen: ['bauch', 'po'],
  einschraenkungen: ['knie'],
  groesseCm: 170,
  gewichtKg: 68,
  zielgewichtKg: 62,
});

describe('Profil', () => {
  it('speichert und lädt ein Profil mit Einwilligung', () => {
    ctx.repos.profile.save({
      ...base(),
      einwilligungGesundheitsdaten: true,
      einwilligungAm: '2026-10-22',
    });
    const p = ctx.repos.profile.get()!;
    expect(p.gewichtKg).toBe(68);
    expect(p.groesseCm).toBe(170);
    expect(p.zielzonen).toEqual(['bauch', 'po']);
    expect(p.einschraenkungen).toEqual(['knie']);
  });

  it('speichert ohne Einwilligung keine Körperdaten (/T160/)', () => {
    const saved = ctx.repos.profile.save({ ...base(), einwilligungGesundheitsdaten: false });
    expect(saved.gewichtKg).toBeNull();
    const p = ctx.repos.profile.get()!;
    expect(p.gewichtKg).toBeNull();
    expect(p.groesseCm).toBeNull();
    expect(p.zielgewichtKg).toBeNull();
  });

  it('überschreibt das Profil bei erneutem Speichern', () => {
    ctx.repos.profile.save(base());
    ctx.repos.profile.save({ ...base(), level: 2 });
    expect(ctx.repos.profile.get()!.level).toBe(2);
  });

  it('löscht Körperdaten beim Widerruf (/S100/)', () => {
    ctx.repos.profile.save({ ...base(), einwilligungGesundheitsdaten: true });
    ctx.repos.profile.clearHealthData();
    const p = ctx.repos.profile.get()!;
    expect(p.gewichtKg).toBeNull();
    expect(p.einwilligungGesundheitsdaten).toBe(false);
    expect(p.ziel).toBe('straffen');
  });
});

describe('Einstellungen', () => {
  it('liefert Standardwerte und speichert Änderungen', () => {
    expect(ctx.repos.settings.get().countdownS).toBe(10);
    ctx.repos.settings.save({ countdownS: 5, schema: 'dark' });
    const s = ctx.repos.settings.get();
    expect(s.countdownS).toBe(5);
    expect(s.schema).toBe('dark');
    expect(s.pauseS).toBe(10);
  });
});

describe('Pläne', () => {
  it('legt Plan und Tage an, aktiver Plan wird ersetzt', () => {
    const p1 = ctx.repos.plans.create({
      typ: 'persoenlich',
      startdatum: '2026-10-22',
      seed: 7,
      days: [
        {
          tagNr: 1,
          ruhetag: false,
          titel: 'Tag 1',
          uebungen: [{ uebung_id: 'ex01_breathing_standing', dauer_s: 30, reihenfolge: 1 }],
        },
        { tagNr: 2, ruhetag: true },
      ],
    });
    expect(ctx.repos.plans.getActive('persoenlich')!.id).toBe(p1.id);
    const days = ctx.repos.plans.listDays(p1.id);
    expect(days).toHaveLength(2);
    expect(days[0].uebungen![0].uebung_id).toBe('ex01_breathing_standing');
    expect(days[1].ruhetag).toBe(true);

    ctx.repos.plans.markDayDone(p1.id, 1, '2026-10-22');
    expect(ctx.repos.plans.listDays(p1.id)[0]).toMatchObject({
      status: 'erledigt',
      erledigtAm: '2026-10-22',
    });

    const p2 = ctx.repos.plans.create({
      typ: 'persoenlich',
      startdatum: '2026-10-23',
      days: [{ tagNr: 1, ruhetag: false }],
    });
    expect(ctx.repos.plans.getActive('persoenlich')!.id).toBe(p2.id);
  });

  it('Challenge und persönlicher Plan sind unabhängig aktiv', () => {
    ctx.repos.plans.create({
      typ: 'persoenlich',
      startdatum: '2026-10-22',
      days: [{ tagNr: 1, ruhetag: false }],
    });
    ctx.repos.plans.create({
      typ: 'challenge',
      challengeId: 'wall_pilates_28',
      startdatum: '2026-10-22',
      days: [{ tagNr: 1, ruhetag: false, workoutId: 'wall_basics' }],
    });
    expect(ctx.repos.plans.getActive('persoenlich')).not.toBeNull();
    expect(ctx.repos.plans.getActive('challenge')!.challengeId).toBe('wall_pilates_28');
  });
});

describe('Sessions', () => {
  it('speichert Sessions und filtert abgeschlossene im Zeitraum', () => {
    const s = {
      workoutId: 'wall_basics',
      titel: 'Wall Pilates Basics',
      planId: null,
      planTagNr: null,
      start: '2026-10-22T08:00:00.000Z',
      ende: '2026-10-22T08:10:00.000Z',
      dauerS: 600,
      kcal: 40,
      kcalGeschaetzt: true,
      abgeschlossen: true,
      uebungenErledigt: 10,
      feedback: null,
      uebungenGesamt: 10,
      abbruchGrund: null,
    };
    const a = ctx.repos.sessions.add(s);
    ctx.repos.sessions.add({ ...s, start: '2026-10-25T08:00:00.000Z' });
    ctx.repos.sessions.add({ ...s, abgeschlossen: false });
    ctx.repos.sessions.setFeedback(a.id, 'passend');
    expect(ctx.repos.sessions.get(a.id)!.feedback).toBe('passend');
    const range = ctx.repos.sessions.listCompletedBetween(
      '2026-10-22T00:00:00.000Z',
      '2026-10-23T00:00:00.000Z',
    );
    expect(range).toHaveLength(1);
    expect(ctx.repos.sessions.list()).toHaveLength(3);
  });
});

describe('Gewicht, Erinnerungen, Favoriten, KV', () => {
  it('verwaltet Gewichtseinträge', () => {
    const a = ctx.repos.weight.add('2026-10-01', 70);
    ctx.repos.weight.add('2026-10-10', 69);
    ctx.repos.weight.update(a.id, { gewichtKg: 70.5 });
    expect(ctx.repos.weight.list().map((w) => w.gewichtKg)).toEqual([70.5, 69]);
    expect(ctx.repos.weight.latest()!.datum).toBe('2026-10-10');
    ctx.repos.weight.delete(a.id);
    expect(ctx.repos.weight.list()).toHaveLength(1);
  });

  it('verwaltet Erinnerungen', () => {
    const r = ctx.repos.reminders.add({ uhrzeit: '18:30', wochentage: [1, 3, 5] });
    ctx.repos.reminders.update(r.id, { aktiv: false, notificationIds: ['n1'] });
    expect(ctx.repos.reminders.list()[0]).toMatchObject({
      uhrzeit: '18:30',
      wochentage: [1, 3, 5],
      aktiv: false,
      notificationIds: ['n1'],
    });
  });

  it('schaltet Favoriten um', () => {
    expect(ctx.repos.favorites.toggle('workout', 'wall_basics')).toBe(true);
    expect(ctx.repos.favorites.has('workout', 'wall_basics')).toBe(true);
    expect(ctx.repos.favorites.list('workout')).toEqual(['wall_basics']);
    expect(ctx.repos.favorites.toggle('workout', 'wall_basics')).toBe(false);
    expect(ctx.repos.favorites.list('workout')).toEqual([]);
  });

  it('speichert Schlüssel-Wert-Paare', () => {
    expect(ctx.repos.kv.get('x')).toBeNull();
    ctx.repos.kv.set('x', '1');
    ctx.repos.kv.set('x', '2');
    expect(ctx.repos.kv.get('x')).toBe('2');
  });
});

describe('Alle Daten löschen (/T120/)', () => {
  it('entfernt sämtliche Nutzerdaten', () => {
    ctx.repos.profile.save(base());
    ctx.repos.settings.save({ pauseS: 20 });
    ctx.repos.weight.add('2026-10-01', 70);
    ctx.repos.reminders.add({ uhrzeit: '07:00', wochentage: [1] });
    ctx.repos.favorites.toggle('workout', 'a');
    ctx.repos.kv.set('k', 'v');
    ctx.repos.plans.create({
      typ: 'persoenlich',
      startdatum: '2026-10-22',
      days: [{ tagNr: 1, ruhetag: false }],
    });
    ctx.repos.deleteAllData();
    expect(ctx.repos.profile.get()).toBeNull();
    expect(ctx.repos.settings.get().pauseS).toBe(10);
    expect(ctx.repos.weight.list()).toEqual([]);
    expect(ctx.repos.reminders.list()).toEqual([]);
    expect(ctx.repos.favorites.list('workout')).toEqual([]);
    expect(ctx.repos.kv.get('k')).toBeNull();
    expect(ctx.repos.plans.getActive('persoenlich')).toBeNull();
  });
});
