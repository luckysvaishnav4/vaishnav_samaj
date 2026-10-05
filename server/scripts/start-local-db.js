import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const pgCtl = 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_ctl.exe';
const dataDirectory = path.join(process.env.LOCALAPPDATA ?? os.homedir(), 'VaishnavSamaj', 'postgres-data');
if (!existsSync(path.join(dataDirectory, 'PG_VERSION'))) {
  throw new Error('Local database is not initialized. Run npm run db:setup first.');
}
execFileSync(pgCtl, [
  '-D', dataDirectory,
  '-l', path.join(dataDirectory, 'postgres.log'),
  '-o', '-h 127.0.0.1 -p 5433',
  'start'
], { stdio: 'inherit' });
