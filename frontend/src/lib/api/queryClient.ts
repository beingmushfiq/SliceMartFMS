// ═══════════════════════════════════════════════════════════════════════════
// QUERY CLIENT — retry, freshness and cache policy
//                       ARCHITECTURE.md §6.4 · API_CONTRACT.md §16.6 · ADR-025
// ───────────────────────────────────────────────────────────────────────────
// Policy lives here, not in the transport. `client.ts` performs exactly one
// attempt and reports honestly; this file decides whether a second attempt is
// legitimate. Separating them is what makes the rule below expressible at all:
//
//   "GET requests retry network and 5xx failures with exponential backoff
//    (max 3). Mutations NEVER auto-retry — the user retries explicitly via the
//    error UI, protected by the idempotency key." (ARCHITECTURE.md §6.3)
//
// The asymmetry is not caution, it is arithmetic. A retried GET costs a round
// trip. A retried POST that timed out after the server committed creates a
// second stock movement or a second payment. §6.4 puts that decision in the
// user's hands, with the idempotency key making their choice safe.
// ═══════════════════════════════════════════════════════════════════════════

import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './errors';

/* ───────────────────────────────────────────────────────────────────────────
   Freshness tiers (ARCHITECTURE.md §6.4)

   Exported as named constants rather than inlined per hook, because "how stale
   may this be" is a data-classification question with three answers, not a
   number each feature invents. A branch list refetched every 30s is wasted
   bandwidth on a metered connection; a stock level cached for 5 minutes is a
   wrong number on a screen someone is about to act on.
   ─────────────────────────────────────────────────────────────────────────── */

export const STALE_TIME = {
  /** Products, warehouses, customers, settings. Edited rarely, read constantly. */
  masterData: 5 * 60_000,
  /** Batches, orders, stock movements. Someone else is changing these now. */
  transactional: 30_000,
  /** Aggregates. Expensive to compute, and `meta.freshness` labels the age. */
  dashboard: 60_000,
} as const;

/** How long an unobserved query survives before eviction. Longer than the
 *  longest staleTime so back-navigation is instant rather than a fresh load. */
const GC_TIME = 10 * 60_000;

const MAX_GET_RETRIES = 3;

/* ───────────────────────────────────────────────────────────────────────────
   Retry predicate
   ─────────────────────────────────────────────────────────────────────────── */

/**
 * Whether a failed **read** deserves another attempt.
 *
 * Driven by `error.retryable`, which is the server's declaration (§2.3) rather
 * than a per-screen guess. The explicit exclusions below are cases where
 * `retryable` is true but an automatic retry would still be wrong.
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_GET_RETRIES) return false;

  /* A non-ApiError escaping the client is a bug in the client, not a flaky
     network. Retrying would run the same broken code three times. */
  if (!isApiError(error)) return false;

  switch (error.code) {
    /* Row 19: the AbortSignal contract working. Retrying a request the caller
       deliberately cancelled would resurrect work for an unmounted screen. */
    case 'REQUEST_CANCELLED':
      return false;

    /* `client.ts` already refreshed once and replayed once (§8.4). A retry
       here would restart that protocol and risk tripping REFRESH_REUSED. */
    case 'TOKEN_EXPIRED':
    case 'UNAUTHENTICATED':
    case 'TOKEN_REVOKED':
    case 'REFRESH_REUSED':
      return false;

    /* Row 18 owns this. Hammering a disconnected radio drains the battery and
       fills the log; `refetchOnReconnect` retries at the right moment instead. */
    case 'NETWORK_OFFLINE':
      return false;

    /* Retrying a throttle is what caused the throttle. Row 9 offers the button
       and `Retry-After` tells the user when. */
    case 'RATE_LIMITED':
      return false;

    default:
      return error.retryable;
  }
}

/**
 * Exponential backoff with full jitter, capped at 8s.
 *
 * Jitter is not cosmetic. A dashboard fires six queries at once; when a server
 * blips, all six fail together and a fixed schedule retries all six in the same
 * millisecond, three times over — eighteen synchronised requests aimed at a
 * service that is already struggling. Randomising the delay spreads them.
 */
function backoff(attemptIndex: number): number {
  const base = Math.min(1000 * 2 ** attemptIndex, 8000);
  return base / 2 + Math.random() * (base / 2);
}

/* ───────────────────────────────────────────────────────────────────────────
   The client
   ─────────────────────────────────────────────────────────────────────────── */

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.transactional,
        gcTime: GC_TIME,
        retry: shouldRetryQuery,
        retryDelay: backoff,

        /* Refetching on every window focus is the default, and it is wrong for
           this product: an operator alt-tabbing between the app and a
           spreadsheet would refire every visible query each time. Reconnect is
           kept, because coming back online is a real freshness event (§6.8). */
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,

        /* Row 2 + row 20: a refetch keeps the previous data on screen behind a
           2px progress bar. Throwing it away would replace a readable table
           with a skeleton every 30 seconds. */
        placeholderData: <T>(previous: T) => previous,

        /* Errors surface as `status: 'error'` for QueryBoundary to render. They
           are NOT thrown to the nearest ErrorBoundary: §8.4 is explicit that
           boundaries catch render errors only, and a failed request must leave
           the shell and the rest of the page alive (row 9, row 19). */
        throwOnError: false,
      },

      mutations: {
        /* ADR-025. Non-negotiable: a mutation may have committed before the
           connection dropped. The user retries, and the per-intent
           idempotency key (§6.2) makes that retry safe. */
        retry: false,
        throwOnError: false,
      },
    },
  });
}
