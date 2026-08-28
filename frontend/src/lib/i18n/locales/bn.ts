// ═══════════════════════════════════════════════════════════════════════════
// BENGALI LOCALE (bn) — LTR                            API_CONTRACT.md §8 · UI
// ───────────────────────────────────────────────────────────────────────────
// Bengali ships from the first commit, not as a later "translation pass":
// tenant #2 is seeded `bn`, so an untranslated string is a visible gap in a
// demo, not a hypothetical. Bengali is left-to-right — there is no `dir: rtl`
// anywhere in this app.
//
// Typed against the English module so a missing or misspelled key is a compile
// error, and the `errors` namespace still satisfies `Record<ErrorCode, string>`
// through that same structural check.
// ═══════════════════════════════════════════════════════════════════════════

import type en from './en';

const errors = {
  UNAUTHENTICATED: 'চালিয়ে যেতে অনুগ্রহ করে সাইন ইন করুন।',
  TOKEN_EXPIRED: 'আপনার সেশনটি নতুন করে যাচাই করা প্রয়োজন।',
  TOKEN_REVOKED: 'এই সেশনটি শেষ হয়েছে। আবার সাইন ইন করুন।',
  REFRESH_REUSED: 'নিরাপত্তার স্বার্থে এই সেশনটি শেষ করা হয়েছে। আবার সাইন ইন করুন।',
  MFA_REQUIRED: 'চালিয়ে যেতে অতিরিক্ত যাচাই প্রয়োজন।',
  ACCOUNT_LOCKED: 'এই অ্যাকাউন্টটি সাময়িকভাবে লক করা আছে। পরে চেষ্টা করুন।',
  ACCOUNT_INACTIVE: 'এই অ্যাকাউন্টটি নিষ্ক্রিয়। আপনার প্রশাসকের সাথে যোগাযোগ করুন।',
  TENANT_INACTIVE: 'এই কর্মক্ষেত্রটি সক্রিয় নয়। আপনার প্রশাসকের সাথে যোগাযোগ করুন।',

  FORBIDDEN: 'এটি করার অনুমতি আপনার নেই।',
  OUT_OF_SCOPE: 'এটি আপনার নির্ধারিত শাখার বাইরে। চালিয়ে যেতে স্কোপ পরিবর্তন করুন।',
  TENANT_MISMATCH: 'এই আইটেমটি অন্য একটি কর্মক্ষেত্রের।',
  PLATFORM_ONLY: 'এই কাজটি শুধুমাত্র প্ল্যাটফর্ম প্রশাসকদের জন্য সীমাবদ্ধ।',

  NOT_FOUND: 'আপনি যা খুঁজছেন তা আমরা খুঁজে পাইনি।',
  ROUTE_NOT_FOUND: 'এই পৃষ্ঠাটি নেই।',
  RESOURCE_GONE: 'এই আইটেমটি আর উপলব্ধ নেই।',

  VALIDATION_FAILED: 'অনুগ্রহ করে চিহ্নিত ঘরগুলো ঠিক করুন।',
  BUSINESS_RULE_VIOLATED: 'এই কাজটি একটি ব্যবসায়িক নিয়ম ভঙ্গ করে এবং সম্পন্ন করা যাবে না।',
  INSUFFICIENT_STOCK: 'এটি সম্পন্ন করার মতো যথেষ্ট স্টক নেই।',
  PRODUCTION_CONTEXT_INCOMPLETE: 'কিছু উৎপাদন তথ্য অনুপস্থিত।',
  QC_REQUIRED: 'এটি এগিয়ে নেওয়ার আগে একটি মান পরীক্ষা প্রয়োজন।',
  CREDIT_LIMIT_EXCEEDED: 'এটি গ্রাহকের ক্রেডিট সীমা অতিক্রম করে।',
  PRICE_STALE: 'দাম পরিবর্তিত হয়েছে। পর্যালোচনা করে আবার চেষ্টা করুন।',
  PERIOD_CLOSED: 'এই হিসাবকালটি বন্ধ।',
  SEQUENCE_EXHAUSTED: 'নম্বর ক্রম শেষ হয়ে গেছে। আপনার প্রশাসকের সাথে যোগাযোগ করুন।',
  UNSUPPORTED_CAPABILITY: 'এই সুবিধাটি আপনার প্ল্যানে নেই।',
  INVALID_FILE: 'এই ফাইলটি ব্যবহার করা যাবে না। ফরম্যাট যাচাই করে আবার চেষ্টা করুন।',
  IMPORT_FAILED: 'ইমপোর্ট সম্পন্ন করা যায়নি। ফাইলটি পর্যালোচনা করে আবার চেষ্টা করুন।',

  INVALID_STATE: 'আইটেমটির বর্তমান অবস্থায় এটি করা যাবে না।',
  DUPLICATE: 'এটি ইতিমধ্যে বিদ্যমান।',
  IDEMPOTENT_KEY_CONFLICT: 'এই অনুরোধটি ইতিমধ্যে প্রক্রিয়া করা হয়েছে।',
  VERSION_CONFLICT: 'আপনি সম্পাদনা করার সময় অন্য কেউ এটি পরিবর্তন করেছেন।',
  LOCKED: 'এই আইটেমটি অন্য একটি কাজের দ্বারা লক করা আছে।',
  IN_USE: 'এটি ব্যবহৃত হচ্ছে এবং পরিবর্তন করা যাবে না।',

  PAYLOAD_TOO_LARGE: 'পাঠানোর জন্য এটি অনেক বড়।',
  IDEMPOTENCY_KEY_REQUIRED: 'এই অনুরোধে একটি নিরাপত্তা কী নেই। আবার চেষ্টা করুন।',
  PRECONDITION_REQUIRED: 'সংরক্ষণের আগে এই আইটেমটি পুনরায় লোড করতে হবে।',
  RATE_LIMITED: 'অনেক বেশি অনুরোধ। একটু অপেক্ষা করুন।',

  INTERNAL_ERROR: 'আমাদের দিক থেকে কিছু একটা সমস্যা হয়েছে।',
  NOT_IMPLEMENTED: 'এটি এখনও উপলব্ধ নয়।',
  UPSTREAM_FAILED: 'আমরা সার্ভারে পৌঁছাতে পারিনি।',
  SERVICE_UNAVAILABLE: 'পরিষেবাটি সাময়িকভাবে অনুপলব্ধ।',
  UPSTREAM_TIMEOUT: 'সার্ভার সাড়া দিতে অনেক সময় নিয়েছে।',

  NETWORK_OFFLINE: 'আপনি অফলাইনে আছেন। পুনরায় সংযুক্ত হলে এটি আবার কাজ করবে।',
  REQUEST_TIMEOUT: 'এই অনুরোধটি সম্পন্ন হতে অনেক সময় নিয়েছে।',
  REQUEST_CANCELLED: 'অনুরোধ বাতিল করা হয়েছে।',
  MALFORMED_RESPONSE: 'সার্ভার এমন একটি সাড়া দিয়েছে যা আমরা পড়তে পারিনি।',
} satisfies (typeof en)['errors'];

