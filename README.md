# Vaishnav Samaj

A responsive Angular community and matrimonial application backed by a Node.js REST API and PostgreSQL. The browser never connects directly to PostgreSQL.

## Local requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer, running locally or at a trusted database host

## Run locally

Install the Angular and API dependencies:

```sh
npm install
npm install --prefix server
```

On Windows with PostgreSQL 17 installed at `C:\Program Files\PostgreSQL\17`, initialize an isolated development database without changing the existing PostgreSQL service or needing its password:

```sh
npm run db:setup
```

It creates a private database cluster under your Windows user profile, runs it on port `5433`, and stores randomly generated credentials in the ignored `server/.env`. The existing PostgreSQL service and its data are not modified.

For another PostgreSQL installation or a hosted database, instead create `server/.env` from `server/.env.example`, create a database named `vaishnav_samaj`, and set its connection details in `DATABASE_URL`:

```powershell
Copy-Item server\.env.example server\.env
```

Set a unique `JWT_SECRET` of at least 32 characters. Keep `server/.env` private; it contains the database password and signing secret and is excluded from Git.

Create the tables in the PostgreSQL database:

```sh
npm run api:migrate
```

Open two terminals in the project folder. Start the API in the first and Angular in the second:

```sh
npm run api:dev
```

```sh
npm start
```

Angular runs at `http://127.0.0.1:4300` and proxies `/api` requests to the API on port `3000`. Check `http://127.0.0.1:3000/api/health` for API/database connectivity.

For the isolated development database, use `npm run db:start` and `npm run db:stop` to start and stop it later.

## Create an administrator

After the database migration, run the command below. The password is entered without being displayed:

```sh
npm run api:create-admin -- admin@example.com
```

Then sign in at `/admin/login`. Admin privileges are checked by the API on every protected request.

## Configure the API URL

The Angular app reads `src/config/api-config.json`. It defaults to `/api`, which is recommended when a reverse proxy routes the same website host's `/api` path to the Node server. For a separately hosted API, set `apiBaseUrl` to its HTTPS URL and set `FRONTEND_ORIGINS` on the server to the exact website origins allowed to call the API. Rebuild the Angular app after changing the runtime config.

For a hosted PostgreSQL database, enable TLS with `DATABASE_SSL=true` (certificate validation is on by default). Use a private database network/allowlist where possible; never put the PostgreSQL URL or `JWT_SECRET` in Angular configuration. If a provider requires an untrusted certificate, prefer configuring its CA; only use `DATABASE_SSL_REJECT_UNAUTHORIZED=false` when you understand that server certificate verification is disabled.

The API binds only to `127.0.0.1` by default for local development. When deploying in a container or hosted service, set `HOST=0.0.0.0` and keep the database private behind the provider's network controls.

## Features and privacy

- Public endpoints show only published events and announcements.
- Registration creates a password-hashed account and private-by-default member profile; the user is immediately signed in.
- Member directories require authentication and show only profiles whose owners explicitly selected community visibility.
- Email and phone are stored separately from profile listings and are not returned by directory/profile endpoints.
- Profile photos are limited to JPEG, PNG, and WebP up to 5 MB and are served only to the owner or signed-in members when the profile is community-visible.
- Interest requests are private; only their recipient can accept or decline them.
- Admin-only content management covers events and announcements.
- API authentication uses short-lived bearer sessions, per-IP sign-in throttling, Helmet headers, CORS allowlists, SQL parameters, and server-side validation.

Email verification, password recovery, profile verification/moderation, contact-form delivery, and real-time matching are not implemented. Since email verification is disabled, registration does not prove that the registrant owns the email address. Add verification and account recovery before using this for a public production launch.

Uploaded photos are stored on the API server's local disk. Many cloud hosts use temporary disks; configure persistent private storage before deploying there or uploads can be lost when the server restarts.

## Existing Supabase project and data

The app no longer connects to Supabase. The existing Supabase project and its data are not deleted, but they are not automatically copied into the new PostgreSQL database. Supabase Auth password hashes cannot be reused by this custom auth service; members will need to create accounts again. The historical `supabase/migrations/` files are retained for reference and are not used by the new API.

## Site content

The gotra directory contains the community list supplied for this site; entries without confirmed sampradaya information are labelled accordingly. Contact details shown on the contact page are placeholders and must be replaced with verified Samaj office information. Gallery content is illustrative. Publish real member and event information only with the Samaj's approval.
