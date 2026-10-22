import { asc, eq } from 'drizzle-orm';
import { reminders } from '../db/schema';
import type { AppDb } from '../db/types';
import { parseJsonArray } from './json';

export type Reminder = {
  id: number;
  uhrzeit: string; // HH:MM
  wochentage: number[]; // 1 = Montag ... 7 = Sonntag
  aktiv: boolean;
  notificationIds: string[];
};

function fromRow(r: typeof reminders.$inferSelect): Reminder {
  return {
    id: r.id,
    uhrzeit: r.uhrzeit,
    wochentage: parseJsonArray<number>(r.wochentage),
    aktiv: r.aktiv,
    notificationIds: parseJsonArray<string>(r.notificationIds),
  };
}

export function createReminderRepository(db: AppDb) {
  return {
    list(): Reminder[] {
      return db.select().from(reminders).orderBy(asc(reminders.uhrzeit)).all().map(fromRow);
    },
    add(input: { uhrzeit: string; wochentage: number[]; aktiv?: boolean }): Reminder {
      const row = db
        .insert(reminders)
        .values({
          uhrzeit: input.uhrzeit,
          wochentage: JSON.stringify(input.wochentage),
          aktiv: input.aktiv ?? true,
        })
        .returning()
        .get();
      return fromRow(row);
    },
    update(id: number, patch: Partial<Omit<Reminder, 'id'>>): void {
      db.update(reminders)
        .set({
          ...(patch.uhrzeit !== undefined ? { uhrzeit: patch.uhrzeit } : {}),
          ...(patch.wochentage !== undefined
            ? { wochentage: JSON.stringify(patch.wochentage) }
            : {}),
          ...(patch.aktiv !== undefined ? { aktiv: patch.aktiv } : {}),
          ...(patch.notificationIds !== undefined
            ? { notificationIds: JSON.stringify(patch.notificationIds) }
            : {}),
        })
        .where(eq(reminders.id, id))
        .run();
    },
    delete(id: number): void {
      db.delete(reminders).where(eq(reminders.id, id)).run();
    },
    deleteAll(): void {
      db.delete(reminders).run();
    },
  };
}

export type ReminderRepository = ReturnType<typeof createReminderRepository>;
