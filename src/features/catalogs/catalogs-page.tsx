import { Eye, EyeOff, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/supabase/errors';
import { cn } from '@/lib/utils/cn';
import type { CatalogKind } from './api';
import { TAG_GROUPS, UTENSIL_GROUPS } from './catalog-constants';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './catalog-constants';
import { CategoryBadge, CategoryIcon } from './catalog-ui';
import {
  useCatalog,
  useCreateCustom,
  useDeleteCustom,
  useIsOwner,
  useSetHidden,
  useUpdateCustom,
  type CatalogItem,
} from './hooks';

const KINDS: CatalogKind[] = ['category', 'tag', 'utensil'];

/**
 * Household catalogues. Everyone sees them; only owners create, edit, delete custom items
 * or hide global ones (enforced by RLS, the UI only mirrors it).
 */
export function CatalogsPage() {
  const { t } = useTranslation('recipes');
  const [params, setParams] = useSearchParams();
  const tab = (KINDS as string[]).includes(params.get('tab') ?? '')
    ? (params.get('tab') as CatalogKind)
    : 'category';
  const catalog = useCatalog();
  const isOwner = useIsOwner();

  return (
    <>
      <PageHeader title={t('catalogs.title')} subtitle={t('catalogs.subtitle')} backTo="/recipes" />
      {!isOwner && (
        <Alert className="mb-4">
          <span className="inline-flex items-center gap-2">
            <Lock aria-hidden="true" className="size-4" />
            {t('catalogs.memberNotice')}
          </span>
        </Alert>
      )}
      <div className="mb-4 flex gap-2" role="tablist" aria-label={t('catalogs.title')}>
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={tab === kind}
            onClick={() => setParams({ tab: kind }, { replace: true })}
            className={cn(
              'min-h-11 rounded-full border px-4 text-sm font-semibold',
              tab === kind
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-border bg-surface text-fg',
            )}
          >
            {t(`catalogs.tabs.${kind}`)}
          </button>
        ))}
      </div>
      {catalog.isError && <Alert tone="error">{errorMessage(catalog.error)}</Alert>}
      {!catalog.data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <CatalogSection
          key={tab}
          kind={tab}
          items={
            tab === 'category'
              ? catalog.data.categories
              : tab === 'tag'
                ? catalog.data.tags
                : catalog.data.utensils
          }
          isOwner={isOwner}
        />
      )}
    </>
  );
}

