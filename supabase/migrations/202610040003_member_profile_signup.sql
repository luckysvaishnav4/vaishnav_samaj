create function public.protect_adult_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.date_of_birth > (current_date - interval '18 years')::date then
    raise exception 'Community profiles are available only to adults aged 18 or older';
  end if;
  return new;
end;
$$;

create trigger protect_adult_profile
  before insert or update of date_of_birth on public.community_profiles
  for each row execute function public.protect_adult_profile();

create function public.create_community_profile_for_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile jsonb := new.raw_user_meta_data -> 'community_profile';
begin
  if profile is null then
    return new;
  end if;
  if jsonb_typeof(profile) <> 'object' then
    raise exception 'Community profile metadata must be an object';
  end if;

  insert into public.community_profiles (
    id, display_name, gender, date_of_birth, gotra, city, education,
    profession, about, family_information, visibility
  ) values (
    new.id,
    btrim(profile ->> 'display_name'),
    profile ->> 'gender',
    (profile ->> 'date_of_birth')::date,
    btrim(profile ->> 'gotra'),
    btrim(profile ->> 'city'),
    nullif(btrim(profile ->> 'education'), ''),
    nullif(btrim(profile ->> 'profession'), ''),
    nullif(btrim(profile ->> 'about'), ''),
    nullif(btrim(profile ->> 'family_information'), ''),
    'private'
  );

  insert into public.profile_contacts (profile_id, email, phone)
  values (new.id, new.email, nullif(btrim(profile ->> 'phone'), ''));

  return new;
end;
$$;

revoke all on function public.create_community_profile_for_signup() from public;

create trigger create_community_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_community_profile_for_signup();
