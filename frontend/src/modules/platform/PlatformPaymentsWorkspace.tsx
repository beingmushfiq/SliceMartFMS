import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api/client';
import type { PlatformPayment, PlatformTenant } from '../../types/api/platform';
import { SelectDropdown } from '../../components/ui/Dropdown';
import { Button } from '../../components/ui/Button';
import {
  Search,
  RotateCcw,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface PaymentsResponse {
  data: PlatformPayment[];
  meta: {
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
  };
}

export const PlatformPaymentsWorkspace: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & Pagination
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(25);

  // New Payment Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('BDT');
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState<string>('');

  // Fetch Tenants for dropdown filter and creation modal
  const { data: tenants = [] } = useQuery<PlatformTenant[]>({
    queryKey: ['platform', 'tenants', 'simple-list'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: PlatformTenant[] } | PlatformTenant[]>('/platform/tenants?per_page=100');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && 'data' in res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  // Fetch Payments List
  const { data, isLoading, isFetching, refetch } = useQuery<PaymentsResponse>({
    queryKey: ['platform', 'payments', tenantFilter, statusFilter, search, page, perPage],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (tenantFilter !== 'all') params['tenant_id'] = tenantFilter;
      if (statusFilter !== 'all') params['status'] = statusFilter;
      if (search) params['search'] = search;

      const res = await api.get<PaymentsResponse>('/platform/payments', { params });
      return res.data;
    },
  });

  const payments = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  // Record Payment Mutation
  const recordMutation = useMutation({
    mutationFn: async (payload: {
      tenant_id: number;
      amount: number;
      currency_code: string;
      payment_method: string;
      transaction_reference?: string;
      payment_date: string;
      notes?: string;
      status: 'paid' | 'pending';
    }) => {
      const res = await api.post<{ payment: PlatformPayment }>(`/platform/tenants/${payload.tenant_id}/payments`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Subscription payment recorded successfully');
      setShowCreateModal(false);
      setSelectedTenantId('');
      setAmount('');
      setTransactionRef('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['platform', 'payments'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      toast.error(msg);
    },
  });

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      toast.error('Please select a target tenant');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const payload: {
      tenant_id: number;
      amount: number;
      currency_code: string;
      payment_method: string;
      transaction_reference?: string;
      payment_date: string;
      notes?: string;
      status: 'paid' | 'pending';
    } = {
      tenant_id: Number(selectedTenantId),
      amount: Number(amount),
      currency_code: currencyCode,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      status: 'paid',
    };
    if (transactionRef) {
      payload.transaction_reference = transactionRef;
    }
    if (notes) {
      payload.notes = notes;
    }

    recordMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">SaaS Subscription Payments</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Cross-tenant SaaS billing ledger, revenue receipts, and subscription payment audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 font-mono text-xs cursor-pointer border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 font-mono text-xs font-bold cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            <Plus className="size-4" />
            <span>Record Payment</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice ref, txn id, notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
          />
        </div>

        {/* Tenant Filter */}
        <div className="w-48">
          <SelectDropdown
            value={tenantFilter}
            onChange={(val) => {
              setTenantFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Tenants' },
              ...tenants.map((t) => ({ value: String(t.id), label: t.name })),
            ]}
          />
        </div>

        {/* Status Filter */}
        <div className="w-36">
          <SelectDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
            ]}
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading subscription payments ledger...
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3">Invoice Ref</th>
                  <th className="px-5 py-3">Tenant</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Txn Reference</th>
                  <th className="px-5 py-3">Payment Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-100">{p.invoice_reference}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Building2 className="size-3 text-slate-500" />
                        <span>{p.tenant?.name ?? `Tenant #${p.tenant_id}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-bold text-amber-400">
                      {p.currency_code === 'BDT' ? '৳' : p.currency_code + ' '}
                      {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-slate-300 capitalize">
                      {p.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-[11px]">
                      {p.transaction_reference || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(p.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : p.status === 'refunded'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {p.status === 'paid' && <CheckCircle2 className="size-2.5" />}
                        {p.status === 'pending' && <Clock className="size-2.5" />}
                        {p.status === 'failed' && <XCircle className="size-2.5" />}
                        {p.status === 'refunded' && <AlertCircle className="size-2.5" />}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-[11px]">
                      {p.creator?.name ?? 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No payment transactions match the active filters.
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.total_pages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="size-8 p-0 cursor-pointer border-slate-800 text-slate-300"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-slate-200">
                {pagination.page} / {pagination.total_pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                className="size-8 p-0 cursor-pointer border-slate-800 text-slate-300"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono text-xs">
            <h2 className="text-lg font-bold text-slate-100 font-sans">Record SaaS Payment</h2>
            <p className="text-slate-400 mt-1">
              Add subscription transaction record and generate an invoice receipt.
            </p>

            <form onSubmit={handleSubmitPayment} className="mt-4 space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Target Tenant *</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Currency</label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="bank_transfer">Bank Transfer (EFT)</option>
                    <option value="bkash">bKash Merchant</option>
                    <option value="nagad">Nagad Direct</option>
                    <option value="stripe">Stripe / Card</option>
                    <option value="cash">Cash / Direct</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Txn / Bank Ref ID</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. TRX-8823901"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Notes / Memo</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Billing memo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordMutation.isPending || !selectedTenantId || !amount}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {recordMutation.isPending ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformPaymentsWorkspace;
