// ─────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format BDT currency */
export function formatBDT(amount: number, options?: { compact?: boolean }): string {
  if (options?.compact) {
    if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000)   return `৳${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000)     return `৳${(amount / 1000).toFixed(1)}K`;
  }
  return `৳${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-BD');
}

/** Format percentage */
export function formatPct(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/** Percentage number */
export function calcPct(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

/** Format datetime to local readable */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** Relative time ("2 hours ago") */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return formatDate(iso);
}

/** Generate a sequential ID */
let _counter = 1000;
export function genId(prefix = 'ID'): string {
  return `${prefix}-${(++_counter).toString().padStart(5, '0')}`;
}

/** Pad order number */
export function padNo(n: number, prefix: string): string {
  return `${prefix}-${n.toString().padStart(5, '0')}`;
}

/** Status → badge variant map */
export function getStatusVariant(status: string): 'blue' | 'green' | 'amber' | 'red' | 'slate' {
  const map: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'slate'> = {
    // General
    active: 'green', inactive: 'slate', discontinued: 'slate',
    // Production
    draft: 'slate', planned: 'blue', ready: 'blue',
    in_production: 'amber', qc_pending: 'amber',
    completed: 'green', cancelled: 'red',
    // QC
    pending: 'amber', passed: 'green', failed: 'red',
    rework: 'amber', retested: 'blue',
    // Payment
    unpaid: 'red', partial: 'amber', paid: 'green',
    // Delivery
    processing: 'blue', assigned: 'blue',
    in_transit: 'amber', delivered: 'green',
    returned: 'red',
    // Purchase
    ordered: 'blue', received: 'green',
    // Transfer
    approved: 'blue',
    // Attendance
    present: 'green', absent: 'red', late: 'amber',
    half_day: 'amber', on_leave: 'slate',
  };
  return map[status] ?? 'slate';
}

/** Truncate string */
export function truncate(str: string, len = 30): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Get today's ISO date string */
export function todayISO(): string {
  return new Date().toISOString();
}

/** Date only string YYYY-MM-DD */
export function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/** Parse date for display */
export function parseDate(str: string): Date {
  return new Date(str);
}

/** Clamp a number */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
