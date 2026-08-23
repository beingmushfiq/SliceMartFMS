// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY — the four-level tree, asserted            UI_SYSTEM.md §8.4
// ───────────────────────────────────────────────────────────────────────────
// Two invariants here are worth more than the rest of the file combined:
//
//   1. Every boundary LOGS before it renders its fallback. A fallback with no
//      log entry is a silent failure — the user sees a friendly panel and the
//      evidence is gone forever. That is §8.5 rule 2 inverted, and it is
//      completely invisible to a type checker and to manual QA.
//
//   2. Containment. A level-4 widget crash must leave its siblings mounted. If
//      containment breaks, one bad chart takes down a dashboard, which is the
//      failure mode boundaries exist to prevent.
//
// React logs caught errors to console.error unconditionally. That output is
// suppressed per-test rather than globally: a suite that blanket-silences
// console.error hides real warnings from every other assertion in the file.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ErrorBoundary, SectionBoundary, WidgetBoundary } from './ErrorBoundary';
import { clearLogs, getLogs } from '../lib/observability/logger';

function Boom({ message = 'render exploded' }: { message?: string }): never {
  throw new Error(message);
}

/* A bare `el.click()` dispatches the event but leaves the resulting setState
   unflushed, so the assertion reads the pre-click DOM. `act` flushes it. */
function click(el: HTMLElement): void {
  act(() => {
    el.click();
  });
}

beforeEach(() => {
  clearLogs();
  /* React's own console.error for a caught boundary error. Silenced for the
     duration of each test, restored by `restoreMocks: true` in the config. */
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  clearLogs();
});

describe('§8.4 — every boundary logs before rendering its fallback', () => {
  it('records one entry with the level that caught it', () => {
    render(
      <ErrorBoundary level="route">
        <Boom message="batch table blew up" />
      </ErrorBoundary>
    );

    const logs = getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.source).toBe('boundary');
    expect(logs[0]?.level).toBe('error');
    expect(logs[0]?.boundaryLevel).toBe('route');
    /* The developer message belongs in the log, never on the screen. Keeping
       it here is what makes the safe UI copy affordable. */
    expect(logs[0]?.message).toBe('batch table blew up');
  });

  it('captures the component stack', () => {
    render(
      <ErrorBoundary level="feature">
        <Boom />
      </ErrorBoundary>
    );
    /* Without this, a log entry says "render exploded" and gives no way to
       find which of forty widgets it was. */
    expect(getLogs()[0]?.componentStack).toBeTruthy();
  });

  it('logs nothing when children render cleanly', () => {
    render(
      <ErrorBoundary level="feature">
        <p>fine</p>
      </ErrorBoundary>
    );
    expect(getLogs()).toHaveLength(0);
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});

describe('§8.5 rule 3 — the fallback never exposes internals', () => {
  it('renders safe copy, not the raw error message', () => {
    render(
      <ErrorBoundary level="route">
        <Boom message="SQLSTATE[42S02]: Base table missing" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('SQLSTATE');
  });

  it('tells the user what it means for their data', () => {
    render(
      <ErrorBoundary level="route">
        <Boom />
      </ErrorBoundary>
    );
    /* §8.3: what happened, what it means for their data, what to do. "Nothing
       you entered was saved" is the sentence that stops a user re-entering a
       production batch they think they lost. */
    expect(screen.getByText(/nothing you entered was saved/i)).toBeInTheDocument();
  });
});

describe('§8.5 rule 4 — the fallback offers a real recovery path', () => {
  it('renders an actionable control at every level', () => {
    for (const level of ['inline', 'feature', 'route', 'global'] as const) {
      const { unmount } = render(
        <ErrorBoundary level={level}>
          <Boom />
        </ErrorBoundary>
      );
      /* A dead-end fallback is a dead button with extra steps. */
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      unmount();
      clearLogs();
    }
  });

  it('re-renders the children when reset succeeds', () => {
    let shouldThrow = true;
    function Flaky() {
      if (shouldThrow) throw new Error('first attempt fails');
      return <p>recovered</p>;
    }

    render(
      <ErrorBoundary level="feature">
        <Flaky />
      </ErrorBoundary>
    );

    expect(screen.getByText(/couldn’t load/i)).toBeInTheDocument();

    shouldThrow = false;
    click(screen.getByRole('button', { name: /retry/i }));

    /* Retry has to actually retry. A reset that clears the error and then
       immediately re-throws is acceptable; a reset that does nothing is the
       dead button §8.5 rule 4 bans. */
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });

  it('routes the primary recovery control through a caller-supplied onReset', () => {
    const onReset = vi.fn();
    render(
      <ErrorBoundary level="route" onReset={onReset}>
        <Boom />
      </ErrorBoundary>
    );

    /* A route boundary inside a router must not call window.history.back() —
       that leaves the router's own state behind. When the caller supplies a
       reset, it owns navigation. If this ever regresses, `onReset` becomes a
       prop that typechecks and does nothing. */
    click(screen.getByRole('button', { name: /go back/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe('containment — a widget crash does not take the page', () => {
  it('leaves sibling sections mounted', () => {
    render(
      <div>
        <SectionBoundary>
          <p>healthy section</p>
        </SectionBoundary>
        <WidgetBoundary>
          <Boom />
        </WidgetBoundary>
      </div>
    );

    /* The entire justification for a four-level tree. If this fails, one bad
       chart blanks a dashboard and every widget becomes a liability. */
    expect(screen.getByText('healthy section')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong in this section/i)).toBeInTheDocument();
  });

  it('honours a custom fallback', () => {
    render(
      <ErrorBoundary level="inline" fallback={() => <p>custom tile</p>}>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('custom tile')).toBeInTheDocument();
    /* An override must not opt out of logging — the point of §8.4 is that the
       evidence is unconditional. */
    expect(getLogs()).toHaveLength(1);
  });
});
