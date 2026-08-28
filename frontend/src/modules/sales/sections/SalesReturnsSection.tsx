import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, RefreshCw, Search } from 'lucide-react';
import type { SalesReturn } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';

export function SalesReturnsSection() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get<SalesReturn[]>('/sales/returns');
      setReturns(res.data ?? []);
    } catch (err) {
      console.error('Failed to load sales returns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleApprove = async (returnId: number) => {
    setActionLoading(returnId);
    try {
      await api.post(`/sales/returns/${returnId}/approve`, {});
      await fetchReturns();
    } catch (err) {
      console.error('Failed to approve sales return', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReturns = returns.filter((r) => {
    return (
      r.return_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.credit_note_number?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusBadge = (status: SalesReturn['status']) => {
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
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by return #, credit note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchReturns}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Return Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Credit Note #</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Restock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading returns...' : 'No sales returns found.'}
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                      {ret.return_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{ret.return_date}</td>
                    <td className="px-4 py-3 text-zinc-200">
                      {ret.customer_name ?? 'Counter Customer'}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      {ret.credit_note_number ?? '-'}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                      {parseFloat(ret.total_amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-zinc-500">BDT</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                          ret.restock
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {ret.restock ? 'Yes (Inventory)' : 'Scrap'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(ret.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {ret.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(ret.id)}
                          disabled={actionLoading === ret.id}
                          className="rounded bg-emerald-600/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50"
                        >
                          {actionLoading === ret.id ? 'Approving...' : 'Approve & Restock'}
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
