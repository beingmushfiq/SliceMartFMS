import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import type { PurchaseRequisition } from '../../../types/api/purchasing';
import { api } from '../../../lib/api/client';

export function PurchaseRequisitionsSection() {
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const res = await api.get<PurchaseRequisition[]>('/purchasing/requisitions');
      setRequisitions(res.data ?? []);
    } catch (err) {
      console.error('Failed to load purchase requisitions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const handleApprove = async (reqId: number) => {
    setActionLoading(reqId);
    try {
      await api.post(`/purchasing/requisitions/${reqId}/approve`, {});
      await fetchRequisitions();
    } catch (err) {
      console.error('Failed to approve PR', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequisitions = requisitions.filter(
    (r) =>
      r.requisition_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase()) ||
      r.requester_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: PurchaseRequisition['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Approved
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileSpreadsheet className="h-3 w-3 text-purple-400" /> Converted to PO
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 text-rose-400" /> Rejected
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequisitions}
            disabled={loading}
            className="p-2 text-muted hover:text-default hover:bg-surface-sunken rounded-xl border border-default transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search requisition #, department, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="rounded-2xl border border-default bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">Requisition #</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Target Warehouse</th>
                <th className="px-4 py-3.5">Req Date</th>
                <th className="px-4 py-3.5">Required By</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading requisitions...' : 'No purchase requisitions found'}
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      {r.requisition_number}
                    </td>
                    <td className="px-4 py-3.5 text-default font-medium">{r.department ?? '—'}</td>
                    <td className="px-4 py-3.5 text-muted">{r.warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-muted">{r.requisition_date}</td>
                    <td className="px-4 py-3.5 font-mono text-muted">
                      {r.required_by_date ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
                    <td className="px-4 py-3.5 text-right">
                      {r.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(r.id)}
                          disabled={actionLoading === r.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {actionLoading === r.id ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
