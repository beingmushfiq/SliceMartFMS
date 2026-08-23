// ═══════════════════════════════════════════════════════════════════════════
// API ERROR CONTRACT                          API_CONTRACT.md §8 · UI §8.1
// ───────────────────────────────────────────────────────────────────────────
// The single vocabulary the UI branches on. Three rules govern this file:
//
//   1. Clients branch on `code`, NEVER on `message`. A message is human copy —
//      it gets rewritten, translated and shortened. A code is a contract.
//   2. `retryable` decides Retry vs Fix-and-resubmit. It is transport-level
//      truth from the server, not a guess the UI makes per screen.
//   3. Adding a code to the API means adding a row to the StateView registry.
//      API_CONTRACT.md §18 makes shipping a code without a designed state a
//      contract violation, so `ErrorCode` is a closed union — a new code fails
//      the `satisfies` check in `patterns/StateView.tsx` at compile time rather
//      than falling through to a blank panel at runtime.
//
// No fetching happens here. This is the type layer plus a normaliser; the
// transport seam is `lib/api/client.ts` (ARCHITECTURE.md §6.3).
// ═══════════════════════════════════════════════════════════════════════════

/* ── 401 · authentication ─────────────────────────────────────────────────── */
export type AuthErrorCode =
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REVOKED'
  | 'REFRESH_REUSED'
  | 'MFA_REQUIRED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_INACTIVE'
  | 'TENANT_INACTIVE';

/* ── 403 · authorisation. OUT_OF_SCOPE is deliberately NOT a FORBIDDEN alias:
      row 11 is a dead end, row 12 is fixable by switching scope (ADR-008). ── */
export type AuthzErrorCode = 'FORBIDDEN' | 'OUT_OF_SCOPE' | 'TENANT_MISMATCH' | 'PLATFORM_ONLY';

/* ── 404 / 410 · absence ──────────────────────────────────────────────────── */
export type NotFoundErrorCode = 'NOT_FOUND' | 'ROUTE_NOT_FOUND' | 'RESOURCE_GONE';

/* ── 422 · the request was understood and refused ─────────────────────────── */
export type ValidationErrorCode =
  | 'VALIDATION_FAILED'
  | 'BUSINESS_RULE_VIOLATED'
  | 'INSUFFICIENT_STOCK'
  | 'PRODUCTION_CONTEXT_INCOMPLETE'
  | 'QC_REQUIRED'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'PRICE_STALE'
  | 'PERIOD_CLOSED'
  | 'SEQUENCE_EXHAUSTED'
  | 'UNSUPPORTED_CAPABILITY'
  | 'INVALID_FILE'
  | 'IMPORT_FAILED';

/* ── 409 · conflict ───────────────────────────────────────────────────────── */
export type ConflictErrorCode =
  | 'INVALID_STATE'
  | 'DUPLICATE'
  | 'IDEMPOTENT_KEY_CONFLICT'
  | 'VERSION_CONFLICT'
  | 'LOCKED'
  | 'IN_USE';

/* ── 413 / 428 / 429 · protocol preconditions ─────────────────────────────── */
export type ProtocolErrorCode =
  'PAYLOAD_TOO_LARGE' | 'IDEMPOTENCY_KEY_REQUIRED' | 'PRECONDITION_REQUIRED' | 'RATE_LIMITED';

/* ── 5xx · server ─────────────────────────────────────────────────────────── */
export type ServerErrorCode =
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'UPSTREAM_FAILED'
  | 'SERVICE_UNAVAILABLE'
  | 'UPSTREAM_TIMEOUT';

/* ── Client pseudo-codes (API_CONTRACT.md §8.9) ────────────────────────────────
   These never arrive over the wire; `lib/api/client.ts` synthesises them so a
   transport failure is the same shape as a server refusal and screens need only
   one error path. `REQUEST_CANCELLED` is load-bearing: an aborted request is a
   normal consequence of navigation, and rendering it as a failure would make
   every route change look broken. ─────────────────────────────────────────── */
export type ClientErrorCode =
  'NETWORK_OFFLINE' | 'REQUEST_TIMEOUT' | 'REQUEST_CANCELLED' | 'MALFORMED_RESPONSE';

export type ErrorCode =
  | AuthErrorCode
  | AuthzErrorCode
  | NotFoundErrorCode
  | ValidationErrorCode
  | ConflictErrorCode
  | ProtocolErrorCode
  | ServerErrorCode
  | ClientErrorCode;

/**
 * The parsed error envelope.
 *
 * A plain object, not an `Error` subclass. Two reasons: it crosses the
 * TanStack Query cache (where a class instance is a liability), and boundaries
 * must be able to tell a render crash (`Error`) from a refused request
 * (`ApiError`) by shape alone — §8.4 forbids mixing the two.
 */
