import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api/client';
import type { PlatformAuditLog } from '../../types/api/platform';
import { SelectDropdown } from '../../components/ui/Dropdown';
import {
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AuditResponsePayload {
  data: PlatformAuditLog[];
  meta: {
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
  };
}

export const PlatformAuditWorkspace: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);

  // Filters & Pagination
  const [entityType, setEntityType] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(25);

  const { data, isLoading, isFetching, refetch } = useQuery<AuditResponsePayload>({
    queryKey: ['platform', 'audit-logs', entityType, actionFilter, page, perPage],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (entityType !== 'all') params['entity_type'] = entityType;
      if (actionFilter !== 'all') params['action'] = actionFilter;

      const response = await api.get<AuditResponsePayload>('/platform/audit-logs', { params });
      return response.data;
    },
  });

  const logs = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default tracking-tight">Platform Audit Trail</h1>
          <p className="text-xs text-muted mt-1 font-mono">
            Immutable append-only ledger of all platform administration and cross-tenant mutations.
          </p>
        </div>

        <button
          onClick={() => {
            refetch();
            toast.success('Audit ledger refreshed.');
          }}
          disabled={isFetching}
          className="px-3 py-2 rounded-lg bg-surface-sunken hover:bg-surface border border-default text-muted hover:text-default text-xs font-mono flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-surface border border-default flex flex-wrap gap-4 items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Target Entity:</span>
          </div>
          <SelectDropdown
            options={[
              { value: 'all', label: 'All Entity Types' },
              { value: 'Tenant', label: 'Tenant' },
              { value: 'Plan', label: 'Plan' },
              { value: 'User', label: 'User' },
            ]}
            value={entityType}
            onChange={(val) => setEntityType(val)}
            size="sm"
            aria-label="Filter by target entity"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted">Action:</span>
          <SelectDropdown
            options={[
              { value: 'all', label: 'All Actions' },
              { value: 'created', label: 'Created', colorDot: 'bg-emerald-500' },
              { value: 'updated', label: 'Updated', colorDot: 'bg-blue-500' },
              { value: 'deleted', label: 'Deleted', colorDot: 'bg-rose-500' },
            ]}
            value={actionFilter}
            onChange={(val) => setActionFilter(val)}
            size="sm"
            aria-label="Filter by action"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-surface border border-default shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted text-xs font-mono animate-pulse">
            Loading immutable audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted text-xs font-mono">
            No audit log records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-xs font-mono">
              <thead className="bg-surface-sunken border-b border-default text-muted uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 pl-6">Timestamp</th>
                  <th className="py-3.5">Action</th>
                  <th className="py-3.5">Auditable Entity</th>
                  <th className="py-3.5">Tenant Scope</th>
                  <th className="py-3.5">Super Admin Actor</th>
                  <th className="py-3.5 pr-6 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3.5 pl-6 text-muted text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] uppercase font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 text-default">
                      {log.auditable_type} #{log.auditable_id}
                    </td>
                    <td className="py-3.5 text-muted">
                      {log.tenant ? `${log.tenant.name} (#${log.tenant.id})` : 'Global Platform'}
                    </td>
                    <td className="py-3.5 text-default font-medium">
                      {log.user?.name ?? 'System Master'}
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded bg-surface-sunken hover:bg-surface border border-default text-default text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
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
          <div className="px-6 py-3.5 bg-surface-sunken border-t border-default flex items-center justify-between font-mono text-xs text-muted">
            <div>
              Showing page <span className="text-default font-bold">{pagination.page}</span> of <span className="text-default font-bold">{pagination.total_pages}</span> ({pagination.total} total events)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isFetching}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-sunken border border-default disabled:opacity-40 disabled:cursor-not-allowed text-default flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={pagination.page >= pagination.total_pages || isFetching}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-sunken border border-default disabled:opacity-40 disabled:cursor-not-allowed text-default flex items-center gap-1 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-overlay/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-default rounded-2xl p-6 max-w-2xl w-full shadow-2xl font-mono text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-3 mb-4">
              <h2 className="text-base font-bold text-default font-sans">
                Audit Record #{selectedLog.id} Detail
              </h2>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold uppercase text-[10px]">
                {selectedLog.action}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-[11px]">
              <div>
                <span className="text-muted block">Actor:</span>
                <span className="text-default">{selectedLog.user?.name ?? 'System'} ({selectedLog.user?.email ?? 'N/A'})</span>
              </div>
              <div>
                <span className="text-muted block">IP Address:</span>
                <span className="text-default">{selectedLog.ip ?? '127.0.0.1'}</span>
              </div>
              <div>
                <span className="text-muted block">Entity:</span>
                <span className="text-default">{selectedLog.auditable_type} #{selectedLog.auditable_id}</span>
              </div>
              <div>
                <span className="text-muted block">Timestamp:</span>
                <span className="text-default">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
            </div>

            {selectedLog.before && (
              <div className="mb-4">
                <span className="text-muted block mb-1 font-bold">State Before Mutation:</span>
                <pre className="p-3 rounded-xl bg-surface-sunken border border-default text-[10px] text-rose-600 dark:text-rose-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.before, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.after && (
              <div className="mb-4">
                <span className="text-muted block mb-1 font-bold">State After Mutation:</span>
                <pre className="p-3 rounded-xl bg-surface-sunken border border-default text-[10px] text-emerald-600 dark:text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.after, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-surface-sunken hover:bg-surface border border-default text-default"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlatformAuditWorkspace;
