#!/usr/bin/env node
/**
 * Bündelt die von drizzle-kit erzeugten SQL-Migrationen (drizzle/) als TypeScript-Modul,
 * damit sie ohne Metro-SQL-Loader in der App und in Jest verfügbar sind.
 * Aufruf nach jeder Schema-Änderung: npm run db:generate
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const journal = JSON.parse(readFileSync(join(root, 'drizzle/meta/_journal.json'), 'utf8'));
rmSync(join(root, 'drizzle/migrations.js'), { force: true });

const migrations = {};
for (const entry of journal.entries) {
  const key = `m${String(entry.idx).padStart(4, '0')}`;
  migrations[key] = readFileSync(join(root, 'drizzle', `${entry.tag}.sql`), 'utf8');
}

const out = `// AUTOMATISCH ERZEUGT von scripts/build-migrations.mjs. Nicht von Hand ändern.
export const journal = ${JSON.stringify(journal, null, 2)};

export const migrations: Record<string, string> = ${JSON.stringify(migrations, null, 2)};

export default { journal, migrations };
`;
writeFileSync(join(root, 'src/data/db/migrations.generated.ts'), out);
console.log(`migrations.generated.ts: ${journal.entries.length} Migration(en)`);
