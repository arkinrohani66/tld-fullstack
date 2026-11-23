import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://ubuntu:ubuntu@localhost:5432/app';
const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'api', 'migrations');

const pool = new pg.Pool({ connectionString: DATABASE_URL });

await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');

const applied = new Set((await pool.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename));
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`↷ ${file} قبلاً اعمال شده`);
    continue;
  }
  const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    await client.query('COMMIT');
    console.log(`✔ ${file} اعمال شد`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

await pool.end();
