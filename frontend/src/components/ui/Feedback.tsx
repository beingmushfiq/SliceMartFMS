// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK — loading, empty and inline-message primitives  UI_SYSTEM.md §10.2
// ───────────────────────────────────────────────────────────────────────────
// Owns the §7.5 loading tiers 2 and 3 plus the row-3/row-4 empty surface:
//
//   Tier 2  Skeleton*        structural placeholder, gated by `useDelayedFlag`
//   Tier 3  Spinner          inline, replaces an icon, never covers content
//           ProgressBar      real percentages only
//           RefetchBar       the 2px top rail for a background refetch (row 20)
//           EmptyState       rows 3 and 4, driven by `patterns/StateView`
//           Alert            inline message, rows 5–8
//
// Tier 1 (the boot loader) is deliberately NOT here — it lives in index.html
// and `app/boot.ts` because it must paint before this bundle exists.
//
// A FULL-SCREEN SPINNER IS BANNED outside boot (§7.5). Nothing in this file
// can produce one: `Spinner` has no layout of its own and the skeletons are
// shaped like the content they stand in for.
//
// All variant maps are static objects — Tailwind v4's compiler never sees
// template literals, so `alert-${variant}` or `h-${height}` would silently
// produce no CSS (§9.2 defect 3).  The Alert variant set is
// info · success · warning · danger (no `error` — Button's closed set is
// primary · secondary · ghost · danger · link, §10.2).
//
// lucide-react v1.31+ renamed: AlertTriangle → TriangleAlert,
// CheckCircle → CircleCheckBig, XCircle → CircleX.
//
// Pagination lives in Navigation.tsx (§10.2 Navigation group).
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Info, CircleCheckBig, TriangleAlert, CircleX, X, LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

/* ═══════════════════════════════════════════════════════════════════════════
   THE 120ms DELAY GATE                                              §7.5
   ───────────────────────────────────────────────────────────────────────────
   §7.5 Tier 2: a skeleton appears only after 120ms. Below that threshold the
   response already feels instant, and a placeholder that paints and vanishes
   inside two frames reads as a glitch — it makes a fast app look broken.

   Implemented as a hook rather than a CSS `animation-delay` because the
   requirement is not "fade in later", it is "do not mount at all". A delayed
   fade still reserves layout, still runs an animation, and still flashes when
   the response wins the race.

   Returns `active && visible` rather than `visible` alone so the frame between
   `active` flipping false and the cleanup running cannot show a stale `true`.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SKELETON_DELAY_MS = 120;

export function useDelayedFlag(active: boolean, delayMs: number = SKELETON_DELAY_MS): boolean {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    /* The reset lives in cleanup, not in the effect body. Resetting in the body
       is a synchronous setState during an effect, which cascades an extra
       render on every deactivation; cleanup runs at exactly the same moment
       without that cost. It is still required — without it a second activation
       would inherit `visible: true` and paint the skeleton instantly, skipping
       the 120ms gate this hook exists to enforce. */
    return () => {
      window.clearTimeout(timer);
      setVisible(false);
    };
  }, [active, delayMs]);

  return active && visible;
}

/** Declarative wrapper around the gate, for the common `{loading && <Skeleton/>}`
 *  case. Renders nothing until the threshold passes. */
