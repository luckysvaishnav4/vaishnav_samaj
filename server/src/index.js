import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
const jwtSecret = process.env.JWT_SECRET ?? '';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Copy server/.env.example to server/.env.');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false,
  max: 10,
  idleTimeoutMillis: 30000
});
pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error:', error));
const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
const photoDirectory = path.resolve(root, '../uploads/profiles');
await mkdir(photoDirectory, { recursive: true });

const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('This website origin is not allowed by the API CORS policy.'));
  }
}));
app.use(express.json({ limit: '100kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait and try again.' }
});

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const fail = (status, message) => Object.assign(new Error(message), { status });
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const optionalText = (value, maximum, field) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > maximum) throw fail(400, `${field} must be ${maximum} characters or fewer.`);
  return text || null;
};

function validateProfile(input) {
  if (!input || typeof input !== 'object') throw fail(400, 'Profile information is required.');
  const displayName = optionalText(input.display_name, 100, 'Name');
  const city = optionalText(input.city, 120, 'City');
  const gotra = optionalText(input.gotra, 120, 'Gotra');
  const gender = input.gender;
  if (!displayName || !city || !gotra) throw fail(400, 'Name, city, and gotra are required.');
  if (!['Man', 'Woman', 'Prefer not to say'].includes(gender)) throw fail(400, 'Choose a valid gender option.');

  const dob = typeof input.date_of_birth === 'string' ? input.date_of_birth : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(Date.parse(`${dob}T00:00:00Z`))) {
    throw fail(400, 'Enter a valid date of birth.');
  }
  const birthDate = new Date(`${dob}T00:00:00Z`);
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < birthDate.getUTCMonth()
    || (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  if (age < 18) throw fail(400, 'Members must be at least 18 years old.');

  return {
    display_name: displayName,
    gender,
    date_of_birth: dob,
    gotra,
    city,
    education: optionalText(input.education, 200, 'Education'),
    profession: optionalText(input.profession, 200, 'Profession'),
    about: optionalText(input.about, 3000, 'Introduction'),
    family_information: optionalText(input.family_information, 2000, 'Family information')
  };
}

function validateEvent(input) {
  const title = optionalText(input?.title, 200, 'Title');
  const startsAt = Date.parse(input?.starts_at);
  if (!title || Number.isNaN(startsAt)) throw fail(400, 'Event title and a valid start date are required.');
  return {
    title,
    description: optionalText(input.description, 10000, 'Description') ?? '',
    starts_at: new Date(startsAt).toISOString(),
    venue: optionalText(input.venue, 300, 'Venue') ?? '',
    category: optionalText(input.category, 100, 'Category') ?? 'Community',
    image_url: optionalText(input.image_url, 2000, 'Image URL'),
    is_published: input.is_published === true
  };
}

function validateAnnouncement(input) {
  const title = optionalText(input?.title, 200, 'Title');
  const publishedAt = input.published_at ? Date.parse(input.published_at) : Date.now();
  if (!title || Number.isNaN(publishedAt)) throw fail(400, 'Announcement title and a valid publish date are required.');
  return {
    title,
    summary: optionalText(input.summary, 10000, 'Summary') ?? '',
    published_at: new Date(publishedAt).toISOString(),
    is_published: input.is_published === true
  };
}

function validateGotra(input) {
  const name = optionalText(input?.name, 120, 'Gotra name');
  if (!name) throw fail(400, 'Gotra name is required.');
  return {
    name,
    tradition: optionalText(input.tradition, 160, 'Tradition') ?? '',
    description: optionalText(input.description, 1500, 'Description') ?? '',
    is_published: input.is_published !== false,
    sort_order: Number.isInteger(input.sort_order) && input.sort_order >= 0 ? input.sort_order : 0
  };
}

