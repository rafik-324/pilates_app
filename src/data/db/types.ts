import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from './schema';

/** Synchrone Drizzle-DB (expo-sqlite in der App, sql.js in Tests). */
export type AppDb = BaseSQLiteDatabase<'sync', any, typeof schema>;
