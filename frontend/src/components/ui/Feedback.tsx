// ─────────────────────────────────────────────────────────────
// EMPTY STATE, SKELETON, ALERTS
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

// ── EmptyState ────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div>
        <p className="empty-state-title">{title}</p>
        {description && <p className="empty-state-desc mt-1">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────
export function SkeletonLine({ width, height = 4 }: { width?: string; height?: number }) {
  return (
    <div
      className={cn('skeleton rounded', `h-${height}`)}
      style={{ width: width ?? '100%' }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 flex flex-col gap-4" aria-busy="true" aria-label="Loading...">
      <SkeletonLine width="40%" height={3} />
      <SkeletonLine width="60%" height={7} />
      <SkeletonLine width="30%" height={3} />
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine width={i === 0 ? '80%' : i === cols - 1 ? '50%' : '65%'} height={3} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </tbody>
  );
}

// ── Alert ─────────────────────────────────────────────────────
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertIcons: Record<AlertVariant, React.ReactNode> = {
  info:    <Info className="w-4 h-4 shrink-0 mt-0.5" />,
  success: <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
  error:   <XCircle className="w-4 h-4 shrink-0 mt-0.5" />,
};

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  return (
    <div className={cn('alert', `alert-${variant}`, 'rounded-lg shadow-2xs', className)} role="alert">
      <span aria-hidden="true">{alertIcons[variant]}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-600 mb-0.5">{title}</p>}
        <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded"
          aria-label="Dismiss alert"
        >
          <XCircle className="w-4 h-4 opacity-70 hover:opacity-100" />
        </button>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }: PaginationProps) {
  const start = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const end   = pageSize ? Math.min(page * pageSize, totalItems ?? 0) : undefined;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      {totalItems !== undefined && pageSize && (
        <p className="text-xs text-slate-500">
          Showing <span className="font-600">{start}</span>–<span className="font-600">{end}</span> of{' '}
          <span className="font-600">{totalItems}</span> results
        </p>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500
                     hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer text-sm"
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
                'w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors duration-150 cursor-pointer',
                p === page
                  ? 'bg-blue-600 text-white font-600'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
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
          className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500
                     hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer text-sm"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
