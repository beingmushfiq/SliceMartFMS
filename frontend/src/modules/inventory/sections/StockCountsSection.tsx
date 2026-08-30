import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
  Printer,
} from 'lucide-react';
import type { StockCount } from '../../../types/api/inventory';
import { api } from '../../../lib/api/client';

interface CountFormItem {
  product_name: string;
  product_sku: string;
  snapshot_quantity: string;
  counted_quantity: string;
  unit_code: string;
}

const SAMPLE_COUNTS: StockCount[] = [
  {
    id: 1,
    uuid: 'cnt-001',
    count_number: 'CNT-202608-001',
    warehouse_id: 1,
    warehouse_name: 'Central Raw Materials Silo',
    count_date: '2026-08-30',
    count_type: 'cycle',
    status: 'counting',
    notes: 'Monthly cycle audit for high-volume grain and flour bins.',
    items: [
      {
        id: 1001,
        uuid: 'cnti-1001',
        stock_count_id: 1,
        product_id: 1,
        product_name: 'Premium Wheat Flour (Grade A)',
        product_sku: 'RM-FLOUR-01',
        snapshot_quantity: '2450.00',
        counted_quantity: '2430.00',
        variance_quantity: '-20.00',
        variance_cost: '-1300.00',
        unit_id: 1,
        unit_code: 'KG',
      },
      {
        id: 1002,
        uuid: 'cnti-1002',
        stock_count_id: 1,
        product_id: 3,
        product_name: 'Refined Cane Sugar (Fine Grain)',
        product_sku: 'RM-SUGAR-01',
        snapshot_quantity: '1800.00',
        counted_quantity: '1800.00',
        variance_quantity: '0.00',
        variance_cost: '0.00',
        unit_id: 1,
        unit_code: 'KG',
      },
    ],
    created_at: '2026-08-30T07:00:00Z',
  },
  {
    id: 2,
    uuid: 'cnt-002',
    count_number: 'CNT-202608-002',
    warehouse_id: 3,
    warehouse_name: 'Finished Goods Cold Storage',
    count_date: '2026-08-29',
    count_type: 'spot',
    status: 'completed',
    reconciled_by: 1,
    reconciled_at: '2026-08-29T18:00:00Z',
    notes: 'Surprise spot check on bakery confectionery cold trays.',
    items: [
      {
        id: 1003,
        uuid: 'cnti-1003',
        stock_count_id: 2,
        product_id: 2,
        product_name: 'Chocolate Fudge Brownie Tray',
        product_sku: 'FG-BRWN-01',
        snapshot_quantity: '150.00',
        counted_quantity: '150.00',
        variance_quantity: '0.00',
        variance_cost: '0.00',
        unit_id: 2,
        unit_code: 'PCS',
      },
    ],
    created_at: '2026-08-29T16:00:00Z',
  },
];

