import {
  Archive,
  ArchiveRestore,
  Copy,
  ExternalLink,
  Heart,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Timer,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatQuantity, nextServings, scaleQuantity } from '@/domain/recipes/quantity';
import { errorMessage } from '@/lib/supabase/errors';
import { cn } from '@/lib/utils/cn';
import type { Difficulty, RecipeDetail } from './api';
import { formatMinutes, totalMinutes } from './format';
import { toRecipeInput } from './input';
import {
  useDeleteRecipe,
  useRecipe,
  useRecipeCategories,
  useRecipeUserState,
  useSaveRecipe,
  useSetArchived,
  useUpdateUserState,
} from './hooks';
import { RecipePhoto } from './recipe-photo';

export function RecipeDetailPage() {
  const { recipeId = '' } = useParams();
  const { t } = useTranslation(['recipes', 'common']);
  const recipe = useRecipe(recipeId);

  if (recipe.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (recipe.isError) return <Alert tone="error">{errorMessage(recipe.error)}</Alert>;
  if (!recipe.data) {
    return (
      <>
        <PageHeader title={t('list.title')} backTo="/recipes" />
        <EmptyState
          icon={Trash2}
          title={t('detail.notFoundTitle')}
          body={t('detail.notFoundBody')}
        />
      </>
    );
  }
  return <RecipeView recipe={recipe.data} />;
}

function RecipeView({ recipe }: { recipe: RecipeDetail }) {
  const { t, i18n } = useTranslation(['recipes', 'common']);
  const toast = useToast();
  const navigate = useNavigate();
  const [servings, setServings] = useState(Number(recipe.base_servings));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categories = useRecipeCategories();
  const userState = useRecipeUserState([recipe.id]);
  const state = userState.data?.get(recipe.id);
  const updateState = useUpdateUserState();
  const archive = useSetArchived(recipe.id);
  const remove = useDeleteRecipe();
  const save = useSaveRecipe();

  const base = Number(recipe.base_servings);
  const scaled = servings !== base;
  const total = totalMinutes(recipe);
  const categoryNames = (categories.data ?? [])
    .filter((c) => recipe.categoryIds.includes(c.id))
    .map((c) => c.name);
  const locale = i18n.language;
  const servingsLabel = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
    servings,
  );

  async function duplicate() {
    const id = await save.mutateAsync({
      ...toRecipeInput(recipe),
      id: undefined,
      title: `${recipe.title} ${t('detail.duplicateSuffix')}`.slice(0, 120),
    });
    toast.show(t('detail.duplicated'));
    void navigate(`/recipes/${id}`);
  }

  async function toggleArchive() {
    const archived = !recipe.archived_at;
    await archive.mutateAsync(archived);
    toast.show(archived ? t('detail.archivedToast') : t('detail.restoredToast'));
  }

  return (
    <article className="flex flex-col gap-6">
      <PageHeader title={recipe.title} backTo="/recipes" />

      {recipe.archived_at && <Alert tone="warning">{t('detail.archivedBanner')}</Alert>}
      {(archive.isError || save.isError || updateState.isError) && (
        <Alert tone="error">{errorMessage(archive.error ?? save.error ?? updateState.error)}</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <RecipePhoto
          path={recipe.photo_path}
          alt={recipe.title}
          className="aspect-[4/3] w-full rounded-xl lg:sticky lg:top-8"
        />

        <div className="flex flex-col gap-5">
          {recipe.description && <p className="text-lg">{recipe.description}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={state?.favorite ? 'accent' : 'outline'}
              aria-pressed={Boolean(state?.favorite)}
              onClick={() =>
                updateState.mutate({
                  recipeId: recipe.id,
                  patch: { favorite: !state?.favorite },
                })
              }
            >
              <Heart aria-hidden="true" className={cn(state?.favorite && 'fill-current')} />
              {state?.favorite ? t('detail.unfavorite') : t('detail.favorite')}
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/recipes/${recipe.id}/edit`}>
                <Pencil aria-hidden="true" />
                {t('common:actions.edit')}
              </Link>
            </Button>
          </div>

          <RatingControl
            value={state?.rating ?? null}
            onChange={(rating) => updateState.mutate({ recipeId: recipe.id, patch: { rating } })}
          />

          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['active', recipe.active_minutes],
              ['passive', recipe.passive_minutes],
              ['total', total],
            ].map(([key, value]) => (
              <div key={key} className="bg-surface-muted rounded-md px-2 py-3">
                <dt className="text-fg-muted text-xs font-semibold tracking-wide uppercase">
                  {t(`time.${key as 'active' | 'passive' | 'total'}`)}
                </dt>
                <dd className="font-display mt-1 text-lg">
                  {typeof value === 'number' ? formatMinutes(t, value) : '—'}
                </dd>
              </div>
            ))}
          </dl>

          {(recipe.difficulty || categoryNames.length > 0 || recipe.tags.length > 0) && (
            <ul className="flex flex-wrap gap-2" aria-label={t('form.organisation')}>
              {recipe.difficulty && (
                <li className="bg-accent-soft text-accent-strong rounded-full px-3 py-1 text-sm font-semibold">
                  {t(`difficulty.${recipe.difficulty as Difficulty}`)}
                </li>
              )}
              {categoryNames.map((name) => (
                <li
                  key={name}
                  className="bg-primary-soft rounded-full px-3 py-1 text-sm font-semibold text-olive-800"
                >
                  {name}
                </li>
              ))}
              {recipe.tags.map((tag) => (
                <li
                  key={tag}
                  className="border-border text-fg-muted rounded-full border px-3 py-1 text-sm"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="ingredients-title" className="text-2xl">
              {t('detail.ingredients')}
            </h2>
            <div
              className="bg-surface-muted flex items-center gap-1 rounded-full p-1"
              role="group"
              aria-label={t('detail.servings')}
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('detail.decrease')}
                disabled={servings <= 0.5}
                onClick={() => setServings((s) => nextServings(s, -1))}
              >
                <Minus aria-hidden="true" />
              </Button>
              <output
                aria-live="polite"
                className="min-w-24 text-center text-sm font-semibold"
                aria-label={t('detail.servingsFor', { count: servings })}
              >
                <span className="font-display text-lg">{servingsLabel}</span>{' '}
                <span className="text-fg-muted">{t('detail.servings').toLowerCase()}</span>
              </output>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('detail.increase')}
                disabled={servings >= 100}
                onClick={() => setServings((s) => nextServings(s, 1))}
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>
          </div>
          {scaled && (
            <div className="flex flex-col gap-2">
              <Alert>{t('detail.scaledNotice')}</Alert>
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => setServings(base)}
              >
                <RotateCcw aria-hidden="true" />
                {t('detail.reset', { count: base })}
              </Button>
            </div>
          )}
          <ul
            className="divide-border/70 flex flex-col divide-y"
            aria-labelledby="ingredients-title"
          >
            {recipe.ingredients.map((ingredient) => {
              const amount = scaleQuantity(ingredient, base, servings);
              return (
                <li key={ingredient.id} className="flex items-baseline gap-3 py-2.5">
                  {amount !== null ? (
                    <span className="font-display min-w-16 shrink-0 text-lg tabular-nums">
                      {formatQuantity(amount, ingredient.unit, locale)}
                      {ingredient.unit && (
                        <span className="text-fg-muted ml-1 font-sans text-sm">
                          {ingredient.unit}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="bg-primary mt-2 size-1.5 shrink-0 rounded-full"
                    />
                  )}
                  <span className="min-w-0">
                    {amount !== null ? ingredient.name : ingredient.original_text}
                    {ingredient.optional && (
                      <span className="text-fg-muted ml-2 text-sm">({t('detail.optional')})</span>
                    )}
                    {scaled && amount !== null && !ingredient.scalable && (
                      <span className="text-fg-muted ml-2 text-sm">({t('detail.notScaled')})</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <section className="flex flex-col gap-4" aria-labelledby="steps-title">
          <h2 id="steps-title" className="text-2xl">
            {t('detail.steps')}
          </h2>
          <ol className="flex flex-col gap-4">
            {recipe.steps.map((step, index) => (
              <li key={step.id} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="bg-primary text-primary-fg font-display grid size-9 shrink-0 place-items-center rounded-full text-lg"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 pt-1">
                  <span className="sr-only">{t('detail.step', { number: index + 1 })}: </span>
                  <p className="whitespace-pre-line">{step.body}</p>
                  {step.timer_minutes && (
                    <span className="text-accent-strong mt-2 inline-flex items-center gap-1 text-sm font-semibold">
                      <Timer aria-hidden="true" className="size-4" />
                      {t('detail.timer', { minutes: step.timer_minutes })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <NotesSection recipe={recipe} />

      <div className="border-border/70 flex flex-wrap gap-2 border-t pt-6">
        <Button variant="outline" onClick={() => void duplicate()} loading={save.isPending}>
          <Copy aria-hidden="true" />
          {t('detail.duplicate')}
        </Button>
        <Button variant="outline" onClick={() => void toggleArchive()} loading={archive.isPending}>
          {recipe.archived_at ? (
            <ArchiveRestore aria-hidden="true" />
          ) : (
            <Archive aria-hidden="true" />
          )}
          {recipe.archived_at ? t('detail.restore') : t('detail.archive')}
        </Button>
        <Button variant="dangerGhost" onClick={() => setConfirmDelete(true)}>
          <Trash2 aria-hidden="true" />
          {t('common:actions.delete')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('detail.deleteTitle', { title: recipe.title })}
        description={t('detail.deleteBody')}
        confirmLabel={t('common:actions.delete')}
        onConfirm={async () => {
          await remove.mutateAsync(recipe);
          toast.show(t('detail.deleted'));
          void navigate('/recipes', { replace: true });
        }}
      />
    </article>
  );
}

function RatingControl({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
}) {
  const { t } = useTranslation('recipes');
  return (
    <div className="flex items-center gap-2">
      <span className="text-fg-muted text-sm font-semibold">{t('detail.rating')}</span>
      <div className="flex" role="radiogroup" aria-label={t('detail.rating')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={t('detail.ratingValue', { count: n })}
            onClick={() => onChange(value === n ? null : n)}
            className="text-accent-strong hover:bg-accent-soft grid size-10 place-items-center rounded-full"
          >
            <Star
              aria-hidden="true"
              className={cn('size-5', value !== null && n <= value && 'fill-current')}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function NotesSection({ recipe }: { recipe: RecipeDetail }) {
  const { t } = useTranslation('recipes');
  const blocks = [
    ['notes', recipe.notes],
    ['storage', recipe.storage_notes],
    ['freezing', recipe.freezing_notes],
    ['reheating', recipe.reheating_notes],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  if (!blocks.length && !recipe.source_url && !recipe.source_author) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {blocks.map(([key, text]) => (
        <Card key={key} className="shadow-none">
          <h2 className="mb-2 text-lg">
            {t(`detail.${key as 'notes' | 'storage' | 'freezing' | 'reheating'}`)}
          </h2>
          <p className="text-fg-muted whitespace-pre-line">{text}</p>
        </Card>
      ))}
      {(recipe.source_url || recipe.source_author) && (
        <Card className="shadow-none">
          <h2 className="mb-2 text-lg">{t('detail.source')}</h2>
          {recipe.source_author && (
            <p className="text-fg-muted">{t('detail.by', { author: recipe.source_author })}</p>
          )}
          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary mt-1 inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline"
            >
              {t('detail.openSource')}
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          )}
        </Card>
      )}
    </div>
  );
}