function validateGalleryItem(input) {
  const title = optionalText(input?.title, 200, 'Gallery title');
  const category = optionalText(input?.category, 80, 'Category');
  const imageUrl = optionalText(input?.image_url, 2000, 'Image URL');
  if (!title || !category || !imageUrl) throw fail(400, 'Title, category, and image URL are required.');
  let url;
  try {
    url = new URL(imageUrl);
  } catch {
    throw fail(400, 'Enter a valid image URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw fail(400, 'Image URL must use HTTPS or HTTP.');
  const shape = input.shape ?? '';
  if (!['', 'wide', 'tall'].includes(shape)) throw fail(400, 'Choose a valid gallery image layout.');
  return { title, category, image_url: imageUrl, shape, is_published: input.is_published === true };
}

const sitePageFields = {
  home: {
    kicker: 100,
    titleLine1: 100,
    titleLine2: 100,
    description: 500
  },
  about: {
    bannerKicker: 120,
    bannerTitle: 200,
    bannerDescription: 500,
    introTitle: 160,
    introParagraph1: 1500,
    introParagraph2: 1500,
    quote: 300
  },
  contact: {
    city: 160,
    phone: 80,
    phoneNote: 200,
    whatsapp: 80,
    whatsappNote: 200,
    email: 254,
    emailNote: 200,
    address: 300,
    mapUrl: 2000
  }
};

function validateSitePage(key, value) {
  const fields = sitePageFields[key];
  if (!fields || !value || typeof value !== 'object' || Array.isArray(value)) {
    throw fail(400, 'Choose a valid page and provide its content.');
  }
  const content = {};
  for (const [field, maximum] of Object.entries(fields)) {
    const text = typeof value[field] === 'string' ? value[field].trim() : '';
    if (!text || text.length > maximum) throw fail(400, `${field} is required and must be ${maximum} characters or fewer.`);
    content[field] = text;
  }
  if (key === 'contact') {
    let mapUrl;
    try {
      mapUrl = new URL(content.mapUrl);
    } catch {
      throw fail(400, 'Map URL must be a valid HTTP(S) URL.');
    }
    if (!['http:', 'https:'].includes(mapUrl.protocol)) throw fail(400, 'Map URL must be a valid HTTP(S) URL.');
  }
  return content;
}

function createToken(user) {
  return jwt.sign({ email: user.email }, jwtSecret, {
    subject: user.id,
    issuer: 'vaishnav-samaj-api',
    expiresIn: '8h'
  });
}

const authenticate = asyncRoute(async (req, _res, next) => {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer ([^\s]+)$/.exec(header);
  if (!match) throw fail(401, 'Sign in to continue.');
  let claims;
  try {
    claims = jwt.verify(match[1], jwtSecret, { issuer: 'vaishnav-samaj-api' });
  } catch {
    throw fail(401, 'Your session has expired. Sign in again.');
  }
  if (typeof claims !== 'object' || typeof claims.sub !== 'string') throw fail(401, 'Invalid sign-in session.');
  const result = await pool.query(
    'select id, email, is_admin, is_suspended from community_users where id = $1',
    [claims.sub]
  );
  if (!result.rowCount) throw fail(401, 'This account is no longer active.');
  if (result.rows[0].is_suspended) throw fail(403, 'This account is temporarily suspended. Contact the Samaj office.');
  req.user = result.rows[0];
  next();
});

const requireAdmin = (req, _res, next) => {
  if (!req.user?.is_admin) return next(fail(403, 'Administrator access is required.'));
  next();
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(fail(400, 'Choose a JPEG, PNG, or WebP profile photo.'));
      return;
    }
    callback(null, true);
  }
});

function hasValidImageSignature(file) {
  if (file.mimetype === 'image/jpeg') {
    return file.buffer.length >= 3 && file.buffer[0] === 0xff
      && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  }
  if (file.mimetype === 'image/png') {
    return file.buffer.length >= 8
      && file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return file.mimetype === 'image/webp'
    && file.buffer.length >= 12
    && file.buffer.toString('ascii', 0, 4) === 'RIFF'
    && file.buffer.toString('ascii', 8, 12) === 'WEBP';
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('select 1');
  res.json({ status: 'ok', database: 'connected' });
}));

