import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, RefreshCw, Search, Send, Truck, XCircle } from 'lucide-react';
import type { StockTransfer } from '../../../types/api/inventory';
import { api } from '../../../lib/api/client';

export function StockTransfersSection() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get<StockTransfer[]>('/inventory/transfers');
      setTransfers(res.data ?? []);
    } catch (err) {
      console.error('Failed to load transfers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleDispatch = async (transferId: number) => {
    setActionLoading(transferId);
    try {
      await api.post(`/inventory/transfers/${transferId}/dispatch`, {});
      await fetchTransfers();
    } catch (err) {
      console.error('Failed to dispatch transfer', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTransfers = transfers.filter(
    (t) =>
      t.transfer_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.from_warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.to_warehouse_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: StockTransfer['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-surface-sunken text-muted border border-default">
            <Clock className="size-3 text-muted" /> Draft
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Truck className="size-3 text-blue-500" /> In Transit
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3 text-emerald-500" /> Received
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
            onClick={fetchTransfers}
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
            placeholder="Search transfer #, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Transfers Data Grid Container */}
      <div className="rounded-2xl border border-default bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken/70 text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">Transfer #</th>
                <th className="px-4 py-3.5">Origin Warehouse</th>
                <th className="px-4 py-3.5">Destination Warehouse</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    {loading ? 'Loading inter-warehouse transfers...' : 'No transfer records found'}
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-sunken/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-semibold text-default">
                      {t.transfer_number}
                    </td>
                    <td className="px-4 py-3.5 text-default">{t.from_warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-default">{t.to_warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-muted">{t.transfer_date}</td>
                    <td className="px-4 py-3.5">{getStatusBadge(t.status)}</td>
                    <td className="px-4 py-3.5 text-muted font-mono">
                      {t.items?.length ?? 0} sku(s)
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {t.status === 'draft' && (
                        <button
                          onClick={() => handleDispatch(t.id)}
                          disabled={actionLoading === t.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors"
                        >
                          <Send className="size-3" />
                          <span>{actionLoading === t.id ? 'Dispatching...' : 'Dispatch'}</span>
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
