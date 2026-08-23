// ═══════════════════════════════════════════════════════════════════════════
// QUERY BOUNDARY — the state matrix, asserted            UI_SYSTEM.md §8.1
// ───────────────────────────────────────────────────────────────────────────
// This is the component every screen delegates its lifecycle to, so a
// regression here is a regression on every screen at once. The rows that
// matter most are the ones a type checker cannot see:
//
//   row 1   the 120ms gate. Rendering a skeleton at 0ms typechecks perfectly
//           and makes a fast app look broken.
//   row 2   a refetch must KEEP the stale rows. Swapping them for a skeleton
//           also typechecks, and is the single most common way this component
//           gets broken during a refactor.
//   row 20  the 60% dim is gated at 1s. A 200ms refetch that dims and undims
//           reads as a flicker.
//   row 19  a cancelled request renders NOTHING. If this breaks, every screen
//           flashes an error panel on navigation.
//   rows 3/4 empty-no-data and empty-filtered are different surfaces with
//           different actions, and only the caller knows which applies.
//
// Timers are faked because the assertions are *about* time. Real waits would
// make the suite slow and, worse, flaky on a loaded CI runner — and a flaky
// reliability test gets deleted, which is how the reliability goes.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { QueryBoundary } from './QueryBoundary';
import { SKELETON_DELAY_MS, SkeletonTable } from '../ui/Feedback';
import { createApiError } from '../../lib/api/errors';

