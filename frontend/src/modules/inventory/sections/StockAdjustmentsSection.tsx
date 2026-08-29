import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import type { StockAdjustment } from '../../../types/api/inventory';
import { api } from '../../../lib/api/client';

export function StockAdjustmentsSection() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await api.get<StockAdjustment[]>('/inventory/adjustments');
      setAdjustments(res.data ?? []);
    } catch (err) {
      console.error('Failed to load adjustments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const handleApprove = async (adjId: number) => {
    setActionLoading(adjId);
    try {
      await api.post(`/inventory/adjustments/${adjId}/approve`, {});
      await fetchAdjustments();
    } catch (err) {
      console.error('Failed to approve adjustment', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.adjustment_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.reason_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: StockAdjustment['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Clock className="size-3 text-amber-500" /> Draft
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3 text-emerald-500" /> Approved
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle className="size-3 text-rose-500" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdjustments}
            disabled={loading}
            className="p-2 text-muted hover:text-default hover:bg-surface-sunken rounded-xl border border-default transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder="Search adjustment #, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Adjustments Data Grid Container */}
      <div className="rounded-2xl border border-default bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken/70 text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">Adjustment #</th>
                <th className="px-4 py-3.5">Warehouse</th>
                <th className="px-4 py-3.5">Reason Code</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    {loading ? 'Loading stock adjustments...' : 'No adjustment records found'}
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-sunken/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-semibold text-default">
                      {a.adjustment_number}
                    </td>
                    <td className="px-4 py-3.5 text-default">{a.warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-default font-medium">{a.reason_name ?? a.reason_code ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted">{a.adjustment_date}</td>
                    <td className="px-4 py-3.5">{getStatusBadge(a.status)}</td>
                    <td className="px-4 py-3.5 text-muted font-mono">
                      {a.items?.length ?? 0} item(s)
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {a.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(a.id)}
                          disabled={actionLoading === a.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs transition-colors"
                        >
                          <ShieldCheck className="size-3" />
                          <span>{actionLoading === a.id ? 'Approving...' : 'Approve'}</span>
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
