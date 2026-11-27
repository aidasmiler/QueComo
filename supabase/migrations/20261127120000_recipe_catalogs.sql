-- QuéComo · Recipe catalogs, kitchen equipment and cooking history.
-- Extends 20261127000000_recipes.sql without removing data:
--   * Global catalogs (categories, manual tags, utensils) seeded here, read-only for users.
--   * Household customisations: own categories/tags/utensils and hidden global items.
--     Only household OWNERS manage them; every member can use them (RLS, not just the UI).
--   * Recipe equipment: explicit status (unspecified / none / defined) plus one or more
--     preparation methods, each with the utensils it needs (alternatives are explicit).
--   * Household equipment availability (which utensils this household has).
--   * Cooking history (recipe_cook_logs) for personal and household time estimates.
-- Legacy recipes.tags (text[]) is kept untouched as a historical copy and migrated to links.

-- ---------------------------------------------------------------------------
-- Global catalogs
-- ---------------------------------------------------------------------------
create table public.category_definitions (
  id text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  position integer not null,
  icon text not null check (char_length(icon) <= 40),
  color text not null check (char_length(color) <= 20),
  -- Names are used for duplicate checks and migrations; the UI shows i18n names by id.
  name_es text not null,
  name_en text not null
);

create table public.tag_definitions (
  id text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  tag_group text not null check (tag_group in ('diet', 'practical', 'moment')),
  position integer not null,
  name_es text not null,
  name_en text not null
);

create table public.utensil_definitions (
  id text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  utensil_group text not null check (utensil_group in ('cookware', 'appliance', 'specialised')),
  position integer not null,
  -- Shown first in the quick kitchen setup.
  common boolean not null default false,
  name_es text not null,
  name_en text not null
);

insert into public.category_definitions (id, position, icon, color, name_es, name_en) values
  ('breakfasts', 1, 'coffee', 'amber', 'Desayunos', 'Breakfasts'),
  ('salads', 2, 'salad', 'green', 'Ensaladas', 'Salads'),
  ('soups', 3, 'soup', 'orange', 'Sopas y cremas', 'Soups and creams'),
  ('rice_grains', 4, 'wheat', 'yellow', 'Arroces y cereales', 'Rice and grains'),
  ('pasta', 5, 'utensils', 'amber', 'Pasta', 'Pasta'),
  ('legumes', 6, 'bean', 'brown', 'Legumbres', 'Legumes'),
  ('vegetables', 7, 'carrot', 'green', 'Verduras y hortalizas', 'Vegetables'),
  ('meat', 8, 'beef', 'red', 'Carnes', 'Meat'),
  ('fish_seafood', 9, 'fish', 'blue', 'Pescados y mariscos', 'Fish and seafood'),
  ('eggs', 10, 'egg', 'yellow', 'Huevos', 'Eggs'),
  ('sandwiches', 11, 'sandwich', 'orange', 'Bocadillos y sándwiches', 'Sandwiches'),
  ('pizza_dough', 12, 'pizza', 'red', 'Pizzas y masas', 'Pizzas and doughs'),
  ('starters', 13, 'cherry', 'purple', 'Aperitivos y entrantes', 'Starters and appetisers'),
  ('desserts', 14, 'cake-slice', 'pink', 'Postres y repostería', 'Desserts and baking'),
  ('sauces', 15, 'droplet', 'teal', 'Salsas y aderezos', 'Sauces and dressings'),
  ('drinks', 16, 'cup-soda', 'blue', 'Bebidas', 'Drinks'),
  ('other', 17, 'shapes', 'gray', 'Otros', 'Other');

