// ═══════════════════════════════════════════════════════════════════════════
// QUERY BOUNDARY                                        UI_SYSTEM.md §8.2
// ───────────────────────────────────────────────────────────────────────────
// A declarative shell around TanStack Query's status/error/data shape. Screens
// compose this once and never think about the loading → error → empty → data
// lifecycle again:
//
//   <QueryBoundary status={q.status} error={q.error} data={q.data} isFetching={q.isFetching}>
//     <MyTable rows={q.data} />
//   </QueryBoundary>
//
// Loading state:
//   Tier 1 boot loader is deliberately not here (§7.5) — it lives in
//   index.html + boot.ts because it must paint before this bundle exists.
//   Tier 2 skeletons: a 120ms gate via `useDelayedFlag` prevents a flash
//   when the response is near-instant. The default placeholder is a `<div>`
//   grid; a caller whose children are table rows passes `renderSkeleton`
//   instead, because a `<tbody>` cannot live inside this component's wrapper.
//   A *refetch* is not a load: rows 2 and 20 keep the existing data on screen
//   under a 2px top rail, and dim it to 60% only past 1s.
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
import { RefetchBar } from '../ui/Feedback';
import { SkeletonLine } from '../ui/Feedback';
import { cn } from '../../lib/utils';
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
  /** Columns to render in the default skeleton grid. Falls back to 5. */
  skeletonCols?: number;
  /** Rows to render in the default skeleton grid. Falls back to 5. */
  skeletonRows?: number;
  /** Override the loading placeholder entirely. Required when the children are
   *  table rows: the default skeleton is a `<div>` grid, which is invalid
   *  inside a `<table>`, so a table caller passes `SkeletonTable` here. */
  renderSkeleton?: () => React.ReactNode;
  /** §8.1 row 4: when true and data is an empty array, show the "filtered to
   *  zero" surface instead of the "no data" surface. */
  hasActiveFilters?: boolean;
  /** §8.1 row 2 + row 20. TanStack Query `isFetching` while data is already on
   *  screen. Drives the 2px top rail; never replaces the data with a skeleton. */
  isFetching?: boolean;
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
  renderSkeleton,
  hasActiveFilters = false,
  isFetching = false,
  renderEmpty,
  renderError,
  className,
}: QueryBoundaryProps) {
  /* ── loading ─────────────────────────────────────────────────────────── */
  const showSkeleton = useDelayedFlag(status === 'pending');

  /* §7.5: a background refetch dims the stale data to 60% "only past 1s".
     The threshold is the whole point — a 200ms refetch that dims and undims
     reads as a flicker, which is worse than showing nothing at all. Below 1s
     the top rail alone carries the signal. */
  const dimStaleData = useDelayedFlag(isFetching && status === 'success', 1000);

  if (status === 'pending') {
    if (showSkeleton) {
      if (renderSkeleton) return <>{renderSkeleton()}</>;

      /* A `<div>` grid rather than `SkeletonTable`. `SkeletonTable` renders a
         `<tbody>`, and wrapping that in this component's own `<div>` produces
         markup the browser reparents — the skeleton would land outside the
         table and CLS would not be 0 (§7.5 Tier 2). A table caller therefore
         passes `renderSkeleton={() => <SkeletonTable … />}` and drops it in
         the correct place itself. */
      return (
        <div className={cn('flex flex-col gap-3', className)} aria-busy="true">
          {Array.from({ length: skeletonRows }).map((_, row) => (
            <div key={row} className="flex items-center gap-4">
              {Array.from({ length: skeletonCols }).map((_, col) => (
                <div key={col} className="flex-1">
                  <SkeletonLine
                    width={col === 0 ? '80%' : col === skeletonCols - 1 ? '50%' : '65%'}
                    height={3}
                  />
                </div>
              ))}
            </div>
          ))}
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
      : {
          __brand: 'ApiError' as const,
          code: 'INTERNAL_ERROR' as ErrorCode,
          status: 500,
          message: 'Something went wrong.',
          retryable: true,
        };

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
  const isEmpty = Array.isArray(data) && data.length === 0;

  /* Rows 2 + 20 wrapper. Applied to the empty surfaces as well as to the data
     surface: a refetch over an empty list is exactly the moment a user is
     waiting to see a row appear, so the rail must be visible there too.

     `relative` is required — RefetchBar is absolutely positioned so it cannot
     contribute to layout and CLS stays 0. */
  const withRefetchRail = (content: React.ReactNode) => (
    <div className={cn('relative', className)}>
      <RefetchBar active={isFetching} />
      {/* Opacity only, and only past 1s. Never `display` or `visibility` — the
          stale rows must stay readable and selectable while they refresh. */}
      <div className={cn(dimStaleData && 'opacity-60 transition-opacity')}>{content}</div>
    </div>
  );

  if (isEmpty) {
    if (renderEmpty) return withRefetchRail(renderEmpty());

    return withRefetchRail(hasActiveFilters ? <EmptyFilterState /> : <StateView code="empty" />);
  }

  /* ── data ────────────────────────────────────────────────────────────── */
  return withRefetchRail(children);
}
