import {
  BookOpen,
  CircleAlert,
  CircleCheck,
  Clock,
  CookingPot,
  Heart,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AUTO_TAGS, type DurationFilter } from '@/domain/recipes/auto-tags';
import type { ItemKey } from '@/domain/recipes/catalog';
import type { AvailabilityFilter } from '@/domain/recipes/equipment';
import { TAG_GROUPS, UTENSIL_GROUPS } from '@/features/catalogs/catalog-constants';
import { CategoryIcon, ToggleChip } from '@/features/catalogs/catalog-ui';
import { useCatalog, type Catalog } from '@/features/catalogs/hooks';
import { useActiveHousehold } from '@/features/households/active-household';
import { errorMessage } from '@/lib/supabase/errors';
import { cn } from '@/lib/utils/cn';
import type { RecipeSummary, RecipeUserState } from './api';
import { formatMinutes } from './format';
import { useRecipeUserState, useRecipes } from './hooks';
import { useRecipeInsights, type RecipeInsight } from './insights';
import {
  countActive,
  EMPTY_FILTERS,
  matchesBase,
  matchesFilters,
  type FilterContext,
  type RecipeFilters,
} from './recipe-filters';
import { RecipePhoto } from './recipe-photo';

const AVAILABILITY_KEY = 'quecomo.recipes.availability';
const AVAILABILITY_OPTIONS: AvailabilityFilter[] = ['auto', 'all', 'can', 'missing', 'unknown'];
const DURATIONS: Exclude<DurationFilter, ''>[] = ['le15', 'le30', 'le60', 'gt60'];

/** The household's default: automatic filtering by equipment, unless the person turned it off. */
function readDefaultAvailability(): AvailabilityFilter {
  try {
    return localStorage.getItem(AVAILABILITY_KEY) === 'all' ? 'all' : 'auto';
  } catch {
    return 'auto';
  }
}

function writeDefaultAvailability(value: 'auto' | 'all') {
  try {
    localStorage.setItem(AVAILABILITY_KEY, value);
  } catch {
    // Private mode: the preference just isn't remembered.
  }
}

