-- QuéComo · Recipe book (MVP §7, §27): recipes, ingredients, steps, categories, per-user favourites
-- and ratings, and a private photo bucket.
-- Scope: recipes belong to a household and are visible/editable by its members only (§7.3,
-- private by default). Child rows carry household_id with a composite FK so they can never point
-- at a recipe of another household; RLS checks membership on every table.

-- ---------------------------------------------------------------------------
-- Categories (editable, custom per household)
-- ---------------------------------------------------------------------------
create table public.recipe_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index recipe_categories_name_idx
  on public.recipe_categories (household_id, lower(btrim(name)));

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (char_length(description) <= 2000),
  base_servings numeric(6, 2) not null check (base_servings > 0 and base_servings <= 100),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  -- §7.2: active vs passive time are separate so "10 min of work + 35 min oven" is representable.
  active_minutes integer check (active_minutes between 0 and 10000),
  passive_minutes integer check (passive_minutes between 0 and 10000),
  total_minutes integer check (total_minutes between 0 and 20000),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  source_url text check (source_url ~* '^https?://' and char_length(source_url) <= 2000),
  source_author text check (char_length(source_author) <= 120),
  notes text check (char_length(notes) <= 4000),
  storage_notes text check (char_length(storage_notes) <= 1000),
  freezing_notes text check (char_length(freezing_notes) <= 1000),
  reheating_notes text check (char_length(reheating_notes) <= 1000),
  photo_path text check (char_length(photo_path) <= 300),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id)
);

create index recipes_household_idx on public.recipes (household_id, archived_at, updated_at desc);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null,
  household_id uuid not null,
  position integer not null check (position >= 0),
  -- §27: keep what the user typed; quantity/unit are parsed only when safe.
  original_text text not null check (char_length(btrim(original_text)) between 1 and 300),
  quantity numeric(12, 4) check (quantity > 0),
  unit text check (char_length(unit) <= 30),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  -- Qualitative amounts ("al gusto") are never scaled.
  scalable boolean not null default true,
  optional boolean not null default false,
  foreign key (recipe_id, household_id) references public.recipes (id, household_id) on delete cascade
);

create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id, position);

create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null,
  household_id uuid not null,
  position integer not null check (position >= 0),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  timer_minutes integer check (timer_minutes between 1 and 10000),
  foreign key (recipe_id, household_id) references public.recipes (id, household_id) on delete cascade
);

create index recipe_steps_recipe_idx on public.recipe_steps (recipe_id, position);

create table public.recipe_category_links (
  recipe_id uuid not null,
  category_id uuid not null references public.recipe_categories (id) on delete cascade,
  household_id uuid not null,
  primary key (recipe_id, category_id),
  foreign key (recipe_id, household_id) references public.recipes (id, household_id) on delete cascade
);

create index recipe_category_links_category_idx on public.recipe_category_links (category_id);

-- Favourites and ratings are personal (each member has their own).
create table public.recipe_user_state (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  favorite boolean not null default false,
  rating smallint check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create trigger recipe_user_state_set_updated_at
  before update on public.recipe_user_state
  for each row execute function public.set_updated_at();

-- A category link must use a category of the same household.
create or replace function public.check_recipe_category_household()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.recipe_categories c
    where c.id = new.category_id and c.household_id = new.household_id
  ) then
    raise exception 'QC_FORBIDDEN';
  end if;
  return new;
end;
$$;

create trigger recipe_category_links_same_household
  before insert or update on public.recipe_category_links
  for each row execute function public.check_recipe_category_household();

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
alter table public.recipe_categories enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_category_links enable row level security;
alter table public.recipe_user_state enable row level security;

revoke all on public.recipe_categories, public.recipes, public.recipe_ingredients,
  public.recipe_steps, public.recipe_category_links, public.recipe_user_state
  from public, anon, authenticated;

grant select, insert, delete on public.recipe_categories to authenticated;
grant update (name) on public.recipe_categories to authenticated;
-- Recipes are written through save_recipe(); clients may only archive/restore/delete directly.
grant select, delete on public.recipes to authenticated;
grant update (archived_at, photo_path) on public.recipes to authenticated;
grant select on public.recipe_ingredients, public.recipe_steps, public.recipe_category_links
  to authenticated;
grant select, insert, delete on public.recipe_user_state to authenticated;
grant update (favorite, rating) on public.recipe_user_state to authenticated;

create policy "recipe_categories: members read" on public.recipe_categories
  for select to authenticated using (public.is_household_member(household_id));