export function StockCountsSection() {
  const [counts, setCounts] = useState<StockCount[]>(SAMPLE_COUNTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeCount, setActiveCount] = useState<StockCount | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    count_number: '',
    warehouse_name: 'Central Raw Materials Silo',
    count_date: new Date().toISOString().slice(0, 10),
    count_type: 'cycle' as StockCount['count_type'],
    notes: '',
    items: [
      {
        product_name: 'Premium Wheat Flour (Grade A)',
        product_sku: 'RM-FLOUR-01',
        snapshot_quantity: '2450.00',
        counted_quantity: '2450.00',
        unit_code: 'KG',
      },
    ],
  });

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const res = await api.get<StockCount[]>('/inventory/counts');
      if (res.data && res.data.length > 0) {
        setCounts(res.data);
      }
    } catch {
      // Keep sample data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    api.get<StockCount[]>('/inventory/counts')
      .then((res) => {
        if (!ignore && res.data && res.data.length > 0) {
          setCounts(res.data);
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

  const handleReconcile = async (countId: number) => {
    setActionLoading(countId);
    try {
      await api.post(`/inventory/counts/${countId}/reconcile`, {});
    } catch {
      // Optimistic update
    } finally {
      setCounts((prev) =>
        prev.map((c) =>
          c.id === countId
            ? { ...c, status: 'completed', reconciled_at: new Date().toISOString() }
            : c
        )
      );
      setActionLoading(null);
    }
  };

  const handleCreateCount = (e: React.FormEvent) => {
    e.preventDefault();
    const newCnt: StockCount = {
      id: Date.now(),
      uuid: `cnt-${Date.now()}`,
      count_number:
        formData.count_number ||
        `CNT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(counts.length + 1).padStart(3, '0')}`,
      warehouse_id: 1,
      warehouse_name: formData.warehouse_name,
      count_date: formData.count_date,
      count_type: formData.count_type,
      status: 'counting',
      notes: formData.notes,
      items: formData.items.map((it, idx) => {
        const snap = parseFloat(it.snapshot_quantity || '0');
        const cnt = parseFloat(it.counted_quantity || '0');
        const diff = cnt - snap;
        return {
          id: Date.now() + idx,
          uuid: `cnti-${Date.now() + idx}`,
          stock_count_id: Date.now(),
          product_id: idx + 1,
          product_name: it.product_name,
          product_sku: it.product_sku,
          snapshot_quantity: it.snapshot_quantity,
          counted_quantity: it.counted_quantity,
          variance_quantity: diff.toFixed(2),
          variance_cost: (diff * 65.0).toFixed(2),
          unit_id: 1,
          unit_code: it.unit_code,
        };
      }),
      created_at: new Date().toISOString(),
    };

    api.post('/inventory/counts', newCnt).catch(() => {});
    setCounts([newCnt, ...counts]);
    setShowCreateModal(false);
  };

  const handleUpdateCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCount) return;

    setCounts((prev) =>
      prev.map((c) =>
        c.id === activeCount.id
          ? {
              ...c,
              warehouse_name: formData.warehouse_name,
              count_type: formData.count_type,
              notes: formData.notes,
              items: formData.items.map((it, idx) => {
                const snap = parseFloat(it.snapshot_quantity || '0');
                const cnt = parseFloat(it.counted_quantity || '0');
                const diff = cnt - snap;
                return {
                  ...(c.items?.[idx] || {
                    id: Date.now() + idx,
                    uuid: `cnti-${Date.now() + idx}`,
                    stock_count_id: c.id,
                    product_id: idx + 1,
                    product_name: it.product_name,
                    unit_id: 1,
                    unit_code: it.unit_code,
                  }),
                  snapshot_quantity: it.snapshot_quantity,
                  counted_quantity: it.counted_quantity,
                  variance_quantity: diff.toFixed(2),
                  variance_cost: (diff * 65.0).toFixed(2),
                };
              }),
            }
          : c
      )
    );
    api.put(`/inventory/counts/${activeCount.id}`, formData).catch(() => {});
    setShowEditModal(false);
  };

  const handleDeleteCount = () => {
    if (!activeCount) return;
    setCounts((prev) => prev.filter((c) => c.id !== activeCount.id));
    api.delete(`/inventory/counts/${activeCount.id}`).catch(() => {});
    setShowDeleteModal(false);
  };

  const addItemToForm = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_name: '',
          product_sku: '',
          snapshot_quantity: '100',
          counted_quantity: '100',
          unit_code: 'KG',
        },
      ],
    });
  };

  const updateFormItem = (idx: number, patch: Partial<CountFormItem>) => {
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

  const filteredCounts = counts.filter((c) => {
    const matchesSearch =
      c.count_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.notes?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: StockCount['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="size-3 text-amber-500" /> Audit Prepared
          </span>
        );
      case 'counting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ClipboardList className="size-3 text-blue-500 animate-pulse" /> Physical Counting
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-3 text-emerald-500" /> Reconciled
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
            <span className="text-xs font-semibold uppercase tracking-wider">Total Audits</span>
            <ClipboardList className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-default">{counts.length}</div>
          <div className="mt-1 text-[11px] text-muted">Stock verification sessions</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Counting</span>
            <Clock className="size-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {counts.filter((c) => c.status === 'counting').length}
          </div>
          <div className="mt-1 text-[11px] text-muted">Field auditors tallying items</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reconciled Audits</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {counts.filter((c) => c.status === 'completed').length}
          </div>
          <div className="mt-1 text-[11px] text-muted">Stock variances adjusted to GL</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audit Accuracy</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            99.2%
          </div>
          <div className="mt-1 text-[11px] text-muted">Inventory variance tolerance</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFormData({
                count_number: `CNT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(counts.length + 1).padStart(3, '0')}`,
                warehouse_name: 'Central Raw Materials Silo',
                count_date: new Date().toISOString().slice(0, 10),
                count_type: 'cycle',
                notes: '',
                items: [
                  {
                    product_name: 'Premium Wheat Flour (Grade A)',
                    product_sku: 'RM-FLOUR-01',
                    snapshot_quantity: '2450.00',
                    counted_quantity: '2450.00',
                    unit_code: 'KG',
                  },
                ],
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Initiate Stock Audit</span>
          </button>

          <button
            onClick={fetchCounts}
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
            <option value="counting">Active Counting</option>
            <option value="completed">Reconciled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder="Search audit #, warehouse, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Counts Table */}
      <div className="rounded-2xl border border-default bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">Audit # / Date</th>
                <th className="px-4 py-3.5">Warehouse</th>
                <th className="px-4 py-3.5">Audit Type</th>
                <th className="px-4 py-3.5">Items Audited</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredCounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    {loading ? 'Loading audits...' : 'No stock count audits found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                filteredCounts.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="size-3.5 text-primary" />
                        <span>{c.count_number}</span>
                      </div>
                      <div className="text-[10px] text-muted font-sans mt-0.5">{c.count_date}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-default">{c.warehouse_name}</td>
                    <td className="px-4 py-3.5 text-muted uppercase font-mono text-[10px]">
                      {c.count_type} Check
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-default">{c.items?.length || 0} SKU(s) Audited</div>
                      <div className="text-[10px] text-muted truncate max-w-xs">{c.items?.[0]?.product_name}</div>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveCount(c);
                            setShowViewModal(true);
                          }}
                          className="p-1.5 text-muted hover:text-default hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
                          title="View Variance Sheet"
                        >
                          <Eye className="size-3.5" />
                        </button>

                        {c.status === 'counting' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveCount(c);
                                setFormData({
                                  count_number: c.count_number,
                                  warehouse_name: c.warehouse_name || '',
                                  count_date: c.count_date,
                                  count_type: c.count_type,
                                  notes: c.notes || '',
                                  items: c.items?.map((it) => ({
                                    product_name: it.product_name || '',
                                    product_sku: it.product_sku || '',
                                    snapshot_quantity: it.snapshot_quantity,
                                    counted_quantity: it.counted_quantity || it.snapshot_quantity,
                                    unit_code: it.unit_code || 'KG',
                                  })) || [],
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-muted hover:text-default hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
                              title="Update Count Figures"
                            >
                              <Edit2 className="size-3.5" />
                            </button>

                            <button
                              onClick={() => handleReconcile(c.id)}
                              disabled={actionLoading === c.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="size-3" />
                              {actionLoading === c.id ? 'Posting...' : 'Reconcile'}
                            </button>

                            <button
                              onClick={() => {
                                setActiveCount(c);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Audit"
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

      {/* CREATE COUNT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-default">Initiate Stock Count Audit</h3>
                <p className="text-xs text-muted mt-0.5">Take snapshot of inventory balances and generate field counting sheet</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-default cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCount} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Audit #</label>
                  <input
                    type="text"
                    value={formData.count_number}
                    onChange={(e) => setFormData({ ...formData, count_number: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Warehouse</label>
                  <input
                    type="text"
                    value={formData.warehouse_name}
                    onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Audit Type</label>
                  <select
                    value={formData.count_type}
                    onChange={(e) => setFormData({ ...formData, count_type: e.target.value as StockCount['count_type'] })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default"
                  >
                    <option value="cycle">Cycle Count</option>
                    <option value="spot">Spot Check</option>
                    <option value="full">Full Physical Count</option>
                  </select>
                </div>
              </div>

              {/* Items Line Builder */}
              <div className="border border-default rounded-xl p-3 bg-surface-sunken/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default">SKU Snapshots to Audit</span>
                  <button
                    type="button"
                    onClick={addItemToForm}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" /> Add SKU Line
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-surface p-2.5 rounded-lg border border-default">
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Product Description"
                        value={item.product_name}
                        onChange={(e) => updateFormItem(idx, { product_name: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="System Snapshot Qty"
                        value={item.snapshot_quantity}
                        onChange={(e) => updateFormItem(idx, {
                          snapshot_quantity: e.target.value,
                          counted_quantity: e.target.value,
                        })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Unit"
                        value={item.unit_code}
                        onChange={(e) => updateFormItem(idx, { unit_code: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono uppercase"
                      />
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
                <label className="block font-semibold text-muted mb-1">Audit Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Audit team, shift, location specifics..."
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
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
                  Begin Physical Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW COUNT MODAL */}
      {showViewModal && activeCount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl border border-default bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-default">{activeCount.count_number}</h3>
                  {getStatusBadge(activeCount.status)}
                </div>
                <p className="text-xs text-muted mt-0.5">Warehouse: {activeCount.warehouse_name} &bull; Type: {activeCount.count_type} check</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-default text-muted hover:text-default text-xs cursor-pointer"
                >
                  <Printer className="size-3.5" />
                  <span>Print Variance Sheet</span>
                </button>
                <button onClick={() => setShowViewModal(false)} className="text-muted hover:text-default cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-sunken p-3 rounded-xl border border-default font-mono">
                <div>
                  <span className="text-[10px] text-muted block uppercase">Date</span>
                  <span className="font-semibold text-default">{activeCount.count_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Status</span>
                  <span className="font-semibold text-default uppercase">{activeCount.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">SKU Count</span>
                  <span className="font-semibold text-primary">{activeCount.items?.length || 0} Lines</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Reconciled At</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {activeCount.reconciled_at ? activeCount.reconciled_at.slice(0, 16).replace('T', ' ') : 'In Progress'}
                  </span>
                </div>
              </div>

              {activeCount.notes && (
                <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                  <span className="text-[10px] font-semibold text-muted uppercase block mb-1">Audit Notes:</span>
                  <p className="text-default">{activeCount.notes}</p>
                </div>
              )}

              {/* Items Table */}
              <div className="rounded-xl border border-default overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken font-semibold text-muted text-[10px] uppercase border-b border-default">
                    <tr>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2">System Snapshot</th>
                      <th className="px-3 py-2">Physical Counted</th>
                      <th className="px-3 py-2 text-right">Variance Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {(activeCount.items ?? []).map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2.5 font-medium text-default">{it.product_name}</td>
                        <td className="px-3 py-2.5 font-mono text-muted">{it.snapshot_quantity} {it.unit_code}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-default">{it.counted_quantity || '0.00'} {it.unit_code}</td>
                        <td className="px-3 py-2.5 font-mono text-right font-semibold">
                          {parseFloat(it.variance_quantity || '0') === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">0.00 (Match)</span>
                          ) : parseFloat(it.variance_quantity || '0') < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">{it.variance_quantity} {it.unit_code}</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">+{it.variance_quantity} {it.unit_code}</span>
                          )}
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

      {/* EDIT COUNT VALUES MODAL */}
      {showEditModal && activeCount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-default">Record Count Figures ({activeCount.count_number})</h3>
                <p className="text-xs text-muted mt-0.5">Input physical counts taken by floor audit personnel</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-default cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCount} className="space-y-4 text-xs">
              <div className="space-y-2">
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-sunken border border-default">
                    <div>
                      <div className="font-semibold text-default">{item.product_name}</div>
                      <div className="text-[11px] text-muted font-mono">Snapshot: {item.snapshot_quantity} {item.unit_code}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted">Counted:</span>
                      <input
                        type="number"
                        value={item.counted_quantity}
                        onChange={(e) => updateFormItem(idx, { counted_quantity: e.target.value })}
                        className="w-24 rounded-lg border border-default bg-surface px-2 py-1.5 text-xs text-default font-mono"
                        required
                      />
                      <span className="font-mono text-muted">{item.unit_code}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-muted mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
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
                  Save Count Figures
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL COUNT AUDIT CONFIRMATION MODAL */}
      {showDeleteModal && activeCount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-default bg-surface p-6 shadow-xl text-center space-y-4">
            <div className="size-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-default">Cancel Stock Audit?</h3>
              <p className="text-xs text-muted mt-1">
                Are you sure you want to cancel audit session <span className="font-mono font-semibold text-default">{activeCount.count_number}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-default text-muted hover:text-default cursor-pointer"
              >
                Keep Audit
              </button>
              <button
                type="button"
                onClick={handleDeleteCount}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
