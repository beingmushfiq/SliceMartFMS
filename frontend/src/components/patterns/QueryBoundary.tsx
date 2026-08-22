// ═══════════════════════════════════════════════════════════════════════════
// QUERY BOUNDARY                                        UI_SYSTEM.md §8.2
// ───────────────────────────────────────────────────────────────────────────
// A declarative shell around TanStack Query's status/error/data shape. Screens
// compose this once and never think about the loading → error → empty → data
// lifecycle again:
//
//   <QueryBoundary status={q.status} error={q.error} data={q.data}>
//     <MyTable rows={q.data} />
//   </QueryBoundary>
//
// Loading state:
//   Tier 1 boot loader is deliberately not here (§7.5) — it lives in
//   index.html + boot.ts because it must paint before this bundle exists.
//   Tier 2 skeletons: a 120ms gate via `useDelayedFlag` prevents a flash
//   when the response is near-instant.
//
// Empty state:
//   §8.1 row 3 (no data) vs row 4 (filtered to zero) — only the caller
//   knows whether filters are active, so `hasActiveFilters` is the caller's
//   prop. Row 4 includes a "Clear filters" action; row 3 includes a "Create"
//   action.
//
// Error state:
//   Cancelled requests (the AbortSignal contract working as designed) are
//   silently ignored — §8.5 rule 1 forbids treating cancellation as a failure.
//   For real errors, the correlation id is surfaced as a copyable reference.
//
// Boundaries:
//   This handles *async* failures (TanStack Query error states). Render-time
//   crashes belong in ErrorBoundary (§8.4). Mixing the two produces boundaries
//   that never fire and errors nobody sees.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { isApiError, isCancelled } from '../../lib/api/errors';
import type { ErrorCode } from '../../lib/api/errors';
import type { ApiError } from '../../lib/api/errors';
import { useDelayedFlag } from '../ui/Feedback';
import { SkeletonTable } from '../ui/Feedback';
import { StateView } from './StateView';
import { EmptyFilterState } from './StateView';

/* ───────────────────────────────────────────────────────────────────────────
   PROPS
   ───────────────────────────────────────────────────────────────────────────
   QueryBoundary does NOT accept `useQueryResult` as a whole — it picks the
   three fields it needs (`status`, `error`, `data`) so a caller can derive
   them from any query hook (useQuery, useInfiniteQuery, useSuspenseQuery)
   without coupling to one type.
   ─────────────────────────────────────────────────────────────────────────── */

interface QueryBoundaryProps {
  /** TanStack Query `status` — the discriminated union that owns the lifecycle. */
  status: 'pending' | 'error' | 'success';
  /** TanStack Query `error` — the thrown value (or null). */
  error: unknown;
  /** The resolved payload. Present only when `status === 'success'`. */
  data?: unknown;
  /** The content to render when data is available. */
  children: React.ReactNode;
  /** Columns to render in the skeleton table. Falls back to 5. */
  skeletonCols?: number;
  /** Rows to render in the skeleton table. Falls back to 5. */
  skeletonRows?: number;
  /** §8.1 row 4: when true and data is an empty array, show the "filtered to
   *  zero" surface instead of the "no data" surface. */
  hasActiveFilters?: boolean;
  /** Override the default empty state entirely. Called when `data` is empty. */
  renderEmpty?: () => React.ReactNode;
  /** Override the default error state entirely. Called when `status === 'error'`. */
  renderError?: (error: ApiError) => React.ReactNode;
  className?: string;
}

/* ───────────────────────────────────────────────────────────────────────────
   QUERY BOUNDARY — the lifecycle shell
   ───────────────────────────────────────────────────────────────────────────
   The render contract:
     1. pending  → skeleton (after 120ms gate)
     2. error    → StateView (unless cancelled)
     3. success  → children (unless empty, which triggers the empty surface)
     4. refetching with stale data → RefetchBar + dimmed children

   There is NO full-screen spinner anywhere in this component. A skeleton
   that matches the final layout is the only loading affordance — §7.5
   bans full-screen spinners outside boot.
   ─────────────────────────────────────────────────────────────────────────── */

export function QueryBoundary({
  status,
  error,
  data,
  children,
  skeletonCols = 5,
  skeletonRows = 5,
  hasActiveFilters = false,
  renderEmpty,
  renderError,
  className,
}: QueryBoundaryProps) {
  /* ── loading ─────────────────────────────────────────────────────────── */
  const showSkeleton = useDelayedFlag(status === 'pending');

  if (status === 'pending') {
    if (showSkeleton) {
      return (
        <div className={className}>
          <SkeletonTable rows={skeletonRows} cols={skeletonCols} />
        </div>
      );
    }
    return null;
  }

  /* ── error ───────────────────────────────────────────────────────────── */
  if (status === 'error') {
    /* §8.5 rule 1: a cancelled request is never an error state. Every
       consumer must check this before rendering anything. */
    if (isCancelled(error)) return null;

    const apiErr = isApiError(error)
      ? error
      : { __brand: 'ApiError' as const, code: 'INTERNAL_ERROR' as ErrorCode, status: 500, message: 'Something went wrong.', retryable: true };

    if (renderError) return <>{renderError(apiErr)}</>;

    return (
      <div className={className}>
        <StateView
          code={apiErr.code}
          description={apiErr.message}
          {...(apiErr.correlationId != null && { correlationId: apiErr.correlationId })}
        />
      </div>
    );
  }

  /* ── success ─────────────────────────────────────────────────────────── */
  const isEmpty =
    Array.isArray(data) && data.length === 0;

  if (isEmpty) {
    if (renderEmpty) return <>{renderEmpty()}</>;

    if (hasActiveFilters) {
      return (
        <div className={className}>
          <EmptyFilterState />
        </div>
      );
    }

    return (
      <div className={className}>
        <StateView code="empty" />
      </div>
    );
  }

  /* ── data ────────────────────────────────────────────────────────────── */
  return <>{children}</>;
}
