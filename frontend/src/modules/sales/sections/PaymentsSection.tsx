import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Search, Printer } from 'lucide-react';
import type { Payment } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';
import { PrintPreviewModal } from '../../../components/print/PrintPreviewModal';
import { PaymentReceiptDocument } from '../../../components/print/documents/PaymentReceiptDocument';
import { useBusinessConfig } from '../../../lib/document/useBusinessConfig';

export function PaymentsSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [printPayment, setPrintPayment] = useState<Payment | null>(null);
  const { config: businessConfig } = useBusinessConfig();

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
    let ignore = false;
    api.get<Payment[]>('/sales/payments')
      .then((res) => {
        if (!ignore) setPayments(res.data ?? []);
      })
      .catch((err) => {
        console.error('Failed to load payments', err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
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
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by payment #, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-xl border border-default bg-surface-sunken pl-8 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="h-9 rounded-xl border border-default bg-surface-sunken px-3 text-xs text-default focus:border-primary focus:outline-none"
          >
            <option value="all">All Directions</option>
            <option value="in">Inflow (Customer Receipts)</option>
            <option value="out">Outflow (Vendor/Refunds)</option>
          </select>

          <button
            onClick={fetchPayments}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 text-xs font-medium text-muted hover:bg-surface hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Record Payment
        </button>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Payment Number</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Direction</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Reference</th>
                <th className="px-4 py-3.5">Total Amount</th>
                <th className="px-4 py-3.5">Allocated</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading payments...' : 'No payments found.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {p.payment_number}
                    </td>
                    <td className="px-4 py-3.5 text-muted">{p.payment_date}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          p.direction === 'in'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
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
                    <td className="px-4 py-3.5 uppercase text-[10px] text-default font-medium">
                      {p.method.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3.5 text-muted font-mono">
                      {p.reference_number ?? '-'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      {parseFloat(p.amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-muted">{p.currency_code}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted">
                      {parseFloat(p.allocated_amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setPrintPayment(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-default text-muted hover:text-default hover:bg-surface text-xs transition-colors cursor-pointer"
                        title="Print Money Receipt"
                      >
                        <Printer className="size-3.5 text-primary" />
                        <span>Print</span>
                      </button>
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
          <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-xl">
            <h3 className="text-base font-semibold text-default">Record Payment / Receipt</h3>
            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-default mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as typeof direction)}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                  >
                    <option value="in">Customer Inflow (Receipt)</option>
                    <option value="out">Vendor Outflow (Payment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-default mb-1">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as typeof method)}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
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
                <label className="block text-xs font-medium text-default mb-1">Amount (BDT)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  placeholder="e.g. 5000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-default mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-default mb-1">
                  Transaction / Cheque Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRX-9823412 or Cheque #0012"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-default mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional memo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-default px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-sunken hover:text-default transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Payment Receipt Modal */}
      {printPayment && (
        <PrintPreviewModal
          isOpen={Boolean(printPayment)}
          onClose={() => setPrintPayment(null)}
          title={`Money Receipt: ${printPayment.payment_number}`}
          documentNumber={printPayment.payment_number}
          documentType="Official Money Receipt Voucher"
          pageClass="print-page-a4"
        >
          <PaymentReceiptDocument payment={printPayment} businessConfig={businessConfig} />
        </PrintPreviewModal>
      )}
    </div>
  );
}
