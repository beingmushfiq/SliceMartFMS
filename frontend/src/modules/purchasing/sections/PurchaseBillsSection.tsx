import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, CreditCard, RefreshCw, Search, XCircle } from 'lucide-react';
import type { PurchaseBill } from '../../../types/api/purchasing';
import { api } from '../../../lib/api/client';

export function PurchaseBillsSection() {
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get<PurchaseBill[]>('/purchasing/bills');
      setBills(res.data ?? []);
    } catch (err) {
      console.error('Failed to load purchase bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const filteredBills = bills.filter(
    (b) =>
      b.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.supplier_invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.po_number?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: PurchaseBill['status']) => {
    switch (status) {
      case 'draft':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3 text-amber-400" /> Pending AP
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="h-3 w-3 text-blue-400" /> Approved
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CreditCard className="h-3 w-3 text-emerald-400" /> Settled
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
            onClick={fetchBills}
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
            placeholder="Search bill #, supplier invoice #, PO #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="rounded-2xl border border-default bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">Bill Number</th>
                <th className="px-4 py-3.5">Supplier Invoice #</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Bill Date</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5 text-right">Grand Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading purchase bills...' : 'No purchase bills found'}
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      {b.bill_number}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted">
                      {b.supplier_invoice_number}
                    </td>
                    <td className="px-4 py-3.5 text-default font-medium">{b.supplier_name ?? '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-muted">{b.bill_date}</td>
                    <td className="px-4 py-3.5 font-mono text-muted">{b.due_date}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-default">
                      {b.currency_code} {parseFloat(b.grand_total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(b.status)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          b.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : b.payment_status === 'partially_paid'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-surface-sunken text-muted border border-default'
                        }`}
                      >
                        {b.payment_status?.replace('_', ' ')}
                      </span>
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