-- Tags that can be derived from recipe data (quick, easy, air fryer, no oven…) are NOT stored:
-- they are computed in src/domain/recipes/auto-tags.ts. Only manual tags live here.
insert into public.tag_definitions (id, tag_group, position, name_es, name_en) values
  ('vegetarian', 'diet', 1, 'Vegetariana', 'Vegetarian'),
  ('vegan', 'diet', 2, 'Vegana', 'Vegan'),
  ('gluten_free', 'diet', 3, 'Sin gluten', 'Gluten-free'),
  ('lactose_free', 'diet', 4, 'Sin lactosa', 'Lactose-free'),
  ('high_protein', 'diet', 5, 'Alta en proteínas', 'High protein'),
  ('budget', 'practical', 1, 'Económica', 'Budget'),
  ('batch_cooking', 'practical', 2, 'Batch cooking', 'Batch cooking'),
  ('packed_lunch', 'practical', 3, 'Para llevar', 'Packed lunch'),
  ('freezable', 'practical', 4, 'Congelable', 'Freezable'),
  ('one_pot', 'practical', 5, 'Una sola olla', 'One pot'),
  ('breakfast', 'moment', 1, 'Desayuno', 'Breakfast'),
  ('lunch', 'moment', 2, 'Comida', 'Lunch'),
  ('dinner', 'moment', 3, 'Cena', 'Dinner'),
  ('afternoon_snack', 'moment', 4, 'Merienda', 'Afternoon snack'),
  ('snack', 'moment', 5, 'Snack', 'Snack');

insert into public.utensil_definitions (id, utensil_group, position, common, name_es, name_en) values
  ('frying_pan', 'cookware', 1, true, 'Sartén', 'Frying pan'),
  ('pot', 'cookware', 2, true, 'Olla', 'Pot'),
  ('saucepan', 'cookware', 3, true, 'Cazo', 'Saucepan'),
  ('pressure_cooker', 'cookware', 4, false, 'Olla a presión', 'Pressure cooker'),
  ('slow_cooker', 'cookware', 5, false, 'Olla de cocción lenta', 'Slow cooker'),
  ('wok', 'cookware', 6, false, 'Wok', 'Wok'),
  ('griddle', 'cookware', 7, false, 'Plancha', 'Griddle'),
  ('grill', 'cookware', 8, false, 'Parrilla', 'Grill'),
  ('baking_tray', 'cookware', 9, true, 'Bandeja de horno', 'Baking tray'),
  ('oven_dish', 'cookware', 10, false, 'Fuente para horno', 'Oven dish'),
  ('baking_tin', 'cookware', 11, false, 'Molde para horno', 'Baking tin'),
  ('wire_rack', 'cookware', 12, false, 'Rejilla', 'Wire rack'),
  ('oven', 'appliance', 1, true, 'Horno', 'Oven'),
  ('microwave', 'appliance', 2, true, 'Microondas', 'Microwave'),
  ('air_fryer', 'appliance', 3, true, 'Freidora de aire', 'Air fryer'),
  ('hand_blender', 'appliance', 4, true, 'Batidora de mano', 'Hand blender'),
  ('blender', 'appliance', 5, false, 'Batidora de vaso', 'Blender'),
  ('food_processor', 'appliance', 6, false, 'Procesador de alimentos', 'Food processor'),
  ('kitchen_robot', 'appliance', 7, false, 'Robot de cocina', 'Kitchen robot'),
  ('stand_mixer', 'appliance', 8, false, 'Amasadora', 'Stand mixer'),
  ('sandwich_maker', 'appliance', 9, false, 'Sandwichera', 'Sandwich maker'),
  ('toaster', 'appliance', 10, false, 'Tostadora', 'Toaster'),
  ('rice_cooker', 'appliance', 11, false, 'Arrocera', 'Rice cooker'),
  ('electric_steamer', 'appliance', 12, false, 'Vaporera eléctrica', 'Electric steamer'),
  ('silicone_steam_case', 'specialised', 1, false, 'Estuche de vapor Lékué', 'Lékué steam case'),
  ('steamer_pot', 'specialised', 2, false, 'Vaporera tradicional', 'Steamer pot'),
  ('steamer_basket', 'specialised', 3, false, 'Cestillo de vapor', 'Steamer basket'),
  ('mandoline', 'specialised', 4, false, 'Mandolina', 'Mandoline'),
  ('spiraliser', 'specialised', 5, false, 'Espiralizador', 'Spiraliser'),
  ('mortar', 'specialised', 6, false, 'Mortero', 'Mortar and pestle'),
  ('kitchen_scale', 'specialised', 7, true, 'Báscula de cocina', 'Kitchen scale'),
  ('kitchen_thermometer', 'specialised', 8, false, 'Termómetro de cocina', 'Kitchen thermometer'),
  ('colander', 'specialised', 9, true, 'Colador', 'Colander'),
  ('grater', 'specialised', 10, true, 'Rallador', 'Grater'),
  ('rolling_pin', 'specialised', 11, false, 'Rodillo', 'Rolling pin'),
  ('piping_bag', 'specialised', 12, false, 'Manga pastelera', 'Piping bag');

