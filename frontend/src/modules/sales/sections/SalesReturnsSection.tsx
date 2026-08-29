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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-surface-sunken text-muted border border-default">
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
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by return #, credit note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-xl border border-default bg-surface-sunken pl-8 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <button
            onClick={fetchReturns}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 text-xs font-medium text-muted hover:bg-surface hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Return Number</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Credit Note #</th>
                <th className="px-4 py-3.5">Total Amount</th>
                <th className="px-4 py-3.5">Restock</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading returns...' : 'No sales returns found.'}
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {ret.return_number}
                    </td>
                    <td className="px-4 py-3.5 text-muted">{ret.return_date}</td>
                    <td className="px-4 py-3.5 text-default font-medium">
                      {ret.customer_name ?? 'Counter Customer'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted">
                      {ret.credit_note_number ?? '-'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      {parseFloat(ret.total_amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-muted">BDT</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                          ret.restock
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-surface-sunken text-muted border border-default'
                        }`}
                      >
                        {ret.restock ? 'Yes (Inventory)' : 'Scrap'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(ret.status)}</td>
                    <td className="px-4 py-3.5 text-right">
                      {ret.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(ret.id)}
                          disabled={actionLoading === ret.id}
                          className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors cursor-pointer"
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
