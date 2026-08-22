// ═══════════════════════════════════════════════════════════════════════════
// LOGGER — the single client-side log sink            UI_SYSTEM.md §8.4 · §8.5
// ───────────────────────────────────────────────────────────────────────────
// §8.4: "Every boundary logs (correlation id, route, user id, tenant id,
// component stack) before rendering its fallback."
// §8.5 rule 2: a `console.log` with no UI change is *hiding* an error. So this
// file does not replace UI feedback — it exists so the UI can stay safe and
// generic while the diagnostic detail is still recoverable.
//
// Design decisions, all load-bearing:
//
//   · A ring buffer in memory + localStorage mirror. Memory so the Log
//     Inspector is instant and works in private-browsing mode; localStorage so
//     a crash that reloads the page does not erase the evidence.
//   · CAPACITY is a hard cap. An error inside a render loop can fire hundreds
//     of times a second; an unbounded array becomes the second bug.
//   · Context (user/tenant/route) is *pushed in* by the app, never imported
//     from an auth store. That keeps this file dependency-free, so the boot
//     path and the error boundary can both use it without a provider.
//   · Nothing here is a network call. Remote shipping belongs to Phase 10
//     observability; a logger that fails to send must never itself throw.
// ═══════════════════════════════════════════════════════════════════════════

import { isApiError, type ErrorCode } from '../api/errors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Where the entry came from. Coarse on purpose — a free-text source becomes
 *  unfilterable within a month. */
export type LogSource = 'boundary' | 'api' | 'app' | 'boot';

/* Every optional field is spelled `?: T | undefined` rather than `?: T`. The
   project runs `exactOptionalPropertyTypes`, and a log entry is a data bag that
   is JSON-serialised: `stack: undefined` and an absent `stack` are the same
   thing to the Inspector, so demanding conditional spreads at eight call sites
   would buy no safety and lose readability. */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  /** Safe, short summary. Never the raw server message for a 5xx. */
  message: string;
  /** Present when the entry describes a refused request. */
  code?: ErrorCode | undefined;
  status?: number | undefined;
  /** The support reference the user is shown; ties client log to server log. */
  correlationId?: string | undefined;
  route?: string | undefined;
  userId?: string | undefined;
  tenantId?: string | undefined;
  /** Diagnostics. Rendered only in development (§8.4). */
  stack?: string | undefined;
  componentStack?: string | undefined;
  /** Which of the four §8.4 levels caught it. */
  boundaryLevel?: string | undefined;
  /** Structured extras. Values are shallow-serialised and size-capped. */
  context?: Record<string, unknown> | undefined;
}

const STORAGE_KEY = 'sm.diagnostics.log';
const CAPACITY = 50;

/** Cheap unique id. Not a uuid: this is a log line, not a database key, and
 *  `crypto.randomUUID` is unavailable on insecure origins (factory LAN). */