-- ---------------------------------------------------------------------------
-- Household customisations
-- ---------------------------------------------------------------------------
-- Custom categories keep using recipe_categories (existing table), now with icon and colour.
alter table public.recipe_categories
  add column icon text check (char_length(icon) <= 40),
  add column color text check (char_length(color) <= 20),
  add constraint recipe_categories_id_household_key unique (id, household_id);

create table public.household_tags (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  -- Custom tags keep the text the household typed.
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (id, household_id)
);
create unique index household_tags_name_idx on public.household_tags (household_id, lower(btrim(name)));

create table public.household_utensils (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (id, household_id)
);
create unique index household_utensils_name_idx
  on public.household_utensils (household_id, lower(btrim(name)));

-- Global items a household chose to hide. Hiding never deletes recipe links.
create table public.household_hidden_items (
  household_id uuid not null references public.households (id) on delete cascade,
  kind text not null check (kind in ('category', 'tag', 'utensil')),
  item_id text not null,
  primary key (household_id, kind, item_id)
);

-- Which utensils this household has. Exactly one of the two references is set.
create table public.household_utensil_availability (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  utensil_def_id text references public.utensil_definitions (id) on delete cascade,
  household_utensil_id uuid,
  created_at timestamptz not null default now(),
  check (num_nonnulls(utensil_def_id, household_utensil_id) = 1),
  foreign key (household_utensil_id, household_id)
    references public.household_utensils (id, household_id) on delete cascade
);
create unique index household_utensil_availability_def_idx
  on public.household_utensil_availability (household_id, utensil_def_id)
  where utensil_def_id is not null;
create unique index household_utensil_availability_custom_idx
  on public.household_utensil_availability (household_id, household_utensil_id)
  where household_utensil_id is not null;

-- A row means the household has reviewed its equipment. Until then, recipes are never hidden
-- for missing equipment (we would be guessing).
create table public.household_kitchen (
  household_id uuid primary key references public.households (id) on delete cascade,
  configured_at timestamptz not null default now()
);

-- Custom names must not clash with the effective catalog (global names in any language).
create or replace function public.check_catalog_name()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_name text := lower(btrim(new.name));
begin
  if (tg_table_name = 'recipe_categories' and exists (
        select 1 from public.category_definitions d
        where lower(d.name_es) = v_name or lower(d.name_en) = v_name))
     or (tg_table_name = 'household_tags' and exists (
        select 1 from public.tag_definitions d
        where lower(d.name_es) = v_name or lower(d.name_en) = v_name))
     or (tg_table_name = 'household_utensils' and exists (
        select 1 from public.utensil_definitions d
        where lower(d.name_es) = v_name or lower(d.name_en) = v_name)) then
    raise exception 'QC_CATALOG_DUPLICATE';
  end if;
  return new;
end;
$$;

create or replace function public.check_hidden_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (
    (new.kind = 'category' and exists (select 1 from public.category_definitions where id = new.item_id))
    or (new.kind = 'tag' and exists (select 1 from public.tag_definitions where id = new.item_id))
    or (new.kind = 'utensil' and exists (select 1 from public.utensil_definitions where id = new.item_id))
  ) then
    raise exception 'QC_FORBIDDEN';
  end if;
  return new;
end;
$$;

