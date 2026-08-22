// ═══════════════════════════════════════════════════════════════════════════
// BADGE + STATUS REGISTRY                                     UI_SYSTEM.md §10.4
// ───────────────────────────────────────────────────────────────────────────
// Domain statuses are not free text. ONE registry maps every status in the
// system to a tone, an icon and a label key, so `draft` looks identical on a
// purchase order and a production batch.
//
// Colour is ALWAYS paired with an icon and a label (§9.1, colour independence).
// There is no icon-less Badge and no `dot`-only Badge: a 6px coloured dot is
// exactly the failure mode §9.1 exists to prevent — invisible to ~8% of male
// users and to anyone printing in greyscale.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  Archive,
  CircleCheckBig,
  CirclePause,
  CircleX,
  Clock,
  FilePen,
  Loader,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/** The four status roles plus the two neutrals. Closed set (§2.3 rule 4). */
export type BadgeTone =
  | 'info-subtle'
  | 'warning-subtle'
  | 'success-subtle'
  | 'primary-subtle'
  | 'danger-subtle'
  | 'surface-sunken';

/* Static map — never a template literal. §9.2 defect 3: a class name the
   compiler cannot see is a class name that does not exist. */
const toneMap: Record<BadgeTone, string> = {
  'info-subtle': 'bg-info-subtle text-info border-info',
  'warning-subtle': 'bg-warning-subtle text-warning border-warning',
  'success-subtle': 'bg-success-subtle text-success border-success',
  'primary-subtle': 'bg-primary-subtle text-primary border-primary',
  'danger-subtle': 'bg-danger-subtle text-danger border-danger',
  'surface-sunken': 'bg-surface-sunken text-muted border-default',
};

interface StatusDescriptor {
  tone: BadgeTone;
  icon: LucideIcon;
  /** i18n key. Resolved by the caller's `t()`; `label` falls back to it. */
  labelKey: string;
  /** True for the one status family that reads as ongoing work (§10.4). */
  spin?: boolean;
}

/* ───────────────────────────────────────────────────────────────────────────
   THE REGISTRY                                                        §10.4

   Grouped by family exactly as the document tables them. A status absent from
   this map is not a styling bug — it is an unmodelled domain state, and
   `resolveStatus` surfaces it as such rather than silently painting it grey.

   lucide-react v1 renamed several icons; the doc's names are given alongside
   so the mapping back to §10.4 stays auditable:
     FileEdit → FilePen · CheckCircle2 → CircleCheckBig
     XCircle  → CircleX · PauseCircle  → CirclePause
   ─────────────────────────────────────────────────────────────────────────── */
export const STATUS_REGISTRY: Record<string, StatusDescriptor> = {
  // ── draft / new → info-subtle · FilePen ──────────────────────────────────
  draft: { tone: 'info-subtle', icon: FilePen, labelKey: 'status.draft' },
  new: { tone: 'info-subtle', icon: FilePen, labelKey: 'status.new' },

  // ── pending / awaiting_approval / submitted → warning-subtle · Clock ─────
  pending: { tone: 'warning-subtle', icon: Clock, labelKey: 'status.pending' },
  awaiting_approval: {
    tone: 'warning-subtle',
    icon: Clock,
    labelKey: 'status.awaiting_approval',
  },
  submitted: { tone: 'warning-subtle', icon: Clock, labelKey: 'status.submitted' },

  // ── approved … paid → success-subtle · CircleCheckBig ────────────────────
  approved: { tone: 'success-subtle', icon: CircleCheckBig, labelKey: 'status.approved' },
  confirmed: { tone: 'success-subtle', icon: CircleCheckBig, labelKey: 'status.confirmed' },
  posted: { tone: 'success-subtle', icon: CircleCheckBig, labelKey: 'status.posted' },
  completed: { tone: 'success-subtle', icon: CircleCheckBig, labelKey: 'status.completed' },
  passed: { tone: 'success-subtle', icon: CircleCheckBig, labelKey: 'status.passed' },
  delivered: { tone: 'success-subtle', icon: CircleCheckBig, labelKey: 'status.delivered' },
  paid: { tone: 'success-subtle', icon: CircleCheckBig, labelKey: 'status.paid' },

  // ── in_progress / processing / in_transit → primary-subtle · Loader ──────
  in_progress: {
    tone: 'primary-subtle',
    icon: Loader,
    labelKey: 'status.in_progress',
    spin: true,
  },
  processing: {
    tone: 'primary-subtle',
    icon: Loader,
    labelKey: 'status.processing',
    spin: true,
  },
  in_transit: {
    tone: 'primary-subtle',
    icon: Loader,
    labelKey: 'status.in_transit',
    spin: true,
  },

  // ── rejected … overdue → danger-subtle · CircleX ─────────────────────────
  rejected: { tone: 'danger-subtle', icon: CircleX, labelKey: 'status.rejected' },
  failed: { tone: 'danger-subtle', icon: CircleX, labelKey: 'status.failed' },
  cancelled: { tone: 'danger-subtle', icon: CircleX, labelKey: 'status.cancelled' },
  returned: { tone: 'danger-subtle', icon: CircleX, labelKey: 'status.returned' },
  overdue: { tone: 'danger-subtle', icon: CircleX, labelKey: 'status.overdue' },

  // ── on_hold / partial / rework → warning-subtle · CirclePause ────────────
  on_hold: { tone: 'warning-subtle', icon: CirclePause, labelKey: 'status.on_hold' },
  partial: { tone: 'warning-subtle', icon: CirclePause, labelKey: 'status.partial' },
  rework: { tone: 'warning-subtle', icon: CirclePause, labelKey: 'status.rework' },

  // ── closed / archived / inactive → surface-sunken · Archive ──────────────
  closed: { tone: 'surface-sunken', icon: Archive, labelKey: 'status.closed' },
  archived: { tone: 'surface-sunken', icon: Archive, labelKey: 'status.archived' },
  inactive: { tone: 'surface-sunken', icon: Archive, labelKey: 'status.inactive' },
};

