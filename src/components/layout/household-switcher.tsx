import { Check, ChevronDown, Home, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Dialog } from '@/components/ui/dialog';
import { useActiveHousehold } from '@/features/households/active-household';
import { cn } from '@/lib/utils/cn';

export function HouseholdSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation(['common', 'households']);
  const { households, active, setActiveId } = useActiveHousehold();
  const [open, setOpen] = useState(false);
  if (!active) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'bg-primary-soft flex min-h-11 max-w-full items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-left text-sm font-semibold text-olive-800 hover:bg-olive-200',
          className,
        )}
        aria-label={`${t('household.active')}: ${active.name}. ${t('household.switch')}`}
      >
        <span className="bg-primary text-primary-fg grid size-8 shrink-0 place-items-center rounded-full">
          <Home aria-hidden="true" className="size-4" />
        </span>
        <span className="truncate">{active.name}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </button>
      <Dialog open={open} onOpenChange={setOpen} title={t('households:switcher.title')}>
        <ul className="flex flex-col gap-2">
          {households.map((household) => {
            const selected = household.id === active.id;
            return (
              <li key={household.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(household.id);
                    setOpen(false);
                  }}
                  aria-current={selected || undefined}
                  className={cn(
                    'flex min-h-14 w-full items-center gap-3 rounded-md border px-4 text-left',
                    selected
                      ? 'border-primary bg-primary-soft'
                      : 'border-border hover:bg-surface-muted',
                  )}
                >
                  <span className="flex-1">
                    <span className="block font-semibold">{household.name}</span>
                    <span className="text-fg-muted block text-sm">
                      {t('households:list.members', { count: household.memberCount })} ·{' '}
                      {t(`roles.${household.role}`)}
                    </span>
                  </span>
                  {selected && <Check aria-hidden="true" className="text-primary size-5" />}
                </button>
              </li>
            );
          })}
        </ul>
        <Link
          to="/households"
          onClick={() => setOpen(false)}
          className="text-primary mt-4 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold"
        >
          <Settings2 aria-hidden="true" className="size-4" />
          {t('households:switcher.manage')}
        </Link>
      </Dialog>
    </>
  );
}