create trigger household_hidden_items_valid
  before insert or update on public.household_hidden_items
  for each row execute function public.check_hidden_item();

-- ---------------------------------------------------------------------------
-- Recipe links
-- ---------------------------------------------------------------------------
-- Categories: a link points to a global category OR a custom one of the same household.
alter table public.recipe_category_links drop constraint recipe_category_links_pkey;
drop trigger recipe_category_links_same_household on public.recipe_category_links;
drop function public.check_recipe_category_household();
alter table public.recipe_category_links
  alter column category_id drop not null,
  add column category_def_id text references public.category_definitions (id) on delete cascade,
  add constraint recipe_category_links_one_ref check (num_nonnulls(category_id, category_def_id) = 1),
  -- Replaces the old trigger: a custom category must belong to the recipe's household.
  add constraint recipe_category_links_same_household
    foreign key (category_id, household_id)
    references public.recipe_categories (id, household_id) on delete cascade;
create unique index recipe_category_links_custom_idx
  on public.recipe_category_links (recipe_id, category_id) where category_id is not null;
create unique index recipe_category_links_def_idx
  on public.recipe_category_links (recipe_id, category_def_id) where category_def_id is not null;
create index recipe_category_links_def_lookup_idx on public.recipe_category_links (category_def_id);

create table public.recipe_tag_links (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null,
  household_id uuid not null,
  tag_def_id text references public.tag_definitions (id) on delete cascade,
  household_tag_id uuid,
  check (num_nonnulls(tag_def_id, household_tag_id) = 1),
  foreign key (recipe_id, household_id) references public.recipes (id, household_id) on delete cascade,
  foreign key (household_tag_id, household_id)
    references public.household_tags (id, household_id) on delete cascade
);
create unique index recipe_tag_links_def_idx
  on public.recipe_tag_links (recipe_id, tag_def_id) where tag_def_id is not null;
create unique index recipe_tag_links_custom_idx
  on public.recipe_tag_links (recipe_id, household_tag_id) where household_tag_id is not null;
create index recipe_tag_links_household_idx on public.recipe_tag_links (household_id);

-- Equipment. 'unspecified' = nobody said; 'none' = explicitly needs nothing special;
-- 'defined' = one or more preparation methods with their utensils.
alter table public.recipes
  add column equipment_status text not null default 'unspecified'
    check (equipment_status in ('unspecified', 'none', 'defined'));

create table public.recipe_methods (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null,
  household_id uuid not null,
  position integer not null check (position >= 0),
  label text check (char_length(label) <= 60),
  unique (id, household_id),
  foreign key (recipe_id, household_id) references public.recipes (id, household_id) on delete cascade
);
create index recipe_methods_recipe_idx on public.recipe_methods (recipe_id, position);

create table public.recipe_method_utensils (
  id uuid primary key default gen_random_uuid(),
  method_id uuid not null,
  household_id uuid not null,
  utensil_def_id text references public.utensil_definitions (id) on delete cascade,
  household_utensil_id uuid,
  check (num_nonnulls(utensil_def_id, household_utensil_id) = 1),
  foreign key (method_id, household_id)
    references public.recipe_methods (id, household_id) on delete cascade,
  foreign key (household_utensil_id, household_id)
    references public.household_utensils (id, household_id) on delete cascade
);
create unique index recipe_method_utensils_def_idx
  on public.recipe_method_utensils (method_id, utensil_def_id) where utensil_def_id is not null;
create unique index recipe_method_utensils_custom_idx
  on public.recipe_method_utensils (method_id, household_utensil_id)
  where household_utensil_id is not null;
create index recipe_method_utensils_def_lookup_idx on public.recipe_method_utensils (utensil_def_id);