app.post('/api/auth/register', authLimiter, asyncRoute(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw fail(400, 'Enter a valid email address.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw fail(400, 'Password must be between 8 and 128 characters.');
  }
  const profile = validateProfile(req.body.profile);
  const phone = optionalText(req.body.profile.phone, 30, 'Phone number');
  const passwordHash = await bcrypt.hash(password, 12);
  const db = await pool.connect();
  try {
    await db.query('begin');
    const userResult = await db.query(
      'insert into community_users (email, password_hash) values ($1, $2) returning id, email, is_admin',
      [email, passwordHash]
    );
    const user = userResult.rows[0];
    await db.query(
      `insert into community_profiles
        (id, display_name, gender, date_of_birth, gotra, city, education, profession, about, family_information, is_approved)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)`,
      [user.id, profile.display_name, profile.gender, profile.date_of_birth, profile.gotra, profile.city,
        profile.education, profile.profession, profile.about, profile.family_information]
    );
    await db.query(
      'insert into profile_contacts (profile_id, email, phone) values ($1, $2, $3)',
      [user.id, email, phone]
    );
    await db.query('commit');
    res.status(201).json({ token: createToken(user), user: { id: user.id, email: user.email, isAdmin: user.is_admin } });
  } catch (error) {
    await db.query('rollback');
    if (error.code === '23505') throw fail(409, 'An account with this email address already exists.');
    throw error;
  } finally {
    db.release();
  }
}));

app.post('/api/auth/login', authLimiter, asyncRoute(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  const result = await pool.query(
    'select id, email, password_hash, is_admin, is_suspended from community_users where lower(email) = $1',
    [email]
  );
  const user = result.rows[0];
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password_hash))) {
    throw fail(401, 'Email or password is incorrect.');
  }
  if (user.is_suspended) throw fail(403, 'This account is temporarily suspended. Contact the Samaj office.');
  res.json({ token: createToken(user), user: { id: user.id, email: user.email, isAdmin: user.is_admin } });
}));

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, isAdmin: req.user.is_admin });
});

app.get('/api/events', asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `select title, description, starts_at, venue, category, image_url
     from community_events
     where is_published = true and starts_at >= now()
     order by starts_at asc`
  );
  res.json(result.rows);
}));

app.get('/api/announcements', asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `select title, summary, published_at from community_announcements
     where is_published = true and published_at <= now()
     order by published_at desc`
  );
  res.json(result.rows);
}));

app.get('/api/gotras', asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `select g.id, g.name, g.tradition, g.description,
       count(p.id)::int as members
     from community_gotras g
     left join community_profiles p
       on p.gotra = g.name and p.visibility = 'community' and p.is_approved = true
     left join community_users u on u.id = p.id and u.is_suspended = false
     where g.is_published = true and (p.id is null or u.id is not null)
     group by g.id
     order by g.sort_order, g.name`);
  res.json(result.rows);
}));

app.get('/api/gallery', asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `select id, title, category, image_url, shape
     from community_gallery where is_published = true
     order by created_at desc`
  );
  res.json(result.rows);
}));

app.get('/api/pages/:key', asyncRoute(async (req, res) => {
  if (!sitePageFields[req.params.key]) throw fail(404, 'Website page not found.');
  const result = await pool.query(
    'select content from community_site_pages where page_key = $1',
    [req.params.key]
  );
  if (!result.rowCount) throw fail(404, 'Website page content not found.');
  res.json(result.rows[0].content);
}));

app.get('/api/profiles', authenticate, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `select p.* from community_profiles p
     join community_users u on u.id = p.id and u.is_suspended = false
     where p.visibility = 'community' and p.is_approved = true and p.id <> $1
     order by p.updated_at desc`,
    [req.user.id]
  );
  res.json(result.rows);
}));

