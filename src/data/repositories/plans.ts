import { and, asc, desc, eq } from 'drizzle-orm';
import type { WorkoutEntry } from '@/domain/content';
import { planDays, plans } from '../db/schema';
import type { AppDb } from '../db/types';
import { parseJsonArray } from './json';

export type PlanType = 'persoenlich' | 'challenge';

export type NewPlanDay = {
  tagNr: number;
  ruhetag: boolean;
  workoutId?: string | null;
  titel?: string | null;
  uebungen?: WorkoutEntry[] | null;
  pauseS?: number | null;
  geschaetzteDauerMin?: number | null;
};

export type PlanRecord = {
  id: number;
  typ: PlanType;
  challengeId: string | null;
  startdatum: string;
  seed: number;
  aktiv: boolean;
  erstelltAm: string;
};

export type PlanDayRecord = {
  id: number;
  planId: number;
  tagNr: number;
  workoutId: string | null;
  titel: string | null;
  uebungen: WorkoutEntry[] | null;
  pauseS: number | null;
  geschaetzteDauerMin: number | null;
  ruhetag: boolean;
  status: 'offen' | 'erledigt';
  erledigtAm: string | null;
};

function dayFromRow(r: typeof planDays.$inferSelect): PlanDayRecord {
  return {
    id: r.id,
    planId: r.planId,
    tagNr: r.tagNr,
    workoutId: r.workoutId,
    titel: r.titel,
    uebungen: r.uebungen ? parseJsonArray<WorkoutEntry>(r.uebungen) : null,
    pauseS: r.pauseS,
    geschaetzteDauerMin: r.geschaetzteDauerMin,
    ruhetag: r.ruhetag,
    status: r.status as PlanDayRecord['status'],
    erledigtAm: r.erledigtAm,
  };
}

export function createPlanRepository(db: AppDb) {
  return {
    /** Legt einen Plan samt Tagen an und deaktiviert vorherige Pläne desselben Typs. */
    create(input: {
      typ: PlanType;
      challengeId?: string | null;
      startdatum: string;
      seed?: number;
      days: NewPlanDay[];
    }): PlanRecord {
      return db.transaction((tx) => {
        tx.update(plans).set({ aktiv: false }).where(eq(plans.typ, input.typ)).run();
        const plan = tx
          .insert(plans)
          .values({
            typ: input.typ,
            challengeId: input.challengeId ?? null,
            startdatum: input.startdatum,
            seed: input.seed ?? 0,
            aktiv: true,
            erstelltAm: new Date().toISOString(),
          })
          .returning()
          .get();
        for (const d of input.days) {
          tx.insert(planDays)
            .values({
              planId: plan.id,
              tagNr: d.tagNr,
              ruhetag: d.ruhetag,
              workoutId: d.workoutId ?? null,
              titel: d.titel ?? null,
              uebungen: d.uebungen ? JSON.stringify(d.uebungen) : null,
              pauseS: d.pauseS ?? null,
              geschaetzteDauerMin: d.geschaetzteDauerMin ?? null,
            })
            .run();
        }
        return plan as PlanRecord;
      });
    },
    getActive(typ: PlanType): PlanRecord | null {
      const row = db
        .select()
        .from(plans)
        .where(and(eq(plans.typ, typ), eq(plans.aktiv, true)))
        .orderBy(desc(plans.id))
        .get();
      return (row as PlanRecord | undefined) ?? null;
    },
    listDays(planId: number): PlanDayRecord[] {
      return db
        .select()
        .from(planDays)
        .where(eq(planDays.planId, planId))
        .orderBy(asc(planDays.tagNr))
        .all()
        .map(dayFromRow);
    },
    markDayDone(planId: number, tagNr: number, dateKey: string): void {
      db.update(planDays)
        .set({ status: 'erledigt', erledigtAm: dateKey })
        .where(and(eq(planDays.planId, planId), eq(planDays.tagNr, tagNr)))
        .run();
    },
    replaceDayWorkout(
      planId: number,
      tagNr: number,
      patch: Partial<Omit<NewPlanDay, 'tagNr' | 'ruhetag'>>,
    ): void {
      db.update(planDays)
        .set({
          ...(patch.uebungen !== undefined
            ? { uebungen: patch.uebungen ? JSON.stringify(patch.uebungen) : null }
            : {}),
          ...(patch.pauseS !== undefined ? { pauseS: patch.pauseS } : {}),
          ...(patch.geschaetzteDauerMin !== undefined
            ? { geschaetzteDauerMin: patch.geschaetzteDauerMin }
            : {}),
          ...(patch.titel !== undefined ? { titel: patch.titel } : {}),
        })
        .where(and(eq(planDays.planId, planId), eq(planDays.tagNr, tagNr)))
        .run();
    },
    deactivate(planId: number): void {
      db.update(plans).set({ aktiv: false }).where(eq(plans.id, planId)).run();
    },
    deleteAll(): void {
      db.delete(planDays).run();
      db.delete(plans).run();
    },
  };
}

export type PlanRepository = ReturnType<typeof createPlanRepository>;
