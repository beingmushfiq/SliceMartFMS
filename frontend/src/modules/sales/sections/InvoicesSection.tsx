import { useState, useEffect } from 'react';
import { Ban, CheckCircle2, Clock, Printer, RefreshCw, Search, Sliders } from 'lucide-react';
import type { Invoice } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';
import { InvoiceTemplateBuilder } from '../components/InvoiceTemplateBuilder';

export function InvoicesSection() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showVoidModal, setShowVoidModal] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [showDesigner, setShowDesigner] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get<Invoice[]>('/sales/invoices');
      setInvoices(res.data ?? []);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleApprove = async (invoiceId: number) => {
    setActionLoading(invoiceId);
    try {
      await api.post(`/sales/invoices/${invoiceId}/approve`, {});
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to post invoice', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVoidModal) return;
    setActionLoading(showVoidModal);
    try {
      await api.post(`/sales/invoices/${showVoidModal}/void`, {
        void_reason: voidReason,
      });
      setShowVoidModal(null);
      setVoidReason('');
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to void invoice', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.sales_order_number?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        );
      case 'posted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="h-3 w-3 text-blue-400" /> Posted
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Paid
          </span>
        );
      case 'void':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Ban className="h-3 w-3 text-rose-400" /> Voided
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
              placeholder="Search by invoice #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </select>

          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowDesigner(true)}
          className="flex h-9 items-center gap-1.5 rounded-md bg-zinc-800 border border-zinc-700 px-3.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white"
        >
          <Sliders className="h-3.5 w-3.5 text-emerald-400" />
          Template Designer & Preview
        </button>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Tax</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading invoices...' : 'No invoices found.'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{inv.invoice_date}</td>
                    <td className="px-4 py-3 text-zinc-200">
                      {inv.customer_name ?? 'Counter Customer'}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      {parseFloat(inv.subtotal || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {parseFloat(inv.tax_amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                      {parseFloat(inv.total_amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="inline-flex items-center gap-1 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
                      >
                        <Printer className="h-3 w-3" /> Print
                      </button>
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(inv.id)}
                          disabled={actionLoading === inv.id}
                          className="rounded bg-blue-600/20 px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:bg-blue-600/30 disabled:opacity-50"
                        >
                          {actionLoading === inv.id ? 'Posting...' : 'Post'}
                        </button>
                      )}
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => setShowVoidModal(inv.id)}
                          className="rounded bg-rose-600/20 px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-600/30"
                        >
                          Void
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

      {/* Void Confirmation Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">Void Invoice</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Provide a valid reason for voiding this invoice. This operation is permanent.
            </p>
            <form onSubmit={handleVoid} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Void Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Order cancelled prior to delivery or duplicate invoice..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoidModal(null);
                    setVoidReason('');
                  }}
                  className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="rounded-md bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {actionLoading !== null ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Template Designer Modal */}
      {(showDesigner || previewInvoice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
            <InvoiceTemplateBuilder
              invoice={previewInvoice ?? undefined}
              onClose={() => {
                setShowDesigner(false);
                setPreviewInvoice(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
