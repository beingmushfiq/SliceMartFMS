// ═══════════════════════════════════════════════════════════════════════════
// ERROR CLASSIFICATION — the contract every surface branches on
// ───────────────────────────────────────────────────────────────────────────
// These tests exist because the whole state matrix is downstream of `code`.
// If `isCancelled` ever returns false for a real cancellation, row 19 breaks
// and every screen starts flashing an error panel on navigation. That is not
// a bug a type checker can catch — the shapes stay valid either way.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it, vi } from 'vitest';
import {
  createApiError,
  isApiError,
  isCancelled,
  isFixable,
  isPermissionProblem,
  isSessionProblem,
  normalizeError,
} from './errors';

describe('isApiError', () => {
  it('accepts a constructed ApiError', () => {
    expect(isApiError(createApiError('NOT_FOUND'))).toBe(true);
  });

  /* §8.4 forbids mixing a render crash with a refused request. A boundary tells
     them apart by shape alone, so a real `Error` must never pass this guard. */
  it('rejects a native Error, so boundaries can distinguish a crash from a refusal', () => {
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError(new TypeError('Failed to fetch'))).toBe(false);
  });

  it('rejects look-alikes without the brand', () => {
    expect(isApiError({ code: 'NOT_FOUND', status: 404, message: 'x' })).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError('NOT_FOUND')).toBe(false);
  });
});

describe('createApiError', () => {
  it('defaults to a safe generic message rather than exposing internals', () => {
    // §8.5 rule 3. A caller that supplies no message must not end up rendering
    // an empty string or a developer string.
    expect(createApiError('INTERNAL_ERROR').message).toBe('Something went wrong on our side.');
  });

  it('defaults retryable to false, so a Retry button is never offered by accident', () => {
    expect(createApiError('VALIDATION_FAILED').retryable).toBe(false);
  });

  /* `exactOptionalPropertyTypes` is on and the factory uses conditional spreads:
     an omitted field must be genuinely absent, not present-and-undefined, or
     `{...err}` merges would clobber real values downstream. */
  it('omits optional keys entirely when not supplied', () => {
    const err = createApiError('NOT_FOUND');
    expect('details' in err).toBe(false);
    expect('fields' in err).toBe(false);
    expect('correlationId' in err).toBe(false);
  });

  it('keeps supplied fields, including the correlation id support reads back', () => {
    const err = createApiError('VALIDATION_FAILED', {
      status: 422,
      message: 'Check the highlighted fields.',
      fields: { 'lines.0.quantity': ['Must be greater than 0.'] },
      correlationId: 'corr-1234',
    });
    expect(err.status).toBe(422);
    expect(err.fields).toEqual({ 'lines.0.quantity': ['Must be greater than 0.'] });
    expect(err.correlationId).toBe('corr-1234');
  });
});

describe('isCancelled — §8.1 row 19, the silent state', () => {
  it('is true for REQUEST_CANCELLED', () => {
    expect(isCancelled(createApiError('REQUEST_CANCELLED'))).toBe(true);
  });

  it('is false for every other failure, including ones with status 0', () => {
    expect(isCancelled(createApiError('NETWORK_OFFLINE'))).toBe(false);
    expect(isCancelled(createApiError('REQUEST_TIMEOUT'))).toBe(false);
    expect(isCancelled(new Error('boom'))).toBe(false);
  });
});

describe('classification predicates keyed on status', () => {
  it('maps 422 to fixable (rows 6 + 7), not retryable', () => {
    expect(isFixable(createApiError('VALIDATION_FAILED', { status: 422 }))).toBe(true);
    expect(isFixable(createApiError('INTERNAL_ERROR', { status: 500 }))).toBe(false);
  });

  it('maps 401 to a session problem (row 10)', () => {
    expect(isSessionProblem(createApiError('TOKEN_EXPIRED', { status: 401 }))).toBe(true);
    expect(isSessionProblem(createApiError('FORBIDDEN', { status: 403 }))).toBe(false);
  });

  /* Rows 11/12 are a 403 concern only. A cross-tenant read returns 404 by
     design, and treating it as a permission problem would tell the user a
     record exists when the entire point is that they cannot learn that. */
  it('maps 403 to a permission problem and keeps 404 out of it', () => {
    expect(isPermissionProblem(createApiError('FORBIDDEN', { status: 403 }))).toBe(true);
    expect(isPermissionProblem(createApiError('OUT_OF_SCOPE', { status: 403 }))).toBe(true);
    expect(isPermissionProblem(createApiError('NOT_FOUND', { status: 404 }))).toBe(false);
  });
});

describe('normalizeError', () => {
  it('passes an existing ApiError through unchanged', () => {
    const original = createApiError('INSUFFICIENT_STOCK', { status: 409 });
    expect(normalizeError(original)).toBe(original);
  });

  it('maps a DOMException AbortError to REQUEST_CANCELLED, so an abort stays silent', () => {
    const aborted = new DOMException('The operation was aborted.', 'AbortError');
    expect(normalizeError(aborted).code).toBe('REQUEST_CANCELLED');
  });

  it('separates offline from unreachable, because the two remedies differ', () => {
    const failedToFetch = new TypeError('Failed to fetch');

    const onLine = vi.spyOn(navigator, 'onLine', 'get');

    onLine.mockReturnValue(true);
    const unreachable = normalizeError(failedToFetch);
    expect(unreachable.code).toBe('UPSTREAM_FAILED');
    expect(unreachable.retryable).toBe(true);

    onLine.mockReturnValue(false);
    expect(normalizeError(failedToFetch).code).toBe('NETWORK_OFFLINE');
  });

  /* §8.5 rule 3. A render-time Error's message is written for developers and
     may name a table, a path or a token. It is logged, never surfaced. */
  it('does NOT forward a native Error message into the user-facing shape', () => {
    const leaky = new Error('SQLSTATE[42S02]: Base table `tenants` not found');
    const normalized = normalizeError(leaky);
    expect(normalized.code).toBe('INTERNAL_ERROR');
    expect(normalized.status).toBe(500);
    expect(normalized.message).not.toContain('SQLSTATE');
    expect(normalized.message).toBe('Something went wrong on our side.');
  });
});
