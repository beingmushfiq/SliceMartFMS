// ═══════════════════════════════════════════════════════════════════════════
// STATE VIEW                                        UI_SYSTEM.md §8.1 · §8.2
// ───────────────────────────────────────────────────────────────────────────
// The canonical renderer for §8.1 rows 3, 4, 9, 11, 12, 13, 14. A single
// registry keyed by `ErrorCode` resolves the correct icon, heading, body
// copy, and action set — adding a new error code to the API means adding a
// row here (API_CONTRACT.md §18).
//
// StateView is a *patterns/* component (§10.1): composed but generic, never
// fetches, never imports from features/. It wraps the `EmptyState` and
// `Alert` primitives from `ui/Feedback.tsx`.
//
// Design rules:
//   · Copy says what happened, what it means, what to do (§8.3).
//   · Never blame the user, never expose internals (§8.5 rules 3, 6).
//   · Rows 11 (FORBIDDEN) and 12 (OUT_OF_SCOPE) are deliberately distinct:
//     11 is a dead end, 12 is fixable by switching scope (ADR-008).
//   · Rows 3 vs 4: only the caller knows whether a filter is active, so
//     the distinction is driven by the `kind` prop, not by inference.
//   · Row 15 (timeout) must include the critical sentence about data safety.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  PackageX,
  SearchX,
  ServerCrash,
  ShieldX,
  FileQuestionMark,
  Clock,
  WifiOff,
  Ban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ErrorCode } from '../../lib/api/errors';
import { EmptyState } from '../ui/Feedback';
import { Button } from '../ui/Button';

/* ── Icon sizes ─────────────────────────────────────────────────────────── */

const ICON_SM = 'size-10 shrink-0';
const ICON_LG = 'size-12 shrink-0';

/* ── State descriptor ───────────────────────────────────────────────────── */

interface StateDescriptor {
  icon: LucideIcon;
  iconTone: string;
  iconSize: typeof ICON_SM | typeof ICON_LG;
  title: string;
  description: string;
}

/* ───────────────────────────────────────────────────────────────────────────
   THE REGISTRY                                                §8.1 rows
   ───────────────────────────────────────────────────────────────────────────
   Each row in this map corresponds to a §8.1 state. A code absent from the
   map is not a styling bug — it is an unmodelled domain state, and the
   `fallbackDescriptor` surfaces it as such.
   ─────────────────────────────────────────────────────────────────────────── */

type EmptyKind = 'empty' | 'filtered';

