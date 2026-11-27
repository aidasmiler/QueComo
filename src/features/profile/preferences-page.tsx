import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/supabase/errors';
import { cn } from '@/lib/utils/cn';
import { PRESET_PREFERENCES } from './api';
import {
  useAddDietaryPreference,
  useDietaryPreferences,
  useRemoveDietaryPreference,
} from './hooks';

export function PreferencesPage() {
  const { t } = useTranslation(['profile', 'common', 'errors']);
  const prefs = useDietaryPreferences();
  const add = useAddDietaryPreference();
  const remove = useRemoveDietaryPreference();
  const toast = useToast();
  const [custom, setCustom] = useState('');

  const onError = (error: unknown) => toast.show(errorMessage(error), 'error');
  const busy = add.isPending || remove.isPending;

  function toggle(key: (typeof PRESET_PREFERENCES)[number]) {
    const existing = prefs.data?.find((p) => p.preset_key === key.key);
    if (existing) remove.mutate(existing.id, { onError });
    else add.mutate({ presetKey: key.key, kind: key.kind }, { onError });
  }

  function onAddCustom(event: React.FormEvent) {
    event.preventDefault();
    const label = custom.trim();
    if (!label || label.length > 40) return;
    add.mutate({ customLabel: label }, { onError, onSuccess: () => setCustom('') });
  }

  const groups = [
    {
      title: t('prefs.restrictionsTitle'),
      items: PRESET_PREFERENCES.filter((p) => p.kind === 'restriction'),
    },
    {
      title: t('prefs.preferencesTitle'),
      items: PRESET_PREFERENCES.filter((p) => p.kind === 'preference'),
    },
  ];
  const customPrefs = prefs.data?.filter((p) => p.custom_label) ?? [];

  return (
    <>
      <PageHeader title={t('prefs.title')} subtitle={t('prefs.intro')} backTo="/profile" />
      {prefs.isPending ? (
        <Skeleton className="h-40" />
      ) : prefs.isError ? (
        <Alert tone="error">{errorMessage(prefs.error)}</Alert>
      ) : (
        <div className="flex max-w-2xl flex-col gap-8">
          {groups.map((group) => (
            <section key={group.title} className="flex flex-col gap-3">
              <h2 className="text-xl">{group.title}</h2>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const selected = prefs.data.some((p) => p.preset_key === item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={selected}
                      disabled={busy}
                      onClick={() => toggle(item)}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-60',
                        selected
                          ? 'border-primary bg-primary text-primary-fg'
                          : 'border-border bg-surface text-fg hover:bg-surface-muted',
                      )}
                    >
                      {selected && <Check aria-hidden="true" className="size-4" />}
                      {t(`prefs.presets.${item.key}`)}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="flex flex-col gap-3">
            <h2 className="text-xl">{t('prefs.customTitle')}</h2>
            {customPrefs.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {customPrefs.map((pref) => (
                  <li
                    key={pref.id}
                    className="bg-accent-soft text-accent-strong inline-flex min-h-11 items-center gap-1 rounded-full pr-1 pl-4 text-sm font-semibold"
                  >
                    {pref.custom_label}
                    <button
                      type="button"
                      className="hover:bg-terracotta-100 grid size-9 place-items-center rounded-full"
                      aria-label={`${t('common:actions.delete')}: ${pref.custom_label ?? ''}`}
                      onClick={() => remove.mutate(pref.id, { onError })}
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={onAddCustom} className="flex gap-2">
              <Input
                value={custom}
                maxLength={40}
                onChange={(event) => setCustom(event.target.value)}
                placeholder={t('prefs.customPlaceholder')}
                aria-label={t('prefs.customTitle')}
              />
              <Button type="submit" variant="secondary" disabled={!custom.trim() || busy}>
                <Plus aria-hidden="true" />
                {t('prefs.add')}
              </Button>
            </form>
          </section>

          <Alert tone="warning">{t('prefs.disclaimer')}</Alert>
        </div>
      )}
    </>
  );
}