/** Unregistered statuses resolve here, visibly neutral and clearly unstyled. */
const UNKNOWN_STATUS: StatusDescriptor = {
  tone: 'surface-sunken',
  icon: Archive,
  labelKey: 'status.unknown',
};

export function resolveStatus(status: string): StatusDescriptor {
  return STATUS_REGISTRY[status] ?? UNKNOWN_STATUS;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BADGE — the presentational shell
   ───────────────────────────────────────────────────────────────────────────
   Fixed height from layer 3 (`--badge-height`): a badge is a label, not a
   control, so it does not resize with density — status columns would jitter
   between modes (tokens.component.css).
   ═══════════════════════════════════════════════════════════════════════════ */

interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: LucideIcon;
  spin?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { children, tone = 'surface-sunken', icon: Icon, spin, className, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex w-fit shrink-0 items-center whitespace-nowrap border',
        'h-(--badge-height) gap-(--badge-gap) rounded-(--badge-radius) px-(--badge-px)',
        'text-(length:--badge-font-size) font-(--badge-font-weight) tracking-(--badge-tracking)',
        'uppercase leading-none',
        toneMap[tone],
        className
      )}
      {...props}
    >
      {Icon && (
        /* The spin is a loop, so it is the one animation here that reduced
           motion must stop rather than shorten. `animate-spin` collapses to a
           single 1ms iteration under the global rule in tokens.motion.css
           (`animation-iteration-count: 1`) — the icon lands upright and static,
           which is exactly the §10.4 "static under reduced motion" contract. */
        <Icon className={cn('size-3 shrink-0', spin && 'animate-spin')} aria-hidden="true" />
      )}
      {children}
    </span>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   STATUS BADGE — the registry-driven form callers should reach for
   ───────────────────────────────────────────────────────────────────────────
   Takes a domain status and nothing else. `label` is passed in already
   translated: a primitive never calls `t()` itself (§10.3 rule 3 — no fetching,
   and by the same reasoning no ambient context), so it stays renderable in
   Storybook and in a test without an i18n provider.
   ═══════════════════════════════════════════════════════════════════════════ */

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  /** Translated text. Falls back to the registry key, then to the raw status. */
  label?: string;
  className?: string;
}) {
  const { tone, icon, labelKey, spin } = resolveStatus(status);
  const known = status in STATUS_REGISTRY;

  return (
    <Badge
      tone={tone}
      icon={icon}
      {...(spin !== undefined && { spin })}
      className={className}
      // The machine value stays queryable regardless of translation — tests and
      // the RMS export both need it (§10.3 rule 8).
      data-status={status}
    >
      {label ?? (known ? labelKey : status)}
    </Badge>
  );
}
