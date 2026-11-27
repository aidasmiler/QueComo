import { Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type { ItemKey } from '@/domain/recipes/catalog';
import { normalise } from '@/features/recipes/format';
import { errorMessage } from '@/lib/supabase/errors';
import type { CatalogKind } from './api';
import { TAG_GROUPS, UTENSIL_GROUPS } from './catalog-constants';
import { CategoryIcon, ToggleChip } from './catalog-ui';
import { useCreateCustom, useIsOwner, type CatalogItem } from './hooks';

function useFilteredItems(items: CatalogItem[], value: ItemKey[], query: string) {
  return useMemo(() => {
    const needle = normalise(query.trim());
    // Hidden globals stay visible only where they are already in use.
    return items.filter(
      (item) =>
        (!item.hidden || value.includes(item.key)) &&
        (!needle || normalise(item.name).includes(needle)),
    );
  }, [items, value, query]);
}

/** Owners can add a custom item right from a picker; members get an explanation instead. */
function CreateInline({
  kind,
  query,
  items,
  onCreated,
}: {
  kind: CatalogKind;
  query: string;
  items: CatalogItem[];
  onCreated: (key: ItemKey) => void;
}) {
  const { t } = useTranslation('recipes');
  const isOwner = useIsOwner();
  const create = useCreateCustom(kind);
  const name = query.trim();
  if (!name) return null;
  const exists = items.some((item) => normalise(item.name) === normalise(name));
  if (exists) return null;
  if (!isOwner) return <p className="text-fg-muted text-sm">{t('catalog.ownerOnlyCreate')}</p>;
  return (
    <div className="flex flex-col gap-2">
      {create.isError && <Alert tone="error">{errorMessage(create.error)}</Alert>}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-fit"
        loading={create.isPending}
        onClick={async () => {
          const created = await create.mutateAsync({ name });
          onCreated(`custom:${created.id}`);
        }}
      >
        <Plus aria-hidden="true" />
        {t('catalog.createNamed', { name })}
      </Button>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden="true"
        className="text-fg-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className="border-border bg-surface focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-full border pr-4 pl-9 text-base focus:ring-2 focus:outline-none"
      />
    </label>
  );
}

function toggle(value: ItemKey[], key: ItemKey) {
  return value.includes(key) ? value.filter((k) => k !== key) : [...value, key];
}

/** Multi-select chips for categories (with icon and colour) or tags (grouped). */
export function ChipPicker({
  kind,
  items,
  value,
  onChange,
  legend,
  max,
}: {
  kind: 'category' | 'tag';
  items: CatalogItem[];
  value: ItemKey[];
  onChange: (value: ItemKey[]) => void;
  legend: string;
  max: number;
}) {
  const { t } = useTranslation(['recipes', 'catalog']);
  const [query, setQuery] = useState('');
  const visible = useFilteredItems(items, value, query);
  const groups =
    kind === 'tag'
      ? TAG_GROUPS.map((group) => ({
          group,
          label: t(`catalog:tagGroups.${group}`),
          items: visible.filter((item) => item.group === group),
        }))
      : [{ group: 'all', label: '', items: visible }];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      <SearchBox
        value={query}
        onChange={setQuery}
        label={t(kind === 'tag' ? 'catalog.searchTags' : 'catalog.searchCategories')}
      />
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <div key={g.group} className="flex flex-col gap-2">
            {g.label && (
              <p className="text-fg-muted text-xs font-semibold tracking-wide uppercase">
                {g.label}
              </p>
            )}
            <ul className="flex flex-wrap gap-2">
              {g.items.map((item) => {
                const selected = value.includes(item.key);
                return (
                  <li key={item.key}>
                    <ToggleChip
                      pressed={selected}
                      onClick={() =>
                        (selected || value.length < max) && onChange(toggle(value, item.key))
                      }
                    >
                      {kind === 'category' && <CategoryIcon icon={item.icon} />}
                      {item.name}
                    </ToggleChip>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      {visible.length === 0 && !query && (
        <p className="text-fg-muted text-sm">{t('catalog.empty')}</p>
      )}
      <CreateInline
        kind={kind}
        query={query}
        items={items}
        onCreated={(key) => {
          onChange([...value, key]);
          setQuery('');
        }}
      />
    </fieldset>
  );
}

/** Grouped, searchable list of utensils with checkboxes. Used by the recipe form and filters. */
export function UtensilChecklist({
  items,
  value,
  onToggle,
  allowCreate = true,
  onCreated,
}: {
  items: CatalogItem[];
  value: ReadonlySet<ItemKey>;
  onToggle: (key: ItemKey) => void;
  allowCreate?: boolean;
  onCreated?: (key: ItemKey) => void;
}) {
  const { t } = useTranslation(['recipes', 'catalog']);
  const [query, setQuery] = useState('');
  const selected = useMemo(() => [...value], [value]);
  const visible = useFilteredItems(items, selected, query);
  return (
    <div className="flex flex-col gap-4">
      <SearchBox value={query} onChange={setQuery} label={t('catalog.searchUtensils')} />
      {UTENSIL_GROUPS.map((group) => {
        const groupItems = visible.filter((item) => item.group === group);
        if (!groupItems.length) return null;
        return (
          <section key={group} className="flex flex-col gap-1">
            <h3 className="text-fg-muted font-sans text-xs font-semibold tracking-wide uppercase">
              {t(`catalog:utensilGroups.${group}`)}
            </h3>
            <ul className="divide-border/60 divide-y">
              {groupItems.map((item) => {
                const checked = value.has(item.key);
                return (
                  <li key={item.key}>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 py-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(item.key)}
                        className="accent-primary size-5 shrink-0 cursor-pointer"
                      />
                      <span className="text-base">{item.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {visible.length === 0 && <p className="text-fg-muted text-sm">{t('catalog.noMatches')}</p>}
      {allowCreate && (
        <CreateInline
          kind="utensil"
          query={query}
          items={items}
          onCreated={(key) => {
            onCreated?.(key);
            setQuery('');
          }}
        />
      )}
    </div>
  );
}

/** Selected utensils as removable chips plus a dialog to pick more. */
export function UtensilPicker({
  items,
  maps,
  value,
  onChange,
  label,
}: {
  items: CatalogItem[];
  maps: Map<ItemKey, CatalogItem>;
  value: ItemKey[];
  onChange: (value: ItemKey[]) => void;
  label: string;
}) {
  const { t } = useTranslation(['recipes', 'common']);
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => new Set(value), [value]);
  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {value.map((key) => {
            const item = maps.get(key);
            const name = item?.name ?? t('catalog.unknownItem');
            return (
              <li
                key={key}
                className="border-border bg-surface inline-flex min-h-9 items-center gap-1 rounded-full border pr-1 pl-3 text-sm font-medium"
              >
                {name}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((k) => k !== key))}
                  aria-label={t('catalog.removeNamed', { name })}
                  className="text-fg-muted hover:text-danger grid size-8 place-items-center rounded-full"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-fg-muted text-sm">{t('equipment.noUtensilsYet')}</p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden="true" />
        {t('equipment.chooseUtensils')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        footer={
          <Button type="button" onClick={() => setOpen(false)}>
            {t('common:actions.done')}
          </Button>
        }
      >
        <UtensilChecklist
          items={items}
          value={selected}
          onToggle={(key) =>
            onChange(
              selected.has(key)
                ? value.filter((k) => k !== key)
                : value.length < 20
                  ? [...value, key]
                  : value,
            )
          }
          onCreated={(key) => onChange([...value, key])}
        />
      </Dialog>
    </div>
  );
}
