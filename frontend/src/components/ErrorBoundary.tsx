// ─────────────────────────────────────────────────────────────
// ERROR BOUNDARY & SYSTEM DIAGNOSTICS INSPECTOR
// ─────────────────────────────────────────────────────────────

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle, RotateCcw, Home, Copy, Check,
  Terminal, ShieldAlert, Bug, X,
} from 'lucide-react';
import { Button } from './ui/Button';

export interface SystemErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
}

// In-memory persistent error log storage
const ERROR_LOGS_KEY = 'slicemart_error_logs';

export function getStoredErrorLogs(): SystemErrorLog[] {
  try {
    const raw = localStorage.getItem(ERROR_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveErrorLog(error: Error, info?: ErrorInfo): SystemErrorLog {
  const newLog: SystemErrorLog = {
    id: `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    message: error.message || 'Unknown runtime exception',
    stack: error.stack,
    componentStack: info?.componentStack || undefined,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  try {
    const existing = getStoredErrorLogs();
    const updated = [newLog, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to persist error log:', e);
  }

  return newLog;
}

export function clearErrorLogs(): void {
  try {
    localStorage.removeItem(ERROR_LOGS_KEY);
  } catch (e) {
    console.error('Failed to clear error logs:', e);
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  currentLog: SystemErrorLog | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    currentLog: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const log = saveErrorLog(error, errorInfo);
    this.setState({ errorInfo, currentLog: log });
    console.error('[Slice Mart FMS Runtime Exception]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, currentLog: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <ErrorFallbackView
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          currentLog={this.state.currentLog}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface FallbackViewProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  currentLog: SystemErrorLog | null;
  onReset: () => void;
}

function ErrorFallbackView({
  error,
  errorInfo,
  currentLog,
  onReset,
}: FallbackViewProps) {
  const [copied, setCopied] = React.useState(false);
  const [showInspector, setShowInspector] = React.useState(false);

  const fullDiagnostics = JSON.stringify(
    {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      componentStack: errorInfo?.componentStack,
      diagnostics: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
      },
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(fullDiagnostics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      {/* Decorative Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-150 h-150 bg-red-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-150 h-150 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xs uppercase tracking-widest font-700 text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60">
                System Exception Caught
              </span>
              <span className="text-2xs text-slate-500 font-mono">
                {currentLog?.id || 'ERR-RUNTIME'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-700 text-white mt-1">
              Slice Mart Operational Error Boundary
            </h1>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          The factory operations interface encountered an unexpected runtime exception. The system captured the diagnostics stack to prevent data corruption.
        </p>

        {/* Error Detail Banner */}
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 mb-5 font-mono text-xs text-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="break-all">
              <span className="font-700 text-red-300">{error.name}: </span>
              {error.message || 'An unexpected rendering error occurred.'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 mb-4">
          <Button
            variant="primary"
            size="sm"
            onClick={onReset}
            leftIcon={<Home className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500"
          >
            Return to Dashboard
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            Reload Interface
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {copied ? 'Copied Diagnostics' : 'Copy Log'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInspector(v => !v)}
            leftIcon={<Terminal className="w-4 h-4 text-amber-400" />}
            className="text-slate-400 hover:text-white hover:bg-slate-800 ml-auto text-xs"
          >
            {showInspector ? 'Hide Stack' : 'Inspect Stack'}
          </Button>
        </div>

        {/* Diagnostic Inspector Drawer */}
        {showInspector && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-600 text-slate-400 flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-amber-400" /> Component & Call Stack Trace
              </span>
              <span className="text-2xs text-slate-500 font-mono">
                {navigator.onLine ? '🟢 Online' : '🔴 Offline Mode'}
              </span>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-2xs overflow-x-auto max-h-56 leading-relaxed">
              {error.stack || 'No stack trace available'}
              {errorInfo?.componentStack && `\n\nComponent Hierarchy:${errorInfo.componentStack}`}
            </pre>
          </div>
        )}

        <div className="mt-5 text-center">
          <p className="text-2xs text-slate-500">
            Slice Mart Enterprise System · Powered by DevCenterPoint · Operational Resilience Layer
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STANDALONE ERROR LOG INSPECTOR MODAL (For Admins/Diagnostics)
// ─────────────────────────────────────────────────────────────
interface ErrorLogInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ErrorLogInspectorModal({ isOpen, onClose }: ErrorLogInspectorModalProps) {
  const [logs, setLogs] = React.useState<SystemErrorLog[]>([]);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setLogs(getStoredErrorLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    clearErrorLogs();
    setLogs([]);
  };

  const handleCopyLog = (log: SystemErrorLog) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-700 text-white">System Error Log & Diagnostics Inspector</h2>
              <p className="text-2xs text-slate-400">Recorded runtime errors and exception telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <Button variant="danger" size="xs" onClick={handleClear}>
                Clear Logs
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-600 text-slate-300">Clean Operational Status</h3>
              <p className="text-xs text-slate-500 mt-1">No runtime exceptions recorded in local telemetry storage.</p>
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs font-mono space-y-2"
              >
                <div className="flex items-center justify-between text-2xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="text-red-400 font-bold">{log.id}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  <button
                    onClick={() => handleCopyLog(log)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === log.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-red-300 font-semibold break-all">{log.message}</div>
                {log.stack && (
                  <pre className="text-2xs text-slate-400 max-h-28 overflow-x-auto bg-slate-900/80 p-2 rounded border border-slate-800/60">
                    {log.stack}
                  </pre>
                )}
                <div className="text-2xs text-slate-500 truncate" title={log.url}>
                  URL: {log.url}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-2xs text-slate-500">
          <span>{logs.length} exception(s) logged</span>
          <Button variant="ghost" size="xs" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}
