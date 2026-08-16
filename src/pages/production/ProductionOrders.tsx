// ─────────────────────────────────────────────────────────────
// PRODUCTION ORDERS PAGE — Full production order management
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/FormElements';
import { EmptyState, Pagination } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { KPICard } from '../../components/ui/KPICard';
import { cn, formatDate, calcPct } from '../../lib/utils';
import { QuickAddProductModal, QuickAddButton } from '../../components/modals/QuickEntryModals';
import type { ProductionOrderStatus } from '../../types';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All',           value: 'all' },
  { label: 'Draft',         value: 'draft' },
  { label: 'Planned',       value: 'planned' },
  { label: 'Ready',         value: 'ready' },
  { label: 'In Production', value: 'in_production' },
  { label: 'QC Pending',    value: 'qc_pending' },
  { label: 'Completed',     value: 'completed' },
  { label: 'Cancelled',     value: 'cancelled' },
];

export default function ProductionOrders() {
  const navigate = useNavigate();
  const productionOrders    = useAppStore(s => s.productionOrders);
  const addProductionOrder  = useAppStore(s => s.addProductionOrder);
  const products            = useAppStore(s => s.products);

  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [page,          setPage]          = useState(1);
  const [showCreate,    setShowCreate]    = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // New order form state
  const [newOrder, setNewOrder] = useState({
    productId: '', targetQty: '', productionDate: '2026-08-18', notes: '',
  });
  const [creating, setCreating] = useState(false);

  const PAGE_SIZE = 10;

  // Filter
  const filtered = useMemo(() => {
    return productionOrders.filter(po => {
      const matchSearch = !search ||
        po.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        po.productName.toLowerCase().includes(search.toLowerCase()) ||
        po.model.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || po.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [productionOrders, search, statusFilter]);

  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // KPIs
  const active    = productionOrders.filter(po => po.status === 'in_production').length;
  const pending   = productionOrders.filter(po => po.status === 'ready' || po.status === 'planned').length;
  const qcPending = productionOrders.filter(po => po.status === 'qc_pending').length;
  const completed = productionOrders.filter(po => po.status === 'completed').length;

  const handleCreate = () => {
    if (!newOrder.productId || !newOrder.targetQty) return;
    setCreating(true);
    const product = products.find(p => p.id === newOrder.productId);
    setTimeout(() => {
      const order = {
        id: `PO-${Date.now()}`,
        orderNo: `PO-${String(productionOrders.length + 130).padStart(5, '0')}`,
        productId: newOrder.productId,
        productName: product?.name ?? '',
        model: product?.model ?? '',
        targetQty: parseInt(newOrder.targetQty),
        producedQty: 0,
        passedQty: 0,
        failedQty: 0,
        reworkQty: 0,
        status: 'planned' as ProductionOrderStatus,
        assignedEmployees: [],
        productionDate: newOrder.productionDate,
        expectedCompletion: newOrder.productionDate,
        notes: newOrder.notes,
        createdBy: 'Mushfiqur Rahman',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addProductionOrder(order);
      setShowCreate(false);
      setCreating(false);
      setNewOrder({ productId: '', targetQty: '', productionDate: '2026-08-18', notes: '' });
    }, 800);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-700 text-slate-900">Production Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track all production orders</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setShowCreate(true)}
        >
          New Order
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="In Production"  value={active}    alert={active > 0 ? 'success' : undefined} onClick={() => setStatusFilter('in_production')} />
        <KPICard label="Ready to Start" value={pending}   alert={pending > 0 ? undefined : undefined} onClick={() => setStatusFilter('ready')} />
        <KPICard label="QC Pending"     value={qcPending} alert={qcPending > 0 ? 'warning' : undefined} onClick={() => setStatusFilter('qc_pending')} />
        <KPICard label="Completed"      value={completed} alert="success" onClick={() => setStatusFilter('completed')} />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body pb-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <SearchInput
              placeholder="Search by order no., product, model…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1"
              aria-label="Search production orders"
            />
          </div>
          {/* Status filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={cn('filter-pill shrink-0', statusFilter === f.value && 'active')}
              >
                {f.label}
                {f.value !== 'all' && (
                  <span className="ml-1 text-2xs opacity-70">
                    {productionOrders.filter(po => po.status === f.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table" aria-label="Production orders">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Product / Model</th>
                <th className="col-numeric">Target</th>
                <th className="col-numeric">Produced</th>
                <th className="col-numeric">Achievement</th>
                <th>Date</th>
                <th>Status</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-0">
                    <EmptyState
                      title="No production orders found"
                      description={search ? `No results for "${search}"` : 'Create a new production order to get started.'}
                      action={{ label: 'New Order', onClick: () => setShowCreate(true) }}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map(po => {
                  const pct = calcPct(po.producedQty, po.targetQty);
                  return (
                    <tr key={po.id} className="cursor-pointer" onClick={() => navigate('/production/entry')}>
                      <td className="font-mono text-xs font-600 text-blue-600">{po.orderNo}</td>
                      <td>
                        <div className="font-500 text-slate-800">{po.model}</div>
                        <div className="text-xs text-slate-400 truncate max-w-40">{po.productName}</div>
                      </td>
                      <td className="col-numeric font-mono text-slate-700">{po.targetQty}</td>
                      <td className="col-numeric font-mono font-600 text-slate-900">{po.producedQty}</td>
                      <td className="col-numeric">
                        <span className={cn(
                          'font-mono font-600 text-sm',
                          pct >= 90 ? 'text-success-600' : pct >= 70 ? 'text-warning-600' : 'text-error-600'
                        )}>
                          {pct}%
                        </span>
                      </td>
                      <td className="text-slate-600 text-xs whitespace-nowrap">{formatDate(po.productionDate)}</td>
                      <td><StatusBadge status={po.status} /></td>
                      <td>
                        <button
                          onClick={e => { e.stopPropagation(); navigate('/production/entry'); }}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400
                                     hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                          aria-label={`View order ${po.orderNo}`}
                        >
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Production Order"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={creating}
              onClick={handleCreate}
              disabled={!newOrder.productId || !newOrder.targetQty}
            >
              Create Order
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label form-label-required" htmlFor="po-product">Product</label>
              <QuickAddButton label="Product" onClick={() => setShowAddProduct(true)} />
            </div>
            <select
              id="po-product"
              className="form-select"
              value={newOrder.productId}
              onChange={e => setNewOrder(v => ({ ...v, productId: e.target.value }))}
            >
              <option value="">Select product…</option>
              {products.filter(p => p.type === 'finished_good').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="po-qty">Target Quantity</label>
              <input
                id="po-qty"
                type="number"
                min="1"
                placeholder="e.g. 50"
                className="form-input"
                value={newOrder.targetQty}
                onChange={e => setNewOrder(v => ({ ...v, targetQty: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="po-date">Production Date</label>
              <input
                id="po-date"
                type="date"
                className="form-input"
                value={newOrder.productionDate}
                onChange={e => setNewOrder(v => ({ ...v, productionDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="po-notes">Notes</label>
            <textarea
              id="po-notes"
              className="form-textarea"
              placeholder="Optional notes…"
              value={newOrder.notes}
              onChange={e => setNewOrder(v => ({ ...v, notes: e.target.value }))}
            />
          </div>
          {newOrder.productId && (
            <div className="alert-info">
              <div className="text-sm">
                BOM will be checked automatically when production starts.
                Required materials will be verified against current stock.
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onCreated={(p) => setNewOrder(v => ({ ...v, productId: p.id }))}
      />
    </div>
  );
}
