import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  RotateCcw,
  Trash2,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { getLogs, clearLogs, subscribeToLogs, type LogEntry } from '../../lib/observability/logger';
import { Button } from '../../components/ui/Button';

export function PlatformErrorMonitoringWorkspace() {
  const [logs, setLogs] = useState<readonly LogEntry[]>(() => getLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusMap, setStatusMap] = useState<Record<string, 'Open' | 'Investigating' | 'Resolved' | 'Ignored'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe to external logger store changes
  useEffect(() => {
    return subscribeToLogs((updated) => {
      setLogs(updated);
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setLogs(getLogs());
  }, []);

  const handleClearLogs = () => {
    if (confirm('Clear all logged errors from the diagnostics buffer?')) {
      clearLogs();
      setLogs([]);
    }
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `platform_error_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(q) ||
          (log.id && log.id.toLowerCase().includes(q)) ||
          (log.correlationId && log.correlationId.toLowerCase().includes(q)) ||
          (log.route && log.route.toLowerCase().includes(q)) ||
          (log.tenantId && log.tenantId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [logs, searchQuery, levelFilter, sourceFilter]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      errors: logs.filter((l) => l.level === 'error').length,
      warnings: logs.filter((l) => l.level === 'warn').length,
      info: logs.filter((l) => l.level === 'info' || l.level === 'debug').length,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-500 border border-rose-500/20">
              Control Plane Observability
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 font-sans">
            Platform Error Monitoring & Diagnostics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Central audit log for client-side boundary crashes, API refusals, and multi-tenant telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            leftIcon={<RotateCcw className="size-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportLogs}
            leftIcon={<Download className="size-3.5" />}
          >
            Export JSON
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleClearLogs}
            leftIcon={<Trash2 className="size-3.5" />}
          >
            Clear Buffer
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Recorded</span>
            <Layers className="size-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{stats.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Errors</span>
            <ShieldAlert className="size-4" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">{stats.errors}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Warnings</span>
            <AlertTriangle className="size-4" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">{stats.warnings}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Info & Debug</span>
            <Info className="size-4" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">{stats.info}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-50 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Reference ID, Route, Message, or Tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Severity Levels</option>
            <option value="error">Errors Only</option>
            <option value="warn">Warnings Only</option>
            <option value="info">Info Only</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Sources</option>
            <option value="boundary">Boundary Crashes</option>
            <option value="api">API Refusals</option>
            <option value="boot">Boot Failures</option>
            <option value="app">App Runtime</option>
          </select>
        </div>
      </div>

      {/* Logs Data Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Severity & Source</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Reference & Route</th>
                <th className="py-3 px-4">Safe Message</th>
                <th className="py-3 px-4">Tenant Scope</th>
                <th className="py-3 px-4 text-right">Workflow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                      Zero unhandled errors in current session
                    </div>
                    <div className="text-xs mt-0.5">
                      All boundary layers and API endpoints are operating within normal parameters.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const currentStatus = statusMap[log.id] || 'Open';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`size-2 rounded-full ${
                              log.level === 'error'
                                ? 'bg-rose-500 ring-2 ring-rose-500/20'
                                : log.level === 'warn'
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                            }`}
                          />
                          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-800 dark:text-slate-200 font-mono">
                            {log.level}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {log.source}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3 text-slate-400" />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                            <span>{log.id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(log.id, log.id)}
                              className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                              title="Copy ID"
                            >
                              {copiedId === log.id ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                            </button>
                          </div>
                          {log.route && (
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-35">
                              {log.route}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium max-w-md line-clamp-2">
                          {log.message}
                        </div>
                        {log.code && (
                          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {log.code}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Building2 className="size-3 text-slate-400" />
                          <span>{log.tenantId ? `Tenant #${log.tenantId}` : 'Platform Core'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            setStatusMap((prev) => ({
                              ...prev,
                              [log.id]: e.target.value as 'Open' | 'Investigating' | 'Resolved' | 'Ignored',
                            }))
                          }
                          className={`text-xs font-bold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                            currentStatus === 'Resolved'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : currentStatus === 'Investigating'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : currentStatus === 'Ignored'
                              ? 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                          }`}
                        >
                          <option value="Open">🔴 Open</option>
                          <option value="Investigating">🟡 Investigating</option>
                          <option value="Resolved">🟢 Resolved</option>
                          <option value="Ignored">⚪ Ignored</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PlatformErrorMonitoringWorkspace;
