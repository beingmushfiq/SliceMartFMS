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

const TOAST_CLASS = [
  'flex items-start w-(--toast-width) gap-(--toast-gap)',
  'p-(--toast-padding) rounded-(--toast-radius)',
  'bg-surface-raised text-default border border-default shadow-lg',
  'text-sm',
].join(' ');

/* ───────────────────────────────────────────────────────────────────────────
   TOASTER — mounted once, at the root
   ─────────────────────────────────────────────────────────────────────────── */

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      /* Sonner's 'system' theme resolves colour scheme through `matchMedia`.
         Dark mode here is class-based token re-mapping, so Sonner must not
         form its own opinion — the tokens already carry it. */
      theme="light"
      richColors={false}
      closeButton
      duration={TRANSIENT_MS}
      /* Beyond three, the stack covers the content that triggered it. */
      visibleToasts={3}
      icons={{
        success: <CircleCheckBig className="size-4 shrink-0 text-success" />,
        info: <Info className="size-4 shrink-0 text-info" />,
        warning: <TriangleAlert className="size-4 shrink-0 text-warning" />,
        error: <CircleX className="size-4 shrink-0 text-danger" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: TOAST_CLASS,
          /* Per-type classes are intentionally empty. The icon carries the
             semantic, not a coloured background: a green panel behind black
             text is how a "success" toast ends up failing contrast, and a
             tinted surface for every outcome makes the genuinely rare error
             toast indistinguishable from routine confirmations. */
          content: 'flex-1 min-w-0',
          title: 'font-medium leading-snug',
          description: 'text-xs text-muted leading-relaxed mt-0.5',
          actionButton: 'shrink-0 text-xs font-medium text-primary hover:underline cursor-pointer',
          cancelButton: 'shrink-0 text-xs text-muted hover:text-default cursor-pointer',
          closeButton:
            'shrink-0 text-muted hover:text-default cursor-pointer transition-token-colors',
        },
      }}
    />
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   NOTIFY — the only sanctioned entry point
   ─────────────────────────────────────────────────────────────────────────── */

interface NotifyOptions {
  /** One supporting sentence. If it needs two, this is not a toast. */
  description?: string | undefined;
  /** A single recovery or follow-up action. Never the only way to reach it. */
  action?: { label: string; onClick: () => void } | undefined;
}

function options(opts?: NotifyOptions) {
  return {
    ...(opts?.description != null && { description: opts.description }),
    ...(opts?.action != null && {
      action: { label: opts.action.label, onClick: opts.action.onClick },
    }),
  };
}

export const notify = {
  /** Row 5. Past tense, names what changed: "Batch B-1042 released." */
  success: (message: string, opts?: NotifyOptions) => toast.success(message, options(opts)),

  /** Neutral, non-blocking information. Nothing the user must act on. */
  info: (message: string, opts?: NotifyOptions) => toast.info(message, options(opts)),

  /**
   * Errors with **no owning surface** — a background action the user has
   * already navigated away from, where there is no form field, no panel and
   * no region left to render into.
   *
   * `duration: Infinity` is deliberate and is the whole reason this is safe to
   * expose: §8.5 rule 2 forbids hiding an error, and a self-dismissing error
   * is a hidden error for anyone who looked away. It stays until dismissed.
   *
   * If the failure has a surface, use that surface: `AsyncButton`'s inline
   * error for a submit, `StateView` for a region, `error.fields` for a 422.
   */
  error: (message: string, opts?: NotifyOptions) =>
    toast.error(message, { ...options(opts), duration: Infinity }),

  dismiss: (id?: string | number) => toast.dismiss(id),
} as const;
