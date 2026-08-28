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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3 text-amber-400" /> Draft
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Approved
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 text-rose-400" /> {status}
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
            onClick={fetchAdjustments}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg border border-zinc-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search adjustment #, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Adjustment #</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Reason Code</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading stock adjustments...' : 'No adjustment records found'}
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                      {a.adjustment_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{a.warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-300">{a.reason_name ?? a.reason_code ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{a.adjustment_date}</td>
                    <td className="px-4 py-3">{getStatusBadge(a.status)}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">
                      {a.items?.length ?? 0} item(s)
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(a.id)}
                          disabled={actionLoading === a.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {actionLoading === a.id ? 'Approving...' : 'Approve'}
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
