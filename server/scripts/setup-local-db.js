import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const postgresRoot = 'C:\\Program Files\\PostgreSQL\\17';
const initdb = path.join(postgresRoot, 'bin', 'initdb.exe');
const pgCtl = path.join(postgresRoot, 'bin', 'pg_ctl.exe');
const dataDirectory = path.join(process.env.LOCALAPPDATA ?? os.homedir(), 'VaishnavSamaj', 'postgres-data');
const logPath = path.join(dataDirectory, 'postgres.log');
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
const envExamplePath = fileURLToPath(new URL('../.env.example', import.meta.url));

if (!existsSync(initdb) || !existsSync(pgCtl)) {
  throw new Error(`PostgreSQL 17 binaries were not found under ${postgresRoot}.`);
}
if (existsSync(envPath)) {
  throw new Error('server/.env already exists. Keep its credentials; use npm run api:migrate instead.');
}

mkdirSync(path.dirname(dataDirectory), { recursive: true });
const password = randomBytes(32).toString('hex');
const jwtSecret = randomBytes(48).toString('hex');
const passwordFile = path.join(os.tmpdir(), `vaishnav-postgres-${randomBytes(12).toString('hex')}.txt`);

try {
  if (existsSync(path.join(dataDirectory, 'PG_VERSION'))) {
    throw new Error('A local database data directory already exists. It was left untouched; ask before resetting it.');
  }
  mkdirSync(dataDirectory, { recursive: true });
  writeFileSync(passwordFile, password, { flag: 'wx' });
  execFileSync(initdb, [
    '-D', dataDirectory,
    '-U', 'vaishnav_app',
    '--auth=scram-sha-256',
    '--pwfile', passwordFile,
    '--encoding=UTF8'
  ], { stdio: 'inherit' });
  const example = readFileSync(envExamplePath, 'utf8');
  const env = example
    .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=postgresql://vaishnav_app:${password}@127.0.0.1:5433/postgres`)
    .replace(/^DATABASE_SSL=.*$/m, 'DATABASE_SSL=false')
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${jwtSecret}`);
  writeFileSync(envPath, env, { flag: 'wx', mode: 0o600 });
  execFileSync(pgCtl, [
    '-D', dataDirectory,
    '-l', logPath,
    '-o', '-h 127.0.0.1 -p 5433',
    'start'
  ], { stdio: 'inherit' });
  console.log('A private PostgreSQL development database is running on 127.0.0.1:5433.');
  console.log('Generated database/JWT credentials were saved only to the ignored server/.env file.');
} catch (error) {
  if (!existsSync(envPath) && existsSync(path.join(dataDirectory, 'PG_VERSION'))) {
    rmSync(dataDirectory, { recursive: true, force: true });
  } else if (!existsSync(path.join(dataDirectory, 'PG_VERSION'))) {
    rmSync(dataDirectory, { recursive: true, force: true });
  }
  throw error;
} finally {
  rmSync(passwordFile, { force: true });
}
