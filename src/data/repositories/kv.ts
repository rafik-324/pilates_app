import { eq } from 'drizzle-orm';
import { kv } from '../db/schema';
import type { AppDb } from '../db/types';

export function createKvRepository(db: AppDb) {
  return {
    get(key: string): string | null {
      return db.select().from(kv).where(eq(kv.key, key)).get()?.value ?? null;
    },
    set(key: string, value: string): void {
      db.insert(kv)
        .values({ key, value })
        .onConflictDoUpdate({ target: kv.key, set: { value } })
        .run();
    },
    delete(key: string): void {
      db.delete(kv).where(eq(kv.key, key)).run();
    },
    deleteAll(): void {
      db.delete(kv).run();
    },
  };
}

export type KvRepository = ReturnType<typeof createKvRepository>;
