// ─────────────────────────────────────────────────────────────
// PROCUREMENT — Purchase orders and supplier management
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { KPICard } from '../../components/ui/KPICard';
import { SearchInput } from '../../components/ui/FormElements';
import { Tabs, TabList, TabTrigger, TabPanel } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { formatBDT, formatDate } from '../../lib/utils';
import { QuickAddSupplierModal, QuickAddMaterialModal, QuickAddButton } from '../../components/modals/QuickEntryModals';
import type { PurchaseOrder } from '../../types';

export default function Procurement() {
  const purchaseOrders    = useAppStore(s => s.purchaseOrders);
  const addPurchaseOrder  = useAppStore(s => s.addPurchaseOrder);
  const suppliers         = useAppStore(s => s.suppliers);

  const [search,   setSearch]   = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const [form, setForm] = useState({
    supplierId: '',
    itemName:   '',
    qty:        '',
    unitCost:   '',
    expectedDate: '',
    notes:      '',
  });

  const pending   = purchaseOrders.filter(po => po.status === 'draft' || po.status === 'ordered');
  const received  = purchaseOrders.filter(po => po.status === 'received');
  const pendingAmt = pending.reduce((s, p) => s + p.total, 0);

  const filtered = search
    ? purchaseOrders.filter(po =>
        (po.orderNo ?? po.poNo ?? '').toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        po.items.some(i => (i.itemName ?? '').toLowerCase().includes(search.toLowerCase()))
      )
    : purchaseOrders;

  const handleCreate = () => {
    if (!form.supplierId || !form.itemName || !form.qty || !form.unitCost) return;
    setSaving(true);
    const supplier = suppliers.find(s => s.id === form.supplierId);
    const qty      = parseInt(form.qty);
    const unitCost = parseFloat(form.unitCost);
    setTimeout(() => {
      const po: PurchaseOrder = {
        id:           `PO-${Date.now()}`,
        orderNo:      `PUR-${String(purchaseOrders.length + 50).padStart(4,'0')}`,
        supplierId:   form.supplierId,
        supplierName: supplier?.name ?? '',
        items: [{
          id:         `PI-${Date.now()}`,
          itemName:   form.itemName,
          qty,
          unit:       'pcs',
          unitCost,
          total:      qty * unitCost,
        }],
        subtotal:      qty * unitCost,
        total:         qty * unitCost,
        paid:          0,
        due:           qty * unitCost,
        status:        'ordered',
        paymentStatus: 'unpaid',
        orderDate:     new Date().toISOString().slice(0, 10),
        expectedDate:  form.expectedDate || new Date(Date.now() + 5*86400000).toISOString().slice(0, 10),
        createdAt:     new Date().toISOString(),
      };
      addPurchaseOrder(po);
      setSaving(false);
      setShowNew(false);
      setForm({ supplierId: '', itemName: '', qty: '', unitCost: '', expectedDate: '', notes: '' });
    }, 600);
  };

  const POTable = ({ items }: { items: PurchaseOrder[] }) => (
    <div className="overflow-x-auto">
      <table className="data-table" aria-label="Purchase orders">
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Supplier</th>
            <th>Items</th>
            <th>Order Date</th>
            <th>Expected Date</th>
            <th className="col-numeric">Total Amount</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map(po => (
            <tr key={po.id}>
              <td className="font-mono text-xs font-600 text-blue-600">{po.orderNo ?? po.poNo}</td>
              <td className="font-500 text-slate-800">{po.supplierName}</td>
              <td className="text-xs text-slate-500">{po.items.map(i => i.itemName ?? i.materialName).join(', ')}</td>
              <td className="text-xs text-slate-500">{formatDate(po.orderDate || po.createdAt)}</td>
              <td className="text-xs text-slate-500">{formatDate(po.expectedDate || po.expectedDelivery || po.createdAt)}</td>
              <td className="col-numeric font-mono font-600 text-slate-900">{formatBDT(po.total)}</td>
              <td><StatusBadge status={po.paymentStatus} /></td>
              <td><StatusBadge status={po.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-700 text-slate-900">Procurement</h1>
          <p className="text-sm text-slate-500 mt-0.5">Suppliers, purchase orders and receiving</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNew(true)}>
          New Purchase Order
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Orders"   value={purchaseOrders.length} />
        <KPICard label="Pending Orders" value={pending.length}        alert={pending.length > 0 ? 'warning' : undefined} />
        <KPICard label="Received"       value={received.length}       alert="success" />
        <KPICard label="Pending Value"  value={formatBDT(pendingAmt)} />
      </div>

      {/* Orders Tabs */}
      <div className="card">
        <Tabs defaultTab="all">
          <div className="card-header border-b-0 pb-0">
            <TabList>
              <TabTrigger id="all" count={purchaseOrders.length}>All Orders</TabTrigger>
              <TabTrigger id="pending" count={pending.length}>Pending ({pending.length})</TabTrigger>
              <TabTrigger id="received" count={received.length}>Received ({received.length})</TabTrigger>
            </TabList>
          </div>
          <div className="px-4 py-3 border-t border-slate-100">
            <SearchInput
              placeholder="Search PO, supplier, item…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <TabPanel id="all"><POTable items={filtered} /></TabPanel>
          <TabPanel id="pending"><POTable items={filtered.filter(po => po.status === 'draft' || po.status === 'ordered')} /></TabPanel>
          <TabPanel id="received"><POTable items={filtered.filter(po => po.status === 'received')} /></TabPanel>
        </Tabs>
      </div>

      {/* Suppliers section */}
      <section className="card">
        <div className="card-header">
          <h2 className="section-title">Registered Suppliers ({SUPPLIERS.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" aria-label="Suppliers list">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Materials Supplied</th>
                <th>Lead Time</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {SUPPLIERS.map(sup => (
                <tr key={sup.id}>
                  <td>
                    <div className="font-500 text-slate-800">{sup.name}</div>
                    <div className="text-xs text-slate-400">{sup.address}</div>
                  </td>
                  <td>
                    <div className="text-xs text-slate-700">{sup.contactPerson}</div>
                    <div className="text-xs text-slate-400">{sup.phone}</div>
                  </td>
                  <td className="text-xs text-slate-500">{(sup.suppliedMaterials ?? []).slice(0,2).join(', ') || 'Raw Materials'}</td>
                  <td className="text-xs text-slate-700">{sup.leadTimeDays ?? 3}d</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-600 text-slate-900 text-sm">{(sup.rating ?? 4.5).toFixed(1)}</span>
                      <span className="text-warning-500 text-sm">★</span>
                    </div>
                  </td>
                  <td><StatusBadge status={sup.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* New PO Modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New Purchase Order"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary"   size="sm" loading={saving}
              disabled={!form.supplierId || !form.itemName || !form.qty || !form.unitCost}
              onClick={handleCreate}>
              Create Order
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label form-label-required" htmlFor="po-supplier">Supplier</label>
              <QuickAddButton label="Supplier" onClick={() => setShowAddSupplier(true)} />
            </div>
            <select id="po-supplier" className="form-select" value={form.supplierId}
              onChange={e => setForm(v => ({ ...v, supplierId: e.target.value }))}>
              <option value="">Select supplier…</option>
              {suppliers.filter(s => s.status === 'active').map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label form-label-required" htmlFor="po-item">Item / Material</label>
              <QuickAddButton label="Material" onClick={() => setShowAddMaterial(true)} />
            </div>
            <input id="po-item" type="text" className="form-input" placeholder="e.g. Heating Coil 1200W"
              value={form.itemName} onChange={e => setForm(v => ({ ...v, itemName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="po-qty">Quantity</label>
              <input id="po-qty" type="number" min="1" className="form-input font-mono" placeholder="500"
                value={form.qty} onChange={e => setForm(v => ({ ...v, qty: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="po-cost">Unit Cost (৳)</label>
              <input id="po-cost" type="number" min="0" className="form-input font-mono" placeholder="85"
                value={form.unitCost} onChange={e => setForm(v => ({ ...v, unitCost: e.target.value }))} />
            </div>
          </div>
          {form.qty && form.unitCost && (
            <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Order Value</span>
              <span className="font-700 font-mono text-slate-900">
                {formatBDT(parseInt(form.qty||'0') * parseFloat(form.unitCost||'0'))}
              </span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="po-expected">Expected Delivery</label>
            <input id="po-expected" type="date" className="form-input"
              value={form.expectedDate} onChange={e => setForm(v => ({ ...v, expectedDate: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* In-Context Quick Entry Modals */}
      <QuickAddSupplierModal
        isOpen={showAddSupplier}
        onClose={() => setShowAddSupplier(false)}
        onCreated={(s) => setForm(v => ({ ...v, supplierId: s.id }))}
      />
      <QuickAddMaterialModal
        isOpen={showAddMaterial}
        onClose={() => setShowAddMaterial(false)}
        onCreated={(m) => setForm(v => ({ ...v, itemName: m.name, unitCost: String(m.costPrice) }))}
      />
    </div>
  );
}