const common = {
  appName: 'স্লাইস মার্ট',
  tagline: 'কারখানা, ইনভেন্টরি ও ব্যবসা ব্যবস্থাপনা',

  action: {
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    close: 'বন্ধ',
    confirm: 'নিশ্চিত করুন',
    retry: 'আবার চেষ্টা করুন',
    signIn: 'সাইন ইন',
    signOut: 'সাইন আউট',
    search: 'অনুসন্ধান',
  },

  state: {
    loading: 'লোড হচ্ছে…',
    empty: 'এখানে এখনও কিছু নেই।',
    error: 'কিছু একটা সমস্যা হয়েছে।',
  },

  nav: {
    dashboard: 'ড্যাশবোর্ড',
    settings: 'সেটিংস',
  },

  theme: {
    label: 'থিম',
    light: 'আলো',
    dark: 'অন্ধকার',
    system: 'সিস্টেম',
  },

  language: {
    label: 'ভাষা',
    en: 'English',
    bn: 'বাংলা',
  },

  density: {
    label: 'ঘনত্ব',
    compact: 'সংক্ষিপ্ত',
    comfortable: 'স্বচ্ছন্দ',
  },

  reference: 'রেফারেন্স',
} satisfies (typeof en)['common'];

const auth = {
  signInTitle: 'সাইন ইন',
  signInSubtitle: 'আবার স্বাগতম। চালিয়ে যেতে আপনার তথ্য দিন।',

  emailLabel: 'ইমেইল',
  emailPlaceholder: 'you@company.com',
  passwordLabel: 'পাসওয়ার্ড',
  passwordPlaceholder: 'আপনার পাসওয়ার্ড',
  rememberDevice: 'এই ডিভাইসটি মনে রাখুন',

  signInButton: 'সাইন ইন',
  signingIn: 'সাইন ইন হচ্ছে…',
  forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',

  invalidCredentials: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',

  selectTenantTitle: 'একটি কর্মক্ষেত্র বেছে নিন',
  selectTenantSubtitle: 'আপনার অ্যাকাউন্টের একাধিক কর্মক্ষেত্রে অ্যাক্সেস রয়েছে।',
  continue: 'চালিয়ে যান',

  signedOut: 'আপনি সাইন আউট হয়েছেন।',
  sessionExpiredTitle: 'সেশন শেষ হয়েছে',
  sessionExpiredBody:
    'আপনার সেশন শেষ হয়েছে। যেখানে ছিলেন সেখান থেকে চালিয়ে যেতে আবার সাইন ইন করুন।',

  validation: {
    emailRequired: 'আপনার ইমেইল দিন।',
    emailInvalid: 'একটি বৈধ ইমেইল ঠিকানা দিন।',
    passwordRequired: 'আপনার পাসওয়ার্ড দিন।',
  },
} satisfies (typeof en)['auth'];

export default { common, auth, errors };
