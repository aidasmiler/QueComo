import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, ClipboardPaste, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatQuantity, parseIngredientLine, parseNumber } from '@/domain/recipes/quantity';
import { useActiveHousehold } from '@/features/households/active-household';
import { errorMessage } from '@/lib/supabase/errors';
import { cn } from '@/lib/utils/cn';
import type { RecipeDetail, RecipeInput } from './api';
import {
  useCreateCategory,
  useDeleteCategory,
  useRecipe,
  useRecipeCategories,
  useRemovePhoto,
  useSaveRecipe,
  useUploadPhoto,
} from './hooks';
import { preparePhoto } from './image';
import { RecipePhoto } from './recipe-photo';

const optionalMinutes = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) <= 10000), 'minutes');

const schema = z.object({
  title: z.string().trim().min(1, 'titleRequired').max(120, 'titleRequired'),
  description: z.string().max(2000),
  baseServings: z
    .string()
    .trim()
    .refine((v) => {
      const n = parseNumber(v);
      return n !== null && n >= 0.5 && n <= 100;
    }, 'servings'),
  difficulty: z.enum(['', 'easy', 'medium', 'hard']),
  activeMinutes: optionalMinutes,
  passiveMinutes: optionalMinutes,
  totalMinutes: optionalMinutes,
  tags: z.string().max(400),
  categoryIds: z.array(z.string()),
  sourceUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'url'),
  sourceAuthor: z.string().max(120),
  notes: z.string().max(4000),
  storageNotes: z.string().max(1000),
  freezingNotes: z.string().max(1000),
  reheatingNotes: z.string().max(1000),
  ingredients: z.array(z.object({ text: z.string().max(300), optional: z.boolean() })),
  steps: z.array(z.object({ body: z.string().max(4000), timer: optionalMinutes })),
});

type FormValues = z.infer<typeof schema>;
type ValidationKey =
  'titleRequired' | 'servings' | 'ingredientsRequired' | 'stepsRequired' | 'minutes' | 'url';

const minutesOrNull = (v: string) => (v.trim() === '' ? null : Number(v));
const textOrNull = (v: string) => (v.trim() === '' ? null : v.trim());

function toFormValues(recipe?: RecipeDetail): FormValues {
  return {
    title: recipe?.title ?? '',
    description: recipe?.description ?? '',
    baseServings: recipe ? String(Number(recipe.base_servings)) : '4',
    difficulty: (recipe?.difficulty as FormValues['difficulty']) ?? '',
    activeMinutes: recipe?.active_minutes?.toString() ?? '',
    passiveMinutes: recipe?.passive_minutes?.toString() ?? '',
    totalMinutes: recipe?.total_minutes?.toString() ?? '',
    tags: recipe?.tags.join(', ') ?? '',
    categoryIds: recipe?.categoryIds ?? [],
    sourceUrl: recipe?.source_url ?? '',
    sourceAuthor: recipe?.source_author ?? '',
    notes: recipe?.notes ?? '',
    storageNotes: recipe?.storage_notes ?? '',
    freezingNotes: recipe?.freezing_notes ?? '',
    reheatingNotes: recipe?.reheating_notes ?? '',
    ingredients: recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({ text: i.original_text, optional: i.optional }))
      : [
          { text: '', optional: false },
          { text: '', optional: false },
          { text: '', optional: false },
        ],
    steps: recipe?.steps.length
      ? recipe.steps.map((s) => ({ body: s.body, timer: s.timer_minutes?.toString() ?? '' }))
      : [{ body: '', timer: '' }],
  };
}

export function RecipeFormPage() {
  const { recipeId } = useParams();
  if (!recipeId) return <RecipeForm />;
  return <EditRecipe recipeId={recipeId} />;
}

function EditRecipe({ recipeId }: { recipeId: string }) {
  const recipe = useRecipe(recipeId);
  if (recipe.isPending) return <Skeleton className="h-96 w-full" />;
  if (recipe.isError) return <Alert tone="error">{errorMessage(recipe.error)}</Alert>;
  if (!recipe.data) return <Alert tone="error">{errorMessage(null)}</Alert>;
  return <RecipeForm recipe={recipe.data} />;
}

