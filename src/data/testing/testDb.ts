import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import { migrations } from '../db/migrations.generated';
import * as schema from '../db/schema';
import type { AppDb } from '../db/types';
import { createRepositories } from '../repositories';

/** Frische In-Memory-DB (sql.js) mit den echten Migrationen, für Repository-Tests. */
export async function createTestRepositories() {
  const SQL = await initSqlJs();
  const sqlite = new SQL.Database();
  sqlite.run('PRAGMA foreign_keys = ON;');
  for (const sql of Object.values(migrations)) {
    for (const statement of sql.split('--> statement-breakpoint')) sqlite.run(statement);
  }
  const db = drizzle(sqlite, { schema }) as unknown as AppDb;
  return { db, repos: createRepositories(db), close: () => sqlite.close() };
}
