import { useState, useEffect } from 'react';
import { Clock, RefreshCw, Search, Undo2, XCircle } from 'lucide-react';
import type { PurchaseReturn } from '../../../types/api/purchasing';
import { api } from '../../../lib/api/client';

export function PurchaseReturnsSection() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get<PurchaseReturn[]>('/purchasing/returns');
      setReturns(res.data ?? []);
    } catch (err) {
      console.error('Failed to load purchase returns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filteredReturns = returns.filter(
    (r) =>
      r.return_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: PurchaseReturn['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Undo2 className="h-3 w-3 text-rose-400" /> Returned
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-700/20 text-zinc-400 border border-zinc-700/30">
            <XCircle className="h-3 w-3 text-zinc-400" /> Cancelled
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
            onClick={fetchReturns}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg border border-zinc-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search return #, supplier, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="rounded-2xl border border-default bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">Return #</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Warehouse</th>
                <th className="px-4 py-3.5">Return Date</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5 text-right">Total Debit</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading debit returns...' : 'No purchase returns found'}
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      {r.return_number}
                    </td>
                    <td className="px-4 py-3.5 text-default font-medium">{r.supplier_name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-muted">{r.warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-muted">{r.return_date}</td>
                    <td className="px-4 py-3.5 text-muted">{r.reason ?? '—'}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {r.currency_code} {parseFloat(r.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
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