export function Delayed({
  when,
  delayMs,
  children,
}: {
  when: boolean;
  delayMs?: number;
  children: React.ReactNode;
}) {
  return useDelayedFlag(when, delayMs) ? <>{children}</> : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPINNER — §7.5 Tier 3                                              §10.2
   ───────────────────────────────────────────────────────────────────────────
   The smallest loading affordance: it replaces an icon in place and occupies
   exactly the icon's box, so nothing reflows when it appears. It is never a
   page-level surface — that is what the skeletons are for.

   `label` is optional because the overwhelmingly common case is a spinner
   inside a control that already announces itself (`aria-busy` on a Button,
   `aria-live` on a panel). A second announcement from the glyph would be
   duplicate noise, so with no label the element is hidden from the
   accessibility tree outright rather than exposed as an unnamed `status`.

   `animate-spin` is Tailwind stock. Under reduced motion the global rule in
   tokens.motion.css collapses it to a single 1ms iteration, which is why the
   glyph is a partial ring: it still reads as "working" while stationary.
   ═══════════════════════════════════════════════════════════════════════════ */

const spinnerSizeMap = {
  xs: 'size-3',
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
} as const;

export function Spinner({
  size = 'md',
  label,
  className,
}: {
  size?: keyof typeof spinnerSizeMap;
  label?: string;
  className?: string;
}) {
  const glyph = (
    <LoaderCircle
      className={cn(spinnerSizeMap[size], 'shrink-0 animate-spin', className)}
      aria-hidden="true"
    />
  );

  if (label === undefined) return glyph;

  return (
    <span role="status" className="inline-flex items-center gap-2">
      {glyph}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE                                              §8.1 rows 3 + 4
   ───────────────────────────────────────────────────────────────────────────
   Two states share this surface and they are NOT interchangeable (§8.5 rule 9):

     row 3  nothing exists yet   → the action is "create the first one"
     row 4  a filter matched 0   → the action is "clear the filters", and the
                                   copy must confirm the filter is the reason,
                                   otherwise the user concludes their data is
                                   gone. Telling someone their stock list is
                                   empty when they simply have a date range
                                   applied is the same failure as fabricating
                                   data: the screen states something untrue.

   The distinction is the caller's, not this component's — only the caller knows
   whether a filter is active. `EmptyState` supplies the shape for both and a
   second action slot so "Clear filters" and "New item" can coexist.

   No `empty-state*` legacy classes — replaced entirely with token-only
   utilities from the semantic palette.
   ═══════════════════════════════════════════════════════════════════════════ */

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /** Rendered as a ghost button beside `action`. Row 4's "Clear filters". */
  secondaryAction?: EmptyStateAction;
  /** Tightens the vertical rhythm for an empty state inside a card or a table
   *  cell, where `py-12` would blow out the container. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 text-center',
        compact ? 'py-6' : 'py-12',
        className
      )}
    >
      {icon && (
        <div className="text-muted" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="max-w-prose">
        <p className="text-md font-semibold text-default">{title}</p>
        {description && <p className="text-sm text-muted mt-1 leading-relaxed">{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
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
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETONS                                                        §10.2
   ───────────────────────────────────────────────────────────────────────────
   `skeleton` is a deleted Tailwind class — the replacement is the
   `skeleton-shimmer` motion token (tokens.motion.css).  `card` is likewise
   gone; use `--card-*` component tokens directly.
   ═══════════════════════════════════════════════════════════════════════════ */

const heightMap = {
  1: 'h-1',
  2: 'h-2',
  3: 'h-3',
  4: 'h-4',
  5: 'h-5',
  6: 'h-6',
  7: 'h-7',
  8: 'h-8',
} as const;
type SkeletonHeight = keyof typeof heightMap;

export function SkeletonLine({ width, height = 4 }: { width?: string; height?: SkeletonHeight }) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-(--skeleton-radius)', heightMap[height])}
      style={{ width: width ?? '100%' }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-(--card-radius) p-(--card-padding) border border-(--card-border) bg-(--card-bg) shadow-(--card-shadow) flex flex-col gap-4"
      aria-busy="true"
      aria-label="Loading..."
    >
      <SkeletonLine width="40%" height={3} />
      <SkeletonLine width="60%" height={7} />
      <SkeletonLine width="30%" height={3} />
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine width={i === 0 ? '80%' : i === cols - 1 ? '50%' : '65%'} height={3} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </tbody>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS BAR — real values only                              §7.4 · §7.5
   ───────────────────────────────────────────────────────────────────────────
   §7.4 forbids fake progress. A bar that animates to 90% and waits is a lie
   about a measurement, and users learn within a day that it means nothing.

   So the API is a discriminated union, not a `value?: number`:

     { value, max }   determinate   → a real width and a real `aria-valuenow`
     { indeterminate: true }        → a travelling rail, no percentage at all

   An optional `value` would let a caller pass `undefined` and silently get a
   0%-wide determinate bar that never moves — the exact failure the rule exists
   to prevent. Making the two cases separate shapes means the honest option is
   the only expressible one.

   Determinate bars use `aria-valuenow`; the indeterminate rail deliberately
   omits it, because a `progressbar` with no `valuenow` is precisely how ARIA
   says "in progress, amount unknown".
   ═══════════════════════════════════════════════════════════════════════════ */

type ProgressBarProps = {
  /** Accessible name. Required — an unnamed progress bar is unusable. */
  label: string;
  /** Renders the percentage as text beside the bar. Determinate only. */
  showValue?: boolean;
  className?: string;
} & (
  | { value: number; max?: number; indeterminate?: never }
  | { indeterminate: true; value?: never; max?: never }
);

export function ProgressBar(props: ProgressBarProps) {
  const { label, showValue = false, className } = props;

  /* Clamped, because a caller computing `done / total` will eventually hand us
     101% or NaN, and a bar wider than its rail is a visual bug that outlives
     the arithmetic bug that caused it. */
  const pct =
    props.indeterminate === true
      ? null
      : Math.min(100, Math.max(0, ((props.value ?? 0) / (props.max ?? 100)) * 100));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        {...(pct !== null ? { 'aria-valuenow': Math.round(pct) } : {})}
        className="h-(--progress-height) flex-1 overflow-hidden rounded-(--progress-radius) bg-surface-sunken"
      >
        {pct === null ? (
          /* `w-1/3` + translate keeps the animation on the compositor: no width
             interpolation, so no layout on every frame. */
          <div className="h-full w-1/3 rounded-(--progress-radius) bg-primary animate-indeterminate" />
        ) : (
          <div
            className="h-full rounded-(--progress-radius) bg-primary transition-token"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {showValue && pct !== null && (
        <span className="text-xs text-muted tabular-nums">{Math.round(pct)}%</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REFETCH BAR — §8.1 row 20 (stale data)                             §7.5
   ───────────────────────────────────────────────────────────────────────────
   §7.5: "A refetch shows a 2px top progress bar, keeps the stale data visible,
   and dims to 60% only past 1s."

   The critical part is what it does NOT do: it never replaces the table with a
   skeleton. Data the user is already reading must not disappear because a
   background poll fired — that is the single most common way a well-meaning
   loading state destroys someone's place in a list.

   Absolutely positioned so it cannot contribute to layout: CLS must stay 0
   while it appears and disappears. The parent needs `relative`.
   ═══════════════════════════════════════════════════════════════════════════ */

export function RefetchBar({ active, label = 'Refreshing' }: { active: boolean; label?: string }) {
  if (!active) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden"
      role="status"
      aria-label={label}
    >
      <div className="h-full w-1/3 bg-primary animate-indeterminate" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALERT                                                            §10.2
   ───────────────────────────────────────────────────────────────────────────
   Variant set: info · success · warning · danger (no `error`).
   lucide-react v1: TriangleAlert, CircleCheckBig, CircleX, Info.
   All class strings are static — no template-literal construction.
   ═══════════════════════════════════════════════════════════════════════════ */

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantMap = {
  info: 'bg-info-subtle text-info border-info',
  success: 'bg-success-subtle text-success border-success',
  warning: 'bg-warning-subtle text-warning border-warning',
  danger: 'bg-danger-subtle text-danger border-danger',
} as const;

const iconMap: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="size-4 shrink-0 mt-0.5" />,
  success: <CircleCheckBig className="size-4 shrink-0 mt-0.5" />,
  warning: <TriangleAlert className="size-4 shrink-0 mt-0.5" />,
  danger: <CircleX className="size-4 shrink-0 mt-0.5" />,
};

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  return (
    <div
      className={cn('flex items-start gap-3 border rounded-lg p-3', variantMap[variant], className)}
      role="alert"
    >
      <span aria-hidden="true">{iconMap[variant]}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 -mr-1 -mt-1 text-muted hover:text-default transition-token-colors cursor-pointer rounded"
          aria-label="Dismiss alert"
        >
          <X className="size-4 opacity-70 hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
