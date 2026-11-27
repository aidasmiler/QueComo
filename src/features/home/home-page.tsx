import { ArrowRight, ChefHat, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useActiveHousehold } from '@/features/households/active-household';
import { useProfile } from '@/features/profile/hooks';
import { formatDate } from '@/lib/utils/format';
import { dayPart } from './greeting';

export function HomePage() {
  const { t, i18n } = useTranslation('home');
  const profile = useProfile();
  const { active } = useActiveHousehold();
  const now = new Date();
  const name = profile.data?.display_name ?? '';

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-primary text-primary-fg shadow-card relative overflow-hidden rounded-xl px-6 py-8 sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 size-56 rounded-full bg-olive-500/70"
        />
        <div
          aria-hidden="true"
          className="bg-terracotta-500/90 absolute right-10 -bottom-10 size-28 rounded-full"
        />
        <div className="relative">
          <p className="text-sm font-semibold text-olive-100 first-letter:uppercase">
            {t('today', {
              date: formatDate(now, i18n.language, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }),
            })}
          </p>
          <h1 className="text-cream-50 mt-2 text-3xl sm:text-4xl">
            {t(`greeting.${dayPart(now)}`, { name })}
          </h1>
          <p className="font-display mt-3 text-2xl text-olive-100 italic">{t('question')}</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {active && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary-soft text-primary grid size-11 place-items-center rounded-full">
                <Users aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-fg-muted text-sm">{t('householdCard.title')}</p>
                <h2 className="truncate text-2xl">{active.name}</h2>
              </div>
            </div>
            <p className="text-fg-muted">
              {t('householdCard.people', { count: active.memberCount })}
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button asChild>
                <Link to={`/households/${active.id}`}>
                  <UserPlus aria-hidden="true" />
                  {t('householdCard.invite')}
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to={`/households/${active.id}`}>
                  {t('householdCard.manage')}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        <Card className="bg-accent-soft flex flex-col gap-3 shadow-none">
          <span className="bg-accent-strong grid size-11 place-items-center rounded-full text-white">
            <ChefHat aria-hidden="true" className="size-5" />
          </span>
          <h2 className="text-2xl">{t('recipesCard.title')}</h2>
          <p className="text-charcoal-700">{t('recipesCard.body')}</p>
          <Button variant="accent" asChild className="mt-auto self-start">
            <Link to="/recipes">
              {t('recipesCard.action')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
