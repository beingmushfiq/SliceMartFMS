// ─────────────────────────────────────────────────────────────
// SALES PAGE — Full sales management with new sale flow
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Download, ChevronRight, BarChart3,
  Users, Building2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/FormElements';
import { EmptyState, Pagination } from '../../components/ui/Feedback';
import { KPICard } from '../../components/ui/KPICard';
import { Tabs, TabList, TabTrigger, TabPanel } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { cn, formatBDT, formatDate } from '../../lib/utils';
import { SALES_TREND_7D } from '../../data/mockData';
import { QuickAddCustomerModal, QuickAddProductModal, QuickAddButton } from '../../components/modals/QuickEntryModals';
import type { Sale, SaleType, PaymentStatus, SaleStatus } from '../../types';

export default function SalesPage() {
  const navigate = useNavigate();
  const sales    = useAppStore(s => s.sales);
  const addSale  = useAppStore(s => s.addSale);
  const customers = useAppStore(s => s.customers);
  const products  = useAppStore(s => s.products);
  const inventory = useAppStore(s => s.inventory);
  const updateStock = useAppStore(s => s.updateStock);

  const [search,     setSearch]    = useState('');
  const [page,       setPage]      = useState(1);
  const [showNew,    setShowNew]   = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct,  setShowAddProduct]  = useState(false);
  const PAGE_SIZE = 10;

  const [newSale, setNewSale] = useState({
    customerId:     '',
    saleType:       'b2b' as SaleType,
    productId:      '',
    qty:            '',
    unitPrice:      '',
    discount:       '0',
    paymentStatus:  'unpaid' as PaymentStatus,
    notes:          '',
  });

  // Computed
  const totalRevenue  = sales.reduce((s, x) => s + x.total, 0);
  const outstanding   = sales.reduce((s, x) => s + x.due, 0);
  const totalPaid     = sales.reduce((s, x) => s + x.paid, 0);
  const b2bSales      = sales.filter(s => s.saleType === 'b2b');
  const b2cSales      = sales.filter(s => s.saleType === 'b2c');
  const rmSales       = sales.filter(s => s.saleType === 'raw_material');

  const selectedProduct  = products.find(p => p.id === newSale.productId);
  const qty              = parseInt(newSale.qty)       || 0;
  const unitPrice        = parseFloat(newSale.unitPrice) || 0;
  const discountAmt      = parseFloat(newSale.discount) || 0;
  const subtotal         = qty * unitPrice;
  const total            = Math.max(0, subtotal - discountAmt);

  const filteredSales = useMemo(() => {
    if (!search) return sales;
    const q = search.toLowerCase();
    return sales.filter(s =>
      s.invoiceNo.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  }, [sales, search]);

  const paged  = filteredSales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const tPages = Math.ceil(filteredSales.length / PAGE_SIZE);

  const handleSave = () => {
    if (!newSale.customerId || !newSale.productId || !newSale.qty || !newSale.unitPrice) return;
    const customer = customers.find(c => c.id === newSale.customerId);
    const product  = products.find(p => p.id === newSale.productId);
    if (!customer || !product) return;
    setSaving(true);

    setTimeout(() => {
      const sale: Sale = {
        id:             `SL-${Date.now()}`,
        invoiceNo:      `INV-${String(sales.length + 101).padStart(4,'0')}`,
        customerId:     newSale.customerId,
        customerName:   customer.name,
        saleType:       newSale.saleType,
        items: [{
          id:          `SI-${Date.now()}`,
          productId:   newSale.productId,
          productName: selectedProduct?.name ?? '',
          model:       selectedProduct?.model ?? '',
          qty,
          unit:        'pcs',
          unitPrice,
          discount:    discountAmt,
          subtotal:    total,
        }],
        subtotal,
        discount:       discountAmt,
        tax:            0,
        total,
        paid:           newSale.paymentStatus === 'paid' ? total : 0,
        due:            newSale.paymentStatus === 'paid' ? 0 : total,
        paymentStatus:  newSale.paymentStatus,
        status:         'confirmed' as SaleStatus,
        saleDate:       new Date().toISOString().slice(0, 10),
        deliveryStatus: 'processing',
        notes:          newSale.notes,
        createdBy:      'Sohel Rana',
        createdAt:      new Date().toISOString(),
        updatedAt:      new Date().toISOString(),
      };

      // Decrement inventory
      if (newSale.saleType !== 'raw_material') {
        const invItem = inventory.find(i => i.itemId === newSale.productId && i.itemType === 'product');
        if (invItem) {
          updateStock(invItem.itemId, invItem.warehouseId, -qty, {
            itemId:       invItem.itemId,
            itemName:     invItem.itemName,
            itemType:     'product',
            warehouseId:  invItem.warehouseId,
            movementType: 'sale',
            qty,
            unit:         invItem.unit,
            date:         new Date().toISOString().slice(0, 10),
            reference:    sale.invoiceNo,
            notes:        `Sale to ${customer.name}`,
            performedBy:  'Sohel Rana',
            createdAt:    new Date().toISOString(),
          });
        }
      }

      addSale(sale);
      setShowNew(false);
      setSaving(false);
      setNewSale({ customerId: '', saleType: 'b2b', productId: '', qty: '', unitPrice: '', discount: '0', paymentStatus: 'unpaid', notes: '' });
    }, 900);
  };

  const SalesTable = ({ items }: { items: typeof sales }) => (
    <div className="overflow-x-auto">
      <table className="data-table" aria-label="Sales records">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Date</th>
            <th className="col-numeric">Amount</th>
            <th className="col-numeric">Paid</th>
            <th className="col-numeric">Due</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-0">
                <EmptyState title="No sales found" description={search ? `No results for "${search}"` : undefined} />
              </td>
            </tr>
          ) : (
            items.map(sale => (
              <tr key={sale.id} className="cursor-pointer" onClick={() => navigate('/sales')}>
                <td className="font-mono text-xs font-600 text-blue-600">{sale.invoiceNo}</td>
                <td className="font-500 text-slate-800">{sale.customerName}</td>
                <td>
                  <span className={cn(
                    'badge border text-2xs',
                    sale.saleType === 'b2b' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    sale.saleType === 'b2c' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  )}>
                    {sale.saleType.toUpperCase()}
                  </span>
                </td>
                <td className="text-xs text-slate-500 whitespace-nowrap">{formatDate(sale.saleDate || sale.createdAt || '')}</td>
                <td className="col-numeric font-mono font-600 text-slate-900">{formatBDT(sale.total)}</td>
                <td className="col-numeric font-mono text-success-700">{formatBDT(sale.paid)}</td>
                <td className={cn('col-numeric font-mono', sale.due > 0 ? 'text-error-700 font-600' : 'text-slate-400')}>
                  {formatBDT(sale.due)}
                </td>
                <td><StatusBadge status={sale.paymentStatus} /></td>
                <td><StatusBadge status={sale.status ?? 'confirmed'} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-700 text-slate-900">Sales</h1>
          <p className="text-sm text-slate-500 mt-0.5">All sales orders and revenue tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>Export</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNew(true)}>
            New Sale
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Revenue"  value={formatBDT(totalRevenue, { compact: true })} delta={12} deltaLabel="vs last month" icon={<BarChart3 className="w-4.5 h-4.5" />} iconColor="bg-success-50 text-success-600" />
        <KPICard label="Outstanding"    value={formatBDT(outstanding, { compact: true })} alert={outstanding > 500000 ? 'warning' : undefined} icon={<ChevronRight className="w-4.5 h-4.5" />} iconColor="bg-warning-50 text-warning-600" />
        <KPICard label="B2B Sales"      value={b2bSales.length} icon={<Building2 className="w-4.5 h-4.5" />} iconColor="bg-blue-50 text-blue-600" />
        <KPICard label="B2C Sales"      value={b2cSales.length} icon={<Users className="w-4.5 h-4.5" />} iconColor="bg-slate-100 text-slate-500" />
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="section-title">Revenue Trend</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SALES_TREND_7D} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatBDT(Number(v))} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="b2b" name="B2B"  fill="#2563eb" radius={[3,3,0,0]} />
                <Bar dataKey="b2c" name="B2C"  fill="#94a3b8" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card-header"><h2 className="section-title">Receivables</h2></div>
          <div className="card-body space-y-3">
            {[
              { label: 'Total Invoiced', value: formatBDT(totalRevenue), color: 'text-slate-900' },
              { label: 'Paid',           value: formatBDT(totalPaid),    color: 'text-success-600' },
              { label: 'Unpaid',         value: formatBDT(outstanding),  color: 'text-error-600' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className={cn('text-sm font-mono font-700', item.color)}>{item.value}</span>
              </div>
            ))}
            <Button variant="secondary" size="sm" fullWidth onClick={() => navigate('/finance/receivables')}>
              View Receivables
            </Button>
          </div>
        </section>
      </div>

      {/* Full Sales Table */}
      <Tabs defaultTab="all">
        <TabList>
          <TabTrigger id="all">All Orders ({sales.length})</TabTrigger>
          <TabTrigger id="b2b">B2B ({b2bSales.length})</TabTrigger>
          <TabTrigger id="b2c">B2C ({b2cSales.length})</TabTrigger>
          <TabTrigger id="raw_material">Raw Materials ({rmSales.length})</TabTrigger>
        </TabList>

        <div className="mt-4">
          <div className="px-4 py-3 border-b border-slate-100">
            <SearchInput
              placeholder="Search invoice, customer…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
          </div>
          <TabPanel id="all">
            <SalesTable items={paged} />
            {tPages > 1 && (
              <Pagination page={page} totalPages={tPages} onPageChange={setPage}
                          totalItems={filteredSales.length} pageSize={PAGE_SIZE} />
            )}
          </TabPanel>
          <TabPanel id="b2b"><SalesTable items={b2bSales} /></TabPanel>
          <TabPanel id="b2c"><SalesTable items={b2cSales} /></TabPanel>
          <TabPanel id="raw_material"><SalesTable items={rmSales} /></TabPanel>
        </div>
      </Tabs>

      {/* New Sale Modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Create New Sale Order"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button
              variant="primary" size="sm" loading={saving}
              disabled={!newSale.customerId || !newSale.productId || !newSale.qty || !newSale.unitPrice}
              onClick={handleSave}
            >
              Confirm Sale
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label form-label-required" htmlFor="sale-customer">Customer</label>
                <QuickAddButton label="Customer" onClick={() => setShowAddCustomer(true)} />
              </div>
              <select id="sale-customer" className="form-select" value={newSale.customerId}
                onChange={e => setNewSale(v => ({ ...v, customerId: e.target.value }))}>
                <option value="">Select customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type.toUpperCase()})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="sale-type">Sale Type</label>
              <select id="sale-type" className="form-select" value={newSale.saleType}
                onChange={e => setNewSale(v => ({ ...v, saleType: e.target.value as SaleType }))}>
                <option value="b2b">B2B — Dealer</option>
                <option value="b2c">B2C — Consumer</option>
                <option value="raw_material">Raw Material</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label form-label-required" htmlFor="sale-product">Product</label>
                <QuickAddButton label="Product" onClick={() => setShowAddProduct(true)} />
              </div>
              <select id="sale-product" className="form-select" value={newSale.productId}
                onChange={e => {
                  const p = products.find(p => p.id === e.target.value);
                  setNewSale(v => ({ ...v, productId: e.target.value, unitPrice: String(p?.sellingPrice ?? '') }));
                }}>
                <option value="">Select product…</option>
                {products.filter(p => newSale.saleType === 'raw_material' ? p.type === 'raw_material' : p.type === 'finished_good').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="sale-qty">Quantity (pcs)</label>
              <input id="sale-qty" type="number" min="1" className="form-input font-mono" placeholder="50"
                value={newSale.qty} onChange={e => setNewSale(v => ({ ...v, qty: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="sale-price">Unit Price (৳)</label>
              <input id="sale-price" type="number" min="0" className="form-input font-mono" placeholder="1200"
                value={newSale.unitPrice} onChange={e => setNewSale(v => ({ ...v, unitPrice: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sale-discount">Discount (৳)</label>
              <input id="sale-discount" type="number" min="0" className="form-input font-mono"
                value={newSale.discount} onChange={e => setNewSale(v => ({ ...v, discount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="sale-payment">Payment</label>
              <select id="sale-payment" className="form-select" value={newSale.paymentStatus}
                onChange={e => setNewSale(v => ({ ...v, paymentStatus: e.target.value as PaymentStatus }))}>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Order summary */}
          {qty > 0 && unitPrice > 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-slate-500">Subtotal ({qty} × {formatBDT(unitPrice)})</span>
                <span className="font-mono text-slate-900">{formatBDT(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-mono text-error-600">-{formatBDT(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-base font-700 border-t border-slate-200 pt-2 mt-2">
                <span>Total</span>
                <span className="font-mono text-slate-900">{formatBDT(total)}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* In-Context Quick Entry Modals */}
      <QuickAddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCreated={(c) => setNewSale(v => ({ ...v, customerId: c.id }))}
      />
      <QuickAddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onCreated={(p) => setNewSale(v => ({ ...v, productId: p.id, unitPrice: String(p.sellingPrice) }))}
      />
    </div>
  );
}
