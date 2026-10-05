import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in server/.env.');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false
});

const client = await pool.connect();
try {
  await client.query(`create table if not exists public.schema_migrations (
    migration_name text primary key,
    applied_at timestamptz not null default now()
  )`);
  const migrationDirectory = fileURLToPath(new URL('../migrations/', import.meta.url));
  const filenames = (await readdir(migrationDirectory))
    .filter((filename) => /^\d+_[a-z0-9_-]+\.sql$/i.test(filename))
    .sort((left, right) => left.localeCompare(right));
  for (const filename of filenames) {
    const applied = await client.query(
      'select 1 from public.schema_migrations where migration_name = $1',
      [filename]
    );
    if (applied.rowCount) {
      console.log(`Already applied: ${filename}`);
      continue;
    }
    if (filename.startsWith('001_')) {
      const existingSchema = await client.query(
        `select to_regclass('public.community_users') is not null
          and to_regclass('public.community_events') is not null as installed`
      );
      if (existingSchema.rows[0].installed) {
        await client.query(
          'insert into public.schema_migrations (migration_name) values ($1)',
          [filename]
        );
        console.log(`Recorded existing initial schema: ${filename}`);
        continue;
      }
    }
    const migration = await readFile(path.join(migrationDirectory, filename), 'utf8');
    try {
      await client.query('begin');
      await client.query(migration);
      await client.query(
        'insert into public.schema_migrations (migration_name) values ($1)',
        [filename]
      );
      await client.query('commit');
      console.log(`Applied: ${filename}`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  }
  console.log('PostgreSQL migrations complete.');
} finally {
  client.release();
  await pool.end();
}
