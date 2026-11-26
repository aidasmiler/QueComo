import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelect } from '@/components/layout/language-select';
import { Logo } from '@/components/layout/logo';
import { writeDeviceLocale } from '@/i18n/locale';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  return (
    <div className="bg-bg min-h-dvh lg:grid lg:grid-cols-[1fr_minmax(28rem,36rem)]">
      <aside className="bg-primary relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo inverse />
        <div className="relative z-10 max-w-md">
          <p className="font-display text-cream-50 text-5xl leading-tight">{t('tagline')}</p>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-24 -bottom-24 size-96 rounded-full bg-olive-500/60"
        />
        <div
          aria-hidden="true"
          className="bg-terracotta-500/80 absolute right-24 bottom-40 size-40 rounded-full"
        />
        <div
          aria-hidden="true"
          className="absolute top-32 -right-10 size-24 rounded-full bg-olive-100/30"
        />
      </aside>
      <main className="pt-safe pb-safe flex min-h-dvh flex-col px-5 sm:px-8">
        <div className="flex items-center justify-between py-4">
          <Logo className="lg:invisible" />
          <LanguageSelect
            compact
            onChange={(locale) => {
              void i18n.changeLanguage(locale);
              writeDeviceLocale(locale);
            }}
          />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          <h1 className="text-4xl">{title}</h1>
          {subtitle && <p className="text-fg-muted mt-2">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
