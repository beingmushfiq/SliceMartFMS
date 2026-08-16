// ─────────────────────────────────────────────────────────────
// BADGE — Status-aware visual indicator
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { cn, getStatusVariant } from '../../lib/utils';

type BadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'navy';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  status?: string;       // auto-maps status → variant
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  blue:  'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-success-50 text-success-700 border-success-100',
  amber: 'bg-warning-50 text-warning-700 border-warning-100',
  red:   'bg-error-50 text-error-700 border-error-100',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  navy:  'bg-navy-900 text-white border-transparent',
};

const dotClasses: Record<BadgeVariant, string> = {
  blue:  'bg-blue-500',
  green: 'bg-success-500',
  amber: 'bg-warning-500',
  red:   'bg-error-500',
  slate: 'bg-slate-400',
  navy:  'bg-white',
};

export function Badge({ children, variant, status, dot, className }: BadgeProps) {
  const resolvedVariant = status ? getStatusVariant(status) : (variant ?? 'slate');
  return (
    <span
      className={cn(
        'badge border',
        variantClasses[resolvedVariant],
        className
      )}
    >
      {dot && (
        <span className={cn('status-dot', dotClasses[resolvedVariant])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/** Maps a status string to a human-readable label */
export const STATUS_LABELS: Record<string, string> = {
  // Products
  active: 'Active', inactive: 'Inactive', discontinued: 'Discontinued',
  // Production
  draft: 'Draft', planned: 'Planned', ready: 'Ready',
  in_production: 'In Production', qc_pending: 'QC Pending',
  completed: 'Completed', cancelled: 'Cancelled',
  // QC
  pending: 'Pending', passed: 'Passed', failed: 'Failed',
  rework: 'Rework', retested: 'Re-tested',
  // Payment
  unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid',
  // Delivery
  processing: 'Processing', assigned: 'Assigned',
  in_transit: 'In Transit', delivered: 'Delivered',
  returned: 'Returned',
  // Purchase
  ordered: 'Ordered', received: 'Received',
  // Transfer
  approved: 'Approved',
  // Attendance
  present: 'Present', absent: 'Absent', late: 'Late',
  half_day: 'Half Day', on_leave: 'On Leave',
  // Customer
  b2b: 'B2B', b2c: 'B2C', raw_material: 'Raw Material',
  // Shift
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night',
};

export function StatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  return (
    <Badge status={status} dot={dot}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
