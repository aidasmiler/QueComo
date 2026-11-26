import { BookOpen, House, UserRound, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils/cn';
import { ConnectionBanner } from './connection-banner';
import { HouseholdSwitcher } from './household-switcher';
import { Logo } from './logo';

interface NavItem {
  to: string;
  labelKey: 'nav.home' | 'nav.recipes' | 'nav.planner' | 'nav.shopping' | 'nav.profile';
  icon: LucideIcon;
  end?: boolean;
}

// Sections are added here as each module ships (no placeholder screens for unfinished features).
const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: House, end: true },
  { to: '/recipes', labelKey: 'nav.recipes', icon: BookOpen },
  { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
];

function EnvBadge() {
  const { t } = useTranslation();
  if (env.appEnv === 'production') return null;
  return (
    <span className="bg-accent-soft text-accent-strong rounded-full px-2.5 py-1 text-xs font-semibold">
      {env.appEnv === 'preview' ? t('env.preview') : t('env.local')}
    </span>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-border/70 bg-surface sticky top-0 hidden h-dvh flex-col gap-8 border-r px-5 py-6 lg:flex">
        <Logo />
        <HouseholdSwitcher className="w-full" />
        <nav aria-label={t('nav.main')} className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-md px-3 font-semibold transition-colors',
                  isActive
                    ? 'bg-primary text-primary-fg'
                    : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
                )
              }
            >
              <item.icon aria-hidden="true" className="size-5" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <EnvBadge />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <ConnectionBanner />
        <header className="border-border/60 bg-bg/90 pt-safe sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 backdrop-blur lg:hidden">
          <div className="flex min-h-14 min-w-0 items-center gap-2 py-2">
            <HouseholdSwitcher />
          </div>
          <EnvBadge />
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12"
        >
          <Outlet />
        </main>
        <nav
          aria-label={t('nav.main')}
          className="border-border/70 bg-surface/95 pb-safe fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur lg:hidden"
        >
          <ul className="mx-auto flex max-w-lg">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold',
                      isActive ? 'text-primary' : 'text-fg-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'grid h-8 w-14 place-items-center rounded-full transition-colors',
                          isActive && 'bg-primary-soft',
                        )}
                      >
                        <item.icon aria-hidden="true" className="size-5" />
                      </span>
                      {t(item.labelKey)}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
