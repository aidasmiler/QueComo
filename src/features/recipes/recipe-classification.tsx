import { Check, Info, Plus, RefreshCw, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  autoSelected,
  parseSuggestionId,
  pendingSuggestions,
  pendingUtensils,
  suggestionId,
  type Reason,
  type Suggestion,
} from '@/domain/classification';
import { autoTags } from '@/domain/recipes/auto-tags';
import type { ItemKey } from '@/domain/recipes/catalog';
import { useCatalog, type CatalogItem } from '@/features/catalogs/hooks';
import { TagBadge } from '@/features/catalogs/catalog-ui';
import { cn } from '@/lib/utils/cn';
import type { RecipeClassification, UtensilRole } from './recipe-classification-state';
import type { RecipeFormValues } from './recipe-form-page';

const minutes = (v: string) => (v.trim() === '' ? null : Number(v));

/**
 * "Clasificación inteligente": deterministic tags (read-only) plus editable suggestions.
 * Compact on purpose: it never blocks saving and nothing in it is required.
 */
export function SmartClassification({
  control,
  api,
}: {
  control: Control<RecipeFormValues>;
  api: RecipeClassification;
}) {
  const { t } = useTranslation(['recipes', 'catalog']);
  const catalog = useCatalog();
  const [showLow, setShowLow] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [categories, tagKeys, methods, optional, status, total, active, passive, difficulty] =
    useWatch({
      control,
      name: [
        'categories',
        'tagKeys',
        'methods',
        'optionalUtensils',
        'equipmentStatus',
        'totalMinutes',
        'activeMinutes',
        'passiveMinutes',
        'difficulty',
      ],
    });
  if (!catalog.data || !api.ready) return null;
  const maps = catalog.data.maps;
  const selection = { category: categories, tag: tagKeys };

  const activeMin = minutes(active);
  const passiveMin = minutes(passive);
  const totalMin =
    minutes(total) ??
    (activeMin !== null || passiveMin !== null ? (activeMin ?? 0) + (passiveMin ?? 0) : null);
  const deterministic = autoTags({
    totalMinutes: totalMin,
    activeMinutes: activeMin,
    difficulty: difficulty || null,
    equipment: {
      status,
      methods: methods
        .filter((m) => m.utensils.length > 0)
        .map((m) => ({ label: m.label, utensils: m.utensils })),
    },
  });

  const inEquipment = new Set<ItemKey>([...methods.flatMap((m) => m.utensils), ...optional]);
  const auto = autoSelected(api.suggestions, api.decisions);
  const pending = pendingSuggestions(api.suggestions, selection, api.decisions, {
    includeLow: showLow,
  });
  const utensils = pendingUtensils(api.suggestions, api.decisions, inEquipment, {
    includeLow: showLow,
  });
  const hiddenLow =
    pendingSuggestions(api.suggestions, selection, api.decisions, { includeLow: true }).length +
    pendingUtensils(api.suggestions, api.decisions, inEquipment, { includeLow: true }).length -
    (showLow ? 0 : pending.length + utensils.length);
  const rejected = Object.entries(api.decisions)
    .filter(([, d]) => d === 'rejected')
    .map(([id]) => parseSuggestionId(id))
    .filter((p): p is NonNullable<typeof p> => p !== null && Boolean(maps[p.kind].get(p.key)));
  const acceptable = pending.filter((s) => s.kind !== 'utensil' && !s.requiresConfirmation);
  const nothing = !auto.length && !pending.length && !utensils.length;

  const itemOf = (s: { kind: Suggestion['kind']; key: ItemKey }): CatalogItem | undefined =>
    maps[s.kind].get(s.key);

  return (
    <Card className="flex flex-col gap-4" aria-labelledby="smart-classification-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="smart-classification-title" className="flex items-center gap-2 text-xl">
            <Sparkles aria-hidden="true" className="text-primary size-5" />
            {t('classification.title')}
          </h2>
          <p className="text-fg-muted mt-1 text-sm">{t('classification.hint')}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={api.reanalyse}>
          <RefreshCw aria-hidden="true" />
          {t('classification.reanalyse')}
        </Button>
      </div>

      {deterministic.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-sans text-sm font-semibold">{t('classification.automatic')}</h3>
          <ul className="flex flex-wrap gap-2" aria-label={t('classification.automatic')}>
            {deterministic.map((tag) => (
              <li key={tag}>
                <TagBadge auto title={t('detail.autoTag')}>
                  {t(`catalog:autoTags.${tag}`)}
                </TagBadge>
              </li>
            ))}
          </ul>
          <p className="text-fg-muted text-xs">{t('classification.automaticHint')}</p>
        </div>
      )}

      <div aria-live="polite" className="flex flex-col gap-4">
        {nothing && <p className="text-fg-muted text-sm">{t('classification.empty')}</p>}

        {auto.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="font-sans text-sm font-semibold">{t('classification.added')}</h3>
            <ul className="flex flex-wrap gap-2">
              {auto.map((s) => {
                const name = itemOf(s)?.name;
                if (!name) return null;
                return (
                  <li
                    key={suggestionId(s.kind, s.key)}
                    className="bg-primary-soft inline-flex min-h-10 items-center gap-1 rounded-full pl-3 text-olive-800"
                  >
                    <Sparkles aria-hidden="true" className="size-3.5" />
                    <span className="text-sm font-semibold">{name}</span>
                    <button
                      type="button"
                      onClick={() => api.reject(s)}
                      className="grid size-10 place-items-center rounded-full hover:bg-olive-200"
                      aria-label={t('classification.removeNamed', { name })}
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {pending.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="font-sans text-sm font-semibold">{t('classification.pending')}</h3>
            <ul className="flex flex-wrap gap-2">
              {pending.map((s) => {
                const name = itemOf(s)?.name;
                if (!name) return null;
                const confirm = s.requiresConfirmation;
                return (
                  <li
                    key={suggestionId(s.kind, s.key)}
                    className={cn(
                      'inline-flex min-h-10 items-center rounded-full border',
                      confirm ? 'border-warning border-dashed' : 'border-border bg-surface',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => api.accept(s)}
                      className="hover:bg-surface-muted inline-flex min-h-10 items-center gap-1 rounded-full pr-1 pl-3 text-sm font-semibold"
                      aria-label={t(
                        confirm ? 'classification.confirmNamed' : 'classification.addNamed',
                        {
                          name,
                        },
                      )}
                    >
                      {confirm ? (
                        <Check aria-hidden="true" className="size-4" />
                      ) : (
                        <Plus aria-hidden="true" className="size-4" />
                      )}
                      {name}
                      {s.confidence === 'low' && (
                        <span className="text-fg-muted font-normal">
                          · {t('classification.confidence.low')}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => api.reject(s)}
                      className="text-fg-muted hover:bg-surface-muted grid size-10 place-items-center rounded-full"
                      aria-label={t('classification.dismissNamed', { name })}
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {pending.some((s) => s.requiresConfirmation) && (
              <p className="bg-warning-soft text-warning rounded-md px-3 py-2 text-xs">
                {t('classification.dietWarning')}
              </p>
            )}
          </section>
        )}

        {utensils.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="font-sans text-sm font-semibold">{t('classification.utensils')}</h3>
            <p className="text-fg-muted text-xs">{t('classification.utensilsHint')}</p>
            <ul className="divide-border/60 flex flex-col divide-y">
              {utensils.map((s) => (
                <UtensilRow
                  key={suggestionId(s.kind, s.key)}
                  suggestion={s}
                  item={itemOf(s)}
                  names={(s.alternativeTo ?? [])
                    .map((k) => maps.utensil.get(k)?.name ?? '')
                    .filter(Boolean)}
                  onRole={(role) => api.acceptUtensil(s, role)}
                  onDismiss={() => api.reject(s)}
                />
              ))}
            </ul>
          </section>
        )}

        {(auto.length > 0 || pending.length > 0 || utensils.length > 0) && (
          <details className="text-fg-muted text-sm">
            <summary className="inline-flex min-h-10 cursor-pointer items-center gap-1.5">
              <Info aria-hidden="true" className="size-4" />
              {t('classification.why')}
            </summary>
            <ul className="mt-1 flex flex-col gap-2">
              {[...auto, ...pending, ...utensils].map((s) => (
                <li key={suggestionId(s.kind, s.key)}>
                  <span className="text-fg font-semibold">{itemOf(s)?.name}</span>{' '}
                  <span>
                    ({t(`classification.kind.${s.kind}`)},{' '}
                    {t(`classification.confidence.${s.confidence}`)})
                  </span>
                  <ul className="list-disc pl-5">
                    {s.reasons.map((r, i) => (
                      <li key={i}>{reasonText(t, r)}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {acceptable.length > 1 && (
          <Button type="button" variant="secondary" size="sm" onClick={api.acceptAll}>
            <Check aria-hidden="true" />
            {t('classification.acceptAll', { count: acceptable.length })}
          </Button>
        )}
        {(hiddenLow > 0 || showLow) && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowLow((v) => !v)}>
            {showLow
              ? t('classification.hideLow')
              : t('classification.showLow', { count: hiddenLow })}
          </Button>
        )}
        {rejected.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowRejected((v) => !v)}
          >
            {t('classification.showRejected', { count: rejected.length })}
          </Button>
        )}
      </div>
      {showRejected && rejected.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t('classification.rejected')}>
          {rejected.map((p) => {
            const name = maps[p.kind].get(p.key)?.name ?? '';
            return (
              <li key={`${p.kind}:${p.key}`}>
                <button
                  type="button"
                  onClick={() => api.restore(suggestionId(p.kind, p.key))}
                  className="border-border text-fg-muted hover:bg-surface-muted inline-flex min-h-10 items-center gap-1 rounded-full border border-dashed px-3 text-sm"
                  aria-label={t('classification.restoreNamed', { name })}
                >
                  <RefreshCw aria-hidden="true" className="size-3.5" />
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function UtensilRow({
  suggestion,
  item,
  names,
  onRole,
  onDismiss,
}: {
  suggestion: Suggestion;
  item: CatalogItem | undefined;
  names: string[];
  onRole: (role: UtensilRole) => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('recipes');
  if (!item) return null;
  const id = `utensil-role-${suggestion.key}`;
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
      <label htmlFor={id} className="min-w-0">
        <span className="font-semibold">{item.name}</span>
        {names.length > 0 && (
          <span className="text-fg-muted block text-xs">
            {t('classification.alternativeTo', { names: names.join(', ') })}
          </span>
        )}
      </label>
      <select
        id={id}
        value=""
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'dismiss') onDismiss();
          else if (value) onRole(value as UtensilRole);
        }}
        className="border-border bg-surface min-h-10 rounded-full border px-3 text-sm"
      >
        <option value="">{t('classification.choose')}</option>
        <option value="required">{t('classification.role.required')}</option>
        <option value="alternative">{t('classification.role.alternative')}</option>
        <option value="optional">{t('classification.role.optional')}</option>
        <option value="dismiss">{t('classification.role.dismiss')}</option>
      </select>
    </li>
  );
}

type T = ReturnType<typeof useTranslation<'recipes'>>['t'];

function reasonText(t: T, r: Reason): string {
  const source = r.source ? t(`classification.source.${r.source}`) : '';
  switch (r.code) {
    case 'mention':
      return t('classification.reason.mention', { term: r.term ?? '', source });
    case 'keyword':
      return t('classification.reason.keyword', { term: r.term ?? '', source });
    case 'dietIncomplete':
      return r.term
        ? t('classification.reason.dietIncompleteTerm', { term: r.term })
        : t('classification.reason.dietIncomplete');
    case 'dietConflict':
      return t('classification.reason.dietConflict', { term: r.term ?? '' });
    default:
      return t(`classification.reason.${r.code}`);
  }
}