function CatalogSection({
  kind,
  items,
  isOwner,
}: {
  kind: CatalogKind;
  items: CatalogItem[];
  isOwner: boolean;
}) {
  const { t } = useTranslation(['recipes', 'catalog', 'common']);
  const setHidden = useSetHidden(kind);
  const remove = useDeleteCustom(kind);
  const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null);
  const customs = items.filter((item) => item.custom);
  const globals = items.filter((item) => !item.custom);
  const groups =
    kind === 'tag'
      ? TAG_GROUPS.filter((g) => g !== 'custom')
      : kind === 'utensil'
        ? UTENSIL_GROUPS.filter((g) => g !== 'custom')
        : [''];
  const error = setHidden.error ?? remove.error;

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl">{t('catalogs.customTitle')}</h2>
          {isOwner && (
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus aria-hidden="true" />
              {t(`catalogs.add.${kind}`)}
            </Button>
          )}
        </div>
        {customs.length === 0 ? (
          <p className="text-fg-muted text-sm">{t('catalogs.customEmpty')}</p>
        ) : (
          <ul className="divide-border/60 divide-y">
            {customs.map((item) => (
              <li key={item.key} className="flex min-h-14 items-center justify-between gap-2 py-1">
                {kind === 'category' ? (
                  <CategoryBadge item={item} />
                ) : (
                  <span className="font-medium">{item.name}</span>
                )}
                {isOwner && (
                  <span className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('catalogs.editNamed', { name: item.name })}
                      onClick={() => setEditing(item)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      variant="dangerGhost"
                      size="icon"
                      aria-label={t('catalogs.deleteNamed', { name: item.name })}
                      onClick={() => setPendingDelete(item)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl">{t('catalogs.globalTitle')}</h2>
          <p className="text-fg-muted mt-1 text-sm">{t('catalogs.globalHint')}</p>
        </div>
        {groups.map((group) => {
          const groupItems = globals.filter((item) => !group || item.group === group);
          return (
            <section key={group || 'all'} className="flex flex-col gap-1">
              {group && (
                <h3 className="text-fg-muted font-sans text-xs font-semibold tracking-wide uppercase">
                  {kind === 'tag'
                    ? t(`catalog:tagGroups.${group as (typeof TAG_GROUPS)[number]}`)
                    : t(`catalog:utensilGroups.${group as (typeof UTENSIL_GROUPS)[number]}`)}
                </h3>
              )}
              <ul className="divide-border/60 divide-y">
                {groupItems.map((item) => (
                  <li
                    key={item.key}
                    className="flex min-h-12 items-center justify-between gap-2 py-1"
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-2',
                        item.hidden && 'text-fg-muted line-through',
                      )}
                    >
                      {kind === 'category' && <CategoryIcon icon={item.icon} />}
                      {item.name}
                      {item.hidden && <span className="sr-only">({t('catalogs.hidden')})</span>}
                    </span>
                    {isOwner ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-pressed={item.hidden}
                        onClick={() => setHidden.mutate({ id: item.id, hidden: !item.hidden })}
                      >
                        {item.hidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                        {item.hidden ? t('catalogs.show') : t('catalogs.hide')}
                      </Button>
                    ) : (
                      item.hidden && (
                        <span className="text-fg-muted text-sm">{t('catalogs.hidden')}</span>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </Card>

      {isOwner && editing !== null && (
        <CustomItemDialog
          kind={kind}
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t('catalogs.deleteTitle', { name: pendingDelete?.name ?? '' })}
        description={t(`catalogs.deleteBody.${kind}`)}
        confirmLabel={t('common:actions.delete')}
        onConfirm={async () => {
          if (pendingDelete) await remove.mutateAsync(pendingDelete.id);
        }}
      />
    </div>
  );
}

function CustomItemDialog({
  kind,
  item,
  onClose,
}: {
  kind: CatalogKind;
  item: CatalogItem | null;
  onClose: () => void;
}) {
  const { t } = useTranslation(['recipes', 'common']);
  const create = useCreateCustom(kind);
  const update = useUpdateCustom(kind);
  const [name, setName] = useState(item?.name ?? '');
  const [icon, setIcon] = useState(item?.icon ?? 'shapes');
  const [color, setColor] = useState(item?.color ?? 'gray');
  const mutation = item ? update : create;
  const max = kind === 'utensil' ? 60 : 40;

  async function submit() {
    const fields = kind === 'category' ? { name, icon, color } : { name };
    if (item) await update.mutateAsync({ id: item.id, fields });
    else await create.mutateAsync(fields);
    onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={item ? t('catalogs.editTitle') : t(`catalogs.add.${kind}`)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={!name.trim()}
            onClick={() => void submit()}
          >
            {t('common:actions.save')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {mutation.isError && <Alert tone="error">{errorMessage(mutation.error)}</Alert>}
        <Field label={t('catalogs.name')}>
          <Input value={name} maxLength={max} onChange={(event) => setName(event.target.value)} />
        </Field>
        {kind === 'category' && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">{t('catalogs.icon')}</legend>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CATEGORY_ICONS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={icon === key}
                    aria-label={key}
                    onClick={() => setIcon(key)}
                    className={cn(
                      'grid size-11 place-items-center rounded-full border',
                      icon === key ? 'border-primary bg-primary text-primary-fg' : 'border-border',
                    )}
                  >
                    <CategoryIcon icon={key} className="size-5" />
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">{t('catalogs.color')}</legend>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CATEGORY_COLORS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={color === key}
                    aria-label={t(`catalogs.colors.${key as 'gray'}`)}
                    onClick={() => setColor(key)}
                    className={cn(
                      'size-11 rounded-full border-2',
                      CATEGORY_COLORS[key],
                      color === key ? 'border-fg' : 'border-transparent',
                    )}
                  />
                ))}
              </div>
            </fieldset>
            <div>
              <p className="mb-2 text-sm font-semibold">{t('catalogs.preview')}</p>
              <CategoryBadge
                item={{
                  key: 'custom:preview',
                  ref: { custom: 'preview' },
                  kind: 'category',
                  id: 'preview',
                  custom: true,
                  name: name.trim() || t('catalogs.name'),
                  group: 'custom',
                  icon,
                  color,
                  hidden: false,
                  common: false,
                }}
              />
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