app.get('/api/profiles/me', authenticate, asyncRoute(async (req, res) => {
  const result = await pool.query('select * from community_profiles where id = $1', [req.user.id]);
  res.json(result.rows[0] ?? null);
}));

app.put('/api/profiles/me', authenticate, asyncRoute(async (req, res) => {
  const profile = validateProfile(req.body);
  const phone = optionalText(req.body.phone, 30, 'Phone number');
  const db = await pool.connect();
  try {
    await db.query('begin');
    const result = await db.query(
      `update community_profiles set
        display_name = $2, gender = $3, date_of_birth = $4, gotra = $5, city = $6,
        education = $7, profession = $8, about = $9, family_information = $10, updated_at = now()
       where id = $1 returning *`,
      [req.user.id, profile.display_name, profile.gender, profile.date_of_birth, profile.gotra,
        profile.city, profile.education, profile.profession, profile.about, profile.family_information]
    );
    if (!result.rowCount) throw fail(404, 'Create a profile before updating it.');
    await db.query(
      'update profile_contacts set phone = $2, updated_at = now() where profile_id = $1',
      [req.user.id, phone]
    );
    await db.query('commit');
    res.json(result.rows[0]);
  } catch (error) {
    await db.query('rollback');
    throw error;
  } finally {
    db.release();
  }
}));

app.patch('/api/profiles/me/visibility', authenticate, asyncRoute(async (req, res) => {
  const visibility = req.body?.visibility;
  if (!['private', 'community'].includes(visibility)) throw fail(400, 'Choose a valid profile visibility.');
  if (visibility === 'community' && req.body?.shareConsent !== true) {
    throw fail(400, 'Confirm that you consent to share your profile with signed-in community members.');
  }
  const result = await pool.query(
    'update community_profiles set visibility = $2, updated_at = now() where id = $1 returning visibility',
    [req.user.id, visibility]
  );
  if (!result.rowCount) throw fail(404, 'Your community profile could not be found.');
  res.json(result.rows[0]);
}));

app.get('/api/profiles/:id', authenticate, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid profile id.');
  const result = await pool.query(
    `select * from community_profiles where id = $1
     and (id = $2 or (visibility = 'community' and is_approved = true))
     and exists (select 1 from community_users u where u.id = community_profiles.id and u.is_suspended = false)`,
    [req.params.id, req.user.id]
  );
  if (!result.rowCount) throw fail(404, 'This community profile is unavailable.');
  res.json(result.rows[0]);
}));

app.post('/api/profiles/me/photo', authenticate, upload.single('photo'), asyncRoute(async (req, res) => {
  if (!req.file) throw fail(400, 'Choose a profile photo to upload.');
  if (!hasValidImageSignature(req.file)) throw fail(400, 'The selected file is not a valid JPEG, PNG, or WebP image.');
  const profileResult = await pool.query('select photo_path from community_profiles where id = $1', [req.user.id]);
  if (!profileResult.rowCount) throw fail(404, 'Create a profile before uploading a photo.');
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[req.file.mimetype];
  const filename = `${req.user.id}-${randomUUID()}.${extension}`;
  const destination = path.join(photoDirectory, filename);
  await writeFile(destination, req.file.buffer, { flag: 'wx', mode: 0o600 });
  try {
    await pool.query(
      'update community_profiles set photo_path = $2, updated_at = now() where id = $1',
      [req.user.id, filename]
    );
  } catch (error) {
    await unlink(destination).catch((cleanupError) => {
      console.error('Unable to remove an unused profile photo:', cleanupError);
    });
    throw error;
  }
  const oldFilename = profileResult.rows[0].photo_path;
  if (oldFilename) {
    await unlink(path.join(photoDirectory, path.basename(oldFilename))).catch((cleanupError) => {
      console.error('Unable to remove the previous profile photo:', cleanupError);
    });
  }
  res.json({ photo_path: filename });
}));