-- ---------------------------------------------------------------------------
-- Cooking history
-- ---------------------------------------------------------------------------
create table public.recipe_cook_logs (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null,
  household_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cooked_on date not null default current_date,
  servings numeric(6, 2) check (servings > 0 and servings <= 100),
  total_minutes integer check (total_minutes between 1 and 20000),
  active_minutes integer check (active_minutes between 0 and 20000),
  -- Methods are rewritten on every recipe save, so the log keeps the method's position.
  method_position integer check (method_position >= 0),
  notes text check (char_length(notes) <= 1000),
  -- Ready for the future cooking-mode timer (start/pause/resume/finish).
  source text not null default 'manual' check (source in ('manual', 'timer')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (recipe_id, household_id) references public.recipes (id, household_id) on delete cascade
);
create index recipe_cook_logs_recipe_idx on public.recipe_cook_logs (recipe_id, cooked_on desc);
create index recipe_cook_logs_household_idx on public.recipe_cook_logs (household_id);

create trigger recipe_cook_logs_set_updated_at
  before update on public.recipe_cook_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Data migration (deterministic, keeps every recipe and association)
-- ---------------------------------------------------------------------------
-- 1. Custom categories whose name equals a global category become links to the global one.
insert into public.recipe_category_links (recipe_id, household_id, category_def_id)
select distinct l.recipe_id, l.household_id, d.id
from public.recipe_category_links l
join public.recipe_categories c on c.id = l.category_id
join public.category_definitions d
  on lower(btrim(c.name)) in (lower(d.name_es), lower(d.name_en))
on conflict do nothing;
delete from public.recipe_categories c
using public.category_definitions d
where lower(btrim(c.name)) in (lower(d.name_es), lower(d.name_en));

-- 2. Legacy text[] tags → links. Global names (es/en) map to the global tag; names of tags that
--    are now automatic are skipped (they are computed); anything else becomes a custom tag of
--    the recipe's household, spelled as its alphabetically first variant. recipes.tags is kept.
create temporary table legacy_tags as
select r.id as recipe_id, r.household_id, btrim(t) as tag, lower(btrim(t)) as norm
from public.recipes r, unnest(r.tags) as t
where btrim(t) <> '';

insert into public.recipe_tag_links (recipe_id, household_id, tag_def_id)
select distinct lt.recipe_id, lt.household_id, d.id
from legacy_tags lt
join public.tag_definitions d on lt.norm in (lower(d.name_es), lower(d.name_en))
on conflict do nothing;

insert into public.household_tags (household_id, name)
select lt.household_id, min(lt.tag)
from legacy_tags lt
where not exists (
    select 1 from public.tag_definitions d where lt.norm in (lower(d.name_es), lower(d.name_en)))
  and lt.norm not in ('rápida', 'rapida', 'quick', 'muy rápida', 'muy rapida', 'very quick',
                      'fácil', 'facil', 'easy', 'sin horno', 'no oven', 'air fryer',
                      'freidora de aire', 'poco tiempo activo', 'little hands-on time')
group by lt.household_id, lt.norm
on conflict do nothing;

insert into public.recipe_tag_links (recipe_id, household_id, household_tag_id)
select distinct lt.recipe_id, lt.household_id, ht.id
from legacy_tags lt
join public.household_tags ht
  on ht.household_id = lt.household_id and lower(btrim(ht.name)) = lt.norm
on conflict do nothing;

drop table legacy_tags;

-- Name checks start after the migration so the clean-up above can't be blocked by them.
create trigger recipe_categories_catalog_name
  before insert or update of name on public.recipe_categories
  for each row execute function public.check_catalog_name();
create trigger household_tags_catalog_name
  before insert or update of name on public.household_tags
  for each row execute function public.check_catalog_name();
create trigger household_utensils_catalog_name
  before insert or update of name on public.household_utensils
  for each row execute function public.check_catalog_name();

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
alter table public.category_definitions enable row level security;
alter table public.tag_definitions enable row level security;
alter table public.utensil_definitions enable row level security;
alter table public.household_tags enable row level security;
alter table public.household_utensils enable row level security;
alter table public.household_hidden_items enable row level security;
alter table public.household_utensil_availability enable row level security;
alter table public.household_kitchen enable row level security;
alter table public.recipe_tag_links enable row level security;
alter table public.recipe_methods enable row level security;
alter table public.recipe_method_utensils enable row level security;
alter table public.recipe_cook_logs enable row level security;

revoke all on public.category_definitions, public.tag_definitions, public.utensil_definitions,
  public.household_tags, public.household_utensils, public.household_hidden_items,
  public.household_utensil_availability, public.household_kitchen, public.recipe_tag_links,
  public.recipe_methods, public.recipe_method_utensils, public.recipe_cook_logs
  from public, anon, authenticated;

-- Global catalogs: read-only for every signed-in user, nobody can write them through the API.
grant select on public.category_definitions, public.tag_definitions, public.utensil_definitions
  to authenticated;
create policy "category_definitions: read" on public.category_definitions
  for select to authenticated using (true);
create policy "tag_definitions: read" on public.tag_definitions
  for select to authenticated using (true);
create policy "utensil_definitions: read" on public.utensil_definitions
  for select to authenticated using (true);

-- Custom catalogs: members read, OWNERS create/edit/delete (replaces the member-wide policies).
grant update (icon, color) on public.recipe_categories to authenticated;
drop policy "recipe_categories: members insert" on public.recipe_categories;
drop policy "recipe_categories: members update" on public.recipe_categories;
drop policy "recipe_categories: members delete" on public.recipe_categories;
create policy "recipe_categories: owners insert" on public.recipe_categories
  for insert to authenticated with check (public.is_household_owner(household_id));
create policy "recipe_categories: owners update" on public.recipe_categories
  for update to authenticated
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));
create policy "recipe_categories: owners delete" on public.recipe_categories
  for delete to authenticated using (public.is_household_owner(household_id));

