import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
  RotateCcw,
  Printer,
  PackageCheck,
  Receipt,
} from 'lucide-react';
import type { SalesReturn } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';
import { PrintPreviewModal } from '../../../components/print/PrintPreviewModal';
import { CreditNoteDocument } from '../../../components/print/documents/CreditNoteDocument';
import { useBusinessConfig } from '../../../lib/document/useBusinessConfig';

interface SalesReturnFormItem {
  product_name: string;
  quantity: string;
  unit_price: string;
  condition: string;
}

const SAMPLE_RETURNS: SalesReturn[] = [
  {
    id: 1,
    uuid: 'srt-001',
    return_number: 'SRT-202608-001',
    invoice_id: 1,
    sales_order_id: 1,
    party_id: 1,
    customer_name: 'Apex Footwear Central Kitchen',
    warehouse_id: 1,
    warehouse_name: 'Main Distribution Hub (Dhaka)',
    return_date: '2026-08-30',
    reason_code_id: 1,
    reason_code_name: 'Damaged in transit packaging',
    restock: false,
    subtotal: '2400.00',
    tax_amount: '120.00',
    total_amount: '2520.00',
    refund_method: 'credit_note',
    credit_note_number: 'CN-202608-001',
    status: 'completed',
    approved_at: '2026-08-30T16:00:00Z',
    items: [
      {
        id: 701,
        uuid: 'sri-701',
        product_id: 1,
        product_name: 'Artisan Sourdough Loaf 500g',
        quantity: '8.00',
        unit_id: 2,
        unit_price: '300.00',
        line_total: '2400.00',
        condition: 'damaged',
      },
    ],
    created_at: '2026-08-30T11:00:00Z',
  },
  {
    id: 2,
    uuid: 'srt-002',
    return_number: 'SRT-202608-002',
    invoice_id: 2,
    sales_order_id: 2,
    party_id: 2,
    customer_name: 'Shwapno Superstore Gulshan',
    warehouse_id: 1,
    warehouse_name: 'Main Distribution Hub (Dhaka)',
    return_date: '2026-08-30',
    reason_code_id: 2,
    reason_code_name: 'Wrong SKU dispatched by warehouse',
    restock: true,
    subtotal: '4500.00',
    tax_amount: '225.00',
    total_amount: '4725.00',
    refund_method: 'customer_balance_adjustment',
    credit_note_number: 'CN-202608-002',
    status: 'draft',
    items: [
      {
        id: 702,
        uuid: 'sri-702',
        product_id: 2,
        product_name: 'Butter Croissant Pack (6 pcs)',
        quantity: '15.00',
        unit_id: 2,
        unit_price: '300.00',
        line_total: '4500.00',
        condition: 'restockable_good',
      },
    ],
    created_at: '2026-08-30T14:30:00Z',
  },
];