app.get('/api/profiles/:id/photo', authenticate, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid profile id.');
  const result = await pool.query(
    `select p.photo_path from community_profiles p
     where p.id = $1 and (p.id = $2 or p.visibility = 'community')`,
    [req.params.id, req.user.id]
  );
  const filename = result.rows[0]?.photo_path;
  if (!filename) throw fail(404, 'This profile does not have a shared photo.');
  const safePath = path.join(photoDirectory, path.basename(filename));
  const content = await readFile(safePath);
  const extension = path.extname(safePath).toLowerCase();
  res.type({ '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[extension] ?? 'application/octet-stream');
  res.set('Cache-Control', 'private, no-store');
  res.send(content);
}));

app.post('/api/interests', authenticate, asyncRoute(async (req, res) => {
  const recipientId = req.body?.recipient_id;
  if (!isUuid(recipientId)) throw fail(400, 'Invalid profile id.');
  const recipient = await pool.query(
    `select p.id from community_profiles p join community_users u on u.id = p.id and u.is_suspended = false
     where p.id = $1 and p.visibility = 'community' and p.is_approved = true`,
    [recipientId]
  );
  if (!recipient.rowCount) throw fail(404, 'This member is unavailable for interest requests.');
  try {
    const result = await pool.query(
      'insert into interest_requests (sender_id, recipient_id) values ($1, $2) returning *',
      [req.user.id, recipientId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') throw fail(409, 'You already have a pending interest request for this profile.');
    if (error.code === '23514') throw fail(400, 'You cannot send an interest request to yourself.');
    throw error;
  }
}));

app.get('/api/interests', authenticate, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `select * from interest_requests
     where sender_id = $1 or recipient_id = $1
     order by created_at desc`,
    [req.user.id]
  );
  res.json(result.rows);
}));

app.patch('/api/interests/:id', authenticate, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid interest request id.');
  const status = req.body?.status;
  if (!['accepted', 'declined'].includes(status)) throw fail(400, 'Choose accept or decline.');
  const result = await pool.query(
    `update interest_requests set status = $3, responded_at = now()
     where id = $1 and recipient_id = $2 and status = 'pending'
     returning *`,
    [req.params.id, req.user.id, status]
  );
  if (!result.rowCount) throw fail(404, 'This pending request was not found or cannot be changed.');
  res.json(result.rows[0]);
}));

app.get('/api/admin/overview', authenticate, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `select
      (select count(*)::int from community_users where is_admin = false) as members,
      (select count(*)::int from community_profiles where is_approved = false) as pending_profiles,
      (select count(*)::int from community_events) as events,
      (select count(*)::int from community_announcements) as announcements,
      (select count(*)::int from community_gotras) as gotras,
      (select count(*)::int from community_gallery) as gallery_items`
  );
  res.json(result.rows[0]);
}));

app.get('/api/admin/members', authenticate, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `select p.id, p.display_name, p.gender,
       extract(year from age(current_date, p.date_of_birth))::int as age,
       p.gotra, p.city, p.visibility, p.is_approved, u.is_suspended, p.updated_at
     from community_profiles p
     join community_users u on u.id = p.id and u.is_admin = false
     order by p.updated_at desc`
  );
  res.json(result.rows);
}));

