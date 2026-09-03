import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  PauseCircle,
  Phone,
  AlertTriangle,
  Search,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { useCurrency } from '../../hooks/useCurrency';

interface RiskFactor {
  code: string;
  description: string;
  points: number;
}

interface FraudAssessment {
  id: number;
  uuid: string;
  sales_order_id: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: RiskFactor[];
  verification_status: 'pending_review' | 'verified' | 'on_hold' | 'rejected';
  verification_checklist?: {
    phone_confirmed?: boolean;
    address_validated?: boolean;
    items_confirmed?: boolean;
  };
  verification_notes?: string;
  verified_at?: string;
  sales_order?: {
    id: number;
    order_number: string;
    order_date: string;
    total_amount: string;
    currency: string;
    shipping_address?: string;
    status: string;
    customer?: {
      id: number;
      name: string;
      phone: string;
      email?: string;
    };
  };
}

export const OrderFraudVerificationWorkspace: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Active Review Modal
  const [selectedItem, setSelectedItem] = useState<FraudAssessment | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [checklist, setChecklist] = useState({
    phone_confirmed: false,
    address_validated: false,
    items_confirmed: false,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const {
    data: assessments = [],
    isLoading: loading,
    refetch: loadQueue,
  } = useQuery({
    queryKey: ['fraud-check', 'queue', riskFilter, statusFilter],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (riskFilter) params.append('risk_level', riskFilter);
      if (statusFilter) params.append('verification_status', statusFilter);

      const response = await api.get<{ data: FraudAssessment[] }>(
        `/fraud-check/queue?${params.toString()}`,
        { signal }
      );
      return response.data.data ?? [];
    },
  });

  const openReviewModal = (item: FraudAssessment) => {
    setSelectedItem(item);
    setReviewNotes(item.verification_notes || '');
    setChecklist({
      phone_confirmed: item.verification_checklist?.phone_confirmed ?? false,
      address_validated: item.verification_checklist?.address_validated ?? false,
      items_confirmed: item.verification_checklist?.items_confirmed ?? false,
    });
  };

  const handleVerify = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      await api.post(`/fraud-check/orders/${selectedItem.sales_order_id}/verify`, {
        notes: reviewNotes,
        checklist,
      });
      showToast(`Order ${selectedItem.sales_order?.order_number} verified & released.`);
      setSelectedItem(null);
      loadQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async () => {
    if (!selectedItem || !reviewNotes.trim()) {
      alert('Please enter reason/notes for putting the order on hold.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/fraud-check/orders/${selectedItem.sales_order_id}/hold`, {
        notes: reviewNotes,
      });
      showToast(`Order ${selectedItem.sales_order?.order_number} placed on hold.`);
      setSelectedItem(null);
      loadQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to hold order.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !reviewNotes.trim()) {
      alert('Please enter justification notes for rejecting the order.');
      return;
    }
    if (!confirm('Are you sure you want to mark this order as fraudulent and cancel it?')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/fraud-check/orders/${selectedItem.sales_order_id}/reject`, {
        notes: reviewNotes,
      });
      showToast(`Order ${selectedItem.sales_order?.order_number} rejected & cancelled.`);
      setSelectedItem(null);
      loadQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject order.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = assessments.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const orderNum = item.sales_order?.order_number?.toLowerCase() || '';
    const custName = item.sales_order?.customer?.name?.toLowerCase() || '';
    const custPhone = item.sales_order?.customer?.phone?.toLowerCase() || '';
    return orderNum.includes(term) || custName.includes(term) || custPhone.includes(term);
  });

  const highRiskCount = assessments.filter((a) => a.risk_level === 'high').length;
  const pendingCount = assessments.filter((a) => a.verification_status === 'pending_review').length;
  const verifiedCount = assessments.filter((a) => a.verification_status === 'verified').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl font-bold text-zinc-100">Fraud Check & Order Verification</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Automated risk scoring, telephone verification checklist, and assembly release gate.
          </p>
        </div>

        <button
          onClick={() => { void loadQueue(); }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:border-emerald-500 transition-all shadow-sm self-start sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              Pending Verification
            </span>
            <div className="text-2xl font-bold text-white font-mono">{pendingCount}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300">
              High Risk Flags
            </span>
            <div className="text-2xl font-bold text-white font-mono">{highRiskCount}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              Verified & Released
            </span>
            <div className="text-2xl font-bold text-white font-mono">{verifiedCount}</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-default bg-surface p-3.5 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by order #, customer name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-default bg-surface-sunken pl-9 pr-3.5 py-1.5 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Filter className="h-3.5 w-3.5" />
            <span>Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-xl border border-default bg-surface-sunken px-2.5 py-1 text-xs text-default focus:outline-none"
            >
              <option value="">All Risks</option>
              <option value="high">High (70+)</option>
              <option value="medium">Medium (30-69)</option>
              <option value="low">Low (0-29)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-default bg-surface-sunken px-2.5 py-1 text-xs text-default focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="on_hold">On Hold</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-hidden rounded-3xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] uppercase tracking-wider text-muted font-bold">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4">Key Risk Indicators</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    No orders currently match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-default">
                      {item.sales_order?.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-default">
                        {item.sales_order?.customer?.name || 'Walk-in / Online Shopper'}
                      </div>
                      <div className="text-[11px] text-muted flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{item.sales_order?.customer?.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Number(item.sales_order?.total_amount || 0))}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                            item.risk_level === 'high'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                              : item.risk_level === 'medium'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.risk_score} / 100
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(item.risk_factors || []).map((f, fIdx) => (
                          <span
                            key={fIdx}
                            className="rounded-md bg-surface-sunken border border-default px-1.5 py-0.5 text-[10px] text-muted"
                            title={f.description}
                          >
                            {f.code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.verification_status === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : item.verification_status === 'on_hold'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : item.verification_status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                        }`}
                      >
                        {item.verification_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openReviewModal(item)}
                        className="rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-primary hover:text-primary transition-all shadow-2xs cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-default bg-surface p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-default pb-4">
              <div>
                <h3 className="text-lg font-bold text-default">
                  Order Review: {selectedItem.sales_order?.order_number}
                </h3>
                <p className="text-xs text-muted">
                  Customer: {selectedItem.sales_order?.customer?.name} ({selectedItem.sales_order?.customer?.phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl p-1.5 text-muted hover:bg-surface-sunken hover:text-default cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Risk Breakdown Card */}
            <div className="rounded-2xl border border-default bg-surface-sunken p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-default">Fraud Risk Assessment</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                    selectedItem.risk_level === 'high'
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                      : selectedItem.risk_level === 'medium'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                  }`}
                >
                  Risk Score: {selectedItem.risk_score} / 100 ({selectedItem.risk_level.toUpperCase()})
                </span>
              </div>

              <div className="space-y-2">
                {(selectedItem.risk_factors || []).map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between text-xs rounded-xl bg-surface p-2.5 border border-default"
                  >
                    <div>
                      <div className="font-semibold text-default">{factor.code}</div>
                      <div className="text-[11px] text-muted">{factor.description}</div>
                    </div>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">+{factor.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Verification Checklist
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-xl border border-default bg-surface-sunken p-3 text-xs text-default cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.phone_confirmed}
                    onChange={(e) =>
                      setChecklist({ ...checklist, phone_confirmed: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span>Customer reached via phone and confirmed order intent</span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-default bg-surface-sunken p-3 text-xs text-default cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.address_validated}
                    onChange={(e) =>
                      setChecklist({ ...checklist, address_validated: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span>Delivery address & landmark verified for courier dispatch</span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-default bg-surface-sunken p-3 text-xs text-default cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.items_confirmed}
                    onChange={(e) =>
                      setChecklist({ ...checklist, items_confirmed: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span>Ordered items and Cash on Delivery amount acknowledged</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-default">
                Verification / Agent Notes
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add verification notes, customer remarks, or reason for hold/rejection..."
                className="w-full rounded-xl border border-default bg-surface-sunken p-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-default">
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject & Cancel</span>
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleHold}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <PauseCircle className="h-4 w-4" />
                <span>Put on Hold</span>
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleVerify}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white hover:bg-primary-hover px-5 py-2 text-xs font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve & Release to Assembly</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