grant select, insert (household_id, name), delete on public.household_tags to authenticated;
grant update (name) on public.household_tags to authenticated;
create policy "household_tags: members read" on public.household_tags
  for select to authenticated using (public.is_household_member(household_id));
create policy "household_tags: owners insert" on public.household_tags
  for insert to authenticated with check (public.is_household_owner(household_id));
create policy "household_tags: owners update" on public.household_tags
  for update to authenticated
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));
create policy "household_tags: owners delete" on public.household_tags
  for delete to authenticated using (public.is_household_owner(household_id));

grant select, insert (household_id, name), delete on public.household_utensils to authenticated;
grant update (name) on public.household_utensils to authenticated;
create policy "household_utensils: members read" on public.household_utensils
  for select to authenticated using (public.is_household_member(household_id));
create policy "household_utensils: owners insert" on public.household_utensils
  for insert to authenticated with check (public.is_household_owner(household_id));
create policy "household_utensils: owners update" on public.household_utensils
  for update to authenticated
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));
create policy "household_utensils: owners delete" on public.household_utensils
  for delete to authenticated using (public.is_household_owner(household_id));

grant select, insert, delete on public.household_hidden_items to authenticated;
create policy "household_hidden_items: members read" on public.household_hidden_items
  for select to authenticated using (public.is_household_member(household_id));
create policy "household_hidden_items: owners insert" on public.household_hidden_items
  for insert to authenticated with check (public.is_household_owner(household_id));
create policy "household_hidden_items: owners delete" on public.household_hidden_items
  for delete to authenticated using (public.is_household_owner(household_id));

-- Equipment availability: any member can tick/untick what the household has.
grant select, insert (household_id, utensil_def_id, household_utensil_id), delete
  on public.household_utensil_availability to authenticated;
create policy "household_utensil_availability: members read"
  on public.household_utensil_availability
  for select to authenticated using (public.is_household_member(household_id));
create policy "household_utensil_availability: members insert"
  on public.household_utensil_availability
  for insert to authenticated with check (public.is_household_member(household_id));
create policy "household_utensil_availability: members delete"
  on public.household_utensil_availability
  for delete to authenticated using (public.is_household_member(household_id));

grant select, insert (household_id) on public.household_kitchen to authenticated;
create policy "household_kitchen: members read" on public.household_kitchen
  for select to authenticated using (public.is_household_member(household_id));
