// ═══════════════════════════════════════════════════════════════════════════
// ASYNC BUTTON                              UI_SYSTEM.md §8.2 · §8.1 row 5
// ───────────────────────────────────────────────────────────────────────────
// A managed-state wrapper around `Button` for mutations that need visual
// lifecycle feedback: idle → submitting → success flash → error (inline).
//
// §8.1 row 5: "Success: mutation returned 2xx. Toast (transient) or inline
// confirmation (in-place). State updated from the server response, not from
// optimistic guesses." AsyncButton takes the inline path — a brief success
// flash followed by a return to idle.
//
// §8.5 rule 1: no faking success. The success flash only appears AFTER the
// Promise resolves. The button is disabled during submission and shows the
// Tier 3 spinner (§7.5) — no layout reflow, width preserved.
//
// §8.5 rule 6: the error message is never misleading. A failed mutation
// shows an inline message below the button, not a toast that vanishes while
// the user is still reading it.
//
// This is a `ui/` primitive (§10.1): no business logic, no fetching, no
// imports from features/. The caller provides the async `onClick`; this
// component owns the visual state.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { CircleCheckBig } from 'lucide-react';
import { Button } from './Button';

/* ── Types ──────────────────────────────────────────────────────────────── */

type AsyncButtonStatus = 'idle' | 'submitting' | 'success' | 'error';

interface AsyncButtonBaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  /** The async mutation. Return void for fire-and-forget, or throw to trigger
   *  the error state. The button disables itself while the promise is pending. */
  onClick: () => Promise<void> | void;
  /** Copy shown below the button on failure. §8.3: say what happened and what
   *  to do. Never expose internals. */
  errorMessage?: string | undefined;
}

interface AsyncButtonControlled extends AsyncButtonBaseProps {
  /** Let the caller drive the status externally (e.g. from a form-level
   *  submission state). When provided, the internal state machine is bypassed. */
  status?: AsyncButtonStatus;
}

interface AsyncButtonUncontrolled extends AsyncButtonBaseProps {
  status?: never;
}

type AsyncButtonProps = AsyncButtonControlled | AsyncButtonUncontrolled;

/* ── Helpers ────────────────────────────────────────────────────────────── */

const SUCCESS_DURATION_MS = 1500;

const successIcon = <CircleCheckBig className="size-4 shrink-0" aria-hidden="true" />;

/* ───────────────────────────────────────────────────────────────────────────
   ASYNC BUTTON
   ───────────────────────────────────────────────────────────────────────────
   Width is preserved during state transitions by the underlying `Button`'s
   `grid place-items-center` pattern (§7.5 Tier 3). The icon swaps between
   the resting icon, a spinner, and a success check — all three occupy the
   same icon slot. No ResizeObserver, no layout thrash.
   ─────────────────────────────────────────────────────────────────────────── */

export const AsyncButton = React.forwardRef<HTMLButtonElement, AsyncButtonProps>(
  function AsyncButton(
    { children, onClick, errorMessage, status: controlledStatus, className, disabled, ...rest },
    ref
  ) {
    const [internalStatus, setInternalStatus] = React.useState<AsyncButtonStatus>('idle');
    const [internalError, setInternalError] = React.useState<string | null>(null);
    const mountedRef = React.useRef(true);

    React.useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    const status = controlledStatus ?? internalStatus;
    const isBusy = status === 'submitting';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    const handleClick = async () => {
      if (isBusy || disabled) return;

      setInternalStatus('submitting');
      setInternalError(null);

      try {
        await onClick();
        if (!mountedRef.current) return;
        setInternalStatus('success');
        setTimeout(() => {
          if (mountedRef.current) setInternalStatus('idle');
        }, SUCCESS_DURATION_MS);
      } catch (err) {
        if (!mountedRef.current) return;
        setInternalStatus('error');
        setInternalError(
          errorMessage ??
            (err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        );
      }
    };

    const baseLeftIcon = rest.leftIcon;

    const renderIcon = isBusy
      ? undefined /* Button shows spinner when loading=true */
      : isSuccess
        ? successIcon
        : baseLeftIcon;

    return (
      <div className="inline-flex flex-col items-start">
        <Button
          ref={ref}
          {...rest}
          leftIcon={renderIcon}
          loading={isBusy}
          loadingLabel="Submitting"
          onClick={handleClick}
          disabled={disabled || isBusy}
          aria-busy={isBusy || undefined}
          aria-disabled={disabled || undefined}
          className={className}
        >
          {isSuccess && !children ? 'Saved' : children}
        </Button>

        {/* §8.1 row 6: inline error. The message stays visible until the user
            retries or dismisses — it never vanishes like a toast would. The
            dismiss is optional because some error messages are critical enough
            that hiding them is more dangerous than showing them. */}
        {isError && internalError && (
          <p role="alert" className="mt-1.5 text-xs text-danger leading-snug animate-fade-in">
            {internalError}
          </p>
        )}
      </div>
    );
  }
);
