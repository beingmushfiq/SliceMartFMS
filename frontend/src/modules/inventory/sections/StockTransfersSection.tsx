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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="h-3 w-3 text-blue-400" /> In Transit
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Received
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 text-rose-400" /> Cancelled
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
            onClick={fetchTransfers}
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
            placeholder="Search transfer #, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Transfer #</th>
                <th className="px-4 py-3">Origin Warehouse</th>
                <th className="px-4 py-3">Destination Warehouse</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading inter-warehouse transfers...' : 'No transfer records found'}
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                      {t.transfer_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{t.from_warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-200">{t.to_warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{t.transfer_date}</td>
                    <td className="px-4 py-3">{getStatusBadge(t.status)}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">
                      {t.items?.length ?? 0} sku(s)
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status === 'draft' && (
                        <button
                          onClick={() => handleDispatch(t.id)}
                          disabled={actionLoading === t.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
                        >
                          <Send className="h-3 w-3" />
                          {actionLoading === t.id ? 'Dispatching...' : 'Dispatch'}
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
