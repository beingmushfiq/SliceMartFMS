import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api/client';
import type { PlatformAuditLog } from '../../types/api/platform';
import {
  Filter,
  RefreshCw,
  Eye,
} from 'lucide-react';

export const PlatformAuditWorkspace: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);

  // Filters
  const [entityType, setEntityType] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs = [], isLoading, isFetching, refetch } = useQuery<PlatformAuditLog[]>({
    queryKey: ['platform', 'audit-logs', entityType, actionFilter],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (entityType !== 'all') params['entity_type'] = entityType;
        if (actionFilter !== 'all') params['action'] = actionFilter;

        const response = await api.get<{
          data: PlatformAuditLog[];
          meta: { pagination: { total: number; current_page: number } };
        }>('/platform/audit-logs', { params });

        // Handle envelope structure
        if (Array.isArray(response.data)) {
          return response.data as PlatformAuditLog[];
        } else if (response.data && Array.isArray((response.data as { data?: PlatformAuditLog[] }).data)) {
          return (response.data as { data: PlatformAuditLog[] }).data;
        }
      } catch {
        // Error fallback
      }
      return [];
    },
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Platform Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Immutable append-only ledger of all platform administration and cross-tenant mutations.
          </p>
        </div>

        <button
          onClick={() => {
            refetch();
            toast.success('Audit ledger refreshed.');
          }}
          disabled={isFetching}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap gap-4 items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Target Entity:</span>
          </div>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Entity Types</option>
            <option value="Tenant">Tenant</option>
            <option value="Plan">Plan</option>
            <option value="User">User</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono animate-pulse">
            Loading immutable audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            No audit log records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 pl-6">Timestamp</th>
                  <th className="py-3.5">Action</th>
                  <th className="py-3.5">Auditable Entity</th>
                  <th className="py-3.5">Tenant Scope</th>
                  <th className="py-3.5">Super Admin Actor</th>
                  <th className="py-3.5 pr-6 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pl-6 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-200">
                      {log.auditable_type} #{log.auditable_id}
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {log.tenant ? `${log.tenant.name} (#${log.tenant.id})` : 'Global Platform'}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {log.user?.name ?? 'System Master'}
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] inline-flex items-center gap-1 transition-colors"
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
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl font-mono text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-100 font-sans">
                Audit Record #{selectedLog.id} Detail
              </h2>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase text-[10px]">
                {selectedLog.action}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-[11px]">
              <div>
                <span className="text-slate-400 block">Actor:</span>
                <span className="text-slate-200">{selectedLog.user?.name ?? 'System'} ({selectedLog.user?.email ?? 'N/A'})</span>
              </div>
              <div>
                <span className="text-slate-400 block">IP Address:</span>
                <span className="text-slate-200">{selectedLog.ip ?? '127.0.0.1'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Entity:</span>
                <span className="text-slate-200">{selectedLog.auditable_type} #{selectedLog.auditable_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Timestamp:</span>
                <span className="text-slate-200">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
            </div>

            {selectedLog.before && (
              <div className="mb-4">
                <span className="text-slate-400 block mb-1 font-bold">State Before Mutation:</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-rose-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.before, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.after && (
              <div className="mb-4">
                <span className="text-slate-400 block mb-1 font-bold">State After Mutation:</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.after, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
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