create policy "recipe_categories: members insert" on public.recipe_categories
  for insert to authenticated with check (public.is_household_member(household_id));
create policy "recipe_categories: members update" on public.recipe_categories
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "recipe_categories: members delete" on public.recipe_categories
  for delete to authenticated using (public.is_household_member(household_id));

create policy "recipes: members read" on public.recipes
  for select to authenticated using (public.is_household_member(household_id));
create policy "recipes: members insert" on public.recipes
  for insert to authenticated with check (public.is_household_member(household_id));
create policy "recipes: members update" on public.recipes
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "recipes: members delete" on public.recipes
  for delete to authenticated using (public.is_household_member(household_id));

create policy "recipe_ingredients: members read" on public.recipe_ingredients
  for select to authenticated using (public.is_household_member(household_id));
create policy "recipe_ingredients: members write" on public.recipe_ingredients
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "recipe_steps: members read" on public.recipe_steps
  for select to authenticated using (public.is_household_member(household_id));
create policy "recipe_steps: members write" on public.recipe_steps
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "recipe_category_links: members read" on public.recipe_category_links
  for select to authenticated using (public.is_household_member(household_id));
create policy "recipe_category_links: members write" on public.recipe_category_links
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "recipe_user_state: own read" on public.recipe_user_state
  for select to authenticated using (user_id = (select auth.uid()));
create policy "recipe_user_state: own insert" on public.recipe_user_state
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id and public.is_household_member(r.household_id)
    )
  );
create policy "recipe_user_state: own update" on public.recipe_user_state
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "recipe_user_state: own delete" on public.recipe_user_state
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- save_recipe: create or update a recipe with its ingredients, steps and categories atomically.
-- SECURITY INVOKER on purpose: every statement runs under the caller's RLS. The function only
-- adds validation and atomicity. Child rows are replaced as a whole (the editor sends the full
-- list), which keeps ordering simple and is cheap at recipe sizes.
-- ---------------------------------------------------------------------------
create or replace function public.save_recipe(p_recipe jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid := nullif(p_recipe ->> 'id', '')::uuid;
  v_household uuid := (p_recipe ->> 'household_id')::uuid;
  v_ingredients jsonb := coalesce(p_recipe -> 'ingredients', '[]'::jsonb);
  v_steps jsonb := coalesce(p_recipe -> 'steps', '[]'::jsonb);
  v_categories jsonb := coalesce(p_recipe -> 'category_ids', '[]'::jsonb);
  v_tags text[];
begin
  if v_uid is null then raise exception 'QC_NOT_AUTHENTICATED'; end if;
  if v_household is null or not public.is_household_member(v_household) then
    raise exception 'QC_FORBIDDEN';
  end if;
  if jsonb_typeof(v_ingredients) <> 'array' or jsonb_array_length(v_ingredients) = 0
     or jsonb_array_length(v_ingredients) > 100 then
    raise exception 'QC_RECIPE_INGREDIENTS';
  end if;
  if jsonb_typeof(v_steps) <> 'array' or jsonb_array_length(v_steps) = 0
     or jsonb_array_length(v_steps) > 100 then
    raise exception 'QC_RECIPE_STEPS';
  end if;
  if jsonb_typeof(v_categories) <> 'array' or jsonb_array_length(v_categories) > 20 then
    raise exception 'QC_FORBIDDEN';
  end if;

  select coalesce(array_agg(distinct btrim(t)) filter (where btrim(t) <> ''), '{}')
    into v_tags
    from jsonb_array_elements_text(coalesce(p_recipe -> 'tags', '[]'::jsonb)) as t;

  if v_id is null then
    insert into public.recipes (
      household_id, title, description, base_servings, difficulty,
      active_minutes, passive_minutes, total_minutes, tags, source_url, source_author, notes,
      storage_notes, freezing_notes, reheating_notes
    ) values (
      v_household, btrim(p_recipe ->> 'title'), nullif(btrim(p_recipe ->> 'description'), ''),
      (p_recipe ->> 'base_servings')::numeric, nullif(p_recipe ->> 'difficulty', ''),
      (p_recipe ->> 'active_minutes')::integer, (p_recipe ->> 'passive_minutes')::integer,
      (p_recipe ->> 'total_minutes')::integer, v_tags,
      nullif(btrim(p_recipe ->> 'source_url'), ''), nullif(btrim(p_recipe ->> 'source_author'), ''),
      nullif(btrim(p_recipe ->> 'notes'), ''), nullif(btrim(p_recipe ->> 'storage_notes'), ''),
      nullif(btrim(p_recipe ->> 'freezing_notes'), ''), nullif(btrim(p_recipe ->> 'reheating_notes'), '')
    )
    returning id into v_id;
  else
    update public.recipes set
      title = btrim(p_recipe ->> 'title'),
      description = nullif(btrim(p_recipe ->> 'description'), ''),
      base_servings = (p_recipe ->> 'base_servings')::numeric,
      difficulty = nullif(p_recipe ->> 'difficulty', ''),
      active_minutes = (p_recipe ->> 'active_minutes')::integer,
      passive_minutes = (p_recipe ->> 'passive_minutes')::integer,
      total_minutes = (p_recipe ->> 'total_minutes')::integer,
      tags = v_tags,
      source_url = nullif(btrim(p_recipe ->> 'source_url'), ''),
      source_author = nullif(btrim(p_recipe ->> 'source_author'), ''),
      notes = nullif(btrim(p_recipe ->> 'notes'), ''),
      storage_notes = nullif(btrim(p_recipe ->> 'storage_notes'), ''),
      freezing_notes = nullif(btrim(p_recipe ->> 'freezing_notes'), ''),
      reheating_notes = nullif(btrim(p_recipe ->> 'reheating_notes'), '')
    where id = v_id and household_id = v_household;
    if not found then raise exception 'QC_FORBIDDEN'; end if;

    delete from public.recipe_ingredients where recipe_id = v_id;
    delete from public.recipe_steps where recipe_id = v_id;
    delete from public.recipe_category_links where recipe_id = v_id;
  end if;

  insert into public.recipe_ingredients (
    recipe_id, household_id, position, original_text, quantity, unit, name, scalable, optional
  )
  select v_id, v_household, (e.ord - 1)::integer,
         btrim(e.value ->> 'original_text'),
         (e.value ->> 'quantity')::numeric,
         nullif(btrim(e.value ->> 'unit'), ''),
         btrim(e.value ->> 'name'),
         coalesce((e.value ->> 'scalable')::boolean, true),
         coalesce((e.value ->> 'optional')::boolean, false)
  from jsonb_array_elements(v_ingredients) with ordinality as e(value, ord);

  insert into public.recipe_steps (recipe_id, household_id, position, body, timer_minutes)
  select v_id, v_household, (e.ord - 1)::integer, btrim(e.value ->> 'body'),
         (e.value ->> 'timer_minutes')::integer
  from jsonb_array_elements(v_steps) with ordinality as e(value, ord);

  insert into public.recipe_category_links (recipe_id, category_id, household_id)
  select distinct v_id, c::uuid, v_household
  from jsonb_array_elements_text(v_categories) as c;

  return v_id;
end;
$$;

revoke all on function public.save_recipe(jsonb) from public, anon;
grant execute on function public.save_recipe(jsonb) to authenticated;

-- save_recipe writes child rows and recipe columns the client can't write directly.
grant insert (household_id, title, description, base_servings, difficulty,
  active_minutes, passive_minutes, total_minutes, tags, source_url, source_author, notes,
  storage_notes, freezing_notes, reheating_notes) on public.recipes to authenticated;
grant update (title, description, base_servings, difficulty, active_minutes, passive_minutes,
  total_minutes, tags, source_url, source_author, notes, storage_notes, freezing_notes,
  reheating_notes) on public.recipes to authenticated;
grant insert, delete on public.recipe_ingredients, public.recipe_steps,
  public.recipe_category_links to authenticated;

-- ---------------------------------------------------------------------------
-- Private photo bucket. Object path: <household_id>/<recipe_id>/<file>. Members only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create or replace function public.can_access_recipe_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (storage.foldername(p_name))[1] ~ '^[0-9a-f-]{36}$'
      then public.is_household_member(((storage.foldername(p_name))[1])::uuid)
    else false
  end;
$$;

revoke all on function public.can_access_recipe_photo(text) from public, anon;
grant execute on function public.can_access_recipe_photo(text) to authenticated;

create policy "recipe-photos: members read" on storage.objects
  for select to authenticated
  using (bucket_id = 'recipe-photos' and public.can_access_recipe_photo(name));
create policy "recipe-photos: members upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-photos' and public.can_access_recipe_photo(name));
create policy "recipe-photos: members update" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-photos' and public.can_access_recipe_photo(name))
  with check (bucket_id = 'recipe-photos' and public.can_access_recipe_photo(name));
create policy "recipe-photos: members delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-photos' and public.can_access_recipe_photo(name));