export function SalesReturnsSection() {
  const [returns, setReturns] = useState<SalesReturn[]>(SAMPLE_RETURNS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeReturn, setActiveReturn] = useState<SalesReturn | null>(null);
  const [printReturn, setPrintReturn] = useState<SalesReturn | null>(null);
  const { config: businessConfig } = useBusinessConfig();

  // Form State
  const [formData, setFormData] = useState({
    return_number: '',
    customer_name: 'Apex Footwear Central Kitchen',
    warehouse_name: 'Main Distribution Hub (Dhaka)',
    return_date: new Date().toISOString().slice(0, 10),
    reason_code_name: 'Customer reported transit damage',
    restock: false,
    refund_method: 'credit_note',
    items: [
      {
        product_name: 'Artisan Sourdough Loaf 500g',
        quantity: '5',
        unit_price: '300.00',
        condition: 'damaged',
      },
    ],
  });

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get<SalesReturn[]>('/sales/returns');
      if (res.data && res.data.length > 0) {
        setReturns(res.data);
      }
    } catch {
      // Keep sample data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    api.get<SalesReturn[]>('/sales/returns')
      .then((res) => {
        if (!ignore && res.data && res.data.length > 0) {
          setReturns(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleApproveReturn = async (returnId: number) => {
    setActionLoading(returnId);
    try {
      await api.post(`/sales/returns/${returnId}/approve`, {});
    } catch {
      // Optimistic update
    } finally {
      setReturns((prev) =>
        prev.map((r) =>
          r.id === returnId
            ? { ...r, status: 'completed', approved_at: new Date().toISOString() }
            : r
        )
      );
      setActionLoading(null);
    }
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = formData.items.reduce(
      (sum, it) => sum + parseFloat(it.quantity || '0') * parseFloat(it.unit_price || '0'),
      0
    );
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const newReturn: SalesReturn = {
      id: Date.now(),
      uuid: `srt-${Date.now()}`,
      return_number:
        formData.return_number ||
        `SRT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(returns.length + 1).padStart(3, '0')}`,
      party_id: 1,
      customer_name: formData.customer_name,
      warehouse_id: 1,
      warehouse_name: formData.warehouse_name,
      return_date: formData.return_date,
      reason_code_id: 1,
      reason_code_name: formData.reason_code_name,
      restock: formData.restock,
      subtotal: subtotal.toFixed(2),
      tax_amount: tax.toFixed(2),
      total_amount: total.toFixed(2),
      refund_method: formData.refund_method,
      credit_note_number: `CN-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(returns.length + 1).padStart(3, '0')}`,
      status: 'draft',
      items: formData.items.map((it, idx) => ({
        id: Date.now() + idx,
        uuid: `sri-${Date.now() + idx}`,
        product_id: idx + 1,
        product_name: it.product_name,
        quantity: it.quantity,
        unit_id: 2,
        unit_price: it.unit_price,
        line_total: (parseFloat(it.quantity) * parseFloat(it.unit_price)).toFixed(2),
        condition: it.condition,
      })),
      created_at: new Date().toISOString(),
    };

    api.post('/sales/returns', newReturn).catch(() => {});
    setReturns([newReturn, ...returns]);
    setShowCreateModal(false);
  };

  const handleUpdateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturn) return;

    setReturns((prev) =>
      prev.map((r) =>
        r.id === activeReturn.id
          ? {
              ...r,
              customer_name: formData.customer_name,
              reason_code_name: formData.reason_code_name,
              restock: formData.restock,
            }
          : r
      )
    );
    api.put(`/sales/returns/${activeReturn.id}`, formData).catch(() => {});
    setShowEditModal(false);
  };

  const handleDeleteReturn = () => {
    if (!activeReturn) return;
    setReturns((prev) => prev.filter((r) => r.id !== activeReturn.id));
    api.delete(`/sales/returns/${activeReturn.id}`).catch(() => {});
    setShowDeleteModal(false);
  };

  const addItemToForm = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_name: '',
          quantity: '1',
          unit_price: '200.00',
          condition: 'restockable_good',
        },
      ],
    });
  };

  const updateFormItem = (idx: number, patch: Partial<SalesReturnFormItem>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const removeItemFromForm = (idx: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx),
    });
  };

  const filteredReturns = returns.filter((r) => {
    const matchesSearch =
      r.return_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.credit_note_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason_code_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCreditIssued = returns.reduce(
    (sum, r) => sum + parseFloat(r.total_amount || '0'),
    0
  );

  const getStatusBadge = (status: SalesReturn['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="size-3 text-amber-500" /> Pending Inspection
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-3 text-emerald-500" /> Credit Issued
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="size-3 text-rose-500" /> Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Returns</span>
            <RotateCcw className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-default">{returns.length}</div>
          <div className="mt-1 text-[11px] text-muted">All customer RMA claims</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Inspection</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {returns.filter((r) => r.status === 'draft').length}
          </div>
          <div className="mt-1 text-[11px] text-muted">Awaiting QA & restock approval</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Restocked Good</span>
            <PackageCheck className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {returns.filter((r) => r.restock).length}
          </div>
          <div className="mt-1 text-[11px] text-muted">Restored into inventory balance</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Credit Issued</span>
            <TrendingUp className="size-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            ৳{totalCreditIssued.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-muted">Total customer refund/credit value</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFormData({
                return_number: `SRT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(returns.length + 1).padStart(3, '0')}`,
                customer_name: 'Apex Footwear Central Kitchen',
                warehouse_name: 'Main Distribution Hub (Dhaka)',
                return_date: new Date().toISOString().slice(0, 10),
                reason_code_name: 'Customer reported transit damage',
                restock: false,
                refund_method: 'credit_note',
                items: [
                  {
                    product_name: 'Artisan Sourdough Loaf 500g',
                    quantity: '5',
                    unit_price: '300.00',
                    condition: 'damaged',
                  },
                ],
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create Sales Return</span>
          </button>

          <button
            onClick={fetchReturns}
            disabled={loading}
            className="p-2 text-muted hover:text-default hover:bg-surface-sunken rounded-xl border border-default transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Pending Inspection</option>
            <option value="completed">Credit Issued</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder="Search return #, customer, CN #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="rounded-2xl border border-default bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">Return # / Date</th>
                <th className="px-4 py-3.5">Customer & Credit Note</th>
                <th className="px-4 py-3.5">Return Reason</th>
                <th className="px-4 py-3.5">Restock Status</th>
                <th className="px-4 py-3.5 text-right">Credit Value</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    {loading ? 'Loading sales returns...' : 'No sales returns found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="size-3.5 text-rose-500" />
                        <span>{r.return_number}</span>
                      </div>
                      <div className="text-[10px] text-muted font-sans mt-0.5">{r.return_date}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-default">{r.customer_name ?? '—'}</div>
                      <div className="text-[10px] font-mono text-primary font-medium">{r.credit_note_number}</div>
                    </td>
                    <td className="px-4 py-3.5 text-muted max-w-xs truncate">{r.reason_code_name ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      {r.restock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Restocked Good
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted bg-surface-sunken px-2 py-0.5 rounded-md border border-default">
                          Scrapped / Loss
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                      ৳{parseFloat(r.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveReturn(r);
                            setShowViewModal(true);
                          }}
                          className="p-1.5 text-muted hover:text-default hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
                          title="View Credit Note"
                        >
                          <Eye className="size-3.5" />
                        </button>

                        {r.status === 'draft' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveReturn(r);
                                setFormData({
                                  return_number: r.return_number,
                                  customer_name: r.customer_name || '',
                                  warehouse_name: r.warehouse_name || '',
                                  return_date: r.return_date,
                                  reason_code_name: r.reason_code_name || '',
                                  restock: r.restock,
                                  refund_method: r.refund_method,
                                  items: r.items?.map((it) => ({
                                    product_name: it.product_name || '',
                                    quantity: it.quantity,
                                    unit_price: it.unit_price,
                                    condition: it.condition,
                                  })) || [],
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-muted hover:text-default hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
                              title="Edit Return"
                            >
                              <Edit2 className="size-3.5" />
                            </button>

                            <button
                              onClick={() => handleApproveReturn(r.id)}
                              disabled={actionLoading === r.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="size-3" />
                              {actionLoading === r.id ? 'Approving...' : 'Issue Credit'}
                            </button>

                            <button
                              onClick={() => {
                                setActiveReturn(r);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Void Return"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SALES RETURN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-default">Create Sales Return (Credit Note)</h3>
                <p className="text-xs text-muted mt-0.5">Issue customer return voucher and adjust inventory ledger</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-default cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Return #</label>
                  <input
                    type="text"
                    value={formData.return_number}
                    onChange={(e) => setFormData({ ...formData, return_number: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Customer</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Return Date</label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Refund / Settlement Mode</label>
                  <select
                    value={formData.refund_method}
                    onChange={(e) => setFormData({ ...formData, refund_method: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default"
                  >
                    <option value="credit_note">Credit Note on Customer Account</option>
                    <option value="cash_refund">Instant Cash Refund</option>
                    <option value="bank_transfer">Bank Wire Reversal</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 font-semibold text-default cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.restock}
                      onChange={(e) => setFormData({ ...formData, restock: e.target.checked })}
                      className="size-4 rounded border-default text-primary"
                    />
                    <span>Restock items back into active inventory</span>
                  </label>
                </div>
              </div>

              {/* Items Line Builder */}
              <div className="border border-default rounded-xl p-3 bg-surface-sunken/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default">Returned Items & Condition</span>
                  <button
                    type="button"
                    onClick={addItemToForm}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" /> Add Item Line
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-surface p-2.5 rounded-lg border border-default">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Product Description"
                        value={item.product_name}
                        onChange={(e) => updateFormItem(idx, { product_name: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateFormItem(idx, { quantity: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={(e) => updateFormItem(idx, { unit_price: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={item.condition}
                        onChange={(e) => updateFormItem(idx, { condition: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-1.5 py-1.5 text-[11px] text-default"
                      >
                        <option value="restockable_good">Good (Restock)</option>
                        <option value="damaged">Damaged (Scrap)</option>
                      </select>
                    </div>
                    <div className="col-span-1 text-center">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemFromForm(idx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-muted mb-1">Return Reason / Justification</label>
                <input
                  type="text"
                  value={formData.reason_code_name}
                  onChange={(e) => setFormData({ ...formData, reason_code_name: e.target.value })}
                  placeholder="Reason for return claim..."
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-default text-muted hover:text-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-fg font-semibold hover:opacity-90 cursor-pointer"
                >
                  Generate Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RETURN MODAL */}
      {showViewModal && activeReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-default">{activeReturn.return_number}</h3>
                  {getStatusBadge(activeReturn.status)}
                </div>
                <p className="text-xs text-muted mt-0.5">Customer: {activeReturn.customer_name} &bull; Credit Note: {activeReturn.credit_note_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintReturn(activeReturn)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-default text-muted hover:text-default text-xs cursor-pointer"
                >
                  <Printer className="size-3.5" />
                  <span>Print Credit Note</span>
                </button>
                <button onClick={() => setShowViewModal(false)} className="text-muted hover:text-default cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-sunken p-3 rounded-xl border border-default font-mono">
                <div>
                  <span className="text-[10px] text-muted block uppercase">Return Date</span>
                  <span className="font-semibold text-default">{activeReturn.return_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Warehouse</span>
                  <span className="font-semibold text-default">{activeReturn.warehouse_name || 'Main Hub'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Restock?</span>
                  <span className="font-semibold text-default">{activeReturn.restock ? 'YES' : 'NO'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Credit Amount</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">৳{parseFloat(activeReturn.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {activeReturn.reason_code_name && (
                <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                  <span className="text-[10px] font-semibold text-muted uppercase block mb-1">Reason:</span>
                  <p className="text-default">{activeReturn.reason_code_name}</p>
                </div>
              )}

              {/* Items Table */}
              <div className="rounded-xl border border-default overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken font-semibold text-muted text-[10px] uppercase border-b border-default">
                    <tr>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Condition</th>
                      <th className="px-3 py-2 text-right">Credit Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {(activeReturn.items ?? []).map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2.5 font-medium text-default">{it.product_name}</td>
                        <td className="px-3 py-2.5 font-mono">{it.quantity} PCS</td>
                        <td className="px-3 py-2.5 font-mono capitalize">{it.condition.replace('_', ' ')}</td>
                        <td className="px-3 py-2.5 font-mono text-right font-semibold text-rose-600 dark:text-rose-400">
                          ৳{parseFloat(it.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-sunken border border-default text-default hover:bg-surface cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RETURN MODAL */}
      {showEditModal && activeReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-default bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-default">Edit Sales Return ({activeReturn.return_number})</h3>
                <p className="text-xs text-muted mt-0.5">Update return claim reason and parameters</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-default cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateReturn} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-muted mb-1">Customer</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-muted mb-1">Reason</label>
                <textarea
                  rows={2}
                  value={formData.reason_code_name}
                  onChange={(e) => setFormData({ ...formData, reason_code_name: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-default text-muted hover:text-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-fg font-semibold hover:opacity-90 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / VOID RETURN CONFIRMATION MODAL */}
      {showDeleteModal && activeReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-default bg-surface p-6 shadow-xl text-center space-y-4">
            <div className="size-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-default">Void Sales Return?</h3>
              <p className="text-xs text-muted mt-1">
                Are you sure you want to void credit note <span className="font-mono font-semibold text-default">{activeReturn.return_number}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-default text-muted hover:text-default cursor-pointer"
              >
                Keep Return
              </button>
              <button
                type="button"
                onClick={handleDeleteReturn}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Credit Note Modal */}
      {printReturn && (
        <PrintPreviewModal
          isOpen={Boolean(printReturn)}
          onClose={() => setPrintReturn(null)}
          title={`Credit Note: ${printReturn.credit_note_number || printReturn.return_number}`}
          documentNumber={printReturn.credit_note_number || printReturn.return_number}
          documentType="Official Commercial Credit Note"
          pageClass="print-page-a4"
        >
          <CreditNoteDocument salesReturn={printReturn} businessConfig={businessConfig} />
        </PrintPreviewModal>
      )}
    </div>
  );
}
