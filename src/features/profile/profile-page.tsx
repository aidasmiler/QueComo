import {
  CookingPot,
  Download,
  HelpCircle,
  Home,
  LogOut,
  Salad,
  ShieldCheck,
  Tags,
  UserRound,
} from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { LanguageSelect } from '@/components/layout/language-select';
import { ListGroup, ListRow } from '@/components/shared/list-row';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useCurrentUser } from '@/features/auth/auth-context';
import { useActiveHousehold } from '@/features/households/active-household';
import { supabase } from '@/lib/supabase/client';
import { useChangeLocale, useProfile } from './hooks';

export function ProfilePage() {
  const { t, i18n } = useTranslation(['profile', 'auth', 'households', 'recipes']);
  const user = useCurrentUser();
  const profile = useProfile();
  const { households } = useActiveHousehold();
  const changeLocale = useChangeLocale();
  const toast = useToast();
  const navigate = useNavigate();
  const languageId = useId();
  const [signingOut, setSigningOut] = useState(false);
  const name = profile.data?.display_name ?? '';

  async function onSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    void navigate('/login', { replace: true });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="bg-primary font-display text-primary-fg grid size-16 shrink-0 place-items-center rounded-full text-2xl font-semibold"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-3xl">{name}</h1>
          <p className="text-fg-muted truncate text-sm">{t('signedInAs', { email: user.email })}</p>
        </div>
      </div>

      <ListGroup title={t('sections.account')}>
        <ListRow to="/profile/edit" icon={UserRound} label={t('editProfile')} />
        <ListRow to="/profile/preferences" icon={Salad} label={t('preferences')} />
      </ListGroup>

      <ListGroup title={t('sections.households')}>
        <ListRow
          to="/households"
          icon={Home}
          label={t('households:list.title')}
          detail={households.map((h) => h.name).join(' · ')}
        />
        <ListRow to="/kitchen" icon={CookingPot} label={t('recipes:kitchen.title')} />
        <ListRow to="/recipes/catalogs" icon={Tags} label={t('recipes:catalogs.title')} />
      </ListGroup>

      <section className="flex flex-col gap-2">
        <h2 className="text-fg-muted px-1 font-sans text-sm font-semibold tracking-wide uppercase">
          {t('sections.settings')}
        </h2>
        <div className="border-border/70 bg-surface shadow-card flex flex-col gap-2 rounded-lg border p-4">
          <label htmlFor={languageId} className="font-semibold">
            {t('language')}
          </label>
          <LanguageSelect
            id={languageId}
            value={profile.data?.locale}
            onChange={(locale) =>
              void changeLocale(locale).then((saved) =>
                // i18n.t (not t): `t` is bound to the language of the previous render.
                saved
                  ? toast.show(i18n.t('profile:languageSaved'))
                  : toast.show(i18n.t('profile:languageNotSaved'), 'error'),
              )
            }
          />
        </div>
      </section>

      <ListGroup title={t('sections.support')}>
        <ListRow to="/profile/install" icon={Download} label={t('install')} />
        <ListRow to="/help" icon={HelpCircle} label={t('help')} />
        <ListRow to="/profile/privacy" icon={ShieldCheck} label={t('privacy')} />
      </ListGroup>

      <Button variant="outline" size="lg" onClick={() => void onSignOut()} loading={signingOut}>
        <LogOut aria-hidden="true" />
        {t('auth:signOut')}
      </Button>
    </div>
  );
}
