import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, RefreshCw, Search, XCircle } from 'lucide-react';
import type { GoodsReceipt } from '../../../types/api/purchasing';
import { api } from '../../../lib/api/client';

export function GoodsReceiptsSection() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.get<GoodsReceipt[]>('/purchasing/receipts');
      setReceipts(res.data ?? []);
    } catch (err) {
      console.error('Failed to load goods receipts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const filteredReceipts = receipts.filter(
    (r) =>
      r.grn_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      (r.supplier_document_number &&
        r.supplier_document_number.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: GoodsReceipt['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        );
      case 'completed':
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
            onClick={fetchReceipts}
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
            placeholder="Search GRN #, supplier, PO #, challan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Goods Receipts Table */}
      <div className="rounded-2xl border border-default bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">GRN #</th>
                <th className="px-4 py-3.5">PO Reference</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Challan / Inv #</th>
                <th className="px-4 py-3.5">Receipt Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Received Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading goods receipts...' : 'No goods receipt notes found'}
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      {r.grn_number}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted">{r.po_number ?? '—'}</td>
                    <td className="px-4 py-3.5 text-default font-medium">{r.supplier_name ?? '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-muted">
                      {r.supplier_document_number ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted">{r.receipt_date}</td>
                    <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
                    <td className="px-4 py-3.5 text-muted font-mono">
                      {r.items?.length ?? 0} item(s)
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
