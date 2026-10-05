create table public.community_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.community_admins enable row level security;

create function public.is_community_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.community_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_community_admin() from public;
grant execute on function public.is_community_admin() to authenticated;

create policy "Community admins can read all events"
  on public.community_events for select to authenticated
  using (public.is_community_admin());
create policy "Community admins can create events"
  on public.community_events for insert to authenticated
  with check (public.is_community_admin());
create policy "Community admins can update events"
  on public.community_events for update to authenticated
  using (public.is_community_admin())
  with check (public.is_community_admin());
create policy "Community admins can delete events"
  on public.community_events for delete to authenticated
  using (public.is_community_admin());

create policy "Community admins can read all announcements"
  on public.community_announcements for select to authenticated
  using (public.is_community_admin());
create policy "Community admins can create announcements"
  on public.community_announcements for insert to authenticated
  with check (public.is_community_admin());
create policy "Community admins can update announcements"
  on public.community_announcements for update to authenticated
  using (public.is_community_admin())
  with check (public.is_community_admin());
create policy "Community admins can delete announcements"
  on public.community_announcements for delete to authenticated
  using (public.is_community_admin());
