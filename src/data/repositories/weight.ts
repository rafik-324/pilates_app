import { asc, desc, eq } from 'drizzle-orm';
import { weightEntries } from '../db/schema';
import type { AppDb } from '../db/types';

export type WeightEntry = { id: number; datum: string; gewichtKg: number };

export function createWeightRepository(db: AppDb) {
  return {
    list(): WeightEntry[] {
      return db
        .select()
        .from(weightEntries)
        .orderBy(asc(weightEntries.datum), asc(weightEntries.id))
        .all();
    },
    latest(): WeightEntry | null {
      return (
        db
          .select()
          .from(weightEntries)
          .orderBy(desc(weightEntries.datum), desc(weightEntries.id))
          .get() ?? null
      );
    },
    add(datum: string, gewichtKg: number): WeightEntry {
      return db.insert(weightEntries).values({ datum, gewichtKg }).returning().get();
    },
    update(id: number, patch: Partial<Pick<WeightEntry, 'datum' | 'gewichtKg'>>): void {
      db.update(weightEntries).set(patch).where(eq(weightEntries.id, id)).run();
    },
    delete(id: number): void {
      db.delete(weightEntries).where(eq(weightEntries.id, id)).run();
    },
    deleteAll(): void {
      db.delete(weightEntries).run();
    },
  };
}

export type WeightRepository = ReturnType<typeof createWeightRepository>;
