// ═══════════════════════════════════════════════════════════════════════════
// BUTTON                                              UI_SYSTEM.md §10.2, §10.3
// ───────────────────────────────────────────────────────────────────────────
// Variants: primary · secondary · ghost · danger · link   (§10.2, closed set)
// Sizes:    sm · md · lg                                  (§10.2, closed set)
//
// Deliberately NOT here:
//   `success` / `warning` variants — a button is an action, not a status. Status
//   is Badge's job (§10.4). A green "Save" button says nothing a primary button
//   does not, and it burns a status colour on chrome (§2.3 rule 4).
//   `xs` size — below 30px a control fails the 24×24 minimum target (§9.1).
//
// Every dimension comes from layer 3 (`--btn-*`), so compact density resizes
// every button in the product without touching this file (§2.5).
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// §10.3 rule 7 — impossible combinations are impossible to express. A `link`
// button is inline text: it has no width to preserve, so the Tier 3 spinner
// contract (§7.5 — keep width, swap icon, change label) cannot be honoured.
// Typing it away is cheaper than documenting that it misbehaves.
type ButtonProps =
  | (ButtonBaseProps & {
      variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
      loading?: boolean;
      loadingLabel?: string;
    })
  | (ButtonBaseProps & {
      variant: 'link';
      loading?: never;
      loadingLabel?: never;
    });

/* Shared geometry. `press` supplies the transform transition; `active:press-active`
   applies the token scale — both collapse to no-ops under reduced motion because
   `--motion-press-scale` becomes 1 (§7.6). `disabled:pointer-events-none` stops
   the press firing on a dead control. */
const base = cn(
  'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap',
  'gap-(--btn-gap) rounded-(--btn-radius)',
  'text-(length:--btn-font-size) font-(--btn-font-weight) leading-none',
  'transition-token press active:press-active',
  'focus-visible:ring-focus',
  'disabled:pointer-events-none disabled:opacity-50'
);

const variantMap = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
  secondary: 'bg-surface text-default border border-strong hover:bg-surface-sunken',
  ghost: 'text-muted hover:bg-surface-sunken hover:text-default',
  danger: 'bg-danger text-danger-fg hover:opacity-90',
  // The one variant with no box: no height, no padding, no radius — it must sit
  // on the text baseline of the sentence containing it.
  link: 'text-primary underline decoration-from-font underline-offset-2 hover:no-underline',
} as const;

const sizeMap = {
  sm: 'h-(--btn-height-sm) px-(--btn-px-sm)',
  md: 'h-(--btn-height-md) px-(--btn-px-md)',
  lg: 'h-(--btn-height-lg) px-(--btn-px-lg)',
} as const;

// Icons scale with the control, not with the font: a 14px glyph in a 42px button
// looks like a mistake. Fixed sizes, not `em`, so a wrapped SVG cannot inherit
// something unexpected.
const iconSizeMap = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-4.5',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel,
    leftIcon,
    rightIcon,
    fullWidth,
    disabled,
    className,
    type = 'button',
    ...props
  },
  ref
) {
  const isLink = variant === 'link';
  const iconSize = iconSizeMap[size];

  /* §7.5 Tier 3: the spinner replaces the leading icon *inside* the button, the
     button keeps its width, and the label becomes a present participle. Width is
     held by rendering the resting label as a zero-opacity, non-measuring twin
     rather than by measuring in JS — no ResizeObserver, no layout thrash, and it
     is correct on the first paint. `aria-hidden` keeps the twin out of the
     accessibility tree; `aria-live` is deliberately absent because `aria-busy`
     on the button already announces the state change. */
  const showSwap = loading && loadingLabel !== undefined && children !== undefined;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        base,
        variantMap[variant],
        !isLink && sizeMap[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoaderCircle className={cn(iconSize, 'shrink-0 animate-spin')} aria-hidden="true" />
      ) : leftIcon ? (
        <span className={cn(iconSize, 'shrink-0 [&>svg]:size-full')} aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}

      {showSwap ? (
        <span className="grid place-items-center">
          <span className="col-start-1 row-start-1">{loadingLabel}</span>
          <span className="invisible col-start-1 row-start-1" aria-hidden="true">
            {children}
          </span>
        </span>
      ) : (
        children
      )}

      {!loading && rightIcon && (
        <span className={cn(iconSize, 'shrink-0 [&>svg]:size-full')} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   ICON BUTTON                                                    §9.2, §10.2
   ───────────────────────────────────────────────────────────────────────────
   `label` is REQUIRED and is not optional-by-convention — §9.2 states a tooltip
   is not an accessible name, so the type system enforces the name. Square by
   construction (`aspect-square p-0`) so it cannot drift from Button's heights.
   ═══════════════════════════════════════════════════════════════════════════ */

interface IconButtonProps
  extends Omit<ButtonBaseProps, 'leftIcon' | 'rightIcon' | 'children' | 'fullWidth'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon: React.ReactNode;
  label: string;
  loading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ icon, label, size = 'md', loading, className, ...props }, ref) {
    return (
      <Button
        ref={ref}
        size={size}
        aria-label={label}
        {...(loading !== undefined && { loading })}
        className={cn('aspect-square p-0', className)}
        {...props}
      >
        {!loading && (
          <span
            className={cn(iconSizeMap[size], 'shrink-0 [&>svg]:size-full')}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </Button>
    );
  }
);

/* ═══════════════════════════════════════════════════════════════════════════
   BUTTON GROUP                                                        §10.2
   ───────────────────────────────────────────────────────────────────────────
   Segmented row of related actions. `role="group"` needs a name, so `label` is
   required for the same reason IconButton's is. Corner rounding is collapsed on
   the inner edges via child selectors rather than by each Button knowing its
   position — a primitive should not need to know it has siblings (§10.3).
   ═══════════════════════════════════════════════════════════════════════════ */

export function ButtonGroup({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex isolate',
        '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none',
        '[&>*:not(:first-child)]:-ml-px',
        // The pressed/focused button must paint over its neighbour's border.
        '[&>*:focus-visible]:z-10 [&>*:hover]:z-10',
        className
      )}
    >
      {children}
    </div>
  );
}
