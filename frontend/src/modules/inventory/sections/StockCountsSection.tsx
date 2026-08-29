import { useState, useEffect } from 'react';
import { Calculator, CheckCircle2, Clock, RefreshCw, Search, XCircle } from 'lucide-react';
import type { StockCount } from '../../../types/api/inventory';
import { api } from '../../../lib/api/client';

export function StockCountsSection() {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const res = await api.get<StockCount[]>('/inventory/counts');
      setCounts(res.data ?? []);
    } catch (err) {
      console.error('Failed to load counts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const filteredCounts = counts.filter(
    (c) =>
      c.count_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.count_type?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: StockCount['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-surface-sunken text-muted border border-default">
            <Clock className="size-3 text-muted" /> Draft
          </span>
        );
      case 'counting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Calculator className="size-3 text-amber-500" /> Counting
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3 text-emerald-500" /> Reconciled
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle className="size-3 text-rose-500" /> Cancelled
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
            onClick={fetchCounts}
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
            placeholder="Search count session #, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Counts Data Grid Container */}
      <div className="rounded-2xl border border-default bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken/70 text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">Count Session #</th>
                <th className="px-4 py-3.5">Warehouse</th>
                <th className="px-4 py-3.5">Count Type</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Snapshotted Lines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredCounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    {loading ? 'Loading physical count sessions...' : 'No count sessions found'}
                  </td>
                </tr>
              ) : (
                filteredCounts.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-sunken/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-semibold text-default">
                      {c.count_number}
                    </td>
                    <td className="px-4 py-3.5 text-default">{c.warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3.5 capitalize text-muted">{c.count_type} count</td>
                    <td className="px-4 py-3.5 font-mono text-muted">{c.count_date}</td>
                    <td className="px-4 py-3.5">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-3.5 text-muted font-mono">
                      {c.items?.length ?? 0} item(s)
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
