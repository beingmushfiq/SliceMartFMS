// ═══════════════════════════════════════════════════════════════════════════
// i18n INITIALISATION                                  UI_SYSTEM.md · ADR-031
// ───────────────────────────────────────────────────────────────────────────
// Two locales from the first commit — `en` and `bn` — because tenant #2 is
// seeded Bengali and an untranslated string is a visible defect, not a later
// pass. Bengali is LEFT-TO-RIGHT; there is no `dir: rtl` in this app.
//
// No `i18next-browser-languagedetector` and no `i18next-http-backend`: those
// packages are not installed, and neither is needed. Resources are bundled
// (small, typed, compile-checked), and language is resolved here from the same
// `ui.*` localStorage mirror the pre-paint script in index.html reads — one
// convention, not two. The store owns the value at runtime; this is its seed.
// ═══════════════════════════════════════════════════════════════════════════

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import bn from './locales/bn';

export const SUPPORTED_LOCALES = ['en', 'bn'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

/** The localStorage key the pre-paint resolver and the preferences store share. */
export const LOCALE_STORAGE_KEY = 'ui.locale';

function isSupported(value: string | null | undefined): value is AppLocale {
  return value === 'en' || value === 'bn';
}

/**
 * The locale to boot with.
 *
 * Reads the stored mirror first (Safari private mode throws on access, so it is
 * guarded), then the browser's `navigator.language`, then the default. The
 * store reconciles this on hydration exactly as the theme does.
 */
export function resolveInitialLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    /* localStorage unavailable — fall through to navigator/default. */
  }

  const navigatorLocale = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : '';
  if (isSupported(navigatorLocale)) return navigatorLocale;

  return DEFAULT_LOCALE;
}

/* The resource tree. `common`, `auth` and `errors` are separate namespaces so a
   screen loads only the keys it references and the `errors` namespace stays the
   single `ErrorCode`-checked table. */
export const resources = {
  en: { common: en.common, auth: en.auth, errors: en.errors },
  bn: { common: bn.common, auth: bn.auth, errors: bn.errors },
} as const;

export const NAMESPACES = ['common', 'auth', 'errors'] as const;

/* Guard against double init under Vite HMR and StrictMode double-invoke. */
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: resolveInitialLocale(),
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    ns: NAMESPACES,
    /* React already escapes everything it renders; i18next re-escaping would
       double-encode Bengali punctuation and the app name's own markup. */
    interpolation: { escapeValue: false },
    /* Missing keys are a bug we want to see in the console during development,
       not silently swallowed into an empty string. */
    returnNull: false,
  });
}

/**
 * Switch language and persist it to the shared mirror.
 *
 * Callers are UI (the language switcher, the preferences form). Writing the
 * mirror here keeps the next cold boot in step without a round trip.
 */
export async function changeLocale(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* Non-fatal: the language still changed for this session. */
  }
}

export default i18n;