create policy "household_kitchen: members insert" on public.household_kitchen
  for insert to authenticated with check (public.is_household_member(household_id));

-- Recipe links and methods: written by save_recipe (security invoker) for members.
grant select on public.recipe_tag_links, public.recipe_methods, public.recipe_method_utensils
  to authenticated;
grant insert, delete on public.recipe_tag_links, public.recipe_methods,
  public.recipe_method_utensils to authenticated;
grant update (equipment_status) on public.recipes to authenticated;
grant insert (equipment_status) on public.recipes to authenticated;
create policy "recipe_tag_links: members" on public.recipe_tag_links
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "recipe_methods: members" on public.recipe_methods
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "recipe_method_utensils: members" on public.recipe_method_utensils
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- Cooking history: the household reads it; each person writes only their own entries.
grant select, delete on public.recipe_cook_logs to authenticated;
grant insert (recipe_id, household_id, cooked_on, servings, total_minutes, active_minutes,
  method_position, notes, source, started_at, finished_at) on public.recipe_cook_logs to authenticated;
grant update (cooked_on, servings, total_minutes, active_minutes, method_position, notes,
  started_at, finished_at) on public.recipe_cook_logs to authenticated;
create policy "recipe_cook_logs: members read" on public.recipe_cook_logs
  for select to authenticated using (public.is_household_member(household_id));
create policy "recipe_cook_logs: own insert" on public.recipe_cook_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_household_member(household_id));
create policy "recipe_cook_logs: own update" on public.recipe_cook_logs
  for update to authenticated
  using (user_id = (select auth.uid()) and public.is_household_member(household_id))
  with check (user_id = (select auth.uid()) and public.is_household_member(household_id));
create policy "recipe_cook_logs: own delete" on public.recipe_cook_logs
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- save_recipe v2: same signature, backward compatible.
-- New optional keys (each replaces its set only when present):
--   categories: [{"def": "<id>"} | {"custom": "<uuid>"}]   (falls back to category_ids)
--   tag_links:  [{"def": "<id>"} | {"custom": "<uuid>"}]
--   equipment_status: 'unspecified' | 'none' | 'defined'
--   methods: [{"label": text|null, "utensils": [{"def"} | {"custom"}]}]  (only for 'defined')
-- Legacy "tags" (text[]) is still written when sent, and left as is otherwise.
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

  if v_has_tags then
    select coalesce(array_agg(distinct btrim(t)) filter (where btrim(t) <> ''), '{}')
      into v_tags
      from jsonb_array_elements_text(coalesce(p_recipe -> 'tags', '[]'::jsonb)) as t;
  end if;

  if v_id is null then
    insert into public.recipes (
      household_id, title, description, base_servings, difficulty,
      active_minutes, passive_minutes, total_minutes, tags, source_url, source_author, notes,
      storage_notes, freezing_notes, reheating_notes, equipment_status
    ) values (
      v_household, btrim(p_recipe ->> 'title'), nullif(btrim(p_recipe ->> 'description'), ''),
      (p_recipe ->> 'base_servings')::numeric, nullif(p_recipe ->> 'difficulty', ''),
      (p_recipe ->> 'active_minutes')::integer, (p_recipe ->> 'passive_minutes')::integer,
      (p_recipe ->> 'total_minutes')::integer, coalesce(v_tags, '{}'),
      nullif(btrim(p_recipe ->> 'source_url'), ''), nullif(btrim(p_recipe ->> 'source_author'), ''),
      nullif(btrim(p_recipe ->> 'notes'), ''), nullif(btrim(p_recipe ->> 'storage_notes'), ''),
      nullif(btrim(p_recipe ->> 'freezing_notes'), ''), nullif(btrim(p_recipe ->> 'reheating_notes'), ''),
      coalesce(v_equipment, 'unspecified')
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
      equipment_status = coalesce(v_equipment, r.equipment_status)
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

  return v_id;
end;
$$;

revoke all on function public.save_recipe(jsonb) from public, anon;
grant execute on function public.save_recipe(jsonb) to authenticated;
