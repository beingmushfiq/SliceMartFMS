// ═══════════════════════════════════════════════════════════════════════════
// LOGGER — the evidence trail, asserted             UI_SYSTEM.md §8.4 · §8.5
// ───────────────────────────────────────────────────────────────────────────
// This module is the reason a production incident is diagnosable at all, and
// every one of its failure modes is silent:
//
//   · A broken ring buffer grows without bound. The symptom is not a test
//     failure, it is a browser tab that dies during the incident you were
//     trying to record.
//   · A logger that throws inside a catch block turns one failure into two,
//     and the second one has no boundary above it.
//   · A cancellation that gets recorded buries real failures under routine
//     route changes, at which point nobody reads the log any more.
//   · A 4xx logged at `error` level does the same thing more slowly: it is the
//     system working, and treating it as an incident trains people to ignore
//     the channel.
//
// The buffer is module state, so `clearLogs()` runs before every test. That is
// a deliberate dependency: the module is a singleton by design (the boot path
// and a crashed React tree must share one sink), and pretending otherwise in
// the test would test a different module than the one that ships.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLogContext,
  clearLogs,
  getLogs,
  logApiError,
  logBoundaryError,
  logEvent,
  setLogContext,
  subscribeToLogs,
} from './logger';
import { createApiError } from '../api/errors';

beforeEach(() => {
  clearLogs();
  clearLogContext();
  /* `record()` mirrors to the console in dev, and `import.meta.env.DEV` is true
     under vitest. Silenced per-test (restored by `restoreMocks`) so the suite
     output stays readable — the mirror itself is asserted explicitly below. */
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  clearLogs();
  clearLogContext();
});

describe('the ring buffer', () => {
  it('keeps entries newest-first', () => {
    logEvent('info', 'first');
    logEvent('info', 'second');

    /* Newest-first is not cosmetic: the Log Inspector shows the head of the
       buffer, and an incident is always at the head. */
    expect(getLogs().map((e) => e.message)).toEqual(['second', 'first']);
  });

  it('caps at 50 entries so a render loop cannot exhaust memory', () => {
    for (let i = 0; i < 120; i += 1) logEvent('error', `burst ${i}`);

    const logs = getLogs();
    expect(logs).toHaveLength(50);
    /* The cap must drop the OLDEST, not refuse the newest. A buffer that stops
       accepting writes at capacity discards exactly the entries that explain
       what the loop escalated into. */
    expect(logs[0]?.message).toBe('burst 119');
    expect(logs.at(-1)?.message).toBe('burst 70');
  });

  it('gives every entry a unique, human-readable id', () => {
    const a = logEvent('info', 'a');
    const b = logEvent('info', 'b');

    /* The id is read aloud to support (§8.3), so it is uppercase and prefixed
       rather than a uuid. Collisions would make two incidents indistinguishable. */
    expect(a.id).toMatch(/^LOG-[0-9A-Z]+-[0-9A-Z]+$/);
    expect(a.id).not.toBe(b.id);
  });

  it('stamps an ISO timestamp', () => {
    const entry = logEvent('info', 'stamped');
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
  });

  it('returns a reference that changes identity on write', () => {
    /* `getLogs` is a `useSyncExternalStore` snapshot. If the array were mutated
       in place, the identity check would pass and the Inspector would never
       re-render — a log viewer that silently stops updating. */
    const before = getLogs();
    logEvent('info', 'x');
    expect(getLogs()).not.toBe(before);
  });
});

describe('ambient context', () => {
  it('merges route, user and tenant into every entry', () => {
    setLogContext({ route: '/production/batches', userId: 'u_7', tenantId: 't_1' });
    const entry = logEvent('warn', 'contextual');

    /* §8.4 lists these as required fields. Without the tenant id, a multi-tenant
       incident cannot be attributed to a tenant. */
    expect(entry.route).toBe('/production/batches');
    expect(entry.userId).toBe('u_7');
    expect(entry.tenantId).toBe('t_1');
  });

  it('merges partial updates instead of replacing the context', () => {
    setLogContext({ userId: 'u_7', tenantId: 't_1' });
    setLogContext({ route: '/sales' });

    const entry = logEvent('info', 'after navigation');
    /* A route change must not erase identity. If it did, every log line after
       the first navigation would be anonymous. */
    expect(entry.userId).toBe('u_7');
    expect(entry.route).toBe('/sales');
  });
});

describe('logBoundaryError — §8.4', () => {
  it('records at error level from the boundary source', () => {
    const error = new Error('render exploded');
    const entry = logBoundaryError(error, { level: 'route', componentStack: '\n  at BatchTable' });

    expect(entry.level).toBe('error');
    expect(entry.source).toBe('boundary');
    expect(entry.boundaryLevel).toBe('route');
    expect(entry.componentStack).toContain('BatchTable');
    expect(entry.stack).toBeTruthy();
  });

  it('substitutes a message when the error has none', () => {
    const entry = logBoundaryError(new Error(''), { level: 'inline' });
    /* An empty row in the Inspector is indistinguishable from a rendering bug
       in the Inspector itself. */
    expect(entry.message).toBe('Unhandled render exception');
  });

  it('returns the entry so the fallback can show its id', () => {
    const entry = logBoundaryError(new Error('boom'), { level: 'global' });
    expect(getLogs()[0]?.id).toBe(entry.id);
  });
});

