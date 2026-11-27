import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esCommon from './locales/es-ES/common.json';
import esAuth from './locales/es-ES/auth.json';
import esErrors from './locales/es-ES/errors.json';
import esHouseholds from './locales/es-ES/households.json';
import esProfile from './locales/es-ES/profile.json';
import esHome from './locales/es-ES/home.json';
import esHelp from './locales/es-ES/help.json';
import esRecipes from './locales/es-ES/recipes.json';
import enCommon from './locales/en-GB/common.json';
import enAuth from './locales/en-GB/auth.json';
import enErrors from './locales/en-GB/errors.json';
import enHouseholds from './locales/en-GB/households.json';
import enProfile from './locales/en-GB/profile.json';
import enHome from './locales/en-GB/home.json';
import enHelp from './locales/en-GB/help.json';
import enRecipes from './locales/en-GB/recipes.json';
import { DEFAULT_LOCALE, readDeviceLocale, type SupportedLocale } from './locale';

export const resources = {
  'es-ES': {
    common: esCommon,
    auth: esAuth,
    errors: esErrors,
    households: esHouseholds,
    profile: esProfile,
    home: esHome,
    help: esHelp,
    recipes: esRecipes,
  },
  'en-GB': {
    common: enCommon,
    auth: enAuth,
    errors: enErrors,
    households: enHouseholds,
    profile: enProfile,
    home: enHome,
    help: enHelp,
    recipes: enRecipes,
  },
} as const;

export const namespaces = Object.keys(resources[DEFAULT_LOCALE]) as Array<
  keyof (typeof resources)[typeof DEFAULT_LOCALE]
>;

export function initI18n(locale: SupportedLocale = readDeviceLocale()) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ['es-ES', 'en-GB'],
    ns: namespaces,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  document.documentElement.lang = locale;
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
  return i18n;
}

export default i18n;
