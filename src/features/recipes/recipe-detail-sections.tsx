import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  ChefHat,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  History,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import type { EffectiveTimes, LogStats, TimeEstimate } from '@/domain/recipes/estimates';
import { parseNumber } from '@/domain/recipes/quantity';
import { useCurrentUser } from '@/features/auth/auth-context';
import type { CookLog } from '@/features/catalogs/api';
import { CategoryBadge, TagBadge } from '@/features/catalogs/catalog-ui';
import {
  useCatalog,
  useCookLogs,
  useCreateCookLog,
  useDeleteCookLog,
  useUpdateCookLog,
} from '@/features/catalogs/hooks';
import { useHouseholdMembers } from '@/features/households/hooks';
import { errorMessage } from '@/lib/supabase/errors';
import { cn } from '@/lib/utils/cn';
import type { Difficulty, RecipeDetail } from './api';
import { formatMinutes } from './format';
import type { RecipeInsight } from './insights';

export function OrganisationBadges({
  recipe,
  insight,
}: {
  recipe: RecipeDetail;
  insight: RecipeInsight | undefined;
}) {
  const { t } = useTranslation(['recipes', 'catalog']);
  const catalog = useCatalog();
  const categories = recipe.categoryKeys.flatMap((key) => {
    const item = catalog.data?.maps.category.get(key);
    return item ? [item] : [];
  });
  const tags = recipe.tagKeys.flatMap((key) => {
    const item = catalog.data?.maps.tag.get(key);
    return item ? [item] : [];
  });
  const auto = insight?.autoTags ?? [];
  if (!recipe.difficulty && !categories.length && !tags.length && !auto.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {(recipe.difficulty || categories.length > 0) && (
        <ul className="flex flex-wrap gap-2" aria-label={t('form.categories')}>
          {recipe.difficulty && (
            <li className="bg-accent-soft text-accent-strong inline-flex min-h-8 items-center rounded-full px-3 text-sm font-semibold">
              {t(`difficulty.${recipe.difficulty as Difficulty}`)}
            </li>
          )}
          {categories.map((item) => (
            <li key={item.key}>
              <CategoryBadge item={item} />
            </li>
          ))}
        </ul>
      )}
      {(tags.length > 0 || auto.length > 0) && (
        <ul className="flex flex-wrap gap-2" aria-label={t('form.tags')}>
          {tags.map((item) => (
            <li key={item.key}>
              <TagBadge>{item.name}</TagBadge>
            </li>
          ))}
          {auto.map((tag) => (
            <li key={tag}>
              <TagBadge
                auto
                title={
                  insight?.times.personalised && ['very_quick', 'quick', 'low_active'].includes(tag)
                    ? t('detail.autoTagPersonalised')
                    : t('detail.autoTag')
                }
              >
                {t(`catalog:autoTags.${tag}`)}
                <span className="sr-only"> ({t('detail.autoTag')})</span>
              </TagBadge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function sourceText(t: ReturnType<typeof useTranslation<'recipes'>>['t'], estimate: TimeEstimate) {
  if (estimate.minutes === null) return null;
  if (estimate.source === 'personal') {
    return t('estimates.personal', {
      time: formatMinutes(t, estimate.minutes),
      count: estimate.basedOn,
    });
  }
  if (estimate.source === 'household') {
    return t('estimates.household', {
      time: formatMinutes(t, estimate.minutes),
      count: estimate.basedOn,
    });
  }
  return null;
}

/** Explains where the times used for filters and automatic tags come from. */
export function EstimateNote({ times }: { times: EffectiveTimes }) {
  const { t } = useTranslation('recipes');
  const total = sourceText(t, times.total);
  const active = sourceText(t, times.active);
  if (!total && !active) return null;
  return (
    <div className="bg-primary-soft/50 rounded-md px-4 py-3 text-sm text-olive-800">
      {total && <p>{t('estimates.totalLine', { text: total })}</p>}
      {active && <p>{t('estimates.activeLine', { text: active })}</p>}
      <p className="text-fg-muted mt-1">{t('estimates.originalKept')}</p>
    </div>
  );
}

export function EquipmentCard({
  recipe,
  insight,
}: {
  recipe: RecipeDetail;
  insight: RecipeInsight | undefined;
}) {
  const { t } = useTranslation('recipes');
  const catalog = useCatalog();
  const kitchenConfigured = insight !== undefined && insightConfigured(insight, recipe);
  const evaluation = insight?.evaluation;
  const name = (key: string) =>
    catalog.data?.maps.utensil.get(key as never)?.name ?? t('catalog.unknownItem');

  return (
    <Card className="flex flex-col gap-4" aria-labelledby="equipment-title">
      <h2 id="equipment-title" className="text-2xl">
        {t('equipment.title')}
      </h2>
      {recipe.equipment.status === 'unspecified' && (
        <p className="text-fg-muted">{t('equipment.detailUnspecified')}</p>
      )}
      {recipe.equipment.status === 'none' && <p>{t('equipment.detailNone')}</p>}
      {recipe.equipment.status === 'defined' && evaluation && (
        <AvailabilityBanner
          availability={evaluation.availability}
          configured={kitchenConfigured}
          missing={evaluation.missing.map(name)}
        />
      )}
      {recipe.equipment.status === 'defined' && (
        <ol className="flex flex-col gap-3">
          {recipe.equipment.methods.map((method, index) => {
            const doable = evaluation?.doableMethods.includes(index);
            return (
              <li key={index} className="border-border/70 rounded-md border p-3">
                {recipe.equipment.methods.length > 1 && (
                  <p className="mb-2 font-semibold">
                    {method.label ?? t('equipment.methodNumber', { number: index + 1 })}
                    {doable && (
                      <span className="text-primary ml-2 text-sm">
                        · {t('equipment.methodDoable')}
                      </span>
                    )}
                  </p>
                )}
                <ul className="flex flex-col gap-1">
                  {method.utensils.map((key) => {
                    const has = !evaluation?.gaps[index]?.includes(key);
                    return (
                      <li key={key} className="flex items-center gap-2">
                        {kitchenConfigured ? (
                          has ? (
                            <Check aria-hidden="true" className="text-primary size-4" />
                          ) : (
                            <X aria-hidden="true" className="text-danger size-4" />
                          )
                        ) : (
                          <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />
                        )}
                        <span>{name(key)}</span>
                        {kitchenConfigured && !has && (
                          <span className="text-danger text-sm">({t('equipment.youLackIt')})</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
      {recipe.optionalUtensils.length > 0 && (
        <div>
          <h3 className="font-sans text-base font-semibold">{t('equipment.optionalTitle')}</h3>
          <p className="text-fg-muted mt-1 text-sm">
            {recipe.optionalUtensils.map(name).join(', ')}
          </p>
        </div>
      )}
    </Card>
  );
}

function insightConfigured(insight: RecipeInsight, recipe: RecipeDetail) {
  return recipe.equipment.status !== 'defined' || insight.evaluation.availability !== 'unknown';
}

function AvailabilityBanner({
  availability,
  configured,
  missing,
}: {
  availability: 'can' | 'missing' | 'unknown';
  configured: boolean;
  missing: string[];
}) {
  const { t } = useTranslation('recipes');
  if (!configured) {
    return (
      <div className="bg-surface-muted flex items-start gap-3 rounded-md px-4 py-3">
        <CircleHelp aria-hidden="true" className="text-fg-muted mt-0.5 size-5 shrink-0" />
        <p className="text-sm">
          {t('equipment.notConfigured')}{' '}
          <Link to="/kitchen" className="text-primary font-semibold underline underline-offset-4">
            {t('equipment.configureNow')}
          </Link>
        </p>
      </div>
    );
  }
  if (availability === 'can') {
    return (
      <div className="bg-primary-soft/60 flex items-center gap-3 rounded-md px-4 py-3 text-olive-800">
        <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
        <p className="font-semibold">{t('availability.can')}</p>
      </div>
    );
  }
  return (
    <div className="bg-warning-soft text-warning flex items-start gap-3 rounded-md px-4 py-3">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">{t('availability.missing')}</p>
        <p className="text-sm">{t('equipment.missingList', { list: missing.join(', ') })}</p>
      </div>
    </div>
  );
}

const logSchema = z.object({
  cookedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date'),
  servings: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || ((parseNumber(v) ?? 0) > 0 && (parseNumber(v) ?? 0) <= 100),
      'servings',
    ),
  totalMinutes: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 20000, 'totalRequired'),
  activeMinutes: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) <= 20000), 'minutes'),
  methodPosition: z.string(),
  notes: z.string().max(1000),
});
type LogValues = z.infer<typeof logSchema>;
type LogValidation = 'date' | 'servings' | 'totalRequired' | 'minutes';

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function LogDialog({
  recipe,
  log,
  open,
  onOpenChange,
}: {
  recipe: RecipeDetail;
  log: CookLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation(['recipes', 'common']);
  const create = useCreateCookLog(recipe.id);
  const update = useUpdateCookLog(recipe.id);
  const form = useForm<LogValues>({
    resolver: zodResolver(logSchema),
    values: {
      cookedOn: log?.cooked_on ?? today(),
      servings: log?.servings?.toString() ?? String(Number(recipe.base_servings)),
      totalMinutes: log?.total_minutes?.toString() ?? '',
      activeMinutes: log?.active_minutes?.toString() ?? '',
      methodPosition: log?.method_position?.toString() ?? '',
      notes: log?.notes ?? '',
    },
  });
  const errors = form.formState.errors;
  const v = (key?: string) => (key ? t(`history.validation.${key as LogValidation}`) : undefined);
  const methods = recipe.equipment.status === 'defined' ? recipe.equipment.methods : [];
  const mutation = log ? update : create;

  const onSubmit = form.handleSubmit(async (values) => {
    const fields = {
      cooked_on: values.cookedOn,
      servings: values.servings ? parseNumber(values.servings) : null,
      total_minutes: Number(values.totalMinutes),
      active_minutes: values.activeMinutes ? Number(values.activeMinutes) : null,
      method_position: values.methodPosition === '' ? null : Number(values.methodPosition),
      notes: values.notes.trim() || null,
    };
    if (log) await update.mutateAsync({ id: log.id, patch: fields });
    else
      await create.mutateAsync({
        ...fields,
        recipe_id: recipe.id,
        household_id: recipe.household_id,
      });
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={log ? t('history.editTitle') : t('history.logTitle')}
      description={t('history.logHint')}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" form="cook-log-form" loading={mutation.isPending}>
            {t('history.save')}
          </Button>
        </>
      }
    >
      <form id="cook-log-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {mutation.isError && <Alert tone="error">{errorMessage(mutation.error)}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('history.date')} error={v(errors.cookedOn?.message)}>
            <Input type="date" max={today()} {...form.register('cookedOn')} />
          </Field>
          <Field label={t('history.servings')} error={v(errors.servings?.message)}>
            <Input inputMode="decimal" {...form.register('servings')} />
          </Field>
          <Field label={t('history.totalMinutes')} error={v(errors.totalMinutes?.message)}>
            <Input inputMode="numeric" {...form.register('totalMinutes')} />
          </Field>
          <Field
            label={t('history.activeMinutes')}
            hint={t('history.optional')}
            error={v(errors.activeMinutes?.message)}
          >
            <Input inputMode="numeric" {...form.register('activeMinutes')} />
          </Field>
        </div>
        {methods.length > 1 && (
          <Field label={t('history.method')}>
            <select
              className="border-border bg-surface min-h-12 w-full rounded-md border px-4"
              {...form.register('methodPosition')}
            >
              <option value="">{t('history.methodUnknown')}</option>
              {methods.map((method, index) => (
                <option key={index} value={String(index)}>
                  {method.label ?? t('equipment.methodNumber', { number: index + 1 })}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t('history.notes')} hint={t('history.optional')}>
          <Textarea rows={2} maxLength={1000} {...form.register('notes')} />
        </Field>
      </form>
    </Dialog>
  );
}

function StatsLine({ label, stats }: { label: string; stats: LogStats }) {
  const { t, i18n } = useTranslation('recipes');
  const date = stats.lastCookedOn
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
        new Date(`${stats.lastCookedOn}T12:00:00`),
      )
    : null;
  return (
    <div className="bg-surface-muted rounded-md px-3 py-2">
      <dt className="text-fg-muted text-xs font-semibold tracking-wide uppercase">{label}</dt>
      <dd className="text-sm">
        {stats.count === 0
          ? t('history.never')
          : [
              t('history.times', { count: stats.count }),
              stats.medianTotal !== null &&
                t('history.median', { time: formatMinutes(t, stats.medianTotal) }),
              date && t('history.last', { date }),
            ]
              .filter(Boolean)
              .join(' · ')}
      </dd>
    </div>
  );
}

export function CookHistory({
  recipe,
  insight,
}: {
  recipe: RecipeDetail;
  insight: RecipeInsight | undefined;
}) {
  const { t, i18n } = useTranslation(['recipes', 'common']);
  const user = useCurrentUser();
  const logs = useCookLogs(recipe.id);
  const members = useHouseholdMembers(recipe.household_id);
  const remove = useDeleteCookLog(recipe.id);
  const [editing, setEditing] = useState<CookLog | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CookLog | null>(null);
  const names = useMemo(
    () => new Map((members.data ?? []).map((m) => [m.userId, m.displayName])),
    [members.data],
  );
  const format = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-2xl">
          <History aria-hidden="true" className="size-6" />
          {t('history.title')}
        </h2>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <ChefHat aria-hidden="true" />
          {t('history.cooked')}
        </Button>
      </div>
      {insight && (
        <dl className="grid gap-2 sm:grid-cols-2">
          <StatsLine label={t('history.you')} stats={insight.times.personal} />
          <StatsLine label={t('history.household')} stats={insight.times.household} />
        </dl>
      )}
      {logs.isError && <Alert tone="error">{errorMessage(logs.error)}</Alert>}
      {remove.isError && <Alert tone="error">{errorMessage(remove.error)}</Alert>}
      {logs.data && logs.data.length === 0 && (
        <p className="text-fg-muted text-sm">{t('history.empty')}</p>
      )}
      {logs.data && logs.data.length > 0 && (
        <ul className="divide-border/60 divide-y" aria-label={t('history.title')}>
          {logs.data.map((log) => {
            const own = log.user_id === user.id;
            return (
              <li key={log.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {format.format(new Date(`${log.cooked_on}T12:00:00`))}
                    <span className="text-fg-muted font-normal">
                      {' · '}
                      {own ? t('history.you') : (names.get(log.user_id) ?? '—')}
                    </span>
                  </p>
                  <p className="text-fg-muted text-sm">
                    {[
                      log.total_minutes !== null &&
                        t('history.totalValue', { time: formatMinutes(t, log.total_minutes) }),
                      log.active_minutes !== null &&
                        t('history.activeValue', { time: formatMinutes(t, log.active_minutes) }),
                      log.servings !== null &&
                        t('history.servingsValue', { count: Number(log.servings) }),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {log.notes && <p className="mt-1 text-sm whitespace-pre-line">{log.notes}</p>}
                </div>
                {own && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('history.edit')}
                      onClick={() => {
                        setEditing(log);
                        setOpen(true);
                      }}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      variant="dangerGhost"
                      size="icon"
                      aria-label={t('history.delete')}
                      onClick={() => setPendingDelete(log)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <LogDialog recipe={recipe} log={editing} open={open} onOpenChange={setOpen} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(value) => !value && setPendingDelete(null)}
        title={t('history.deleteTitle')}
        description={t('history.deleteBody')}
        confirmLabel={t('common:actions.delete')}
        onConfirm={async () => {
          if (pendingDelete) await remove.mutateAsync(pendingDelete.id);
        }}
      />
      <p className={cn('text-fg-muted text-xs')}>{t('history.privacy')}</p>
    </Card>
  );
}
