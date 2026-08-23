// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION — Pagination                                 UI_SYSTEM.md §10.2
// ───────────────────────────────────────────────────────────────────────────
// Pagination is a navigation primitive (§10.2 Navigation group), not feedback.
// All class strings use semantic tokens — no primitive colours
// (text-slate-*, bg-blue-*, border-slate-*).
// ═══════════════════════════════════════════════════════════════════════════

import { cn } from '../../lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  const start = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const end = pageSize ? Math.min(page * pageSize, totalItems ?? 0) : undefined;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-default">
      {totalItems !== undefined && pageSize && (
        <p className="text-xs text-muted">
          Showing <span className="font-semibold">{start}</span>–
          <span className="font-semibold">{end}</span> of{' '}
          <span className="font-semibold">{totalItems}</span> results
        </p>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted
                     hover:bg-surface-sunken hover:text-default disabled:opacity-40
                     disabled:cursor-not-allowed transition-token-colors cursor-pointer text-sm"
          aria-label="Previous page"
        >
          ‹
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-md text-sm transition-token-colors cursor-pointer',
                p === page
                  ? 'bg-primary text-primary-fg font-semibold'
                  : 'text-muted hover:bg-surface-sunken hover:text-default'
              )}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted
                     hover:bg-surface-sunken hover:text-default disabled:opacity-40
                     disabled:cursor-not-allowed transition-token-colors cursor-pointer text-sm"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
