// ═══════════════════════════════════════════════════════════════════════════
// LOG INSPECTOR                                      UI_SYSTEM.md §8.4 §8.5
// ───────────────────────────────────────────────────────────────────────────
// §8.5 rule 2: a `console.log` with no UI change is *hiding* an error. The
// Log Inspector is the sanctioned UI surface for viewing the diagnostic data
// that the logger (`lib/observability/logger.ts`) collects.
//
// This was previously a hand-rolled overlay inside `ErrorBoundary.tsx`. It
// has been promoted to a first-class `patterns/` component on the real
// `Modal` — which means it inherits focus trap, Escape, background inert,
// body scroll lock, and the `AnimatePresence` exit animation (§7.3 row 2).
//
// §8.4: stack traces are never rendered in production. In development they
// appear behind a collapsed <details> per entry.
//
// §10.1: this is a `patterns/` component (composed, generic, never fetches).
// It imports from `ui/` (Modal, Button) and from `lib/` (logger) but never
// from `features/`.
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useSyncExternalStore } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  getLogs,
  subscribeToLogs,
  clearLogs,
  isDev,
  type LogEntry,
  type LogLevel,
} from '../../lib/observability/logger';

/* ── Props ──────────────────────────────────────────────────────────────── */

interface LogInspectorProps {
  open: boolean;
  onClose: () => void;
}

/* ── Subscribe hook ─────────────────────────────────────────────────────── */

function useLogEntries(): readonly LogEntry[] {
  return useSyncExternalStore(subscribeToLogs, getLogs);
}

/* ── Level badge ────────────────────────────────────────────────────────── */

const levelStyles: Record<LogLevel, string> = {
  error: 'bg-danger-subtle text-danger border-danger',
  warn: 'bg-warning-subtle text-warning border-warning',
  info: 'bg-info-subtle text-info border-info',
  debug: 'bg-surface-sunken text-muted border-default',
};

/* ── Single entry row ───────────────────────────────────────────────────── */

function LogEntryRow({ entry }: { entry: LogEntry }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 bg-surface-sunken rounded-lg border border-default text-xs font-mono">
      {/* Row 1: id · level · source · timestamp */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-muted text-2xs">{entry.id}</span>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold border ${levelStyles[entry.level]}`}
        >
          {entry.level.toUpperCase()}
        </span>
        <span className="text-2xs text-muted">{entry.source}</span>
        <span className="text-2xs text-subtle ml-auto">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Row 2: message */}
      <p className="text-muted break-all">{entry.message}</p>

      {/* Row 3: metadata row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-subtle">
        {entry.code && <span>code: {entry.code}</span>}
        {entry.status != null && <span>status: {entry.status}</span>}
        {entry.correlationId && <span>ref: {entry.correlationId}</span>}
        {entry.route && <span>route: {entry.route}</span>}
        {entry.userId && <span>user: {entry.userId}</span>}
        {entry.tenantId && <span>tenant: {entry.tenantId}</span>}
        {entry.boundaryLevel && <span>boundary: {entry.boundaryLevel}</span>}
      </div>

      {/* §8.4: stack traces dev-only, behind collapsed <details> */}
      {isDev && entry.stack && (
        <details className="group">
          <summary className="text-2xs text-subtle cursor-pointer select-none hover:text-muted transition-token-colors">
            Stack trace
          </summary>
          <pre className="mt-1 p-2 bg-surface rounded border border-default text-muted text-2xs overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
            {entry.stack}
            {entry.componentStack && `\n\nComponent:${entry.componentStack}`}
          </pre>
        </details>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   LOG INSPECTOR — the modal shell
   ───────────────────────────────────────────────────────────────────────────
   A thin composition: Modal + level filter + scrollable list + clear button.
   The Modal handles focus trap, Escape, background inert and exit animation.
   This component handles nothing visual beyond layout.
   ─────────────────────────────────────────────────────────────────────────── */

const ALL_LEVELS: readonly (LogLevel | 'all')[] = ['all', 'error', 'warn', 'info', 'debug'] as const;

export function LogInspector({ open, onClose }: LogInspectorProps) {
  const logs = useLogEntries();
  const [levelFilter, setLevelFilter] = React.useState<LogLevel | 'all'>('all');

  const filtered = levelFilter === 'all' ? logs : logs.filter((e) => e.level === levelFilter);

  return (
    <Modal open={open} onClose={onClose} title="Log Inspector" size="lg">
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        {ALL_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => setLevelFilter(level)}
            className={`px-2 py-1 rounded text-xs transition-token-colors cursor-pointer ${
              levelFilter === level
                ? 'bg-primary text-primary-fg font-semibold'
                : 'text-muted hover:text-default hover:bg-surface-sunken'
            }`}
          >
            {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
        <span className="text-xs text-muted ml-auto">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Scrollable list */}
      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            No log entries{levelFilter !== 'all' ? ` at level "${levelFilter}"` : ''}.
          </div>
        ) : (
          filtered.map((entry) => <LogEntryRow key={entry.id} entry={entry} />)
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-default">
        <span className="text-xs text-muted">
          {logs.length} total · {filtered.length} shown
        </span>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={clearLogs}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear all
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
