import { CookingPot, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import type { ItemKey } from '@/domain/recipes/catalog';
import { useActiveHousehold } from '@/features/households/active-household';
import { errorMessage } from '@/lib/supabase/errors';
import { UtensilChecklist } from './catalog-pickers';
import {
  useCatalog,
  useIsOwner,
  useKitchen,
  useSetUtensilsAvailable,
  type CatalogItem,
} from './hooks';

/** Per-household equipment: what the kitchen has. Any member can tick and untick. */
export function KitchenPage() {
  const { t } = useTranslation('recipes');
  const { active } = useActiveHousehold();
  const catalog = useCatalog();
  const kitchen = useKitchen();
  const setAvailable = useSetUtensilsAvailable();
  const isOwner = useIsOwner();

  if (catalog.isError || kitchen.isError) {
    return <Alert tone="error">{errorMessage(catalog.error ?? kitchen.error)}</Alert>;
  }
  if (!catalog.data || !kitchen.data) return <Skeleton className="h-96 w-full" />;
  const count = catalog.data.utensils.filter((u) => kitchen.data.available.has(u.key)).length;

  return (
    <>
      <PageHeader
        title={t('kitchen.title')}
        subtitle={active ? t('kitchen.subtitle', { household: active.name }) : undefined}
        backTo="/recipes"
      />
      <div className="flex flex-col gap-6">
        {!kitchen.data.configured && <QuickSetup items={catalog.data.utensils} />}
        {setAvailable.isError && <Alert tone="error">{errorMessage(setAvailable.error)}</Alert>}
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl">{t('kitchen.listTitle')}</h2>
            <p className="text-fg-muted text-sm" aria-live="polite">
              {t('kitchen.count', { count })}
            </p>
          </div>
          <p className="text-fg-muted text-sm">{t('kitchen.listHint')}</p>
          <UtensilChecklist
            items={catalog.data.utensils}
            value={kitchen.data.available}
            onToggle={(key) =>
              setAvailable.mutate({ keys: [key], available: !kitchen.data.available.has(key) })
            }
            onCreated={(key) => setAvailable.mutate({ keys: [key], available: true })}
          />
        </Card>
        <Card className="flex flex-wrap items-center gap-3 shadow-none">
          <Settings2 aria-hidden="true" className="text-fg-muted size-5" />
          <p className="min-w-0 flex-1 text-sm">
            {isOwner ? t('kitchen.manageOwner') : t('kitchen.manageMember')}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/recipes/catalogs?tab=utensil">{t('kitchen.manageLink')}</Link>
          </Button>
        </Card>
      </div>
    </>
  );
}

function QuickSetup({ items }: { items: CatalogItem[] }) {
  const { t } = useTranslation('recipes');
  const toast = useToast();
  const setAvailable = useSetUtensilsAvailable();
  const common = useMemo(() => items.filter((item) => item.common && !item.hidden), [items]);
  // Nothing is ticked by default: the household says what it has.
  const [selected, setSelected] = useState<Set<ItemKey>>(() => new Set());
  return (
    <Card className="border-primary/40 bg-primary-soft/30 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <CookingPot aria-hidden="true" className="text-primary mt-1 size-6 shrink-0" />
        <div>
          <h2 className="text-xl">{t('kitchen.quickTitle')}</h2>
          <p className="text-fg-muted mt-1 text-sm">{t('kitchen.quickHint')}</p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2">
        {common.map((item) => {
          const pressed = selected.has(item.key);
          return (
            <li key={item.key}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (pressed) next.delete(item.key);
                    else next.add(item.key);
                    return next;
                  })
                }
                className={
                  pressed
                    ? 'border-primary bg-primary text-primary-fg min-h-10 rounded-full border px-3.5 text-sm font-semibold'
                    : 'border-border bg-surface text-fg min-h-10 rounded-full border px-3.5 text-sm font-semibold'
                }
              >
                {item.name}
              </button>
            </li>
          );
        })}
      </ul>
      <Button
        className="w-fit"
        loading={setAvailable.isPending}
        onClick={async () => {
          // Also marks the kitchen as configured, even with nothing selected.
          await setAvailable.mutateAsync({ keys: [...selected], available: true });
          toast.show(t('kitchen.quickSaved'));
        }}
      >
        {t('kitchen.quickSave', { count: selected.size })}
      </Button>
    </Card>
  );
}
