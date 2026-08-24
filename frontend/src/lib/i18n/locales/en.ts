// ═══════════════════════════════════════════════════════════════════════════
// ENGLISH LOCALE                                       API_CONTRACT.md §8 · UI
// ───────────────────────────────────────────────────────────────────────────
// Resources live as typed modules, not `.json`, for one load-bearing reason:
// the `errors` namespace is `satisfies Record<ErrorCode, string>`, so shipping
// a new `ErrorCode` without a translation is a compile error here rather than a
// raw code string leaking onto a user's screen. This mirrors the StateView
// registry rule in `lib/api/errors.ts` — every code has a designed surface.
// ═══════════════════════════════════════════════════════════════════════════

import type { ErrorCode } from '../../api/errors';

/* Every code the transport can produce maps to safe, human copy. The server
   sends its own already-localised message when it can (§2.3); this is the
   fallback the StateView registry uses when it cannot. */
const errors = {
  /* 401 — the session, not the request */
  UNAUTHENTICATED: 'Please sign in to continue.',
  TOKEN_EXPIRED: 'Your session needs refreshing.',
  TOKEN_REVOKED: 'This session was ended. Please sign in again.',
  REFRESH_REUSED: 'For your security, this session was ended. Please sign in again.',
  MFA_REQUIRED: 'Additional verification is required to continue.',
  ACCOUNT_LOCKED: 'This account is temporarily locked. Try again later.',
  ACCOUNT_INACTIVE: 'This account is inactive. Contact your administrator.',
  TENANT_INACTIVE: 'This workspace is not active. Contact your administrator.',

  /* 403 — the record exists, you may not act on it */
  FORBIDDEN: 'You don’t have permission to do this.',
  OUT_OF_SCOPE: 'This is outside your assigned branches. Switch scope to continue.',
  TENANT_MISMATCH: 'This item belongs to a different workspace.',
  PLATFORM_ONLY: 'This action is limited to platform administrators.',

  /* 404 / 410 — absence */
  NOT_FOUND: 'We couldn’t find what you were looking for.',
  ROUTE_NOT_FOUND: 'This page doesn’t exist.',
  RESOURCE_GONE: 'This item is no longer available.',

  /* 422 — understood and refused */
  VALIDATION_FAILED: 'Please correct the highlighted fields.',
  BUSINESS_RULE_VIOLATED: 'This action breaks a business rule and can’t be completed.',
  INSUFFICIENT_STOCK: 'There isn’t enough stock to complete this.',
  PRODUCTION_CONTEXT_INCOMPLETE: 'Some production details are missing.',
  QC_REQUIRED: 'A quality check is required before this can proceed.',
  CREDIT_LIMIT_EXCEEDED: 'This exceeds the customer’s credit limit.',
  PRICE_STALE: 'The price has changed. Review it and try again.',
  PERIOD_CLOSED: 'This accounting period is closed.',
  SEQUENCE_EXHAUSTED: 'The number sequence is exhausted. Contact your administrator.',
  UNSUPPORTED_CAPABILITY: 'This feature isn’t available on your plan.',
  INVALID_FILE: 'This file can’t be used. Check the format and try again.',
  IMPORT_FAILED: 'The import couldn’t be completed. Review the file and try again.',

  /* 409 — conflict */
  INVALID_STATE: 'This can’t be done in the item’s current state.',
  DUPLICATE: 'This already exists.',
  IDEMPOTENT_KEY_CONFLICT: 'This request was already processed.',
  VERSION_CONFLICT: 'Someone else changed this while you were editing.',
  LOCKED: 'This item is locked by another action.',
  IN_USE: 'This is in use and can’t be changed.',

  /* 413 / 428 / 429 — protocol preconditions */
  PAYLOAD_TOO_LARGE: 'This is too large to send.',
  IDEMPOTENCY_KEY_REQUIRED: 'This request is missing a safety key. Try again.',
  PRECONDITION_REQUIRED: 'This item must be reloaded before saving.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',

  /* 5xx — server */
  INTERNAL_ERROR: 'Something went wrong on our side.',
  NOT_IMPLEMENTED: 'This isn’t available yet.',
  UPSTREAM_FAILED: 'We couldn’t reach the server.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable.',
  UPSTREAM_TIMEOUT: 'The server took too long to respond.',

  /* client pseudo-codes synthesised by the transport (§8.9) */
  NETWORK_OFFLINE: 'You’re offline. This will work again once you reconnect.',
  REQUEST_TIMEOUT: 'This request took too long to complete.',
  REQUEST_CANCELLED: 'Request cancelled.',
  MALFORMED_RESPONSE: 'The server returned a response we couldn’t read.',
} satisfies Record<ErrorCode, string>;

const common = {
  appName: 'Slice Mart',
  tagline: 'Factory, inventory & business management',

  action: {
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    retry: 'Try again',
    signIn: 'Sign in',
    signOut: 'Sign out',
    search: 'Search',
  },

  state: {
    loading: 'Loading…',
    empty: 'Nothing here yet.',
    error: 'Something went wrong.',
  },

  nav: {
    dashboard: 'Dashboard',
    settings: 'Settings',
  },

  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },

  language: {
    label: 'Language',
    en: 'English',
    bn: 'বাংলা',
  },

  density: {
    label: 'Density',
    compact: 'Compact',
    comfortable: 'Comfortable',
  },

  /* §7 — the id support searches on. Always shown, never hidden. */
  reference: 'Reference',
};

const auth = {
  signInTitle: 'Sign in',
  signInSubtitle: 'Welcome back. Enter your details to continue.',

  emailLabel: 'Email',
  emailPlaceholder: 'you@company.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Your password',
  rememberDevice: 'Remember this device',

  signInButton: 'Sign in',
  signingIn: 'Signing in…',
  forgotPassword: 'Forgot password?',

  /* §8.1 — a single generic message. "Wrong password" vs "no such user" is
     never disclosed. */
  invalidCredentials: 'The email or password is incorrect.',

  selectTenantTitle: 'Choose a workspace',
  selectTenantSubtitle: 'Your account has access to more than one workspace.',
  continue: 'Continue',

  signedOut: 'You’ve been signed out.',
  sessionExpiredTitle: 'Session expired',
  sessionExpiredBody: 'Your session ended. Sign in again to continue where you left off.',

  validation: {
    emailRequired: 'Enter your email.',
    emailInvalid: 'Enter a valid email address.',
    passwordRequired: 'Enter your password.',
  },
};

export default { common, auth, errors };
