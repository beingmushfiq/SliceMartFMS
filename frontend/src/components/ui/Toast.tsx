// ═══════════════════════════════════════════════════════════════════════════
// TOAST                                        UI_SYSTEM.md §8.1 row 5, §8.3
// ───────────────────────────────────────────────────────────────────────────
// The transient half of row 5: "Success: mutation returned 2xx. Toast
// (transient) or inline confirmation."
//
// This is a thin, opinionated wrapper over Sonner. It exists so that the rest
// of the codebase never imports `sonner` directly, for three reasons:
//
//   1. Sonner ships its own colours. §8 and the token cascade allow no
//      non-token colour anywhere, so `unstyled` is forced on and every surface
//      is re-declared from semantic tokens. `richColors` stays off — it is the
//      single biggest source of untokenised colour in a Sonner install.
//
//   2. A bare `toast()` accepts anything, which is how a 422 validation
//      failure ends up in a box that disappears after four seconds. The
//      exported surface deliberately makes the wrong thing hard: see the
//      comment on `notify.error`.
//
//   3. §8.3 copy rules apply to toasts too. A toast is one short sentence in
//      the past tense naming what changed. If a message needs a paragraph, a
//      number breakdown, or a decision from the user, it is not a toast —
//      it is a StateView, an Alert, or a ConfirmDialog.
//
// WHAT A TOAST IS NOT
//   · Not a validation surface (row 6)      — fields, inline, focus first invalid
//   · Not a business-rule surface (row 7)   — explanatory panel with real numbers
//   · Not a warning surface (row 8)         — persistent amber banner
//   · Not a partial-failure surface (row 9) — scoped panel in the failed region
//   · Not a permission surface (rows 11/12) — StateView
//   · Not an offline surface (row 18)       — persistent topbar banner
// Each of those is explicitly "never a toast" in §8.1 because a dismissable,
// self-hiding box cannot carry information the user must act on.
// ═══════════════════════════════════════════════════════════════════════════

import { CircleCheckBig, CircleX, Info, TriangleAlert } from 'lucide-react';
import { Toaster as SonnerToaster, toast } from 'sonner';

/* Long enough to read a short sentence twice, short enough not to sit over the
   next thing the user does. Toasts are confirmations, and a confirmation that
   outstays its welcome becomes an obstacle to dismiss. */
const TRANSIENT_MS = 4000;

/* ───────────────────────────────────────────────────────────────────────────
   SURFACE — all semantic tokens, no primitive ramp, no dynamic class names
   ───────────────────────────────────────────────────────────────────────────
   `w-(--toast-width)` / `rounded-(--toast-radius)` / `p-(--toast-padding)` /
   `gap-(--toast-gap)` read the component layer directly, so a tenant theme
   change moves the toast with everything else.
   ─────────────────────────────────────────────────────────────────────────── */

/* ───────────────────────────────────────────────────────────────────────────
   TOASTER — mounted once, at the root
   ─────────────────────────────────────────────────────────────────────────── */

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="light"
      richColors={false}
      closeButton
      duration={TRANSIENT_MS}
      visibleToasts={5}
      icons={{
        success: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-success-subtle text-success ring-1 ring-success/25 shadow-xs">
            <CircleCheckBig className="size-4" />
          </div>
        ),
        info: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info ring-1 ring-info/25 shadow-xs">
            <Info className="size-4" />
          </div>
        ),
        warning: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-warning-subtle text-warning ring-1 ring-warning/25 shadow-xs">
            <TriangleAlert className="size-4" />
          </div>
        ),
        error: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-danger-subtle text-danger ring-1 ring-danger/25 shadow-xs">
            <CircleX className="size-4" />
          </div>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group flex items-start w-[24rem] max-w-[calc(100vw-2rem)] gap-3 p-3.5 rounded-xl bg-surface-raised/98 backdrop-blur-md text-default border shadow-2xl transition-all duration-200',
          success: 'border-l-[4px] border-l-success border-default',
          error: 'border-l-[4px] border-l-danger border-default',
          warning: 'border-l-[4px] border-l-warning border-default',
          info: 'border-l-[4px] border-l-info border-default',
          default: 'border-default',
          content: 'flex-1 min-w-0 pt-0.5',
          title: 'font-semibold text-sm leading-snug text-default tracking-tight',
          description: 'text-xs text-muted leading-relaxed mt-1 font-normal',
          icon: 'shrink-0',
          actionButton:
            'shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary text-primary-fg hover:opacity-90 cursor-pointer shadow-xs transition-opacity',
          cancelButton:
            'shrink-0 text-xs font-medium px-2 py-1 rounded-lg text-muted hover:text-default hover:bg-surface-sunken cursor-pointer transition-colors',
          closeButton:
            'shrink-0 p-1.5 rounded-lg text-muted hover:text-default hover:bg-surface-sunken cursor-pointer transition-colors',
        },
      }}
    />
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   NOTIFY — the only sanctioned entry point
   ─────────────────────────────────────────────────────────────────────────── */

export interface NotifyOptions {
  /** One supporting sentence. If it needs two, this is not a toast. */
  description?: string | undefined;
  /** A single recovery or follow-up action. Never the only way to reach it. */
  action?: { label: string; onClick: () => void } | undefined;
  /** Custom duration in milliseconds */
  duration?: number | undefined;
}

function options(opts?: NotifyOptions) {
  return {
    ...(opts?.description != null && { description: opts.description }),
    ...(opts?.action != null && {
      action: { label: opts.action.label, onClick: opts.action.onClick },
    }),
    ...(opts?.duration != null && { duration: opts.duration }),
  };
}

export const notify = {
  /** Past tense, names what changed: "Batch B-1042 released." */
  success: (message: string, opts?: NotifyOptions) => toast.success(message, options(opts)),

  /** Neutral, non-blocking information. */
  info: (message: string, opts?: NotifyOptions) => toast.info(message, options(opts)),

  /** Warning: alerts cashier or operator of conditions requiring attention */
  warning: (message: string, opts?: NotifyOptions) => toast.warning(message, options(opts)),

  /** Errors: clear, styled feedback with action support */
  error: (message: string, opts?: NotifyOptions) =>
    toast.error(message, { duration: opts?.duration ?? 6000, ...options(opts) }),

  dismiss: (id?: string | number) => toast.dismiss(id),
} as const;
