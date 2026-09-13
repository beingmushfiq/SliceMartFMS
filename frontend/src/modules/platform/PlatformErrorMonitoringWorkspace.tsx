import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api/client';
import type { PlatformErrorLogItem } from '../../types/api/platform';
import { SelectDropdown } from '../../components/ui/Dropdown';
import { Button } from '../../components/ui/Button';
import {
  Search,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Copy,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
} from 'lucide-react';

interface ErrorListResponse {
  data: PlatformErrorLogItem[];
  meta: {
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
    stats: {
      total: number;
      open: number;
      investigating: number;
      resolved: number;
      critical: number;
    };
  };
}

export const PlatformErrorMonitoringWorkspace: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(25);

  // Detail Modal State
  const [selectedError, setSelectedError] = useState<PlatformErrorLogItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<ErrorListResponse>({
    queryKey: ['platform', 'errors', statusFilter, severityFilter, search, page, perPage],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (search) params['search'] = search;
      if (statusFilter !== 'all') params['status'] = statusFilter;
      if (severityFilter !== 'all') params['severity'] = severityFilter;

      const res = await api.get<ErrorListResponse>('/platform/errors', { params });
      return res.data;
    },
  });

  const errors = data?.data ?? [];
  const pagination = data?.meta?.pagination;
  const stats = data?.meta?.stats;

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: string; note?: string }) => {
      return await api.patch(`/platform/errors/${id}`, {
        status,
        resolution_note: note,
      });
    },
    onSuccess: (_, variables) => {
      toast.success(`Error marked as ${variables.status}.`);
      queryClient.invalidateQueries({ queryKey: ['platform', 'errors'] });
      if (selectedError && selectedError.id === variables.id) {
        setSelectedError((prev) => (prev ? { ...prev, status: variables.status as 'open' | 'investigating' | 'resolved' | 'ignored', resolution_note: variables.note ?? prev.resolution_note ?? null } : null));
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update error status';
      toast.error(msg);
    },
  });

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard.');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-rose-500 border border-rose-500/20 uppercase tracking-wider">
              Control Plane Observability
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default mt-1 font-sans">
            Platform Error Telemetry & Diagnostics
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Real-time multi-tenant exception tracking, error boundary crashes, fingerprint deduplication, and triage ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RotateCcw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh Diagnostics
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-default shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Open Issues</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-default">
              {stats?.open ?? 0}
            </div>
            <p className="text-[11px] text-muted mt-1">Requires engineering triage</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-default shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Investigating</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-default">
              {stats?.investigating ?? 0}
            </div>
            <p className="text-[11px] text-muted mt-1">Currently under analysis</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-default shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Resolved Bugs</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-default">
              {stats?.resolved ?? 0}
            </div>
            <p className="text-[11px] text-muted mt-1">Closed telemetry traces</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-default shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Critical Priority</span>
            <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
              <Flame className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-rose-500">
              {stats?.critical ?? 0}
            </div>
            <p className="text-[11px] text-muted mt-1">High impact crashes</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-default flex flex-wrap gap-4 items-center justify-between">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder="Search exceptions, routes, fingerprints, or error messages..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-surface-sunken border border-default rounded-xl text-xs text-default placeholder:text-muted focus:outline-hidden focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Filter className="size-3.5" />
            <span>Status:</span>
          </div>
          <SelectDropdown
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'open', label: 'Open', colorDot: 'bg-rose-500' },
              { value: 'investigating', label: 'Investigating', colorDot: 'bg-amber-500' },
              { value: 'resolved', label: 'Resolved', colorDot: 'bg-emerald-500' },
              { value: 'ignored', label: 'Ignored', colorDot: 'bg-slate-500' },
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            size="sm"
          />

          <div className="flex items-center gap-2 text-xs text-muted ml-2">
            <span>Severity:</span>
          </div>
          <SelectDropdown
            options={[
              { value: 'all', label: 'All Severities' },
              { value: 'critical', label: 'Critical' },
              { value: 'error', label: 'Error' },
              { value: 'warning', label: 'Warning' },
              { value: 'info', label: 'Info' },
            ]}
            value={severityFilter}
            onChange={(val) => {
              setSeverityFilter(val);
              setPage(1);
            }}
            size="sm"
          />
        </div>
      </div>

      {/* Errors Table */}
      <div className="rounded-2xl bg-surface border border-default shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-muted text-xs font-mono animate-pulse">
            Querying platform telemetry store...
          </div>
        ) : errors.length === 0 ? (
          <div className="p-16 text-center text-muted text-xs space-y-2">
            <CheckCircle2 className="size-8 text-emerald-500 mx-auto opacity-70" />
            <p className="font-semibold text-default">No diagnostic errors matching current filter.</p>
            <p className="text-muted">Platform telemetry reports all systems running smoothly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-sunken border-b border-default text-muted uppercase text-[10px] font-mono">
                <tr>
                  <th className="py-3.5 pl-6">Severity & Status</th>
                  <th className="py-3.5">Error Type & Signature</th>
                  <th className="py-3.5">Tenant Scope</th>
                  <th className="py-3.5">Occurrences</th>
                  <th className="py-3.5">Last Seen</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {errors.map((err) => (
                  <tr key={err.id} className="hover:bg-surface-sunken/50 transition-colors">
                    <td className="py-3.5 pl-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono border ${
                            err.severity === 'critical'
                              ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                              : err.severity === 'error'
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {err.severity}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium font-mono ${
                            err.status === 'open'
                              ? 'bg-rose-500/10 text-rose-500'
                              : err.status === 'investigating'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          {err.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 max-w-xs">
                      <div className="font-mono text-xs font-semibold text-default truncate" title={err.error_type}>
                        {err.error_type}
                      </div>
                      <div className="text-[11px] text-muted truncate mt-0.5" title={err.message}>
                        {err.message}
                      </div>
                      {err.route && (
                        <div className="text-[10px] text-muted font-mono truncate mt-0.5 opacity-80">
                          {err.route}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 text-muted whitespace-nowrap">
                      {err.tenant ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-muted shrink-0" />
                          <span className="text-default font-medium">{err.tenant.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted font-mono text-[11px]">Global Platform</span>
                      )}
                    </td>
                    <td className="py-3.5 font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-surface-sunken border border-default text-[11px] font-bold text-default">
                        {err.occurrence_count}×
                      </span>
                    </td>
                    <td className="py-3.5 text-muted text-[11px] font-mono whitespace-nowrap">
                      {new Date(err.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(err.last_seen_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pr-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedError(err);
                          setResolutionNote(err.resolution_note || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface-sunken hover:bg-surface border border-default text-xs font-medium text-default inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="size-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.total_pages > 1 && (
          <div className="px-6 py-3.5 bg-surface-sunken border-t border-default flex items-center justify-between text-xs font-mono text-muted">
            <div>
              Showing page <span className="font-bold text-default">{pagination.page}</span> of{' '}
              <span className="font-bold text-default">{pagination.total_pages}</span> ({pagination.total} total traces)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isFetching}
                className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed border border-default text-default flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={pagination.page >= pagination.total_pages || isFetching}
                className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed border border-default text-default flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect & Triage Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-default rounded-2xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-default pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    {selectedError.severity}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    Trace #{selectedError.id}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-default font-mono mt-1">
                  {selectedError.error_type}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted font-mono">
                  {selectedError.occurrence_count} occurrences
                </span>
              </div>
            </div>

            {/* Error Message */}
            <div className="p-4 rounded-xl bg-surface-sunken border border-default">
              <span className="text-[11px] font-bold text-muted block mb-1 uppercase font-mono">
                Error Message
              </span>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-mono select-all">
                {selectedError.message}
              </p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                <span className="text-muted block text-[10px] font-mono uppercase">Fingerprint</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[11px] text-default truncate max-w-35">
                    {selectedError.fingerprint}
                  </span>
                  <button
                    onClick={() => handleCopy('fp', selectedError.fingerprint)}
                    className="text-muted hover:text-default"
                  >
                    {copiedKey === 'fp' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                <span className="text-muted block text-[10px] font-mono uppercase">Tenant Scope</span>
                <span className="font-semibold text-default block mt-1">
                  {selectedError.tenant ? selectedError.tenant.name : 'Platform Engine'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                <span className="text-muted block text-[10px] font-mono uppercase">Route / Module</span>
                <span className="font-mono text-[11px] text-default block mt-1 truncate">
                  {selectedError.route || selectedError.module || 'System Backend'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                <span className="text-muted block text-[10px] font-mono uppercase">First Seen</span>
                <span className="font-mono text-[11px] text-default block mt-1">
                  {new Date(selectedError.first_seen_at).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                <span className="text-muted block text-[10px] font-mono uppercase">Last Seen</span>
                <span className="font-mono text-[11px] text-default block mt-1">
                  {new Date(selectedError.last_seen_at).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                <span className="text-muted block text-[10px] font-mono uppercase">Environment / IP</span>
                <span className="font-mono text-[11px] text-default block mt-1">
                  {selectedError.environment} ({selectedError.ip || 'Local'})
                </span>
              </div>
            </div>

            {/* Stack Trace */}
            {selectedError.stack_trace && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-default font-mono">
                    Stack Trace
                  </span>
                  <button
                    onClick={() => handleCopy('st', selectedError.stack_trace || '')}
                    className="text-xs text-muted hover:text-default flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'st' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    <span>Copy Trace</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto border border-slate-800 select-all">
                  {selectedError.stack_trace}
                </pre>
              </div>
            )}

            {/* Triage & Status Management */}
            <div className="p-4 rounded-xl bg-surface-sunken border border-default space-y-3">
              <span className="text-xs font-bold text-default font-mono uppercase">
                Triage Action & Resolution Notes
              </span>
              <textarea
                rows={2}
                placeholder="Add resolution details, PR reference, or triage notes..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-surface border border-default text-xs text-default placeholder:text-muted focus:outline-hidden focus:border-primary"
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: selectedError.id, status: 'investigating', note: resolutionNote })}
                  disabled={updateStatusMutation.isPending}
                >
                  Mark as Investigating
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: selectedError.id, status: 'resolved', note: resolutionNote })}
                  disabled={updateStatusMutation.isPending}
                >
                  Mark as Resolved
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: selectedError.id, status: 'ignored', note: resolutionNote })}
                  disabled={updateStatusMutation.isPending}
                >
                  Ignore Error
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-default">
              <Button variant="secondary" size="sm" onClick={() => setSelectedError(null)}>
                Close Diagnostic
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformErrorMonitoringWorkspace;
