-- QuéComo · Smart recipe classification (rules engine runs in the client, see ADR 0008).
-- Extends 20261127120000_recipe_catalogs.sql without removing data:
--   * keywords[] on household custom categories/tags/utensils, used by the classifier.
--     Only OWNERS write them: the existing owner-only insert/update policies already apply.
--   * recipes.dismissed_suggestions: suggestions a person rejected, so re-analysing never
--     selects them again. Not used by any filter.
--   * recipe_optional_utensils: utensils mentioned as optional. They never make a recipe
--     "not doable", whatever the equipment status.
--   * save_recipe v3: same signature, backward compatible (new optional keys
--     "dismissed_suggestions" and "optional_utensils"; each replaces its set only when present).

-- ---------------------------------------------------------------------------
-- Keywords on custom catalog items
-- ---------------------------------------------------------------------------
alter table public.recipe_categories
  add column keywords text[] not null default '{}'
    check (cardinality(keywords) <= 20 and char_length(array_to_string(keywords, '|')) <= 800);
alter table public.household_tags
  add column keywords text[] not null default '{}'
    check (cardinality(keywords) <= 20 and char_length(array_to_string(keywords, '|')) <= 800);
alter table public.household_utensils
  add column keywords text[] not null default '{}'
    check (cardinality(keywords) <= 20 and char_length(array_to_string(keywords, '|')) <= 800);

-- recipe_categories already grants insert on every column; tags and utensils grant columns.
grant insert (keywords) on public.household_tags, public.household_utensils to authenticated;
grant update (keywords) on public.recipe_categories, public.household_tags,
  public.household_utensils to authenticated;

-- ---------------------------------------------------------------------------
-- Rejected suggestions (per recipe, shared by the household)
-- ---------------------------------------------------------------------------
alter table public.recipes
  add column dismissed_suggestions text[] not null default '{}'
    check (cardinality(dismissed_suggestions) <= 100
           and char_length(array_to_string(dismissed_suggestions, '|')) <= 6000);
grant insert (dismissed_suggestions), update (dismissed_suggestions)
  on public.recipes to authenticated;

-- ---------------------------------------------------------------------------
-- Optional utensils
-- ---------------------------------------------------------------------------
create table public.recipe_optional_utensils (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null,
  household_id uuid not null,
  utensil_def_id text references public.utensil_definitions (id) on delete cascade,
  household_utensil_id uuid,
  check (num_nonnulls(utensil_def_id, household_utensil_id) = 1),
  foreign key (recipe_id, household_id) references public.recipes (id, household_id) on delete cascade,
  foreign key (household_utensil_id, household_id)
    references public.household_utensils (id, household_id) on delete cascade
);
create unique index recipe_optional_utensils_def_idx
  on public.recipe_optional_utensils (recipe_id, utensil_def_id) where utensil_def_id is not null;
create unique index recipe_optional_utensils_custom_idx
  on public.recipe_optional_utensils (recipe_id, household_utensil_id)
  where household_utensil_id is not null;
create index recipe_optional_utensils_household_idx
  on public.recipe_optional_utensils (household_id);

alter table public.recipe_optional_utensils enable row level security;
revoke all on public.recipe_optional_utensils from public, anon, authenticated;
grant select, insert, delete on public.recipe_optional_utensils to authenticated;
create policy "recipe_optional_utensils: members" on public.recipe_optional_utensils
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- save_recipe v3
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
  v_categories jsonb;
  v_tag_links jsonb := p_recipe -> 'tag_links';
  v_methods jsonb := coalesce(p_recipe -> 'methods', '[]'::jsonb);
  v_equipment text := p_recipe ->> 'equipment_status';
  v_has_tags boolean := p_recipe ? 'tags';
  v_has_dismissed boolean := p_recipe ? 'dismissed_suggestions';
  v_dismissed text[];
  v_optional jsonb := p_recipe -> 'optional_utensils';
  v_tags text[];
  v_method jsonb;
  v_method_ord bigint;
  v_method_id uuid;
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

  -- Categories: new format, or the v1 list of custom category ids.
  if p_recipe ? 'categories' then
    v_categories := p_recipe -> 'categories';
  else
    select coalesce(jsonb_agg(jsonb_build_object('custom', c)), '[]'::jsonb) into v_categories
    from jsonb_array_elements_text(coalesce(p_recipe -> 'category_ids', '[]'::jsonb)) as c;
  end if;
  if jsonb_typeof(v_categories) <> 'array' or jsonb_array_length(v_categories) > 20 then
    raise exception 'QC_FORBIDDEN';
  end if;
  if v_tag_links is not null
     and (jsonb_typeof(v_tag_links) <> 'array' or jsonb_array_length(v_tag_links) > 30) then
    raise exception 'QC_FORBIDDEN';
  end if;

  if v_equipment is not null and v_equipment not in ('unspecified', 'none', 'defined') then
    raise exception 'QC_RECIPE_EQUIPMENT';
  end if;
  if v_equipment = 'defined' then
    if jsonb_typeof(v_methods) <> 'array' or jsonb_array_length(v_methods) = 0
       or jsonb_array_length(v_methods) > 5
       or exists (
         select 1 from jsonb_array_elements(v_methods) m
         where jsonb_typeof(m -> 'utensils') <> 'array'
            or jsonb_array_length(m -> 'utensils') = 0
            or jsonb_array_length(m -> 'utensils') > 20) then
      raise exception 'QC_RECIPE_EQUIPMENT';
    end if;
  end if;

  -- Suggestions the person rejected: "<kind>:def:<id>" or "<kind>:custom:<uuid>".
  if v_has_dismissed then
    if jsonb_typeof(p_recipe -> 'dismissed_suggestions') <> 'array'
       or jsonb_array_length(p_recipe -> 'dismissed_suggestions') > 100
       or exists (
         select 1 from jsonb_array_elements(p_recipe -> 'dismissed_suggestions') d
         where jsonb_typeof(d) <> 'string'
            or (d #>> '{}') !~ '^(category|tag|utensil):(def:[a-z0-9_]{2,40}|custom:[0-9a-f-]{36})$') then
      raise exception 'QC_RECIPE_SUGGESTIONS';
    end if;
    select coalesce(array_agg(distinct d), '{}') into v_dismissed
      from jsonb_array_elements_text(p_recipe -> 'dismissed_suggestions') as d;
  end if;
  if v_optional is not null
     and (jsonb_typeof(v_optional) <> 'array' or jsonb_array_length(v_optional) > 20) then
    raise exception 'QC_RECIPE_EQUIPMENT';
  end if;

  if v_has_tags then
    select coalesce(array_agg(distinct btrim(t)) filter (where btrim(t) <> ''), '{}')
      into v_tags
      from jsonb_array_elements_text(coalesce(p_recipe -> 'tags', '[]'::jsonb)) as t;
  end if;

  if v_id is null then
    insert into public.recipes (
      household_id, title, description, base_servings, difficulty,
      active_minutes, passive_minutes, total_minutes, tags, source_url, source_author, notes,
      storage_notes, freezing_notes, reheating_notes, equipment_status, dismissed_suggestions
    ) values (
      v_household, btrim(p_recipe ->> 'title'), nullif(btrim(p_recipe ->> 'description'), ''),
      (p_recipe ->> 'base_servings')::numeric, nullif(p_recipe ->> 'difficulty', ''),
      (p_recipe ->> 'active_minutes')::integer, (p_recipe ->> 'passive_minutes')::integer,
      (p_recipe ->> 'total_minutes')::integer, coalesce(v_tags, '{}'),
      nullif(btrim(p_recipe ->> 'source_url'), ''), nullif(btrim(p_recipe ->> 'source_author'), ''),
      nullif(btrim(p_recipe ->> 'notes'), ''), nullif(btrim(p_recipe ->> 'storage_notes'), ''),
      nullif(btrim(p_recipe ->> 'freezing_notes'), ''), nullif(btrim(p_recipe ->> 'reheating_notes'), ''),
      coalesce(v_equipment, 'unspecified'), coalesce(v_dismissed, '{}')
    )
    returning id into v_id;
  else
    update public.recipes r set
      title = btrim(p_recipe ->> 'title'),
      description = nullif(btrim(p_recipe ->> 'description'), ''),
      base_servings = (p_recipe ->> 'base_servings')::numeric,
      difficulty = nullif(p_recipe ->> 'difficulty', ''),
      active_minutes = (p_recipe ->> 'active_minutes')::integer,
      passive_minutes = (p_recipe ->> 'passive_minutes')::integer,
      total_minutes = (p_recipe ->> 'total_minutes')::integer,
      tags = case when v_has_tags then v_tags else r.tags end,
      source_url = nullif(btrim(p_recipe ->> 'source_url'), ''),
      source_author = nullif(btrim(p_recipe ->> 'source_author'), ''),
      notes = nullif(btrim(p_recipe ->> 'notes'), ''),
      storage_notes = nullif(btrim(p_recipe ->> 'storage_notes'), ''),
      freezing_notes = nullif(btrim(p_recipe ->> 'freezing_notes'), ''),
      reheating_notes = nullif(btrim(p_recipe ->> 'reheating_notes'), ''),
      equipment_status = coalesce(v_equipment, r.equipment_status),
      dismissed_suggestions = case when v_has_dismissed then v_dismissed
                                   else r.dismissed_suggestions end
    where id = v_id and household_id = v_household;
    if not found then raise exception 'QC_FORBIDDEN'; end if;

    delete from public.recipe_ingredients where recipe_id = v_id;
    delete from public.recipe_steps where recipe_id = v_id;
    delete from public.recipe_category_links where recipe_id = v_id;
    if v_tag_links is not null then
      delete from public.recipe_tag_links where recipe_id = v_id;
    end if;
    if v_equipment is not null then
      delete from public.recipe_methods where recipe_id = v_id;
    end if;
    if v_optional is not null then
      delete from public.recipe_optional_utensils where recipe_id = v_id;
    end if;
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

  -- Composite FKs reject custom items of another household.
  insert into public.recipe_category_links (recipe_id, household_id, category_def_id, category_id)
  select distinct v_id, v_household, c ->> 'def', (c ->> 'custom')::uuid
  from jsonb_array_elements(v_categories) as c;

  if v_tag_links is not null then
    insert into public.recipe_tag_links (recipe_id, household_id, tag_def_id, household_tag_id)
    select distinct v_id, v_household, t ->> 'def', (t ->> 'custom')::uuid
    from jsonb_array_elements(v_tag_links) as t;
  end if;

  if v_equipment = 'defined' then
    for v_method, v_method_ord in
      select m.value, m.ord from jsonb_array_elements(v_methods) with ordinality as m(value, ord)
    loop
      insert into public.recipe_methods (recipe_id, household_id, position, label)
      values (v_id, v_household, (v_method_ord - 1)::integer,
              nullif(btrim(v_method ->> 'label'), ''))
      returning id into v_method_id;
      insert into public.recipe_method_utensils (
        method_id, household_id, utensil_def_id, household_utensil_id
      )
      select distinct v_method_id, v_household, u ->> 'def', (u ->> 'custom')::uuid
      from jsonb_array_elements(v_method -> 'utensils') as u;
    end loop;
  end if;

  -- Optional utensils never decide whether a recipe can be made; any equipment status.
  if v_optional is not null then
    insert into public.recipe_optional_utensils (
      recipe_id, household_id, utensil_def_id, household_utensil_id
    )
    select distinct v_id, v_household, u ->> 'def', (u ->> 'custom')::uuid
    from jsonb_array_elements(v_optional) as u;
  end if;

  return v_id;
end;
$$;

revoke all on function public.save_recipe(jsonb) from public, anon;
grant execute on function public.save_recipe(jsonb) to authenticated;
