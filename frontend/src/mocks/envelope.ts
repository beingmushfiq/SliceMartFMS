// ═══════════════════════════════════════════════════════════════════════════
// MOCK ENVELOPE BUILDERS                       API_CONTRACT.md §2, §3, §4, §7
// ───────────────────────────────────────────────────────────────────────────
// §2 says there are exactly three response shapes and "there is no fourth
// shape". A mock that invents a fourth one is worse than no mock at all: the
// UI gets written against a contract the server does not honour, and the bug
// only appears when the real backend is wired in.
//
// So handlers never call `HttpResponse.json` directly. They call these four
// builders, which are the only place the byte layout of an envelope is
// written down on the client side. Two consequences are load-bearing:
//
//   · `code` is typed `ErrorCode` (the closed union in `lib/api/errors.ts`),
//     so a mock that emits a code the UI has no designed state for is a
//     compile error rather than a blank panel in a demo.
//   · `details` and `fields` are always *present* and explicitly `null` when
//     they do not apply, matching `ErrorResponse::make()` on the backend.
//     `lib/api/client.ts` tolerates their absence; a fixture that relies on
//     that tolerance would hide a real contract drift.
//
// `X-Correlation-Id` is set on every response because §7 makes it the one id
// that ties a user-visible Reference to a server log line, and `client.ts`
// reads the *header* (not the body) to decide which id won.
// ═══════════════════════════════════════════════════════════════════════════

import { HttpResponse } from 'msw';

import type { ErrorCode } from '../lib/api/errors';

/** §7 — the header the correlation middleware adopts, echoes and logs. */
const CORRELATION_HEADER = 'X-Correlation-Id';

/* The backend's CorrelationId middleware keeps an inbound id only when it is a
   valid uuid and otherwise generates its own. `client.ts` falls back to a
   non-uuid id on insecure origins, so this branch is real, not theoretical. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function newUuid(): string {
  const bytes = new Uint8Array(16);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  /* Version 4, variant 10xx — so the id survives the uuid check above and a
     fixture recorded from the mock is indistinguishable from a real one. */
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/**
 * The correlation id this response must carry, resolved the way the server
 * resolves it: adopt the caller's, or mint one if the caller sent nothing
 * usable. Handlers pass the result into `ok`/`err` so body and header agree.
 */
export function correlationIdOf(request: Request): string {
  const inbound = request.headers.get(CORRELATION_HEADER);
  return inbound !== null && UUID_PATTERN.test(inbound) ? inbound : newUuid();
}

/* ───────────────────────────────────────────────────────────────────────────
   Meta

   Mirrors `ResponseMeta` in `lib/api/client.ts` rather than importing it: the
   client type is deliberately permissive (every field optional, because a
   real server may omit any of them), and a mock should be *stricter* than the
   consumer it feeds. `correlation_id` is required here for that reason.
   ─────────────────────────────────────────────────────────────────────────── */

export interface MockPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface MockMeta {
  correlation_id: string;
  /** §8.5 — a change makes the client refetch `/auth/me`, never log out. */
  perm_version?: string | undefined;
  warnings?: string[] | undefined;
}

export interface MockCollectionMeta extends MockMeta {
  pagination: MockPagination;
  /** §2.2 — echoes exactly what the server understood, never what was sent. */
  applied?:
    | {
        filters?: Record<string, unknown> | undefined;
        sort?: string | undefined;
        search?: string | undefined;
      }
    | undefined;
}

/* `Record<string, unknown>` rather than a generic `T`: every auth payload is a
   JSON object, and constraining to objects here means a handler cannot
   accidentally return a bare array as `data` — which §2 forbids at the top
   level and which `okCollection` exists to express properly. */
type Payload = Record<string, unknown>;

function headersFor(correlationId: string): Record<string, string> {
  return { [CORRELATION_HEADER]: correlationId };
}

/* ───────────────────────────────────────────────────────────────────────────
   §2.1 · single resource
   ─────────────────────────────────────────────────────────────────────────── */

export function ok(data: Payload, meta?: MockMeta, status = 200): Response {
  const resolved: MockMeta = meta ?? { correlation_id: newUuid() };
  return HttpResponse.json(
    { success: true, data, meta: stripUndefined(resolved) },
    { status, headers: headersFor(resolved.correlation_id) }
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   §2.2 · collection

   `meta` is required, and `pagination` inside it is required, because §2.2
   makes both mandatory for a list. Auth has no list endpoint today; this
   exists so the first module that does cannot invent its own shape.
   ─────────────────────────────────────────────────────────────────────────── */

export function okCollection(items: readonly Payload[], meta: MockCollectionMeta): Response {
  return HttpResponse.json(
    { success: true, data: [...items], meta: stripUndefined(meta) },
    { status: 200, headers: headersFor(meta.correlation_id) }
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   §2.3 · error

   `retryable` is the server's word (`errors.ts` rule 2) and defaults to the
   §3 tables: false for every refusal, true only for transport-shaped
   failures. Nothing here guesses it per call site.
   ─────────────────────────────────────────────────────────────────────────── */

export interface ErrOptions {
  /** §7 — omit only when the handler genuinely has no inbound request. */
  correlationId?: string | undefined;
  retryable?: boolean | undefined;
  /** §4 — `VALIDATION_FAILED` only. Prefer `validationErr`. */
  fields?: Record<string, string[]> | undefined;
}

export function err(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown> | null,
  options?: ErrOptions
): Response {
  const correlationId = options?.correlationId ?? newUuid();

  return HttpResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: details ?? null,
        fields: options?.fields ?? null,
        retryable: options?.retryable ?? (status >= 500 || status === 429),
        correlation_id: correlationId,
      },
    },
    { status, headers: headersFor(correlationId) }
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   §4 · validation

   One entry point, because §4 has three rules a hand-rolled 422 keeps
   breaking: the code is always `VALIDATION_FAILED`, every value is an
   *array* even for a single message, and the message is the generic
   "correct the highlighted fields" — the per-field copy lives in `fields`
   where React Hook Form can reach it.
   ─────────────────────────────────────────────────────────────────────────── */

export function validationErr(fields: Record<string, string[]>, correlationId?: string): Response {
  return err(422, 'VALIDATION_FAILED', 'Please correct the highlighted fields.', null, {
    correlationId,
    retryable: false,
    fields,
  });
}

/* `exactOptionalPropertyTypes` lets a caller pass `perm_version: undefined`,
   which would serialise as an absent key anyway — but `JSON.stringify` drops
   it silently and a test asserting on `Object.keys(meta)` would then depend on
   which call site built the meta. Dropping it here makes that deterministic. */
function stripUndefined(value: object): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) result[key] = entry;
  }
  return result;
}