app.patch('/api/admin/members/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid member id.');
  const allowed = ['is_approved', 'is_suspended', 'visibility'];
  if (!req.body || Object.keys(req.body).some((key) => !allowed.includes(key))) {
    throw fail(400, 'Only profile approval, suspension, and visibility can be changed here.');
  }
  const current = await pool.query(
    `select p.id, u.is_admin from community_profiles p
     join community_users u on u.id = p.id where p.id = $1`,
    [req.params.id]
  );
  if (!current.rowCount || current.rows[0].is_admin) throw fail(404, 'Community member not found.');
  const isApproved = req.body.is_approved;
  const isSuspended = req.body.is_suspended;
  const visibility = req.body.visibility;
  if (isApproved !== undefined && typeof isApproved !== 'boolean') throw fail(400, 'Approval must be true or false.');
  if (isSuspended !== undefined && typeof isSuspended !== 'boolean') throw fail(400, 'Suspension must be true or false.');
  if (visibility !== undefined && !['private', 'community'].includes(visibility)) {
    throw fail(400, 'Choose a valid profile visibility.');
  }
  if (isSuspended === true && req.params.id === req.user.id) throw fail(400, 'You cannot suspend your own administrator account.');

  const db = await pool.connect();
  try {
    await db.query('begin');
    const profile = await db.query(
      `update community_profiles set
        is_approved = coalesce($2, is_approved),
        visibility = coalesce($3, visibility),
        updated_at = now()
       where id = $1 returning id, display_name, gender,
         extract(year from age(current_date, date_of_birth))::int as age,
         gotra, city, visibility, is_approved, updated_at`,
      [req.params.id, isApproved ?? null, visibility ?? null]
    );
    if (isSuspended !== undefined) {
      await db.query('update community_users set is_suspended = $2 where id = $1', [req.params.id, isSuspended]);
    }
    await db.query('commit');
    res.json({ ...profile.rows[0], is_suspended: isSuspended ?? false });
  } catch (error) {
    await db.query('rollback');
    throw error;
  } finally {
    db.release();
  }
}));

app.delete('/api/admin/members/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid member id.');
  if (req.params.id === req.user.id) throw fail(400, 'You cannot delete your own administrator account.');
  const result = await pool.query(
    `delete from community_users u where u.id = $1 and u.is_admin = false
     and exists (select 1 from community_profiles p where p.id = u.id)`,
    [req.params.id]
  );
  if (!result.rowCount) throw fail(404, 'Community member not found.');
  res.status(204).end();
}));

app.get('/api/admin/gotras', authenticate, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query('select * from community_gotras order by sort_order, name');
  res.json(result.rows);
}));

app.post('/api/admin/gotras', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const gotra = validateGotra(req.body);
  const result = await pool.query(
    `insert into community_gotras (name, tradition, description, is_published, sort_order)
     values ($1, $2, $3, $4, $5) returning *`,
    [gotra.name, gotra.tradition, gotra.description, gotra.is_published, gotra.sort_order]
  );
  res.status(201).json(result.rows[0]);
}));

app.put('/api/admin/gotras/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid gotra id.');
  const gotra = validateGotra(req.body);
  const result = await pool.query(
    `update community_gotras set name=$2, tradition=$3, description=$4,
     is_published=$5, sort_order=$6, updated_at=now() where id=$1 returning *`,
    [req.params.id, gotra.name, gotra.tradition, gotra.description, gotra.is_published, gotra.sort_order]
  );
  if (!result.rowCount) throw fail(404, 'Gotra not found.');
  res.json(result.rows[0]);
}));

app.delete('/api/admin/gotras/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid gotra id.');
  const result = await pool.query('delete from community_gotras where id=$1', [req.params.id]);
  if (!result.rowCount) throw fail(404, 'Gotra not found.');
  res.status(204).end();
}));

app.get('/api/admin/gallery', authenticate, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query('select * from community_gallery order by created_at desc');
  res.json(result.rows);
}));

app.post('/api/admin/gallery', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const item = validateGalleryItem(req.body);
  const result = await pool.query(
    `insert into community_gallery (title, category, image_url, shape, is_published)
     values ($1, $2, $3, $4, $5) returning *`,
    [item.title, item.category, item.image_url, item.shape, item.is_published]
  );
  res.status(201).json(result.rows[0]);
}));

app.put('/api/admin/gallery/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid gallery item id.');
  const item = validateGalleryItem(req.body);
  const result = await pool.query(
    `update community_gallery set title=$2, category=$3, image_url=$4, shape=$5,
     is_published=$6, updated_at=now() where id=$1 returning *`,
    [req.params.id, item.title, item.category, item.image_url, item.shape, item.is_published]
  );
  if (!result.rowCount) throw fail(404, 'Gallery item not found.');
  res.json(result.rows[0]);
}));