export interface ApiError {
  readonly __brand: 'ApiError';
  /** The contract. Branch on this. */
  code: ErrorCode;
  /** HTTP status, or 0 for a client pseudo-code that never reached the server. */
  status: number;
  /** Safe, human-readable. Already localised by the server via `Accept-Language`. */
  message: string;
  /** Structured payload for the specific code — the numbers row 7 copy needs. */
  details?: Record<string, unknown> | undefined;
  /** Dot-path → messages, for `VALIDATION_FAILED` only. Maps onto RHF field names. */
  fields?: Record<string, string[]> | undefined;
  /** Server-declared. Drives Retry vs Fix-and-resubmit; never inferred per screen. */
  retryable: boolean;
  /** The support reference. Shown to the user, copyable, never hidden. */
  correlationId?: string | undefined;
}

/** Type guard. The only sanctioned way to tell an `ApiError` from an `Error`. */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { __brand?: unknown }).__brand === 'ApiError'
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Classification helpers.

   These exist so the same question is not answered slightly differently in
   fifteen screens. Each one is a single predicate over `code` — deliberately
   not a `retryable` re-derivation, because `retryable` is the server's word.
   ─────────────────────────────────────────────────────────────────────────── */

/** Row 19 (silent). An aborted request is never an error state, never a toast,
 *  never a boundary. Every consumer must check this before rendering anything. */
export function isCancelled(error: unknown): boolean {
  return isApiError(error) && error.code === 'REQUEST_CANCELLED';
}

/** Rows 6 + 7 — the user can fix this by editing the form. Nothing to retry. */
export function isFixable(error: ApiError): boolean {
  return error.status === 422;
}

/** Row 10 — the session, not the request, is the problem. Handled globally by
 *  the session-expiry surface, so screens must not render their own panel. */
export function isSessionProblem(error: ApiError): boolean {
  return error.status === 401;
}

/** Rows 11 + 12. Kept separate from 404 because a 403 means the record exists. */
export function isPermissionProblem(error: ApiError): boolean {
  return error.status === 403;
}

/**
 * Whether a Retry button should appear.
 *
 * `retryable` alone is not sufficient: `TOKEN_EXPIRED` is flagged retryable
 * because the *client* retries it silently after a refresh (§8.4), not because
 * a human should be offered a button. Offering one would be a dead end.
 */
export function isUserRetryable(error: ApiError): boolean {
  if (error.code === 'TOKEN_EXPIRED') return false;
  return error.retryable;
}

/* ───────────────────────────────────────────────────────────────────────────
   Normalisation

   `normalizeError` is the boundary between "anything at all" and the typed
   contract. Query error channels, catch blocks and boundary fallbacks all pass
   through here, so no screen has to defend against an unknown throw shape.

   It never invents a code it cannot justify: an unrecognised throw becomes
   `INTERNAL_ERROR`, which has a designed state, rather than being coerced into
   a specific code that would produce misleading copy (§8.5 rule 6).
   ─────────────────────────────────────────────────────────────────────────── */

const GENERIC_MESSAGE = 'Something went wrong on our side.';

export function createApiError(
  code: ErrorCode,
  init: Partial<Omit<ApiError, '__brand' | 'code'>> = {}
): ApiError {
  return {
    __brand: 'ApiError',
    code,
    status: init.status ?? 0,
    message: init.message ?? GENERIC_MESSAGE,
    ...(init.details !== undefined && { details: init.details }),
    ...(init.fields !== undefined && { fields: init.fields }),
    retryable: init.retryable ?? false,
    ...(init.correlationId !== undefined && { correlationId: init.correlationId }),
  };
}

export function normalizeError(thrown: unknown): ApiError {
  if (isApiError(thrown)) return thrown;

  /* An `AbortError` is what the browser throws when an AbortSignal fires. It is
     not a failure — it is the cancellation contract working. Mapping it here
     means a component that forgot to check still renders nothing rather than a
     spurious error panel. */
  if (thrown instanceof DOMException && thrown.name === 'AbortError') {
    return createApiError('REQUEST_CANCELLED', { message: 'Request cancelled.' });
  }

  /* A bare `TypeError: Failed to fetch` is the browser's only signal for DNS
     failure, a dropped socket or a CORS rejection. `navigator.onLine` separates
     "the device has no network" from "the server did not answer", because the
     remedies differ and row 18 owns only the first. */
  if (thrown instanceof TypeError) {
    return navigator.onLine
      ? createApiError('UPSTREAM_FAILED', {
          status: 502,
          message: 'We couldn’t reach the server.',
          retryable: true,
        })
      : createApiError('NETWORK_OFFLINE', {
          message: 'You’re offline.',
          retryable: true,
        });
  }

  /* A render-time `Error` reaching an error channel means a bug, not a refused
     request. The message is NOT forwarded: it is written for developers and may
     contain internals (§8.5 rule 3). It is logged instead. */
  return createApiError('INTERNAL_ERROR', { status: 500, retryable: true });
}
