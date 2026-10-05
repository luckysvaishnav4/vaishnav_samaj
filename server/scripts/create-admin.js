import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in server/.env.');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false
});

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
      reject(new Error('Run this command in an interactive terminal so the password can be hidden.'));
      return;
    }

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = '';
    const onData = (chunk) => {
      const key = chunk.toString();
      if (key === '\u0003') {
        process.stdin.setRawMode(false);
        process.exit(130);
      }
      if (key === '\r' || key === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.off('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
      } else if (!key.startsWith('\u001b')) {
        value += key;
      }
    };
    process.stdin.on('data', onData);
  });
}

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Usage: npm run create-admin -- admin@example.com');
}

try {
  const password = await readHidden('Admin password (minimum 10 characters): ');
  if (password.length < 10) throw new Error('Admin password must contain at least 10 characters.');
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `insert into community_users (email, password_hash, is_admin)
     values ($1, $2, true)
     on conflict (lower(email))
     do update set is_admin = true`,
    [email, hash]
  );
  console.log(`Admin account is ready for ${email}. The password was not printed.`);
} finally {
  await pool.end();
}
