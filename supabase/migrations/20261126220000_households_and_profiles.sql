-- QuéComo · Profiles, households, membership, invitations and dietary preferences.
-- Security model: every table has RLS enabled. Membership changes only happen through
-- SECURITY DEFINER RPCs that validate auth.uid(), roles and parameters (see docs/ARCHITECTURE.md).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  avatar_path text,
  locale text not null default 'es-ES' check (locale in ('es-ES', 'en-GB')),
  timezone text not null default 'Europe/Madrid' check (char_length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Creates the profile when a user signs up. Name and locale come from sign-up metadata and are
-- sanitised here because user metadata is client-controlled.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  v_locale text := coalesce(new.raw_user_meta_data ->> 'locale', 'es-ES');
begin
  if v_name = '' then
    v_name := split_part(coalesce(new.email, 'QuéComo'), '@', 1);
  end if;
  if v_locale not in ('es-ES', 'en-GB') then
    v_locale := 'es-ES';
  end if;
  insert into public.profiles (id, display_name, locale)
  values (new.id, left(v_name, 60), v_locale);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Households and membership
-- ---------------------------------------------------------------------------
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_id_idx on public.household_members (user_id);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  token_hash text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index household_invitations_household_idx on public.household_invitations (household_id);

-- Membership helpers. SECURITY DEFINER avoids recursive RLS evaluation on household_members.
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = p_household_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_household_owner(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

create or replace function public.shares_household_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members mine
    join public.household_members theirs on theirs.household_id = mine.household_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
  );
$$;

revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.is_household_owner(uuid) from public, anon;
revoke all on function public.shares_household_with(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;
grant execute on function public.shares_household_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Dietary preferences (personal, never shared through the household)
-- ---------------------------------------------------------------------------
create table public.user_dietary_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('preference', 'restriction')),
  preset_key text check (
    preset_key in (
      'vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'quick', 'budget',
      'low_prep', 'batch_cooking', 'freezer_friendly', 'make_ahead'
    )
  ),
  custom_label text check (char_length(btrim(custom_label)) between 1 and 40),
  created_at timestamptz not null default now(),
  check ((preset_key is null) <> (custom_label is null))
);

create unique index user_dietary_preferences_preset_uidx
  on public.user_dietary_preferences (user_id, preset_key) where preset_key is not null;
create unique index user_dietary_preferences_custom_uidx
  on public.user_dietary_preferences (user_id, lower(custom_label)) where custom_label is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.user_dietary_preferences enable row level security;

revoke all on public.profiles, public.households, public.household_members,
  public.household_invitations, public.user_dietary_preferences from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_path, locale, timezone) on public.profiles to authenticated;
grant select on public.households to authenticated;
grant update (name) on public.households to authenticated;
grant select on public.household_members to authenticated;
grant select on public.household_invitations to authenticated;
grant select, insert, delete on public.user_dietary_preferences to authenticated;

create policy "profiles: read own or household mates" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_household_with(id));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "households: members read" on public.households
  for select to authenticated
  using (public.is_household_member(id));

create policy "households: owners rename" on public.households
  for update to authenticated
  using (public.is_household_owner(id))
  with check (public.is_household_owner(id));

create policy "household_members: members read" on public.household_members
  for select to authenticated
  using (public.is_household_member(household_id));

create policy "household_invitations: members read" on public.household_invitations
  for select to authenticated
  using (public.is_household_member(household_id));

