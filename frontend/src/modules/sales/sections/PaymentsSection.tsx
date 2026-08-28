import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Plus, RefreshCw, Search } from 'lucide-react';
import type { Payment } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';

export function PaymentsSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Payment form state
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [method, setMethod] = useState<
    'cash' | 'bank_transfer' | 'cheque' | 'card' | 'mobile_banking' | 'credit_adjustment'
  >('cash');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get<Payment[]>('/sales/payments');
      setPayments(res.data ?? []);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/sales/payments', {
        direction,
        method,
        amount,
        payment_date: paymentDate,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      });
      setShowCreateModal(false);
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      await fetchPayments();
    } catch (err) {
      console.error('Failed to record payment', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.payment_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(search.toLowerCase());

    const matchesDirection = directionFilter === 'all' || p.direction === directionFilter;

    return matchesSearch && matchesDirection;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by payment #, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Directions</option>
            <option value="in">Inflow (Customer Receipts)</option>
            <option value="out">Outflow (Vendor/Refunds)</option>
          </select>

          <button
            onClick={fetchPayments}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" />
          Record Payment
        </button>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Payment Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Allocated</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading payments...' : 'No payments found.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                      {p.payment_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{p.payment_date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          p.direction === 'in'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.direction === 'in' ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        {p.direction === 'in' ? 'Inflow' : 'Outflow'}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] text-zinc-300">
                      {p.method.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">
                      {p.reference_number ?? '-'}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                      {parseFloat(p.amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-zinc-500">{p.currency_code}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {parseFloat(p.allocated_amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">Record Payment Transaction</h3>
            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as typeof direction)}
                    className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="in">Customer Inflow (Receipt)</option>
                    <option value="out">Vendor Outflow (Payment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as typeof method)}
                    className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Amount (BDT)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  placeholder="e.g. 5000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">
                  Transaction / Cheque Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRX-9823412 or Cheque #0012"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional memo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