function makeId(): string {
  return `LOG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

export const isDev = import.meta.env.DEV;

/* ───────────────────────────────────────────────────────────────────────────
   Ambient context

   Set once at sign-in and on every route change. Held in a module variable
   rather than a store because the logger must work *before* React mounts and
   *after* it has crashed — the two moments a store is least trustworthy.
   ─────────────────────────────────────────────────────────────────────────── */

interface LogContext {
  route?: string | undefined;
  userId?: string | undefined;
  tenantId?: string | undefined;
}

let ambient: LogContext = {};

export function setLogContext(next: Partial<LogContext>): void {
  ambient = { ...ambient, ...next };
}

export function clearLogContext(): void {
  ambient = {};
}

/* ───────────────────────────────────────────────────────────────────────────
   Buffer
   ─────────────────────────────────────────────────────────────────────────── */

let buffer: LogEntry[] = readPersisted();

type Listener = (entries: readonly LogEntry[]) => void;
const listeners = new Set<Listener>();

function readPersisted(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    /* Storage is shared with other tabs, other app versions and the user's dev
       tools. Anything that is not an array is discarded rather than trusted. */
    return Array.isArray(parsed) ? (parsed as LogEntry[]).slice(0, CAPACITY) : [];
  } catch {
    /* Quota errors, disabled storage, malformed JSON. A logger that throws
       while recording a crash turns one failure into two. */
    return [];
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    /* Over quota or storage disabled. The in-memory buffer still works, so the
       Log Inspector still has data for this session. Degrade, never fail. */
  }
}

function emit(): void {
  for (const listener of listeners) listener(buffer);
}

/** Subscribe to buffer changes. Shaped for `useSyncExternalStore`. */
export function subscribeToLogs(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current entries, newest first. Stable reference between mutations, so it is
 *  safe as a `useSyncExternalStore` snapshot. */
export function getLogs(): readonly LogEntry[] {
  return buffer;
}

export function clearLogs(): void {
  buffer = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing to do — the in-memory clear already happened, which is what the
       user asked for. */
  }
  emit();
}

/* ───────────────────────────────────────────────────────────────────────────
   Recording
   ─────────────────────────────────────────────────────────────────────────── */

type LogInput = Omit<LogEntry, 'id' | 'timestamp' | 'route' | 'userId' | 'tenantId'> &
  Partial<Pick<LogEntry, 'route' | 'userId' | 'tenantId'>>;

function record(input: LogInput): LogEntry {
  const entry: LogEntry = {
    id: makeId(),
    timestamp: new Date().toISOString(),
    route: ambient.route,
    userId: ambient.userId,
    tenantId: ambient.tenantId,
    ...input,
  };

  buffer = [entry, ...buffer].slice(0, CAPACITY);
  persist();
  emit();

  /* The console mirror is development-only. In production it is noise that also
     leaks internals into any screen-recording or support session. */
  if (isDev) {
    const tag = `[${entry.source}${entry.boundaryLevel ? `:${entry.boundaryLevel}` : ''}]`;
    const args: unknown[] = [tag, entry.message, entry];
    if (entry.level === 'error') console.error(...args);
    else if (entry.level === 'warn') console.warn(...args);
    else console.info(...args);
  }

  return entry;
}

/**
 * Log a render-time crash caught by a boundary.
 *
 * Returns the entry so the fallback can display `entry.id` as the reference the
 * user reads out to support — §8.3 requires a specific reference, and an id the
 * user can see but nobody can look up is worse than none.
 */
export function logBoundaryError(
  error: Error,
  options: {
    level: string;
    componentStack?: string | undefined;
    correlationId?: string | undefined;
  }
): LogEntry {
  return record({
    level: 'error',
    source: 'boundary',
    /* `error.message` is developer text. It is kept in the log (which is
       gated) but the fallback UI renders its own safe copy (§8.5 rule 3). */
    message: error.message || 'Unhandled render exception',
    stack: error.stack,
    componentStack: options.componentStack,
    boundaryLevel: options.level,
    correlationId: options.correlationId,
  });
}

/**
 * Log a refused or failed request.
 *
 * Cancellations are dropped: they are the AbortSignal contract working as
 * designed, and recording them would bury real failures under route changes.
 */
export function logApiError(
  error: unknown,
  context?: Record<string, unknown> | undefined
): LogEntry | null {
  if (!isApiError(error)) {
    return record({ level: 'error', source: 'api', message: 'Unrecognised failure', context });
  }
  if (error.code === 'REQUEST_CANCELLED') return null;

  /* A 4xx is the system working — a refusal the user can act on. Only a 5xx or
     a transport failure is an `error` level event worth escalating. */
  const level: LogLevel = error.status >= 500 || error.status === 0 ? 'error' : 'warn';

  return record({
    level,
    source: 'api',
    message: error.message,
    code: error.code,
    status: error.status,
    correlationId: error.correlationId,
    context,
  });
}

/** General-purpose application event. */
export function logEvent(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown> | undefined
): LogEntry {
  return record({ level, source: 'app', message, context });
}

/* ───────────────────────────────────────────────────────────────────────────
   Global handlers

   Two failure classes never reach a React boundary: a rejected promise nobody
   awaited, and an error thrown outside the React call stack (an event handler,
   a timer, a service-worker message). Without these, §8.5 rule 2 is violated by
   the platform itself — the failure is real and nothing records it.

   These do not render UI. They make the failure recoverable in the Log
   Inspector; the surface that owns the interaction still owns its own state.
   ─────────────────────────────────────────────────────────────────────────── */

let installed = false;

export function installGlobalErrorHandlers(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;

    /* An aborted fetch surfaces here on unmount during navigation. Silent. */
    if (isApiError(reason) && reason.code === 'REQUEST_CANCELLED') return;
    if (reason instanceof DOMException && reason.name === 'AbortError') return;

    record({
      level: 'error',
      source: 'app',
      message:
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Unhandled promise rejection',
      stack: reason instanceof Error ? reason.stack : undefined,
      context: { kind: 'unhandledrejection' },
    });
  });

  window.addEventListener('error', (event) => {
    /* Resource load failures (a broken <img>, a failed chunk) fire `error` on
       the element and bubble here with no `error` object. They are not app
       exceptions and get their own quieter level. */
    if (!event.error) {
      record({
        level: 'warn',
        source: 'app',
        message: `Failed to load resource: ${event.filename || 'unknown'}`,
        context: { kind: 'resource' },
      });
      return;
    }

    record({
      level: 'error',
      source: 'app',
      message: event.error instanceof Error ? event.error.message : String(event.message),
      stack: event.error instanceof Error ? event.error.stack : undefined,
      context: { kind: 'window.error' },
    });
  });
}
