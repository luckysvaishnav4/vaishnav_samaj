create extension if not exists pgcrypto;

create table if not exists community_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists community_users_email_lower_unique
  on community_users (lower(email));

create table if not exists community_profiles (
  id uuid primary key references community_users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  gender text not null check (gender in ('Man', 'Woman', 'Prefer not to say')),
  date_of_birth date not null,
  gotra text not null check (char_length(gotra) between 1 and 120),
  city text not null check (char_length(city) between 1 and 120),
  education text,
  profession text,
  about text check (char_length(about) <= 3000),
  family_information text check (char_length(family_information) <= 2000),
  lifestyle text check (char_length(lifestyle) <= 1000),
  photo_path text,
  visibility text not null default 'private' check (visibility in ('private', 'community')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profile_contacts (
  profile_id uuid primary key references community_profiles(id) on delete cascade,
  email text not null,
  phone text,
  updated_at timestamptz not null default now()
);

create table if not exists interest_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references community_profiles(id) on delete cascade,
  recipient_id uuid not null references community_profiles(id) on delete cascade,
  message text check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint interest_not_self check (sender_id <> recipient_id)
);

create unique index if not exists one_pending_interest_per_pair
  on interest_requests (sender_id, recipient_id)
  where status = 'pending';
create index if not exists interest_requests_member_date_idx
  on interest_requests (recipient_id, created_at desc);

create table if not exists community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  starts_at timestamptz not null,
  venue text not null default '',
  category text not null default 'Community',
  image_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists community_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  summary text not null default '',
  published_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_events_published_date_idx
  on community_events (starts_at) where is_published;
create index if not exists community_announcements_published_date_idx
  on community_announcements (published_at desc) where is_published;
