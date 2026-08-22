// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY — four-level tree                          UI_SYSTEM.md §8.4
// ───────────────────────────────────────────────────────────────────────────
// §8.4 mandates four boundary levels, each with a different recovery scope:
//
//   ① App/global   catches everything; full-page recovery screen
//   ② Route        one screen crashes → shell, sidebar, nav survive
//   ③ Section      a widget, chart, tab fails in isolation
//   ④ Widget       smallest recoverable unit, compact "Couldn't load" tile
//
// Rules from the doc:
//   · Every boundary logs (correlation id, route, user id, tenant id,
//     component stack) before rendering its fallback.
//   · Fallback always offers a real recovery path — retry, reload, navigate.
//   · Stack traces never rendered in production (§8.4 + §8.5 rule 3).
//   · Boundaries catch render errors only. Async failures are TanStack Query's
//     job — mixing the two produces boundaries that never fire.
//   · The existing prototype is kept and extended, not rewritten.
//
// The Log Inspector (previously a hand-rolled overlay here) has moved to
// `patterns/LogInspector.tsx` on the real `Modal` (focus trap + Escape).
// ═══════════════════════════════════════════════════════════════════════════

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  TriangleAlert,
  RotateCcw,
  Home,
  Copy,
  Check,
  ShieldAlert,
  Bug,
} from 'lucide-react';
import { Button } from './ui/Button';
import { logBoundaryError } from '../lib/observability/logger';

/* ── Types ──────────────────────────────────────────────────────────────── */

type ErrorBoundaryLevel = 'global' | 'route' | 'feature' | 'inline';

interface ErrorBoundaryProps {
  children: ReactNode;
  level?: ErrorBoundaryLevel;
  /** Called when the boundary resets. If omitted, the default behaviour
   *  navigates: `back()` for route, home for global, no-op for feature/inline. */
  onReset?: () => void;
  /** Custom fallback renderer. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/* ── The boundary ───────────────────────────────────────────────────────── */

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    /* §8.4: "Every boundary logs (correlation id, route, user id, tenant id,
       component stack) before rendering its fallback." The logger merges
       ambient context (route/user/tenant) automatically. */
    logBoundaryError(error, {
      level: this.props.level ?? 'global',
      componentStack: errorInfo.componentStack ?? undefined,
    });

    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    if (this.props.onReset) {
      this.props.onReset();
      return;
    }

    /* Default recovery: route-level → go back, global → home, feature/inline
       → just re-render (the state reset above is sufficient). */
    const level = this.props.level ?? 'global';
    if (level === 'route') {
      window.history.back();
    } else if (level === 'global') {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <ErrorFallbackView
          level={this.props.level ?? 'global'}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   FALLBACK VIEWS — one per level, escalating in severity
   ───────────────────────────────────────────────────────────────────────────
   §8.3 copy rules apply: say what happened, what it means for their data,
   what to do. Never expose internals (§8.5 rule 3). The error.name and
   error.message are developer text — they are shown only in dev builds,
   behind a collapsed <details>, gated on `import.meta.env.DEV`.
   ─────────────────────────────────────────────────────────────────────────── */

interface FallbackViewProps {
  level: ErrorBoundaryLevel;
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function ErrorFallbackView({ level, error, errorInfo, onReset }: FallbackViewProps) {
  const [copied, setCopied] = React.useState(false);

  /* §8.3: the copyable diagnostics block. Safe values only — no stack trace,
     no internal error names in the user-facing copy. */
  const diagnostics = JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      screen: `${window.innerWidth}×${window.innerHeight}`,
      online: navigator.onLine,
      /* Stack is included in the copyable payload but NOT in the rendered UI
         in production. A support agent can read the clipboard. */
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    },
    null,
    2,
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(diagnostics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── inline (level 4) — compact tile, smallest recovery unit ──────────── */
  if (level === 'inline') {
    return (
      <div className="p-3 rounded-lg bg-danger-subtle border border-danger text-sm">
        <span className="text-danger font-semibold">Something went wrong in this section. </span>
        <span className="text-danger">
          {import.meta.env.DEV && (
            <span className="font-mono text-xs"> {error.name}: {error.message}</span>
          )}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="ml-2 text-danger"
        >
          Retry
        </Button>
      </div>
    );
  }

  /* ── feature (level 3) — widget/section failure, siblings survive ─────── */
  if (level === 'feature') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-danger-subtle border border-danger">
        <TriangleAlert className="w-4 h-4 text-danger shrink-0" />
        <span className="text-sm text-danger flex-1">
          This section couldn\u2019t load. Your other data is fine.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="text-danger"
        >
          Retry
        </Button>
      </div>
    );
  }

  /* ── route (level 2) — one screen crashes, shell survives ─────────────── */
  if (level === 'route') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4 bg-base text-default">
        <div className="w-full max-w-md bg-surface border border-default rounded-2xl p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-danger-subtle border border-danger flex items-center justify-center text-danger mx-auto mb-4">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-default mb-2">
            This page hit an unexpected error
          </h2>
          <p className="text-sm text-muted mb-1">
            Nothing you entered was saved. Your other pages are unaffected.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Go back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.reload()}
              leftIcon={<Home className="w-4 h-4" />}
            >
              Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── global (level 1) — catches everything, full-page recovery ────────── */
  return (
    <div className="min-h-screen bg-base text-default flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="relative w-full max-w-2xl bg-surface border border-default rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-danger-subtle border border-danger flex items-center justify-center text-danger shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xs uppercase tracking-widest font-bold text-danger bg-danger-subtle px-2 py-0.5 rounded border border-danger">
                System Error
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-default mt-1">
              Something went wrong
            </h1>
          </div>
        </div>

        {/* Safe copy — §8.3: what happened, what it means, what to do */}
        <p className="text-sm text-muted mb-4 leading-relaxed">
          An unexpected error occurred. Nothing was saved and your data is safe.
          You can return to the dashboard or try reloading the page.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-default mb-4">
          <Button
            variant="primary"
            size="sm"
            onClick={onReset}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reload
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied' : 'Copy diagnostics'}
          </Button>
        </div>

        {/* §8.4: stack traces never rendered in production. Dev-only, behind
            a collapsed <details>. */}
        {import.meta.env.DEV && error.stack && (
          <details className="mt-2 group">
            <summary className="text-xs text-subtle cursor-pointer select-none hover:text-muted transition-token-colors flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-warning" />
              Stack trace (dev only)
            </summary>
            <pre className="mt-2 p-3.5 rounded-xl bg-surface-sunken border border-default text-muted font-mono text-2xs overflow-x-auto max-h-56 leading-relaxed">
              {error.stack}
              {errorInfo?.componentStack && `\n\nComponent hierarchy:${errorInfo.componentStack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   CONVENIENCE WRAPPERS — the four named levels
   ───────────────────────────────────────────────────────────────────────────
   Callers use these rather than passing `level` to the base component:
     <GlobalBoundary>      — wraps App in main.tsx
     <RouteBoundary>       — wraps each route in the router
     <SectionBoundary>     — wraps a dashboard widget / tab panel
     <WidgetBoundary>      — wraps a single metric card / chart
   ─────────────────────────────────────────────────────────────────────────── */

export function GlobalBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="global">{children}</ErrorBoundary>;
}

export function RouteBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="route">{children}</ErrorBoundary>;
}

export function SectionBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="feature">{children}</ErrorBoundary>;
}

export function WidgetBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="inline">{children}</ErrorBoundary>;
}