export function RecipesPage() {
  const { t } = useTranslation(['recipes', 'common', 'catalog']);
  const { active } = useActiveHousehold();
  const recipes = useRecipes();
  const catalog = useCatalog();
  const ids = useMemo(() => (recipes.data ?? []).map((r) => r.id), [recipes.data]);
  const userState = useRecipeUserState(ids);
  const { insights, kitchen } = useRecipeInsights(recipes.data);
  const [defaultAvailability, setDefaultAvailability] = useState(readDefaultAvailability);
  const [filters, setFilters] = useState<RecipeFilters>(() => ({
    ...EMPTY_FILTERS,
    availability: defaultAvailability,
  }));
  const [sheetOpen, setSheetOpen] = useState(false);
  const update = useCallback(
    (patch: Partial<RecipeFilters>) => setFilters((current) => ({ ...current, ...patch })),
    [],
  );
  const kitchenConfigured = kitchen?.configured ?? false;

  const searchText = useCallback(
    (recipe: RecipeSummary) =>
      [
        recipe.title,
        recipe.description ?? '',
        ...recipe.tags,
        ...recipe.categoryKeys.map((k) => catalog.data?.maps.category.get(k)?.name ?? ''),
        ...recipe.tagKeys.map((k) => catalog.data?.maps.tag.get(k)?.name ?? ''),
      ].join(' '),
    [catalog.data],
  );

  const ctx: FilterContext = useMemo(
    () => ({
      insights,
      favorites: (id) => Boolean(userState.data?.get(id)?.favorite),
      kitchenConfigured,
      searchText,
    }),
    [insights, userState.data, kitchenConfigured, searchText],
  );

  const { visible, hiddenByEquipment } = useMemo(() => {
    const base = (recipes.data ?? []).filter((r) => matchesBase(r, filters, ctx));
    const shown = base.filter((r) => matchesFilters(r, filters, ctx));
    return { visible: shown, hiddenByEquipment: base.length - shown.length };
  }, [recipes.data, filters, ctx]);

  const hasAny = (recipes.data ?? []).some((r) => !r.archived_at);
  const refinements = countActive(filters, defaultAvailability);
  const filtered = filters.query !== '' || filters.view !== 'all' || refinements > 0;
  const clear = () => setFilters({ ...EMPTY_FILTERS, availability: defaultAvailability });

  return (
    <>
      <PageHeader
        title={t('list.title')}
        subtitle={active ? t('list.subtitle', { household: active.name }) : undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/kitchen">
                <CookingPot aria-hidden="true" />
                {t('kitchen.short')}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/recipes/new">
                <Plus aria-hidden="true" />
                {t('list.new')}
              </Link>
            </Button>
          </div>
        }
      />

      {recipes.isError && <Alert tone="error">{errorMessage(recipes.error)}</Alert>}

      {hasAny && kitchen && !kitchen.configured && (
        <div className="border-primary/30 bg-primary-soft/40 mb-4 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
          <CookingPot aria-hidden="true" className="text-primary size-6 shrink-0" />
          <p className="min-w-0 flex-1 text-sm">{t('list.kitchenInvite')}</p>
          <Button asChild size="sm" variant="secondary">
            <Link to="/kitchen">{t('list.kitchenInviteAction')}</Link>
          </Button>
        </div>
      )}

      {(hasAny || filtered) && (
        <div className="mb-6 flex flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">{t('list.search')}</span>
            <Search
              aria-hidden="true"
              className="text-fg-muted pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
            />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder={t('list.searchPlaceholder')}
              className="border-border bg-surface focus:border-primary focus:ring-primary/20 min-h-12 w-full rounded-full border pr-4 pl-12 text-base focus:ring-2 focus:outline-none"
            />
          </label>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t('list.filters')}
          >
            {(['all', 'favorites', 'archived'] as const).map((option) => (
              <ToggleChip
                key={option}
                pressed={filters.view === option}
                onClick={() => update({ view: option })}
              >
                {t(`list.${option}`)}
              </ToggleChip>
            ))}
            <Button
              variant={refinements > 0 ? 'secondary' : 'outline'}
              size="sm"
              className="min-h-10"
              onClick={() => setSheetOpen(true)}
            >
              <SlidersHorizontal aria-hidden="true" />
              {refinements > 0 ? t('filters.openCount', { count: refinements }) : t('filters.open')}
            </Button>
          </div>
          {catalog.data && (
            <ActiveFilters
              filters={filters}
              catalog={catalog.data}
              defaultAvailability={defaultAvailability}
              onChange={update}
              onClear={clear}
            />
          )}
        </div>
      )}

      {recipes.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : !hasAny && !filtered ? (
        <EmptyState
          icon={BookOpen}
          title={t('list.emptyTitle')}
          body={t('list.emptyBody')}
          action={
            <Button asChild>
              <Link to="/recipes/new">
                <Plus aria-hidden="true" />
                {t('list.new')}
              </Link>
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t('list.noResultsTitle')}
          body={hiddenByEquipment > 0 ? t('filters.allHiddenByEquipment') : t('list.noResultsBody')}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {hiddenByEquipment > 0 && (
                <Button onClick={() => update({ availability: 'all' })}>
                  {t('filters.showAll')}
                </Button>
              )}
              <Button variant="outline" onClick={clear}>
                {t('list.clearFilters')}
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1" aria-live="polite">
            <p className="text-fg-muted text-sm">{t('list.count', { count: visible.length })}</p>
            {hiddenByEquipment > 0 && (
              <p className="text-fg-muted text-sm">
                {t('filters.hiddenByEquipment', { count: hiddenByEquipment })}{' '}
                <button
                  type="button"
                  className="text-primary min-h-11 font-semibold underline underline-offset-4"
                  onClick={() => update({ availability: 'all' })}
                >
                  {t('filters.showAll')}
                </button>
              </p>
            )}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard
                  recipe={recipe}
                  state={userState.data?.get(recipe.id)}
                  insight={insights.get(recipe.id)}
                  catalog={catalog.data}
                  kitchenConfigured={kitchenConfigured}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {catalog.data && (
        <FilterSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          filters={filters}
          catalog={catalog.data}
          kitchenConfigured={kitchenConfigured}
          defaultAvailability={defaultAvailability}
          onChange={update}
          onClear={clear}
          onDefaultAvailability={(value) => {
            writeDefaultAvailability(value);
            setDefaultAvailability(value);
            update({ availability: value });
          }}
          resultCount={visible.length}
        />
      )}
    </>
  );
}

function ActiveFilters({
  filters,
  catalog,
  defaultAvailability,
  onChange,
  onClear,
}: {
  filters: RecipeFilters;
  catalog: Catalog;
  defaultAvailability: AvailabilityFilter;
  onChange: (patch: Partial<RecipeFilters>) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation(['recipes', 'catalog']);
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...filters.categories.map((key) => ({
      key,
      label: catalog.maps.category.get(key)?.name ?? '—',
      remove: () => onChange({ categories: filters.categories.filter((k) => k !== key) }),
    })),
    ...filters.tags.map((key) => ({
      key,
      label: catalog.maps.tag.get(key)?.name ?? '—',
      remove: () => onChange({ tags: filters.tags.filter((k) => k !== key) }),
    })),
    ...filters.autoTags.map((tag) => ({
      key: `auto:${tag}`,
      label: t(`catalog:autoTags.${tag}`),
      remove: () => onChange({ autoTags: filters.autoTags.filter((k) => k !== tag) }),
    })),
  ];
  if (filters.utensil) {
    chips.push({
      key: 'utensil',
      label: t('filters.withUtensil', {
        name: catalog.maps.utensil.get(filters.utensil)?.name ?? '—',
      }),
      remove: () => onChange({ utensil: '' }),
    });
  }
  if (filters.total) {
    chips.push({
      key: 'total',
      label: t('filters.totalChip', { value: t(`filters.duration.${filters.total}`) }),
      remove: () => onChange({ total: '' }),
    });
  }
  if (filters.active) {
    chips.push({
      key: 'active',
      label: t('filters.activeChip', { value: t(`filters.duration.${filters.active}`) }),
      remove: () => onChange({ active: '' }),
    });
  }
  if (filters.availability !== defaultAvailability) {
    chips.push({
      key: 'availability',
      label: t(`filters.availability.${filters.availability}`),
      remove: () => onChange({ availability: defaultAvailability }),
    });
  }
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={t('filters.active')}>
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={chip.remove}
            aria-label={t('filters.removeChip', { name: chip.label })}
            className="bg-primary-soft inline-flex min-h-9 items-center gap-1 rounded-full pr-2 pl-3 text-sm font-semibold text-olive-800"
          >
            {chip.label}
            <X aria-hidden="true" className="size-4" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={onClear}
          className="text-fg-muted hover:text-fg min-h-9 px-2 text-sm font-semibold underline underline-offset-4"
        >
          {t('list.clearFilters')}
        </button>
      </li>
    </ul>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function toggleIn<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterSheet({
  open,
  onOpenChange,
  filters,
  catalog,
  kitchenConfigured,
  defaultAvailability,
  onChange,
  onClear,
  onDefaultAvailability,
  resultCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RecipeFilters;
  catalog: Catalog;
  kitchenConfigured: boolean;
  defaultAvailability: AvailabilityFilter;
  onChange: (patch: Partial<RecipeFilters>) => void;
  onClear: () => void;
  onDefaultAvailability: (value: 'auto' | 'all') => void;
  resultCount: number;
}) {
  const { t } = useTranslation(['recipes', 'catalog', 'common']);
  const visibleCategories = catalog.categories.filter(
    (c) => !c.hidden || filters.categories.includes(c.key),
  );
  const visibleTags = catalog.tags.filter((c) => !c.hidden || filters.tags.includes(c.key));
  const visibleUtensils = catalog.utensils.filter((u) => !u.hidden || filters.utensil === u.key);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('filters.title')}
      footer={
        <>
          <Button variant="ghost" onClick={onClear}>
            {t('list.clearFilters')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t('filters.showResults', { count: resultCount })}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h3 className="font-sans text-base font-semibold">{t('filters.equipmentTitle')}</h3>
          {!kitchenConfigured && (
            <p className="text-fg-muted text-sm">
              {t('filters.kitchenNotConfigured')}{' '}
              <Link to="/kitchen" className="text-primary font-semibold underline">
                {t('list.kitchenInviteAction')}
              </Link>
            </p>
          )}
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t('filters.equipmentTitle')}
          >
            {AVAILABILITY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={filters.availability === option}
                onClick={() => onChange({ availability: option })}
                className={cn(
                  'min-h-10 rounded-full border px-3.5 text-sm font-semibold',
                  filters.availability === option
                    ? 'border-primary bg-primary text-primary-fg'
                    : 'border-border bg-surface text-fg',
                )}
              >
                {t(`filters.availability.${option}`)}
              </button>
            ))}
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="accent-primary size-5"
              checked={defaultAvailability === 'auto'}
              onChange={(event) => onDefaultAvailability(event.target.checked ? 'auto' : 'all')}
            />
            {t('filters.autoDefault')}
          </label>
        </section>

        <FilterGroup title={t('filters.utensil')}>
          <select
            aria-label={t('filters.utensil')}
            value={filters.utensil}
            onChange={(event) => onChange({ utensil: event.target.value as ItemKey | '' })}
            className="border-border bg-surface min-h-11 w-full rounded-md border px-3"
          >
            <option value="">{t('filters.anyUtensil')}</option>
            {UTENSIL_GROUPS.map((group) => {
              const items = visibleUtensils.filter((u) => u.group === group);
              if (!items.length) return null;
              return (
                <optgroup key={group} label={t(`catalog:utensilGroups.${group}`)}>
                  {items.map((u) => (
                    <option key={u.key} value={u.key}>
                      {u.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </FilterGroup>

        <FilterGroup title={t('filters.categories')}>
          {visibleCategories.map((item) => (
            <ToggleChip
              key={item.key}
              pressed={filters.categories.includes(item.key)}
              onClick={() => onChange({ categories: toggleIn(filters.categories, item.key) })}
            >
              <CategoryIcon icon={item.icon} />
              {item.name}
            </ToggleChip>
          ))}
        </FilterGroup>

        <FilterGroup title={t('filters.autoTags')}>
          {AUTO_TAGS.map((tag) => (
            <ToggleChip
              key={tag}
              pressed={filters.autoTags.includes(tag)}
              onClick={() => onChange({ autoTags: toggleIn(filters.autoTags, tag) })}
            >
              <Sparkles aria-hidden="true" className="size-3.5" />
              {t(`catalog:autoTags.${tag}`)}
            </ToggleChip>
          ))}
        </FilterGroup>

        {TAG_GROUPS.map((group) => {
          const items = visibleTags.filter((tag) => tag.group === group);
          if (!items.length) return null;
          return (
            <FilterGroup key={group} title={t(`catalog:tagGroups.${group}`)}>
              {items.map((item) => (
                <ToggleChip
                  key={item.key}
                  pressed={filters.tags.includes(item.key)}
                  onClick={() => onChange({ tags: toggleIn(filters.tags, item.key) })}
                >
                  {item.name}
                </ToggleChip>
              ))}
            </FilterGroup>
          );
        })}

        {(['total', 'active'] as const).map((field) => (
          <FilterGroup key={field} title={t(`filters.${field}Time`)}>
            {DURATIONS.map((value) => (
              <ToggleChip
                key={value}
                pressed={filters[field] === value}
                onClick={() => onChange({ [field]: filters[field] === value ? '' : value })}
              >
                {t(`filters.duration.${value}`)}
              </ToggleChip>
            ))}
          </FilterGroup>
        ))}
        <p className="text-fg-muted text-sm">{t('filters.durationHint')}</p>
      </div>
    </Dialog>
  );
}

function RecipeCard({
  recipe,
  state,
  insight,
  catalog,
  kitchenConfigured,
}: {
  recipe: RecipeSummary;
  state?: RecipeUserState;
  insight?: RecipeInsight;
  catalog?: Catalog;
  kitchenConfigured: boolean;
}) {
  const { t } = useTranslation(['recipes', 'catalog']);
  const minutes = insight?.times.total.minutes ?? null;
  const availability = insight?.evaluation.availability;
  const category = recipe.categoryKeys
    .map((key) => catalog?.maps.category.get(key))
    .find((item) => item !== undefined);
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group border-border/70 bg-surface shadow-card hover:shadow-float focus-visible:ring-primary flex h-full flex-col overflow-hidden rounded-lg border transition-shadow focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="relative">
        <RecipePhoto path={recipe.photo_path} alt="" className="aspect-[4/3] w-full" />
        {state?.favorite && (
          <span className="bg-surface/90 text-accent-strong absolute top-3 right-3 grid size-9 place-items-center rounded-full">
            <Heart aria-label={t('list.favorites')} className="size-5 fill-current" />
          </span>
        )}
        {kitchenConfigured && recipe.equipment.status !== 'unspecified' && availability && (
          <span
            className={cn(
              'absolute bottom-3 left-3 inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold',
              availability === 'can'
                ? 'bg-surface/95 text-olive-800'
                : 'bg-warning-soft text-warning',
            )}
          >
            {availability === 'can' ? (
              <CircleCheck aria-hidden="true" className="size-4" />
            ) : (
              <CircleAlert aria-hidden="true" className="size-4" />
            )}
            {t(`availability.${availability}`)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && (
          <span className="text-fg-muted inline-flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
            <CategoryIcon icon={category.icon} className="size-3.5" />
            {category.name}
          </span>
        )}
        <h2 className="text-xl leading-tight group-hover:underline">{recipe.title}</h2>
        {recipe.description && (
          <p className="text-fg-muted line-clamp-2 text-sm">{recipe.description}</p>
        )}
        {insight && insight.autoTags.length > 0 && (
          <p className="text-primary flex flex-wrap gap-x-2 text-xs font-semibold">
            {insight.autoTags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5">
                <Sparkles aria-hidden="true" className="size-3" />
                {t(`catalog:autoTags.${tag}`)}
              </span>
            ))}
          </p>
        )}
        <div className="text-fg-muted mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
          <span>{t('list.servings', { count: recipe.base_servings })}</span>
          {minutes !== null && (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-4" />
              {formatMinutes(t, minutes)}
              {insight?.times.total.source !== 'original' && (
                <span className="sr-only">{t('estimates.personalisedShort')}</span>
              )}
              {insight?.times.total.source !== 'original' && <span aria-hidden="true">*</span>}
            </span>
          )}
          {state?.rating && (
            <span className="inline-flex items-center gap-1">
              <Star aria-hidden="true" className="size-4" />
              {t('detail.ratingValue', { count: state.rating })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