const STATE_REGISTRY: Partial<Record<EmptyKind | ErrorCode, StateDescriptor>> = {
  // ── rows 3 + 4 · empty (not ApiError codes — typed separately) ──────────
  empty: {
    icon: PackageX,
    iconTone: 'text-muted',
    iconSize: ICON_LG,
    title: 'Nothing here yet',
    description: 'There are no records to display. Create your first entry to get started.',
  },
  filtered: {
    icon: SearchX,
    iconTone: 'text-muted',
    iconSize: ICON_SM,
    title: 'No results match your filters',
    description: 'Try adjusting your search or clearing the active filters.',
  },

  // ── row 9 · API / network failure ───────────────────────────────────────
  UPSTREAM_FAILED: {
    icon: ServerCrash,
    iconTone: 'text-danger',
    iconSize: ICON_SM,
    title: 'Connection failed',
    description:
      'We couldn\u2019t reach the server. Your data is safe. If this keeps happening, try again in a moment.',
  },
  SERVICE_UNAVAILABLE: {
    icon: ServerCrash,
    iconTone: 'text-danger',
    iconSize: ICON_SM,
    title: 'Service temporarily unavailable',
    description: 'The system is undergoing maintenance. Your data is safe. Try again shortly.',
  },
  NETWORK_OFFLINE: {
    icon: WifiOff,
    iconTone: 'text-warning',
    iconSize: ICON_SM,
    title: 'You\u2019re offline',
    description:
      'Your device isn\u2019t connected to the network. Cached data may be shown. Changes will sync when you\u2019re back online.',
  },

  // ── row 11 · forbidden (403) ────────────────────────────────────────────
  FORBIDDEN: {
    icon: ShieldX,
    iconTone: 'text-danger',
    iconSize: ICON_SM,
    title: 'You don\u2019t have permission',
    description:
      'Your account doesn\u2019t have access to this area. If this seems wrong, contact your administrator.',
  },
  PLATFORM_ONLY: {
    icon: ShieldX,
    iconTone: 'text-danger',
    iconSize: ICON_SM,
    title: 'Platform administrators only',
    description: 'This area is restricted to platform-level accounts.',
  },

  // ── row 12 · out of scope (403) ─────────────────────────────────────────
  OUT_OF_SCOPE: {
    icon: Ban,
    iconTone: 'text-warning',
    iconSize: ICON_SM,
    title: 'Wrong scope',
    description:
      'This record belongs to a different branch or warehouse. Switch to the correct scope to access it.',
  },
  TENANT_MISMATCH: {
    icon: Ban,
    iconTone: 'text-warning',
    iconSize: ICON_SM,
    title: 'Wrong tenant',
    description:
      'This record belongs to a different organisation. Switch to the correct tenant to access it.',
  },

  // ── row 13 · not found (404) ────────────────────────────────────────────
  NOT_FOUND: {
    icon: FileQuestionMark,
    iconTone: 'text-muted',
    iconSize: ICON_SM,
    title: 'Not found',
    description:
      'This record may have been deleted or moved. If it was recently created, try refreshing.',
  },
  RESOURCE_GONE: {
    icon: FileQuestionMark,
    iconTone: 'text-muted',
    iconSize: ICON_SM,
    title: 'This record has been removed',
    description: 'It was permanently deleted and no longer exists.',
  },
  ROUTE_NOT_FOUND: {
    icon: FileQuestionMark,
    iconTone: 'text-muted',
    iconSize: ICON_SM,
    title: 'Page not found',
    description:
      'The page you\u2019re looking for doesn\u2019t exist. Check the URL or go back to the dashboard.',
  },

  // ── row 14 · server error (500) ─────────────────────────────────────────
  INTERNAL_ERROR: {
    icon: ServerCrash,
    iconTone: 'text-danger',
    iconSize: ICON_SM,
    title: 'Something went wrong',
    description:
      'We couldn\u2019t complete this request. Nothing was saved. Try again, and if it persists, share the reference with support.',
  },
  UPSTREAM_TIMEOUT: {
    icon: Clock,
    iconTone: 'text-danger',
    iconSize: ICON_SM,
    title: 'The server took too long',
    description: 'This request timed out. Your data may have been saved — check before retrying.',
  },

  // ── row 15 · timeout (client) ───────────────────────────────────────────
  REQUEST_TIMEOUT: {
    icon: Clock,
    iconTone: 'text-warning',
    iconSize: ICON_SM,
    title: 'This took too long',
    description: 'The request timed out. Your data may have been saved — check before retrying.',
  },
};

const fallbackDescriptor: StateDescriptor = {
  icon: ServerCrash,
  iconTone: 'text-muted',
  iconSize: ICON_SM,
  title: 'Something went wrong',
  description:
    'An unexpected issue occurred. Try again, and if it persists, share the reference with support.',
};

function resolveState(code: ErrorCode | EmptyKind): StateDescriptor {
  return STATE_REGISTRY[code] ?? fallbackDescriptor;
}

/* ───────────────────────────────────────────────────────────────────────────
   PROPS
   ─────────────────────────────────────────────────────────────────────────── */

interface StateViewProps {
  /** ApiError code, or 'empty' / 'filtered' for the two empty variants. */
  code: ErrorCode | EmptyKind;
  /** Override the default title. */
  title?: string | undefined;
  /** Override the default description. */
  description?: string | undefined;
  /** Primary action. */
  action?: { label: string; onClick: () => void } | undefined;
  /** Secondary action — "Clear filters", "Go back", etc. */
  secondaryAction?: { label: string; onClick: () => void } | undefined;
  /** Correlation id, shown to the user for support reference (§8.3). */
  correlationId?: string | undefined;
  /** Dev-only stack trace, rendered behind a collapsed <details> (§8.4). */
  stack?: string | undefined;
  className?: string | undefined;
}

