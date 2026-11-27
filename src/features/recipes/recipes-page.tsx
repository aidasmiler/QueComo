import { BookOpen, Clock, Heart, Plus, Search, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveHousehold } from '@/features/households/active-household';
import { errorMessage } from '@/lib/supabase/errors';
import { cn } from '@/lib/utils/cn';
import type { RecipeSummary, RecipeUserState } from './api';
import { formatMinutes, normalise, totalMinutes } from './format';
import { useRecipeCategories, useRecipeUserState, useRecipes } from './hooks';
import { RecipePhoto } from './recipe-photo';

type View = 'all' | 'favorites' | 'archived';

export function RecipesPage() {
  const { t } = useTranslation(['recipes', 'common']);
  const { active } = useActiveHousehold();
  const recipes = useRecipes();
  const categories = useRecipeCategories();
  const ids = useMemo(() => (recipes.data ?? []).map((r) => r.id), [recipes.data]);
  const userState = useRecipeUserState(ids);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('all');
  const [categoryId, setCategoryId] = useState<string>('');

  const visible = useMemo(() => {
    const needle = normalise(query.trim());
    return (recipes.data ?? []).filter((recipe) => {
      if (view === 'archived' ? !recipe.archived_at : recipe.archived_at) return false;
      if (view === 'favorites' && !userState.data?.get(recipe.id)?.favorite) return false;
      if (categoryId && !recipe.categoryIds.includes(categoryId)) return false;
      if (!needle) return true;
      return normalise([recipe.title, recipe.description ?? '', ...recipe.tags].join(' ')).includes(
        needle,
      );
    });
  }, [recipes.data, userState.data, query, view, categoryId]);

  const hasAny = (recipes.data ?? []).some((r) => !r.archived_at);
  const filtered = query !== '' || view !== 'all' || categoryId !== '';

  return (
    <>
      <PageHeader
        title={t('list.title')}
        subtitle={active ? t('list.subtitle', { household: active.name }) : undefined}
        actions={
          <Button asChild>
            <Link to="/recipes/new">
              <Plus aria-hidden="true" />
              {t('list.new')}
            </Link>
          </Button>
        }
      />

      {recipes.isError && <Alert tone="error">{errorMessage(recipes.error)}</Alert>}

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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  'min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors',
                  view === option
                    ? 'border-primary bg-primary text-primary-fg'
                    : 'border-border bg-surface text-fg-muted hover:text-fg',
                )}
              >
                {t(`list.${option}`)}
              </button>
            ))}
            {(categories.data?.length ?? 0) > 0 && (
              <select
                aria-label={t('list.category')}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="border-border bg-surface text-fg min-h-10 rounded-full border px-4 text-sm font-semibold"
              >
                <option value="">{t('list.allCategories')}</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>
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
          body={t('list.noResultsBody')}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setView('all');
                setCategoryId('');
              }}
            >
              {t('list.clearFilters')}
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-fg-muted mb-3 text-sm" aria-live="polite">
            {t('list.count', { count: visible.length })}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} state={userState.data?.get(recipe.id)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function RecipeCard({ recipe, state }: { recipe: RecipeSummary; state?: RecipeUserState }) {
  const { t } = useTranslation('recipes');
  const minutes = totalMinutes(recipe);
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
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-xl leading-tight group-hover:underline">{recipe.title}</h2>
        {recipe.description && (
          <p className="text-fg-muted line-clamp-2 text-sm">{recipe.description}</p>
        )}
        <div className="text-fg-muted mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
          <span>{t('list.servings', { count: recipe.base_servings })}</span>
          {minutes !== null && (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-4" />
              {formatMinutes(t, minutes)}
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
