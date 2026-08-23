// ═══════════════════════════════════════════════════════════════════════════
// QUERY CLIENT POLICY — the rules that protect the backend and the user's data
// ───────────────────────────────────────────────────────────────────────────
// `shouldRetryQuery` and `backoff` are deliberately not exported: they are
// policy, not API. These tests read them back off the constructed client's
// default options, which is how TanStack Query itself will invoke them — so
// the test exercises the wiring as well as the logic. Exporting internals
// purely to test them would let the wiring rot silently.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { createApiError } from './errors';
import { STALE_TIME, createQueryClient } from './queryClient';

type RetryFn = (failureCount: number, error: unknown) => boolean;
type RetryDelayFn = (attemptIndex: number, error: unknown) => number;

function policy() {
  const defaults = createQueryClient().getDefaultOptions();
  return {
    queries: defaults.queries,
    mutations: defaults.mutations,
    retry: defaults.queries?.retry as RetryFn,
    retryDelay: defaults.queries?.retryDelay as RetryDelayFn,
  };
}

describe('mutation policy — ADR-025', () => {
  /* The single most consequential line in the file. A retried POST that already
     committed creates a second batch, a second payment or a second stock
     movement. The user retries explicitly, protected by the idempotency key. */
  it('never auto-retries a mutation', () => {
    expect(policy().mutations?.retry).toBe(false);
  });

  it('does not throw mutation errors to a render boundary', () => {
    expect(policy().mutations?.throwOnError).toBe(false);
  });
});

describe('query policy — §8.4 and §7.5 wiring', () => {
  it('surfaces query errors as state rather than throwing to a boundary', () => {
    // §8.4: boundaries catch render errors only. A failed request must leave
    // the shell alive so row 9 can scope the failure to one region.
    expect(policy().queries?.throwOnError).toBe(false);
  });

  it('keeps previous data during a refetch, so row 2 has stale data to show', () => {
    const placeholder = policy().queries?.placeholderData as (prev: unknown) => unknown;
    const previous = [{ id: 1 }];
    expect(placeholder(previous)).toBe(previous);
  });

  it('does not refetch on window focus, but does on reconnect', () => {
    expect(policy().queries?.refetchOnWindowFocus).toBe(false);
    expect(policy().queries?.refetchOnReconnect).toBe(true);
  });

  it('uses the documented staleTime tiers', () => {
    expect(STALE_TIME).toEqual({
      masterData: 5 * 60_000,
      transactional: 30_000,
      dashboard: 60_000,
    });
    expect(policy().queries?.staleTime).toBe(STALE_TIME.transactional);
  });
});

describe('shouldRetryQuery', () => {
  const { retry } = policy();

  it('retries a server-declared retryable failure', () => {
    expect(retry(0, createApiError('UPSTREAM_FAILED', { status: 502, retryable: true }))).toBe(
      true
    );
  });

  it('stops at 3 attempts', () => {
    const err = createApiError('UPSTREAM_FAILED', { status: 502, retryable: true });
    expect(retry(2, err)).toBe(true);
    expect(retry(3, err)).toBe(false);
    expect(retry(9, err)).toBe(false);
  });

  it('respects the server when it says a failure is not retryable', () => {
    expect(retry(0, createApiError('VALIDATION_FAILED', { status: 422, retryable: false }))).toBe(
      false
    );
  });

  /* A non-ApiError escaping the client means the client itself is broken.
     Retrying runs the same broken code three times and buries the real cause. */
  it('refuses to retry anything that is not an ApiError', () => {
    expect(retry(0, new Error('boom'))).toBe(false);
    expect(retry(0, undefined)).toBe(false);
  });

  /* Each of these has `retryable` deliberately set true to prove the exclusion
     is driven by `code`, not by the flag. Every one of them would cause real
     damage on retry: resurrecting cancelled work, restarting the refresh
     protocol and risking REFRESH_REUSED, hammering a dead radio, or
     re-triggering the very throttle that just rejected us. */
  it.each([
    'REQUEST_CANCELLED',
    'TOKEN_EXPIRED',
    'UNAUTHENTICATED',
    'TOKEN_REVOKED',
    'REFRESH_REUSED',
    'NETWORK_OFFLINE',
    'RATE_LIMITED',
  ] as const)('never retries %s even when the server marks it retryable', (code) => {
    expect(retry(0, createApiError(code, { retryable: true }))).toBe(false);
  });
});

describe('backoff', () => {
  const { retryDelay } = policy();
  const err = createApiError('UPSTREAM_FAILED', { status: 502, retryable: true });

  it('grows exponentially and caps at 8s', () => {
    // Full jitter: each delay lands in [base/2, base). Asserting the envelope
    // rather than a value, because a fixed schedule is the bug jitter prevents.
    for (const [attempt, base] of [
      [0, 1000],
      [1, 2000],
      [2, 4000],
      [3, 8000],
      [7, 8000],
    ] as const) {
      const delay = retryDelay(attempt, err);
      expect(delay).toBeGreaterThanOrEqual(base / 2);
      expect(delay).toBeLessThan(base);
    }
  });

  it('actually jitters, so six queries failing together do not retry in lockstep', () => {
    const delays = new Set(Array.from({ length: 24 }, () => retryDelay(2, err)));
    expect(delays.size).toBeGreaterThan(1);
  });
});
