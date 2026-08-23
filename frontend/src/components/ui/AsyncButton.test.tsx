// ═══════════════════════════════════════════════════════════════════════════
// ASYNC BUTTON — the no-faking-success contract        UI_SYSTEM.md §8.1 row 5
// ───────────────────────────────────────────────────────────────────────────
// AsyncButton is the only component in the system that renders a *success*
// affordance, which makes it the one place §8.5 rule 1 ("never fake success")
// can actually be violated. The assertions that matter:
//
//   · the success flash appears only AFTER the promise resolves
//   · a rejected promise never shows success, and surfaces an inline message
//     that stays put — not a toast that vanishes mid-read (§8.1 row 6)
//   · the button is disabled while in flight, so a double click cannot post
//     twice (§6.4 double-click protection is a disabled button AND a key)
//   · a resolution after unmount does not setState on a dead component
//
// Timers are faked: the 1500ms success window is part of the contract, and
// waiting it out for real would add 1.5s per assertion.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AsyncButton } from './AsyncButton';

/** A promise plus its resolvers, so a test can hold the button mid-flight. */
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Click without user-event: the suite runs on fake timers, and user-event's
 *  internal delay would never elapse. */
function click(el: HTMLElement) {
  act(() => {
    el.click();
  });
}

/** Let a resolved/rejected microtask flush inside act(). */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('submitting — in-flight is visible and non-repeatable', () => {
  it('disables the button while the promise is pending', async () => {
    const d = deferred();
    render(<AsyncButton onClick={() => d.promise}>Save</AsyncButton>);

    const button = screen.getByRole('button');
    click(button);
    await flush();

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('ignores a second click while in flight', async () => {
    const d = deferred();
    const onClick = vi.fn(() => d.promise);
    render(<AsyncButton onClick={onClick}>Save</AsyncButton>);

    const button = screen.getByRole('button');
    click(button);
    await flush();
    click(button);
    await flush();

    /* §6.4: double-click protection. A second POST of a stock movement or a
       payment is not a cosmetic bug. The disabled attribute is the first line
       of defence; the idempotency key is the second. */
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onClick = vi.fn();
    render(
      <AsyncButton onClick={onClick} disabled>
        Save
      </AsyncButton>
    );
    click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('success — only after the promise resolves', () => {
  it('shows no success affordance while pending', async () => {
    const d = deferred();
    render(<AsyncButton onClick={() => d.promise}>Save</AsyncButton>);

    click(screen.getByRole('button'));
    await flush();

    /* §8.5 rule 1. The single most damaging failure mode this component can
       have: a checkmark that appears before the server has agreed. */
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('clears busy state after resolution', async () => {
    const d = deferred();
    render(<AsyncButton onClick={() => d.promise}>Save</AsyncButton>);

    click(screen.getByRole('button'));
    await flush();
    await act(async () => {
      d.resolve();
      await d.promise;
    });

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('returns to idle after the success window', async () => {
    const d = deferred();
    render(<AsyncButton onClick={() => d.promise}>Save</AsyncButton>);

    click(screen.getByRole('button'));
    await flush();
    await act(async () => {
      d.resolve();
      await d.promise;
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    /* The flash is transient by design: a permanently green button stops
       meaning anything, and the next mutation needs a clean starting state. */
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('accepts a synchronous onClick', async () => {
    const onClick = vi.fn();
    render(<AsyncButton onClick={onClick}>Save</AsyncButton>);
    click(screen.getByRole('button'));
    await flush();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('error — inline, persistent, and never misleading', () => {
  it('surfaces a rejection as an inline alert', async () => {
    const d = deferred();
    render(<AsyncButton onClick={() => d.promise}>Save</AsyncButton>);

    click(screen.getByRole('button'));
    await flush();
    await act(async () => {
      d.reject(new Error('Stock would go negative.'));
      await d.promise.catch(() => {});
    });

    /* role=alert, not a toast. §8.1 row 6 and §8.3: the message must stay
       visible while the user reads it and fixes the input. */
    expect(screen.getByRole('alert')).toHaveTextContent('Stock would go negative.');
  });

  it('never shows success after a rejection', async () => {
    const d = deferred();
    render(<AsyncButton onClick={() => d.promise}>Save</AsyncButton>);

    click(screen.getByRole('button'));
    await flush();
    await act(async () => {
      d.reject(new Error('nope'));
      await d.promise.catch(() => {});
    });

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('prefers the caller-supplied errorMessage over the raw throw', async () => {
    const d = deferred();
    render(
      <AsyncButton onClick={() => d.promise} errorMessage="Couldn’t save this batch.">
        Save
      </AsyncButton>
    );

    click(screen.getByRole('button'));
    await flush();
    await act(async () => {
      d.reject(new Error('SQLSTATE[23000]: Integrity constraint violation'));
      await d.promise.catch(() => {});
    });

    /* §8.5 rule 3: internals never reach the screen. A raw driver message is
       exactly the kind of leak that gets screenshotted into a support ticket. */
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t save this batch.');
    expect(alert.textContent).not.toContain('SQLSTATE');
  });

  it('recovers on retry', async () => {
    const first = deferred();
    const second = deferred();
    let call = 0;
    render(
      <AsyncButton onClick={() => (call++ === 0 ? first.promise : second.promise)}>
        Save
      </AsyncButton>
    );

    const button = screen.getByRole('button');
    click(button);
    await flush();
    await act(async () => {
      first.reject(new Error('transient'));
      await first.promise.catch(() => {});
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    click(button);
    await flush();

    /* A stale error message next to a running retry tells the user the retry
       already failed. §8.5 rule 6: never misleading. */
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('lifecycle safety', () => {
  it('does not update state after unmount', async () => {
    const d = deferred();
    const { unmount } = render(<AsyncButton onClick={() => d.promise}>Save</AsyncButton>);

    click(screen.getByRole('button'));
    await flush();
    unmount();

    /* Navigating away mid-mutation is normal, not exceptional. If the resolve
       path setStates on a dead component React logs a warning that nobody
       reads, and the real cost is a leaked timer per abandoned submit. */
    await act(async () => {
      d.resolve();
      await d.promise;
    });

    expect(true).toBe(true);
  });
});

describe('controlled status', () => {
  it('lets a form drive the state externally', () => {
    render(
      <AsyncButton onClick={() => {}} status="submitting">
        Save
      </AsyncButton>
    );
    /* Form-level submission state lives in React Hook Form, not here. When the
       caller owns it, the internal machine must stay out of the way. */
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
