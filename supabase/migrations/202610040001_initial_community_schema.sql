create extension if not exists pgcrypto;

create table public.community_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  gender text not null check (gender in ('Man', 'Woman', 'Prefer not to say')),
  date_of_birth date not null check (date_of_birth <= current_date),
  gotra text not null,
  city text not null check (char_length(city) between 1 and 120),
  education text,
  profession text,
  about text check (char_length(about) <= 3000),
  family_information text check (char_length(family_information) <= 2000),
  lifestyle text check (char_length(lifestyle) <= 1000),
  photo_path text,
  visibility text not null default 'private'
    check (visibility in ('private', 'community')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_contacts (
  profile_id uuid primary key references public.community_profiles (id) on delete cascade,
  email text,
  phone text,
  updated_at timestamptz not null default now()
);

create table public.interest_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.community_profiles (id) on delete cascade,
  recipient_id uuid not null references public.community_profiles (id) on delete cascade,
  message text check (char_length(message) <= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint interest_not_self check (sender_id <> recipient_id)
);

create unique index one_pending_interest_per_pair
  on public.interest_requests (sender_id, recipient_id)
  where status = 'pending';

create table public.community_events (
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

create table public.community_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  summary text not null default '',
  published_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index interest_requests_recipient_status_idx
  on public.interest_requests (recipient_id, status, created_at desc);
create index community_events_published_date_idx
  on public.community_events (starts_at)
  where is_published;
create index community_announcements_published_date_idx
  on public.community_announcements (published_at desc)
  where is_published;

alter table public.community_profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.interest_requests enable row level security;
alter table public.community_events enable row level security;
alter table public.community_announcements enable row level security;

create policy "Members can read community-visible profiles"
  on public.community_profiles for select to authenticated
  using (visibility = 'community' or id = (select auth.uid()));
create policy "Members can create their own profile"
  on public.community_profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "Members can update their own profile"
  on public.community_profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy "Members can delete their own profile"
  on public.community_profiles for delete to authenticated
  using (id = (select auth.uid()));

create policy "Members can read their own private contact details"
  on public.profile_contacts for select to authenticated
  using (profile_id = (select auth.uid()));
create policy "Members can create their own private contact details"
  on public.profile_contacts for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "Members can update their own private contact details"
  on public.profile_contacts for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
create policy "Members can delete their own private contact details"
  on public.profile_contacts for delete to authenticated
  using (profile_id = (select auth.uid()));

create policy "Members can read interests they sent or received"
  on public.interest_requests for select to authenticated
  using (
    sender_id = (select auth.uid()) or recipient_id = (select auth.uid())
  );
create policy "Members can send interest requests as themselves"
  on public.interest_requests for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.community_profiles p
      where p.id = recipient_id and p.visibility = 'community'
    )
  );
create policy "Recipients can respond to their interest requests"
  on public.interest_requests for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create function public.protect_interest_request_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.sender_id is distinct from old.sender_id
    or new.recipient_id is distinct from old.recipient_id
    or new.message is distinct from old.message
    or new.created_at is distinct from old.created_at then
    raise exception 'Interest request details cannot be changed';
  end if;

  if auth.uid() is distinct from old.recipient_id
    or old.status <> 'pending'
    or new.status not in ('accepted', 'declined') then
    raise exception 'Only the recipient can respond to a pending interest request';
  end if;

  new.responded_at := now();
  return new;
end;
$$;

create trigger protect_interest_request_update
  before update on public.interest_requests
  for each row execute function public.protect_interest_request_update();

create policy "Anyone can read published events"
  on public.community_events for select to anon, authenticated
  using (is_published);
create policy "Anyone can read published announcements"
  on public.community_announcements for select to anon, authenticated
  using (is_published);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Members can read photos of community-visible profiles"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and exists (
      select 1
      from public.community_profiles p
      where p.id::text = (storage.foldername(name))[1]
        and (p.visibility = 'community' or p.id = (select auth.uid()))
    )
  );
create policy "Members can upload their own profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Members can update their own profile photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Members can delete their own profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