app.delete('/api/admin/gallery/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid gallery item id.');
  const result = await pool.query('delete from community_gallery where id=$1', [req.params.id]);
  if (!result.rowCount) throw fail(404, 'Gallery item not found.');
  res.status(204).end();
}));

app.get('/api/admin/pages/:key', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!sitePageFields[req.params.key]) throw fail(404, 'Website page not found.');
  const result = await pool.query(
    'select content from community_site_pages where page_key=$1',
    [req.params.key]
  );
  if (!result.rowCount) throw fail(404, 'Website page content not found.');
  res.json(result.rows[0].content);
}));

app.put('/api/admin/pages/:key', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const content = validateSitePage(req.params.key, req.body);
  const result = await pool.query(
    `insert into community_site_pages (page_key, content, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (page_key) do update set content=$2::jsonb, updated_at=now()
     returning content`,
    [req.params.key, JSON.stringify(content)]
  );
  res.json(result.rows[0].content);
}));

app.get('/api/admin/events', authenticate, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query('select * from community_events order by starts_at desc');
  res.json(result.rows);
}));

app.post('/api/admin/events', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const event = validateEvent(req.body);
  const result = await pool.query(
    `insert into community_events (title, description, starts_at, venue, category, image_url, is_published)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [event.title, event.description, event.starts_at, event.venue, event.category, event.image_url, event.is_published]
  );
  res.status(201).json(result.rows[0]);
}));

app.put('/api/admin/events/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid event id.');
  const event = validateEvent(req.body);
  const result = await pool.query(
    `update community_events set title=$2, description=$3, starts_at=$4, venue=$5,
     category=$6, image_url=$7, is_published=$8 where id=$1 returning *`,
    [req.params.id, event.title, event.description, event.starts_at, event.venue, event.category,
      event.image_url, event.is_published]
  );
  if (!result.rowCount) throw fail(404, 'Event not found.');
  res.json(result.rows[0]);
}));

app.delete('/api/admin/events/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid event id.');
  const result = await pool.query('delete from community_events where id=$1', [req.params.id]);
  if (!result.rowCount) throw fail(404, 'Event not found.');
  res.status(204).end();
}));

app.get('/api/admin/announcements', authenticate, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query('select * from community_announcements order by published_at desc');
  res.json(result.rows);
}));

app.post('/api/admin/announcements', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const item = validateAnnouncement(req.body);
  const result = await pool.query(
    `insert into community_announcements (title, summary, published_at, is_published)
     values ($1, $2, $3, $4) returning *`,
    [item.title, item.summary, item.published_at, item.is_published]
  );
  res.status(201).json(result.rows[0]);
}));

app.put('/api/admin/announcements/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid announcement id.');
  const item = validateAnnouncement(req.body);
  const result = await pool.query(
    `update community_announcements set title=$2, summary=$3, published_at=$4, is_published=$5
     where id=$1 returning *`,
    [req.params.id, item.title, item.summary, item.published_at, item.is_published]
  );
  if (!result.rowCount) throw fail(404, 'Announcement not found.');
  res.json(result.rows[0]);
}));

app.delete('/api/admin/announcements/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  if (!isUuid(req.params.id)) throw fail(400, 'Invalid announcement id.');
  const result = await pool.query('delete from community_announcements where id=$1', [req.params.id]);
  if (!result.rowCount) throw fail(404, 'Announcement not found.');
  res.status(204).end();
}));

app.use((req, _res, next) => next(fail(404, `No API route for ${req.method} ${req.path}.`)));
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
    ? 413
    : Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error('API request failed:', error);
  res.status(status).json({
    error: status >= 500
      ? 'The server could not complete the request. Check the API logs.'
      : status === 413
        ? 'Profile photos must be 5 MB or smaller.'
        : error.message
  });
});

const server = app.listen(port, host, () => console.log(`Vaishnav Samaj API listening on ${host}:${port}.`));

async function shutdown(signal) {
  console.log(`${signal} received; closing API connections.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