function RecipeForm({ recipe }: { recipe?: RecipeDetail }) {
  const { t } = useTranslation(['recipes', 'common']);
  const navigate = useNavigate();
  const toast = useToast();
  const { active } = useActiveHousehold();
  const save = useSaveRecipe();
  const [listError, setListError] = useState<ValidationKey | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const backTo = recipe ? `/recipes/${recipe.id}` : '/recipes';

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(recipe),
  });
  const { errors, isDirty } = form.formState;
  const ingredients = useFieldArray({ control: form.control, name: 'ingredients' });
  const steps = useFieldArray({ control: form.control, name: 'steps' });

  const v = (key?: string) => (key ? t(`form.validation.${key as ValidationKey}`) : undefined);

  const onSubmit = form.handleSubmit(async (values) => {
    const ingredientRows = values.ingredients.filter((row) => row.text.trim() !== '');
    const stepRows = values.steps.filter((row) => row.body.trim() !== '');
    if (!ingredientRows.length) return setListError('ingredientsRequired');
    if (!stepRows.length) return setListError('stepsRequired');
    setListError(null);
    if (!active) return;

    const input: RecipeInput = {
      id: recipe?.id,
      household_id: recipe?.household_id ?? active.id,
      title: values.title.trim(),
      description: textOrNull(values.description),
      base_servings: parseNumber(values.baseServings) ?? 1,
      difficulty: values.difficulty === '' ? null : values.difficulty,
      active_minutes: minutesOrNull(values.activeMinutes),
      passive_minutes: minutesOrNull(values.passiveMinutes),
      total_minutes: minutesOrNull(values.totalMinutes),
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
      source_url: textOrNull(values.sourceUrl),
      source_author: textOrNull(values.sourceAuthor),
      notes: textOrNull(values.notes),
      storage_notes: textOrNull(values.storageNotes),
      freezing_notes: textOrNull(values.freezingNotes),
      reheating_notes: textOrNull(values.reheatingNotes),
      category_ids: values.categoryIds,
      ingredients: ingredientRows.map((row) => {
        const parsed = parseIngredientLine(row.text);
        return {
          original_text: parsed.originalText,
          quantity: parsed.quantity,
          unit: parsed.unit,
          name: parsed.name,
          scalable: parsed.scalable,
          optional: row.optional,
        };
      }),
      steps: stepRows.map((row) => ({
        body: row.body.trim(),
        timer_minutes: minutesOrNull(row.timer),
      })),
    };
    const id = await save.mutateAsync(input);
    toast.show(t('form.saved'));
    void navigate(`/recipes/${id}`, { replace: true });
  });

  return (
    <>
      <PageHeader title={recipe ? t('form.editTitle') : t('form.newTitle')} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 pb-24">
        {save.isError && <Alert tone="error">{errorMessage(save.error)}</Alert>}

        <Card className="flex flex-col gap-5">
          <h2 className="text-xl">{t('form.basics')}</h2>
          <Field label={t('form.title')} error={v(errors.title?.message)}>
            <Input
              placeholder={t('form.titlePlaceholder')}
              maxLength={120}
              autoComplete="off"
              {...form.register('title')}
            />
          </Field>
          <Field label={t('form.description')}>
            <Textarea
              rows={2}
              placeholder={t('form.descriptionPlaceholder')}
              maxLength={2000}
              {...form.register('description')}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={t('form.baseServings')}
              hint={t('form.baseServingsHint')}
              error={v(errors.baseServings?.message)}
            >
              <Input inputMode="decimal" {...form.register('baseServings')} />
            </Field>
            <Field label={t('difficulty.label')}>
              <select
                className="border-border bg-surface min-h-12 w-full rounded-md border px-4 text-base"
                {...form.register('difficulty')}
              >
                <option value="">{t('difficulty.none')}</option>
                <option value="easy">{t('difficulty.easy')}</option>
                <option value="medium">{t('difficulty.medium')}</option>
                <option value="hard">{t('difficulty.hard')}</option>
              </select>
            </Field>
          </div>
          {recipe ? (
            <PhotoField recipe={recipe} />
          ) : (
            <p className="text-fg-muted text-sm">{t('form.photoAfterSave')}</p>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl">{t('form.ingredients')}</h2>
            <p className="text-fg-muted mt-1 text-sm">{t('form.ingredientsHint')}</p>
          </div>
          {listError === 'ingredientsRequired' && <Alert tone="error">{v(listError)}</Alert>}
          <ol className="flex flex-col gap-3">
            {ingredients.fields.map((field, index) => (
              <li key={field.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={t('form.ingredientLine', { number: index + 1 })}
                    maxLength={300}
                    autoComplete="off"
                    {...form.register(`ingredients.${index}.text`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        if (index === ingredients.fields.length - 1) {
                          ingredients.append({ text: '', optional: false });
                        } else {
                          form.setFocus(`ingredients.${index + 1}.text`);
                        }
                      }
                    }}
                  />
                  <RowActions
                    index={index}
                    count={ingredients.fields.length}
                    onMove={(to) => ingredients.move(index, to)}
                    onRemove={() => ingredients.remove(index)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-1">
                  <ParsedPreview control={form.control} index={index} />
                  <label className="text-fg-muted inline-flex min-h-9 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      {...form.register(`ingredients.${index}.optional`)}
                    />
                    {t('form.optional')}
                  </label>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => ingredients.append({ text: '', optional: false })}
            >
              <Plus aria-hidden="true" />
              {t('form.addIngredient')}
            </Button>
            <PasteIngredients
              onAdd={(lines) => {
                const current = form.getValues('ingredients').filter((r) => r.text.trim() !== '');
                ingredients.replace([
                  ...current,
                  ...lines.map((text) => ({ text, optional: false })),
                ]);
              }}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-xl">{t('form.steps')}</h2>
          {listError === 'stepsRequired' && <Alert tone="error">{v(listError)}</Alert>}
          <ol className="flex flex-col gap-4">
            {steps.fields.map((field, index) => (
              <li key={field.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="bg-primary text-primary-fg font-display mt-2 grid size-8 shrink-0 place-items-center rounded-full"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Textarea
                    aria-label={t('form.stepLine', { number: index + 1 })}
                    placeholder={t('form.stepPlaceholder')}
                    rows={3}
                    maxLength={4000}
                    {...form.register(`steps.${index}.body`)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Input
                      aria-label={t('form.stepTimer')}
                      placeholder={t('form.stepTimer')}
                      inputMode="numeric"
                      className="max-w-48"
                      aria-invalid={errors.steps?.[index]?.timer ? true : undefined}
                      {...form.register(`steps.${index}.timer`)}
                    />
                    <RowActions
                      index={index}
                      count={steps.fields.length}
                      onMove={(to) => steps.move(index, to)}
                      onRemove={() => steps.remove(index)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="secondary"
            className="self-start"
            onClick={() => steps.append({ body: '', timer: '' })}
          >
            <Plus aria-hidden="true" />
            {t('form.addStep')}
          </Button>
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl">{t('form.times')}</h2>
            <p className="text-fg-muted mt-1 text-sm">{t('form.timesHint')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('form.activeMinutes')} error={v(errors.activeMinutes?.message)}>
              <Input inputMode="numeric" {...form.register('activeMinutes')} />
            </Field>
            <Field label={t('form.passiveMinutes')} error={v(errors.passiveMinutes?.message)}>
              <Input inputMode="numeric" {...form.register('passiveMinutes')} />
            </Field>
            <Field
              label={t('form.totalMinutes')}
              hint={t('form.totalAuto')}
              error={v(errors.totalMinutes?.message)}
            >
              <Input inputMode="numeric" {...form.register('totalMinutes')} />
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-xl">{t('form.organisation')}</h2>
          <CategoryPicker
            value={useWatch({ control: form.control, name: 'categoryIds' })}
            onChange={(ids) => form.setValue('categoryIds', ids, { shouldDirty: true })}
          />
          <Field label={t('form.tags')} hint={t('form.tagsHint')}>
            <Input maxLength={400} autoComplete="off" {...form.register('tags')} />
          </Field>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-xl">{t('form.extra')}</h2>
          <Field label={t('form.notes')}>
            <Textarea rows={3} maxLength={4000} {...form.register('notes')} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t('form.storageNotes')}>
              <Textarea rows={2} maxLength={1000} {...form.register('storageNotes')} />
            </Field>
            <Field label={t('form.freezingNotes')}>
              <Textarea rows={2} maxLength={1000} {...form.register('freezingNotes')} />
            </Field>
            <Field label={t('form.reheatingNotes')}>
              <Textarea rows={2} maxLength={1000} {...form.register('reheatingNotes')} />
            </Field>
          </div>
          <h3 className="text-lg">{t('form.source')}</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('form.sourceUrl')} error={v(errors.sourceUrl?.message)}>
              <Input
                type="url"
                inputMode="url"
                autoComplete="off"
                {...form.register('sourceUrl')}
              />
            </Field>
            <Field label={t('form.sourceAuthor')}>
              <Input maxLength={120} {...form.register('sourceAuthor')} />
            </Field>
          </div>
        </Card>

        <div className="bg-bg/95 border-border/70 pb-safe fixed inset-x-0 bottom-16 z-20 border-t px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-5xl justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (isDirty ? setConfirmLeave(true) : void navigate(backTo))}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" loading={save.isPending}>
              {t('form.save')}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title={t('form.discardTitle')}
        description={t('form.discardBody')}
        confirmLabel={t('form.discard')}
        onConfirm={() => void navigate(backTo)}
      />
    </>
  );
}

function ParsedPreview({ control, index }: { control: Control<FormValues>; index: number }) {
  const { t, i18n } = useTranslation('recipes');
  const text = useWatch({ control, name: `ingredients.${index}.text` });
  if (!text?.trim()) return null;
  const parsed = parseIngredientLine(text);
  return (
    <span className="text-fg-muted text-xs">
      {parsed.quantity !== null
        ? t('form.parsed', {
            quantity: formatQuantity(parsed.quantity, parsed.unit, i18n.language),
            unit: parsed.unit ?? '',
            name: parsed.name,
          })
        : t('form.parsedNoQuantity')}
    </span>
  );
}

function RowActions({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation('recipes');
  return (
    <div className="flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('form.moveUp')}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('form.moveDown')}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
      >
        <ArrowDown aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="dangerGhost"
        size="icon"
        aria-label={t('form.remove')}
        disabled={count === 1}
        onClick={onRemove}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}

function PasteIngredients({ onAdd }: { onAdd: (lines: string[]) => void }) {
  const { t } = useTranslation('recipes');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const lines = text
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*·]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 100);
  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        <ClipboardPaste aria-hidden="true" />
        {t('form.pasteIngredients')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('form.pasteIngredients')}
        description={t('form.pasteHint')}
        footer={
          <Button
            type="button"
            disabled={lines.length === 0}
            onClick={() => {
              onAdd(lines);
              setText('');
              setOpen(false);
            }}
          >
            {t('form.pasteAdd')}
          </Button>
        }
      >
        <Textarea
          aria-label={t('form.pasteIngredients')}
          rows={8}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Dialog>
    </>
  );
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useTranslation(['recipes', 'common']);
  const categories = useRecipeCategories();
  const create = useCreateCategory();
  const remove = useDeleteCategory();
  const [name, setName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const category = await create.mutateAsync(trimmed);
    onChange([...value, category.id]);
    setName('');
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold">{t('form.categories')}</legend>
      {(create.isError || remove.isError) && (
        <Alert tone="error">{errorMessage(create.error ?? remove.error)}</Alert>
      )}
      <ul className="flex flex-wrap gap-2">
        {categories.data?.map((category) => {
          const selected = value.includes(category.id);
          return (
            <li key={category.id} className="flex items-center">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange(
                    selected ? value.filter((id) => id !== category.id) : [...value, category.id],
                  )
                }
                className={cn(
                  'min-h-10 rounded-l-full border py-1 pr-2 pl-4 text-sm font-semibold',
                  selected
                    ? 'border-primary bg-primary text-primary-fg'
                    : 'border-border bg-surface text-fg',
                )}
              >
                {category.name}
              </button>
              <button
                type="button"
                aria-label={t('form.deleteCategory', { name: category.name })}
                onClick={() => setPendingDelete(category)}
                className={cn(
                  'text-fg-muted hover:text-danger grid min-h-10 w-9 place-items-center rounded-r-full border border-l-0',
                  selected ? 'border-primary' : 'border-border',
                )}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2">
        <Input
          aria-label={t('form.newCategory')}
          placeholder={t('form.newCategory')}
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void add();
            }
          }}
          className="max-w-xs"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void add()}
          loading={create.isPending}
          disabled={!name.trim()}
        >
          {t('form.addCategory')}
        </Button>
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t('form.deleteCategoryTitle', { name: pendingDelete?.name ?? '' })}
        description={t('form.deleteCategoryBody')}
        confirmLabel={t('common:actions.delete')}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await remove.mutateAsync(pendingDelete.id);
          onChange(value.filter((id) => id !== pendingDelete.id));
        }}
      />
    </fieldset>
  );
}

function PhotoField({ recipe }: { recipe: RecipeDetail }) {
  const { t } = useTranslation('recipes');
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadPhoto();
  const remove = useRemovePhoto();
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const blob = await preparePhoto(file);
      await upload.mutateAsync({ recipe, file: blob });
      toast.show(t('form.photoUploaded'));
    } catch (e) {
      setError(
        e instanceof Error && e.message.startsWith('photo')
          ? t('form.photoTooBig')
          : errorMessage(e),
      );
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold">{t('form.photo')}</span>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-wrap items-center gap-4">
        <RecipePhoto
          path={recipe.photo_path}
          alt={recipe.title}
          className="aspect-[4/3] w-40 rounded-md"
        />
        <div className="flex flex-col gap-2">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              void onFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => input.current?.click()}
            loading={upload.isPending}
          >
            <ImagePlus aria-hidden="true" />
            {recipe.photo_path ? t('form.changePhoto') : t('form.addPhoto')}
          </Button>
          {recipe.photo_path && (
            <Button
              type="button"
              variant="dangerGhost"
              onClick={() => remove.mutate(recipe)}
              loading={remove.isPending}
            >
              {t('form.removePhoto')}
            </Button>
          )}
          <p className="text-fg-muted text-xs">{t('form.photoHint')}</p>
        </div>
      </div>
    </div>
  );
}