/* ───────────────────────────────────────────────────────────────────────────
   STATE VIEW — the canonical renderer
   ───────────────────────────────────────────────────────────────────────────
   For rows 3 + 4 it renders the `EmptyState` primitive (full illustration).
   For rows 9 + 11 + 12 + 13 + 14 + 15 it renders a compact error panel that
   is visually distinct from the empty state — an error is not an absence.

   The stack trace is gated on `import.meta.env.DEV` (§8.4) and collapsed by
   default. A production build never renders it regardless of the prop.

   No `data-testid` here — this is a composed pattern, not a leaf primitive,
   and the heading is always semantically queryable (§10.3 rule 8).
   ─────────────────────────────────────────────────────────────────────────── */

export function StateView({
  code,
  title: titleOverride,
  description: descriptionOverride,
  action,
  secondaryAction,
  correlationId,
  stack,
  className,
}: StateViewProps) {
  const state = resolveState(code);

  const icon = React.createElement(state.icon, {
    className: cn(state.iconSize, state.iconTone),
    'aria-hidden': true,
  });

  /* Rows 3 + 4 (empty surface): delegate to the EmptyState primitive, which
     provides the full illustration treatment. Rows 9 + 11–15 (error panel):
     render the more compact error layout with correlation reference and
     optional dev-only stack trace. */
  const isRow3or4 = code === 'empty' || code === 'filtered';

  return (
    <div className={cn('flex flex-col items-center', isRow3or4 ? undefined : 'gap-4', className)}>
      {isRow3or4 ? (
        <EmptyState
          icon={icon}
          title={titleOverride ?? state.title}
          description={descriptionOverride ?? state.description}
          {...(action != null && { action })}
          {...(secondaryAction != null && { secondaryAction })}
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-md font-semibold text-default">{titleOverride ?? state.title}</h3>
          </div>
          <p className="text-sm text-muted text-center max-w-prose leading-relaxed">
            {descriptionOverride ?? state.description}
          </p>
          {correlationId && (
            <p className="text-xs text-subtle">
              Reference: <span className="font-mono tabular-nums">{correlationId}</span>
            </p>
          )}
          {(action || secondaryAction) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              {action && (
                <Button variant="secondary" size="sm" onClick={action.onClick}>
                  {action.label}
                </Button>
              )}
              {secondaryAction && (
                <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
          {/* §8.4: stack traces never rendered in production. Dev-only, behind
              a collapsed <details>. The raw Error.stack is developer text and is
              deliberately NOT shown to users. */}
          {import.meta.env.DEV && stack && (
            <details className="w-full max-w-lg mt-2 group">
              <summary className="text-xs text-subtle cursor-pointer select-none hover:text-muted transition-token-colors">
                Stack trace (dev only)
              </summary>
              <pre className="mt-2 text-xs text-muted bg-surface-sunken rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {stack}
              </pre>
            </details>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   CONVENIENCE COMPONENTS — for the common composition patterns
   ───────────────────────────────────────────────────────────────────────────
   `EmptyDataState`  → row 3 (no data, create first entry)
   `EmptyFilterState` → row 4 (filtered to zero, clear filters)
   These are thin wrappers that callers use instead of remembering `code`.
   ─────────────────────────────────────────────────────────────────────────── */

export function EmptyDataState({
  title,
  description,
  action,
  className,
}: {
  title?: string | undefined;
  description?: string | undefined;
  action?: { label: string; onClick: () => void } | undefined;
  className?: string | undefined;
}) {
  return (
    <StateView
      code="empty"
      {...(title != null && { title })}
      {...(description != null && { description })}
      {...(action != null && { action })}
      {...(className != null && { className })}
    />
  );
}

export function EmptyFilterState({
  title,
  description,
  onClearFilters,
  action,
  className,
}: {
  title?: string | undefined;
  description?: string | undefined;
  onClearFilters?: (() => void) | undefined;
  action?: { label: string; onClick: () => void } | undefined;
  className?: string | undefined;
}) {
  return (
    <StateView
      code="filtered"
      {...(title != null && { title })}
      {...(description != null && { description })}
      {...(action != null && { action })}
      {...(onClearFilters != null && {
        secondaryAction: { label: 'Clear filters', onClick: onClearFilters },
      })}
      {...(className != null && { className })}
    />
  );
}
