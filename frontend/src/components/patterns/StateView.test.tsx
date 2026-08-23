// ═══════════════════════════════════════════════════════════════════════════
// STATE VIEW — the copy registry, asserted                  UI_SYSTEM.md §8.1
// ───────────────────────────────────────────────────────────────────────────
// This component is where §8.3 is either honoured or quietly broken. Its
// failure modes are all invisible to the type checker, because every branch
// returns a valid `StateDescriptor` no matter how wrong the words are:
//
//   · An unmodelled `code` silently falls back. That is correct behaviour, but
//     only if the fallback itself is safe copy and not an empty panel.
//   · Rows 11 and 12 could drift into the same wording. ADR-008 exists because
//     a dead end and a fixable scope mismatch are different problems, and a
//     user who is told "no permission" for a scope issue will file a ticket
//     instead of switching branch.
//   · Row 15's data-safety sentence could be dropped in an innocent copy edit.
//     That sentence is the difference between a user re-posting a payment and
//     a user checking first.
//
// The assertions below are therefore about *words*, deliberately. Snapshot
// tests were rejected: a snapshot accepts any change as long as someone
// re-records it, which is exactly the review step that gets skipped.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StateView, EmptyDataState, EmptyFilterState } from './StateView';

describe('rows 3 + 4 — the two empty surfaces stay distinct', () => {
  it('renders the no-data heading for `empty`', () => {
    render(<StateView code="empty" />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.queryByText(/no results match/i)).not.toBeInTheDocument();
  });

  it('renders the filtered heading for `filtered`', () => {
    render(<StateView code="filtered" />);
    expect(screen.getByText('No results match your filters')).toBeInTheDocument();
    expect(screen.queryByText(/nothing here yet/i)).not.toBeInTheDocument();
  });

  it('offers a clear-filters escape hatch on the filtered surface', () => {
    const onClearFilters = vi.fn();
    render(<EmptyFilterState onClearFilters={onClearFilters} />);

    /* Row 4 without this control is a dead end: the user sees zero rows and
       has no way to learn the filter is the cause. */
    screen.getByRole('button', { name: 'Clear filters' }).click();
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('does not invent a clear-filters button when the caller gave no handler', () => {
    render(<EmptyFilterState />);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('lets the caller override the copy for a domain-specific empty state', () => {
    render(
      <EmptyDataState
        title="No production batches today"
        description="Start a batch to see it here."
      />
    );
    expect(screen.getByText('No production batches today')).toBeInTheDocument();
    expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument();
  });
});

describe('rows 11 vs 12 — FORBIDDEN is a dead end, OUT_OF_SCOPE is fixable', () => {
  it('tells a forbidden user to contact an administrator', () => {
    render(<StateView code="FORBIDDEN" />);
    expect(screen.getByText(/don’t have permission/i)).toBeInTheDocument();
    expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument();
  });

  it('tells an out-of-scope user to switch scope', () => {
    render(<StateView code="OUT_OF_SCOPE" />);

    /* ADR-008. If this copy ever collapses into the FORBIDDEN wording, the
       user loses the one action that would actually resolve it. */
    expect(screen.getByText(/switch to the correct scope/i)).toBeInTheDocument();
    expect(screen.queryByText(/don’t have permission/i)).not.toBeInTheDocument();
  });

  it('keeps TENANT_MISMATCH distinct from a scope problem', () => {
    render(<StateView code="TENANT_MISMATCH" />);
    expect(screen.getByText(/different organisation/i)).toBeInTheDocument();
  });
});

describe('§8.3 — every modelled state says what it means for the user’s data', () => {
  it.each([['REQUEST_TIMEOUT'] as const, ['UPSTREAM_TIMEOUT'] as const])(
    '%s carries the data-safety sentence',
    (code) => {
      render(<StateView code={code} />);

      /* The mandated sentence. A user who retries a blind timeout can double-post
       a stock movement or a payment; this is the only thing standing in the
       way, and it is one careless copy edit from disappearing. */
      expect(
        screen.getByText(/your data may have been saved — check before retrying/i)
      ).toBeInTheDocument();
    }
  );

  it.each([
    ['UPSTREAM_FAILED', /your data is safe/i] as const,
    ['SERVICE_UNAVAILABLE', /your data is safe/i] as const,
    ['INTERNAL_ERROR', /nothing was saved/i] as const,
  ])('%s reassures the user about their data', (code, sentence) => {
    render(<StateView code={code} />);
    expect(screen.getByText(sentence)).toBeInTheDocument();
  });

  it('renders a heading and a description for every modelled code', () => {
    const codes = [
      'UPSTREAM_FAILED',
      'SERVICE_UNAVAILABLE',
      'NETWORK_OFFLINE',
      'FORBIDDEN',
      'PLATFORM_ONLY',
      'OUT_OF_SCOPE',
      'TENANT_MISMATCH',
      'NOT_FOUND',
      'RESOURCE_GONE',
      'ROUTE_NOT_FOUND',
      'INTERNAL_ERROR',
      'UPSTREAM_TIMEOUT',
      'REQUEST_TIMEOUT',
    ] as const;

    for (const code of codes) {
      const { unmount } = render(<StateView code={code} />);
      /* A registry row with a blank heading typechecks perfectly and renders
         an empty panel, which reads to the user as a broken page. */
      expect(screen.getByRole('heading').textContent?.trim().length ?? 0).toBeGreaterThan(0);
      unmount();
    }
  });
});

describe('fallback — an unmodelled code degrades safely, never blankly', () => {
  it('renders safe copy for a code that is not in the registry', () => {
    /* A new server error code ships before the frontend models it. That is a
       normal event (API_CONTRACT §18), not an exception — the panel must still
       be a complete, actionable surface. */
    render(<StateView code="RATE_LIMITED" />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByText(/an unexpected issue occurred/i)).toBeInTheDocument();
  });

  it('never renders the raw code as the heading', () => {
    render(<StateView code="RATE_LIMITED" />);

    /* Leaking `RATE_LIMITED` into the UI is §8.5 rule 3 (exposing internals)
       dressed up as helpfulness. */
    expect(document.body.textContent).not.toContain('RATE_LIMITED');
  });
});

describe('§8.3 — the support reference and the recovery controls', () => {
  it('renders the correlation id so support can find the request', () => {
    render(<StateView code="INTERNAL_ERROR" correlationId="req_9f2b1c" />);
    expect(screen.getByText('req_9f2b1c')).toBeInTheDocument();
  });

  it('omits the reference line entirely when there is no correlation id', () => {
    render(<StateView code="INTERNAL_ERROR" />);
    expect(screen.queryByText(/^Reference:/)).not.toBeInTheDocument();
  });

  it('wires both actions on an error panel', () => {
    const onRetry = vi.fn();
    const onBack = vi.fn();
    render(
      <StateView
        code="UPSTREAM_FAILED"
        action={{ label: 'Try again', onClick: onRetry }}
        secondaryAction={{ label: 'Go back', onClick: onBack }}
      />
    );

    screen.getByRole('button', { name: 'Try again' }).click();
    screen.getByRole('button', { name: 'Go back' }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('keeps a stack trace out of the visible copy', () => {
    render(
      <StateView
        code="INTERNAL_ERROR"
        stack={'Error: SQLSTATE[42S02] table missing\n  at Repo.find'}
      />
    );

    /* In dev the trace is allowed, but only collapsed inside <details>. The
       user-facing sentence must never contain it, in any build. */
    expect(screen.getByText(/we couldn’t complete this request/i)).toBeInTheDocument();
    const summary = screen.queryByText(/stack trace \(dev only\)/i);
    if (summary) {
      expect(summary.closest('details')?.hasAttribute('open')).toBe(false);
    }
  });
});