create policy "dietary preferences: own read" on public.user_dietary_preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy "dietary preferences: own insert" on public.user_dietary_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "dietary preferences: own delete" on public.user_dietary_preferences
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Household RPCs (transactional, validated server-side)
-- Errors use stable codes in the message (e.g. 'QC_NOT_OWNER') that the client maps to i18n.
-- ---------------------------------------------------------------------------
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 60 then
    raise exception 'QC_INVALID_NAME';
  end if;
  if (select count(*) from public.household_members where user_id = v_uid) >= 20 then
    raise exception 'QC_TOO_MANY_HOUSEHOLDS';
  end if;
  insert into public.households (name, created_by) values (btrim(p_name), v_uid) returning id into v_id;
  insert into public.household_members (household_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
end;
$$;

create or replace function public.create_household_invitation(p_household_id uuid)
returns table (invitation_id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
  v_id uuid;
  v_expires timestamptz := now() + interval '7 days';
begin
  if v_uid is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  if not public.is_household_member(p_household_id) then raise exception 'QC_FORBIDDEN'; end if;
  if (
    select count(*) from public.household_invitations i
    where i.household_id = p_household_id
      and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
  ) >= 20 then
    raise exception 'QC_TOO_MANY_INVITATIONS';
  end if;
  -- 32 random bytes, URL-safe. Only the SHA-256 hash is stored.
  v_token := translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
  insert into public.household_invitations (household_id, token_hash, invited_by, expires_at)
  values (p_household_id, encode(extensions.digest(v_token, 'sha256'), 'hex'), v_uid, v_expires)
  returning id into v_id;
  return query select v_id, v_token, v_expires;
end;
$$;

create or replace function public.get_invitation_preview(p_token text)
returns table (household_name text, invited_by_name text, status text, already_member boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inv public.household_invitations;
begin
  if auth.uid() is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  if p_token is null or char_length(p_token) > 100 then raise exception 'QC_INVITATION_INVALID'; end if;
  select * into v_inv from public.household_invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  if not found then raise exception 'QC_INVITATION_INVALID'; end if;
  return query
  select h.name,
         p.display_name,
         case
           when v_inv.revoked_at is not null then 'revoked'
           when v_inv.accepted_at is not null then 'accepted'
           when v_inv.expires_at <= now() then 'expired'
           else 'pending'
         end,
         public.is_household_member(v_inv.household_id)
  from public.households h
  left join public.profiles p on p.id = v_inv.invited_by
  where h.id = v_inv.household_id;
end;
$$;

create or replace function public.accept_household_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.household_invitations;
begin
  if v_uid is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  if p_token is null or char_length(p_token) > 100 then raise exception 'QC_INVITATION_INVALID'; end if;
  select * into v_inv from public.household_invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'QC_INVITATION_INVALID'; end if;
  if v_inv.revoked_at is not null then raise exception 'QC_INVITATION_REVOKED'; end if;
  if v_inv.accepted_at is not null then raise exception 'QC_INVITATION_USED'; end if;
  if v_inv.expires_at <= now() then raise exception 'QC_INVITATION_EXPIRED'; end if;
  if exists (
    select 1 from public.household_members
    where household_id = v_inv.household_id and user_id = v_uid
  ) then
    raise exception 'QC_ALREADY_MEMBER';
  end if;
  insert into public.household_members (household_id, user_id, role)
  values (v_inv.household_id, v_uid, 'member');
  update public.household_invitations
  set accepted_at = now(), accepted_by = v_uid
  where id = v_inv.id;
  return v_inv.household_id;
end;
$$;

create or replace function public.revoke_household_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.household_invitations;
begin
  if auth.uid() is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  select * into v_inv from public.household_invitations where id = p_invitation_id for update;
  if not found or not public.is_household_member(v_inv.household_id) then
    raise exception 'QC_FORBIDDEN';
  end if;
  if v_inv.invited_by is distinct from auth.uid() and not public.is_household_owner(v_inv.household_id) then
    raise exception 'QC_NOT_OWNER';
  end if;
  if v_inv.accepted_at is not null then raise exception 'QC_INVITATION_USED'; end if;
  update public.household_invitations set revoked_at = coalesce(revoked_at, now()) where id = v_inv.id;
end;
$$;

create or replace function public.leave_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
begin
  if v_uid is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  select role into v_role from public.household_members
  where household_id = p_household_id and user_id = v_uid
  for update;
  if not found then raise exception 'QC_FORBIDDEN'; end if;
  if v_role = 'owner' and (
    select count(*) from public.household_members
    where household_id = p_household_id and role = 'owner'
  ) = 1 then
    raise exception 'QC_LAST_OWNER';
  end if;
  delete from public.household_members where household_id = p_household_id and user_id = v_uid;
end;
$$;

create or replace function public.remove_household_member(p_household_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  if not public.is_household_owner(p_household_id) then raise exception 'QC_NOT_OWNER'; end if;
  if p_user_id = auth.uid() then raise exception 'QC_USE_LEAVE'; end if;
  delete from public.household_members
  where household_id = p_household_id and user_id = p_user_id;
  if not found then raise exception 'QC_NOT_A_MEMBER'; end if;
end;
$$;

create or replace function public.transfer_household_ownership(p_household_id uuid, p_new_owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  if not public.is_household_owner(p_household_id) then raise exception 'QC_NOT_OWNER'; end if;
  if p_new_owner = v_uid then raise exception 'QC_INVALID_TARGET'; end if;
  perform 1 from public.household_members
  where household_id = p_household_id and user_id in (v_uid, p_new_owner)
  for update;
  update public.household_members set role = 'owner'
  where household_id = p_household_id and user_id = p_new_owner;
  if not found then raise exception 'QC_NOT_A_MEMBER'; end if;
  update public.household_members set role = 'member'
  where household_id = p_household_id and user_id = v_uid;
end;
$$;

create or replace function public.delete_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  if not public.is_household_owner(p_household_id) then raise exception 'QC_NOT_OWNER'; end if;
  delete from public.households where id = p_household_id;
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.create_household(text)',
    'public.create_household_invitation(uuid)',
    'public.get_invitation_preview(text)',
    'public.accept_household_invitation(text)',
    'public.revoke_household_invitation(uuid)',
    'public.leave_household(uuid)',
    'public.remove_household_member(uuid, uuid)',
    'public.transfer_household_ownership(uuid, uuid)',
    'public.delete_household(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;
