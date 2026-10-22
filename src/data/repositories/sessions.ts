import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { FeedbackValue } from '@/domain/profile';
import { sessions } from '../db/schema';
import type { AppDb } from '../db/types';

export type SessionRecord = {
  id: number;
  workoutId: string | null;
  titel: string | null;
  planId: number | null;
  planTagNr: number | null;
  start: string;
  ende: string | null;
  dauerS: number;
  kcal: number;
  kcalGeschaetzt: boolean;
  abgeschlossen: boolean;
  uebungenErledigt: number;
  feedback: FeedbackValue | null;
};

export type NewSession = Omit<SessionRecord, 'id'>;

export function createSessionRepository(db: AppDb) {
  return {
    add(s: NewSession): SessionRecord {
      return db.insert(sessions).values(s).returning().get() as SessionRecord;
    },
    get(id: number): SessionRecord | null {
      return (
        (db.select().from(sessions).where(eq(sessions.id, id)).get() as
          SessionRecord | undefined) ?? null
      );
    },
    setFeedback(id: number, feedback: FeedbackValue): void {
      db.update(sessions).set({ feedback }).where(eq(sessions.id, id)).run();
    },
    list(): SessionRecord[] {
      return db.select().from(sessions).orderBy(desc(sessions.start)).all() as SessionRecord[];
    },
    /** Abgeschlossene Sessions, deren Start in [fromIso, toIso] liegt. */
    listCompletedBetween(fromIso: string, toIso: string): SessionRecord[] {
      return db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.abgeschlossen, true),
            gte(sessions.start, fromIso),
            lte(sessions.start, toIso),
          ),
        )
        .orderBy(desc(sessions.start))
        .all() as SessionRecord[];
    },
    delete(id: number): void {
      db.delete(sessions).where(eq(sessions.id, id)).run();
    },
    deleteAll(): void {
      db.delete(sessions).run();
    },
  };
}

export type SessionRepository = ReturnType<typeof createSessionRepository>;