describe('logApiError — signal, not noise', () => {
  it('drops a cancellation entirely', () => {
    const result = logApiError(createApiError('REQUEST_CANCELLED', { status: 0 }));

    /* §8.1 row 19. A cancellation is the AbortSignal contract working. Recording
       it means every route change writes a line, and the log becomes unreadable
       precisely when it matters. */
    expect(result).toBeNull();
    expect(getLogs()).toHaveLength(0);
  });

  it.each([
    [422, 'warn'] as const,
    [403, 'warn'] as const,
    [404, 'warn'] as const,
    [409, 'warn'] as const,
  ])('logs a %i as %s — a refusal is the system working', (status, level) => {
    const entry = logApiError(createApiError('VALIDATION_FAILED', { status }));
    expect(entry?.level).toBe(level);
  });

  it.each([[500] as const, [502] as const, [503] as const])('logs a %i as error', (status) => {
    const entry = logApiError(createApiError('INTERNAL_ERROR', { status }));
    expect(entry?.level).toBe('error');
  });

  it('logs a transport failure (status 0) as error', () => {
    /* Status 0 is "the request never reached the server". It is not a 4xx the
       user can act on, and it must not be filed as one. */
    const entry = logApiError(createApiError('UPSTREAM_FAILED', { status: 0 }));
    expect(entry?.level).toBe('error');
  });

  it('preserves the correlation id that ties client to server', () => {
    const entry = logApiError(
      createApiError('INTERNAL_ERROR', { status: 500, correlationId: 'req_abc123' })
    );
    expect(entry?.correlationId).toBe('req_abc123');
    expect(entry?.code).toBe('INTERNAL_ERROR');
    expect(entry?.status).toBe(500);
  });

  it('still records something when handed a non-ApiError', () => {
    const entry = logApiError(new Error('thrown from an interceptor'));
    /* Silently returning null here would create a class of failure with no
       trace at all — the worst possible outcome for a log sink. */
    expect(entry?.source).toBe('api');
    expect(entry?.level).toBe('error');
  });

  it('attaches caller context for the Inspector', () => {
    const entry = logApiError(createApiError('INTERNAL_ERROR', { status: 500 }), {
      method: 'POST',
      url: '/api/v1/production/batches',
    });
    expect(entry?.context).toEqual({ method: 'POST', url: '/api/v1/production/batches' });
  });
});

describe('subscribeToLogs', () => {
  it('notifies on write and on clear, and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToLogs(listener);

    logEvent('info', 'one');
    expect(listener).toHaveBeenCalledTimes(1);

    clearLogs();
    /* Clear must notify too, or the Inspector keeps rendering entries the user
       just deleted. */
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    logEvent('info', 'two');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('the dev console mirror', () => {
  it('routes each level to the matching console method', () => {
    logEvent('error', 'a failure');
    logEvent('warn', 'a refusal');
    logEvent('info', 'an event');

    /* §8.5 rule 2: the console is a *mirror*, never the only signal. It exists
       so a developer sees the failure in the same place they see everything
       else, and the level must match or the browser filter lies. */
    expect(console.error).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
  });
});

describe('degradation — a logger must never be the second failure', () => {
  /* jsdom 30 exposes storage through a proxy, so neither `Storage.prototype`
     nor the instance is spy-able. Replacing the global is the only way to
     simulate a hostile storage backend; `unstubGlobals` in the vitest config
     puts the real one back. */
  function stubHostileStorage(): {
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
  } {
    const setItem = vi.fn(() => {
      throw new DOMException('QuotaExceededError');
    });
    const removeItem = vi.fn(() => {
      throw new DOMException('SecurityError');
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem,
      removeItem,
      clear: vi.fn(),
      key: vi.fn(() => null),
      length: 0,
    });
    return { setItem, removeItem };
  }

  it('records normally when localStorage throws on write', () => {
    const { setItem } = stubHostileStorage();

    /* Over quota is a routine state on a shared factory terminal. If the write
       path propagated, every subsequent log call would throw from inside a
       catch block. */
    expect(() => logEvent('error', 'over quota')).not.toThrow();
    expect(setItem).toHaveBeenCalled();
    expect(getLogs()).toHaveLength(1);
  });

  it('clears in memory even when localStorage removal throws', () => {
    logEvent('info', 'present');
    const { removeItem } = stubHostileStorage();

    expect(() => clearLogs()).not.toThrow();
    expect(removeItem).toHaveBeenCalled();
    /* The user asked for the log to be cleared. A storage error must not leave
       stale entries on screen. */
    expect(getLogs()).toHaveLength(0);
  });
});
