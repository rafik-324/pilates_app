import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { ENCRYPTION_REQUESTED, getOrCreateDbKey, isExpoGo } from './encryption';
import { journal, migrations } from './migrations.generated';
import * as schema from './schema';
import type { AppDb } from './types';

const DB_NAME = 'pilates.db';

let instance: { raw: SQLiteDatabase; db: AppDb } | null = null;

/**
 * Öffnet die lokale DB, wendet bei Bedarf die Verschlüsselung an und führt Migrationen aus.
 * In Expo Go gibt es kein SQLCipher: dort läuft die DB unverschlüsselt (Hinweis im Log).
 */
export async function openDb(): Promise<AppDb> {
  if (instance) return instance.db;
  const raw = openDatabaseSync(DB_NAME);

  if (ENCRYPTION_REQUESTED) {
    if (isExpoGo()) {
      console.warn(
        '[DB] Expo Go: SQLCipher nicht verfügbar, die lokale Datenbank ist unverschlüsselt.',
      );
    } else {
      try {
        const key = await getOrCreateDbKey();
        raw.execSync(`PRAGMA key = "x'${key}'";`);
        const row = raw.getFirstSync<{ cipher_version: string }>('PRAGMA cipher_version;');
        if (!row?.cipher_version) {
          console.warn(
            '[DB] SQLCipher nicht im Build enthalten, die Datenbank ist unverschlüsselt.',
          );
        }
      } catch (e) {
        console.warn('[DB] Verschlüsselung konnte nicht aktiviert werden:', e);
      }
    }
  }

  raw.execSync('PRAGMA journal_mode = WAL;');
  raw.execSync('PRAGMA foreign_keys = ON;');
  const db = drizzle(raw, { schema }) as unknown as AppDb;
  await migrate(db as unknown as ReturnType<typeof drizzle>, { journal, migrations });
  instance = { raw, db };
  return db;
}