/** Advance past the 120ms skeleton gate. */
function passSkeletonGate() {
  act(() => {
    vi.advanceTimersByTime(SKELETON_DELAY_MS + 1);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('row 1 — pending, the 120ms skeleton gate', () => {
  it('renders nothing before the threshold', () => {
    const { container } = render(
      <QueryBoundary status="pending" error={null}>
        <p>rows</p>
      </QueryBoundary>
    );

    /* Not "no skeleton" — *nothing*. §7.5 requires the component not to mount
       at all below the threshold, because a delayed fade still reserves
       layout and still flashes when the response wins the race. */
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('rows')).not.toBeInTheDocument();
  });

  it('renders the default skeleton grid once the threshold passes', () => {
    const { container } = render(
      <QueryBoundary status="pending" error={null} skeletonRows={3} skeletonCols={4}>
        <p>rows</p>
      </QueryBoundary>
    );

    passSkeletonGate();

    const skeleton = container.querySelector('[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    /* The skeleton must match the final layout (§7.5 Tier 2), so the row and
       column counts are part of the contract, not a styling detail. */
    expect(skeleton?.children).toHaveLength(3);
    expect(skeleton?.children[0]?.children).toHaveLength(4);
  });

  it('uses renderSkeleton when the children are table rows', () => {
    /* The default placeholder is a `<div>` grid. Dropping a `<tbody>` inside a
       `<div>` makes the browser reparent it, so the skeleton lands outside the
       table and CLS stops being 0 — the exact thing the tier exists to
       prevent. A table caller therefore owns its own placeholder. */
    const { container } = render(
      <table>
        <QueryBoundary
          status="pending"
          error={null}
          renderSkeleton={() => <SkeletonTable rows={3} cols={4} />}
        >
          <tbody>
            <tr>
              <td>rows</td>
            </tr>
          </tbody>
        </QueryBoundary>
      </table>
    );

    passSkeletonGate();

    const skeleton = container.querySelector('tbody[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.querySelectorAll('tr')).toHaveLength(3);
    expect(skeleton?.querySelectorAll('tr')[0]?.querySelectorAll('td')).toHaveLength(4);
    expect(screen.queryByText('rows')).not.toBeInTheDocument();
  });

  it('never renders children while pending', () => {
    render(
      <QueryBoundary status="pending" error={null}>
        <p>rows</p>
      </QueryBoundary>
    );
    passSkeletonGate();
    /* §8.5 rule 5: fabricated data. Children must not paint against absent
       data, however briefly. */
    expect(screen.queryByText('rows')).not.toBeInTheDocument();
  });
});

describe('rows 2 + 20 — refetch keeps the stale data', () => {
  it('keeps children on screen during a refetch and shows the rail', () => {
    render(
      <QueryBoundary status="success" error={null} data={[1]} isFetching>
        <p>stale rows</p>
      </QueryBoundary>
    );

    /* The whole point of row 2. If a future refactor routes `isFetching` into
       the pending branch, this is the assertion that catches it. */
    expect(screen.getByText('stale rows')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Refreshing' })).toBeInTheDocument();
  });

  it('does not dim the stale data below 1s', () => {
    render(
      <QueryBoundary status="success" error={null} data={[1]} isFetching>
        <p>stale rows</p>
      </QueryBoundary>
    );

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.getByText('stale rows').parentElement).not.toHaveClass('opacity-60');
  });

  it('dims the stale data to 60% past 1s', () => {
    render(
      <QueryBoundary status="success" error={null} data={[1]} isFetching>
        <p>stale rows</p>
      </QueryBoundary>
    );

    act(() => {
      vi.advanceTimersByTime(1001);
    });

    /* Opacity only — never `display` or `visibility`. The stale rows have to
       stay readable and selectable while they refresh. */
    expect(screen.getByText('stale rows').parentElement).toHaveClass('opacity-60');
  });

  it('shows no rail when settled', () => {
    render(
      <QueryBoundary status="success" error={null} data={[1]}>
        <p>rows</p>
      </QueryBoundary>
    );
    expect(screen.queryByRole('status', { name: 'Refreshing' })).not.toBeInTheDocument();
  });

  it('shows the rail over an empty list too', () => {
    /* A refetch over an empty list is exactly the moment a user is waiting for
       a row to appear, so suppressing the rail there would hide the one signal
       that matters most. */
    render(
      <QueryBoundary status="success" error={null} data={[]} isFetching>
        {null}
      </QueryBoundary>
    );
    expect(screen.getByRole('status', { name: 'Refreshing' })).toBeInTheDocument();
  });
});

describe('rows 3 + 4 — the two empty surfaces are distinct', () => {
  it('row 3: no data offers a create path', () => {
    render(
      <QueryBoundary status="success" error={null} data={[]}>
        {null}
      </QueryBoundary>
    );
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('row 4: filtered to zero offers a clear-filters path', () => {
    render(
      <QueryBoundary status="success" error={null} data={[]} hasActiveFilters>
        {null}
      </QueryBoundary>
    );
    /* Two rows, not one, because the recovery differs: row 3 means "create
       something", row 4 means "widen your filter". Collapsing them strands the
       user in a screen whose advice does not apply. */
    expect(screen.getByText('No results match your filters')).toBeInTheDocument();
    expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument();
  });

  it('renders children when data is present', () => {
    render(
      <QueryBoundary status="success" error={null} data={[{ id: 1 }]}>
        <p>a row</p>
      </QueryBoundary>
    );
    expect(screen.getByText('a row')).toBeInTheDocument();
    expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument();
  });

  it('treats a non-array payload as data, not as empty', () => {
    /* A detail record is an object. Inferring emptiness from anything other
       than an empty array would show "Nothing here yet" on a perfectly good
       detail screen. */
    render(
      <QueryBoundary status="success" error={null} data={{ id: 1 }}>
        <p>detail</p>
      </QueryBoundary>
    );
    expect(screen.getByText('detail')).toBeInTheDocument();
  });

  it('honours renderEmpty', () => {
    render(
      <QueryBoundary status="success" error={null} data={[]} renderEmpty={() => <p>custom</p>}>
        {null}
      </QueryBoundary>
    );
    expect(screen.getByText('custom')).toBeInTheDocument();
  });
});

describe('row 19 — a cancelled request is silent', () => {
  it('renders nothing at all', () => {
    const { container } = render(
      <QueryBoundary status="error" error={createApiError('REQUEST_CANCELLED', { status: 0 })}>
        <p>rows</p>
      </QueryBoundary>
    );

    /* Not an empty state, not an error panel, not the children. Cancellation
       is the AbortSignal contract working as designed; §8.5 rule 1 forbids
       treating it as a failure, and a visible panel on every route change is
       how users learn to distrust the whole UI. */
    expect(container).toBeEmptyDOMElement();
  });

  it('is silent even when renderError is supplied', () => {
    const renderError = vi.fn(() => <p>custom error</p>);
    const { container } = render(
      <QueryBoundary
        status="error"
        error={createApiError('REQUEST_CANCELLED', { status: 0 })}
        renderError={renderError}
      >
        {null}
      </QueryBoundary>
    );
    /* The cancellation check must come *before* the override, or a caller
       opting into custom error copy silently opts back into the flicker. */
    expect(renderError).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});

describe('rows 9 + 11 + 12 + 13 — error surfaces are keyed on code', () => {
  it.each([
    ['UPSTREAM_FAILED', 502],
    ['FORBIDDEN', 403],
    ['OUT_OF_SCOPE', 403],
    ['NOT_FOUND', 404],
  ] as const)('%s renders its own heading', (code, status) => {
    render(
      <QueryBoundary status="error" error={createApiError(code, { status })}>
        {null}
      </QueryBoundary>
    );
    /* Asserting a heading exists rather than its exact words: the copy is
       owned by StateView's registry and tested there. What matters here is
       that the error branch resolves a real state and does not fall through
       to the children. */
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.queryByText('rows')).not.toBeInTheDocument();
  });

  it('surfaces the correlation id as a support reference', () => {
    render(
      <QueryBoundary
        status="error"
        error={createApiError('INTERNAL_ERROR', {
          status: 500,
          correlationId: 'req_abc123',
        })}
      >
        {null}
      </QueryBoundary>
    );
    /* §8.3 requires a specific reference. An id the user can see but nobody
       can look up is worse than none, so this ties the client panel to the
       server log. */
    expect(screen.getByText('req_abc123')).toBeInTheDocument();
  });

  it('never renders children in the error branch', () => {
    render(
      <QueryBoundary status="error" error={createApiError('INTERNAL_ERROR', { status: 500 })}>
        <p>rows</p>
      </QueryBoundary>
    );
    expect(screen.queryByText('rows')).not.toBeInTheDocument();
  });

  it('handles a non-ApiError throw without crashing', () => {
    /* A bug in a query function throws a plain Error. The boundary must still
       render a safe panel rather than crashing itself — a failing failure
       handler is the worst class of bug in this file. */
    render(
      <QueryBoundary status="error" error={new Error('kaboom')}>
        {null}
      </QueryBoundary>
    );
    expect(screen.getByRole('heading')).toBeInTheDocument();
    /* §8.5 rule 3: the raw developer message must not reach the screen. */
    expect(screen.queryByText(/kaboom/)).not.toBeInTheDocument();
  });

  it('honours renderError for real errors', () => {
    render(
      <QueryBoundary
        status="error"
        error={createApiError('INTERNAL_ERROR', { status: 500 })}
        renderError={(e) => <p>custom {e.code}</p>}
      >
        {null}
      </QueryBoundary>
    );
    expect(screen.getByText('custom INTERNAL_ERROR')).toBeInTheDocument();
  });
});
