import exercisesJson from '../../../../assets/content/exercises.json';
import challengesJson from '../../../../assets/content/challenges.json';
import workoutsJson from '../../../../assets/content/workouts.json';
import { createTestRepositories } from '@/data/testing/testDb';
import { validateContent } from '@/domain/content';
import { defaultProfile, type Profile } from '@/domain/profile';
import { createPlanService } from '../service';

const content = validateContent({
  exercises: exercisesJson,
  workouts: workoutsJson,
  challenges: challengesJson,
});

const profile: Profile = {
  ...defaultProfile(),
  level: 1,
  zielzonen: ['bauch'],
  einschraenkungen: [],
  gewichtKg: 70,
  groesseCm: 170,
  einwilligungGesundheitsdaten: true,
};

async function setup(start: Date) {
  const t = await createTestRepositories();
  let current = start;
  const service = createPlanService({ repos: t.repos, ...content, now: () => current });
  return { ...t, service, setNow: (d: Date) => (current = d) };
}

describe('Plan-Service', () => {
  it('erzeugt beim ersten Laden einen 30-Tage-Plan, Tag 1 ist freigeschaltet (/T010/, /F210/)', async () => {
    const { service, close } = await setup(new Date(2026, 9, 22, 9));
    const { personal } = service.load(profile);
    expect(personal.days).toHaveLength(30);
    expect(personal.current!.tagNr).toBe(1);
    expect(personal.days.filter((d) => d.state === 'gesperrt')).toHaveLength(29);
    expect(personal.current!.stats!.kcalEstimated).toBe(false);
    // zweiter Aufruf erzeugt keinen neuen Plan
    expect(service.load(profile).personal.plan.id).toBe(personal.plan.id);
    close();
  });

  it('schaltet Tage der Reihe nach frei, mehrere Tage am selben Kalendertag erlaubt (/F230/)', async () => {
    const { service, close } = await setup(new Date(2026, 9, 22, 9));
    const { personal } = service.load(profile);
    expect(service.completeDay(personal.plan.id, 2)).toBe(false); // Tag 2 noch gesperrt
    expect(service.completeDay(personal.plan.id, 1)).toBe(true);
    expect(service.completeDay(personal.plan.id, 2)).toBe(true);
    const view = service.load(profile).personal;
    expect(view.doneCount).toBe(2);
    expect(view.current!.tagNr).toBe(3);
    close();
  });

  it('Ruhetag wird am nächsten Kalendertag automatisch erledigt (/T180/)', async () => {
    const { service, setNow, close } = await setup(new Date(2026, 9, 22, 9));
    const planId = service.load(profile).personal.plan.id;
    for (const n of [1, 2, 3]) service.completeDay(planId, n);
    let view = service.load(profile).personal;
    expect(view.current!.tagNr).toBe(4);
    expect(view.current!.ruhetag).toBe(true);
    setNow(new Date(2026, 9, 23, 8));
    view = service.load(profile).personal;
    expect(view.days[3].state).toBe('erledigt');
    expect(view.days[3].erledigtAm).toBe('2026-10-23');
    expect(view.current!.tagNr).toBe(5);
    close();
  });

  it('kcal ohne Einwilligung als Schätzung gekennzeichnet (/T160/)', async () => {
    const { service, close } = await setup(new Date(2026, 9, 22, 9));
    const p = { ...profile, einwilligungGesundheitsdaten: false, gewichtKg: null };
    expect(service.load(p).personal.current!.stats!.kcalEstimated).toBe(true);
    close();
  });

  it('startet Challenges und führt sie parallel zum persönlichen Plan (/F260/)', async () => {
    const { service, close } = await setup(new Date(2026, 9, 22, 9));
    service.load(profile);
    service.startChallenge('wall_pilates_28');
    const { personal, challenge } = service.load(profile);
    expect(personal.plan.typ).toBe('persoenlich');
    expect(challenge!.days).toHaveLength(28);
    expect(challenge!.challenge!.id).toBe('wall_pilates_28');
    expect(challenge!.current!.entries.length).toBeGreaterThan(0);
    service.endChallenge();
    expect(service.load(profile).challenge).toBeNull();
    close();
  });

  it('Plan neu generieren ersetzt den Fortschritt (/F250/)', async () => {
    const { service, close } = await setup(new Date(2026, 9, 22, 9));
    const first = service.load(profile).personal;
    service.completeDay(first.plan.id, 1);
    service.resetPersonalPlan(profile);
    const second = service.load(profile).personal;
    expect(second.plan.id).not.toBe(first.plan.id);
    expect(second.doneCount).toBe(0);
    close();
  });

  it('wendet Feedback auf die Folgetage an (/F270/)', async () => {
    const { service, repos, close } = await setup(new Date(2026, 9, 22, 9));
    const { personal } = service.load({ ...profile, level: 2 });
    const before = repos.plans.listDays(personal.plan.id)[1].uebungen;
    const changed = service.applyFeedback(personal.plan.id, 1, 'zu_leicht', {
      ...profile,
      level: 2,
    });
    expect(changed).toBe(3);
    const after = repos.plans.listDays(personal.plan.id)[1].uebungen;
    expect(after).not.toEqual(before);
    expect(service.applyFeedback(personal.plan.id, 1, 'passend', profile)).toBe(0);
    close();
  });
});
