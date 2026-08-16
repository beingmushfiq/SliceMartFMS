// ─────────────────────────────────────────────────────────────
// OPERATIONAL SUB-PAGES & PANELS
// Full interactive implementations for all Slice Mart sub-routes
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Factory, Package, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Wrench, Building2, ScrollText, RotateCcw,
  TruckIcon, ShieldCheck, Activity, Coins, Plus,
  Download, CheckCircle, Clock, Video, Maximize2, Check,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { KPICard } from '../components/ui/KPICard';
import { StatusBadge } from '../components/ui/Badge';
import { SearchInput } from '../components/ui/FormElements';
import {
  QuickAddCustomerModal, QuickAddSupplierModal,
  QuickAddMaterialModal, QuickAddProductModal,
  QuickAddAccountModal, QuickAddButton,
} from '../components/modals/QuickEntryModals';
import { cn, formatBDT, calcPct } from '../lib/utils';
import {
  PRODUCTS, RAW_MATERIALS, BOMS, EMPLOYEES, ATTENDANCE_RECORDS,
  QC_RECORDS, PURCHASE_ORDERS,
  DELIVERIES, EXPENSES, AUDIT_LOGS, WAREHOUSE_TRANSFERS, TRANSACTIONS,
  PRODUCTION_TREND_7D, FINANCE_TREND_7D,
} from '../data/mockData';

// Framer Motion Animation Settings
const cardTransition = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] };
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: cardTransition }
};

// ── Shared Page Header ─────────────────────────────────────────
function PageHeader({
  title, subtitle, actions
}: {
  title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-700 text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. PRODUCTION SUITE
// ─────────────────────────────────────────────────────────────

export function ProductionOverview() {
  const navigate = useNavigate();
  const orders = useAppStore(s => s.productionOrders);
  const activeOrders = orders.filter(o => o.status === 'in_production' || o.status === 'ready' || o.status === 'planned');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Production Overview"
        subtitle="Factory throughput, active assembly lines, and shift performance"
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate('/production/orders')}>
            New Production Order
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Active Orders" value={activeOrders.length} icon={<Factory className="w-4 h-4" />} iconColor="bg-blue-50 text-blue-600" />
        <KPICard label="Completed Batches" value={completedOrders.length} icon={<CheckCircle className="w-4 h-4" />} iconColor="bg-success-50 text-success-600" />
        <KPICard label="Active Line Capacity" value="94%" icon={<Activity className="w-4 h-4" />} iconColor="bg-indigo-50 text-indigo-600" delta={3} />
        <KPICard label="Average Defect Rate" value="1.8%" icon={<AlertTriangle className="w-4 h-4" />} iconColor="bg-amber-50 text-amber-600" delta={-0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div variants={itemVariants} className="card lg:col-span-2">
          <div className="card-header">
            <div>
              <h2 className="section-title">Weekly Output Trend</h2>
              <p className="text-xs text-slate-400">Target vs Actual units assembled</p>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={PRODUCTION_TREND_7D}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip />
                <Area type="monotone" dataKey="target" stroke="#cbd5e1" fill="#f8fafc" strokeDasharray="3 3" name="Target" />
                <Area type="monotone" dataKey="produced" stroke="#2563eb" fill="#eff6ff" name="Produced" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <h2 className="section-title">Active Assembly Line</h2>
            <span className="badge badge-green">Running</span>
          </div>
          <div className="card-body space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 font-500">Current Batch</p>
              <p className="text-sm font-700 text-slate-900 mt-0.5">PO-00125 — Infrared Cooker IR-101</p>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Progress</span>
                <span className="font-600 font-mono">48 / 50 pcs (96%)</span>
              </div>
              <div className="progress-bar mt-1">
                <div className="progress-fill bg-blue-600" style={{ width: '96%' }} />
              </div>
            </div>
            <div>
              <p className="text-xs font-600 text-slate-400 uppercase tracking-wider mb-2">Assigned Staff</p>
              <div className="space-y-1.5">
                {EMPLOYEES.slice(0, 3).map(e => (
                  <div key={e.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="font-500 text-slate-700">{e.name}</span>
                    <span className="text-slate-400">{e.designation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function BOMPage() {
  const [selectedProduct, setSelectedProduct] = useState('PRD-001');
  const bom = BOMS.find(b => b.productId === selectedProduct) ?? BOMS[0];
  const product = PRODUCTS.find(p => p.id === selectedProduct) ?? PRODUCTS[0];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Bill of Materials (BOM)"
        subtitle="Manage product component requirements, quantities, and wastage calculations"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="form-input text-xs py-1.5 px-3 bg-white"
            >
              {PRODUCTS.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
              ))}
            </select>
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Component
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KPICard label="Total Components" value={bom.items.length} icon={<Layers className="w-4 h-4" />} iconColor="bg-blue-50 text-blue-600" />
        <KPICard label="Estimated Unit Cost" value={formatBDT(product.costPrice)} icon={<Coins className="w-4 h-4" />} iconColor="bg-success-50 text-success-600" />
        <KPICard label="Wholesale Margin" value={`${calcPct(product.wholesalePrice - product.costPrice, product.costPrice)}%`} icon={<TrendingUp className="w-4 h-4" />} iconColor="bg-amber-50 text-amber-600" />
        <KPICard label="BOM Version" value={`v${bom.version}.0`} icon={<ScrollText className="w-4 h-4" />} iconColor="bg-purple-50 text-purple-600" />
      </div>

      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title">Component Breakdown for {product.name}</h2>
            <p className="text-xs text-slate-400">Required raw materials per single finished product unit</p>
          </div>
          <span className="badge badge-blue">SKU: {product.sku}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component / Material</th>
                <th>Material ID</th>
                <th className="col-numeric">Required Qty</th>
                <th>Unit</th>
                <th className="col-numeric">Wastage %</th>
                <th className="col-numeric">Est. Material Cost</th>
              </tr>
            </thead>
            <tbody>
              {bom.items.map((item, i) => {
                const mat = RAW_MATERIALS.find(r => r.id === item.materialId);
                const cost = mat ? mat.costPrice * item.requiredQty * (1 + item.wastagePercent / 100) : 0;
                return (
                  <tr key={i}>
                    <td className="font-500 text-slate-800">{item.materialName}</td>
                    <td className="font-mono text-xs text-blue-600">{item.materialId}</td>
                    <td className="col-numeric font-mono font-600">{item.requiredQty}</td>
                    <td className="text-slate-500 text-xs">{item.unit}</td>
                    <td className="col-numeric text-slate-600">{item.wastagePercent}%</td>
                    <td className="col-numeric font-mono text-slate-900">{formatBDT(cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProductionHistory() {
  const orders = useAppStore(s => s.productionOrders);
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Production Batch History"
        subtitle="Historical audit log of all completed and archived manufacturing orders"
        actions={
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </Button>
        }
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Product Model</th>
                <th>Date</th>
                <th className="col-numeric">Target</th>
                <th className="col-numeric">Produced</th>
                <th className="col-numeric">Passed QC</th>
                <th className="col-numeric">Yield Rate</th>
                <th>Supervisor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(po => {
                const yieldRate = po.producedQty > 0 ? Math.round((po.passedQty / po.producedQty) * 100) : 0;
                return (
                  <tr key={po.id}>
                    <td className="font-mono text-xs text-blue-600 font-500">{po.orderNo}</td>
                    <td className="font-500 text-slate-800">{po.model} - {po.productName}</td>
                    <td className="text-xs text-slate-500">{po.productionDate}</td>
                    <td className="col-numeric font-mono text-slate-600">{po.targetQty}</td>
                    <td className="col-numeric font-mono text-slate-900 font-600">{po.producedQty}</td>
                    <td className="col-numeric font-mono text-success-600 font-600">{po.passedQty}</td>
                    <td className="col-numeric font-mono">{yieldRate}%</td>
                    <td className="text-xs text-slate-600">{po.createdBy}</td>
                    <td><StatusBadge status={po.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. INVENTORY & WAREHOUSE SUITE
// ─────────────────────────────────────────────────────────────

export function RawMaterials() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const rawMaterials = useAppStore(s => s.rawMaterials);
  const materials = rawMaterials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Raw Materials Catalog"
        subtitle="15+ core manufacturing components for Cooker & Stove assembly lines"
        actions={
          <div className="flex items-center gap-2">
            <SearchInput placeholder="Search materials or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowAdd(true)}
            >
              Add Material
            </Button>
          </div>
        }
      />

      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Material Name</th>
                <th>Category</th>
                <th className="col-numeric">Unit Cost</th>
                <th className="col-numeric">Selling Price</th>
                <th className="col-numeric">Min Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{m.sku}</td>
                  <td className="font-500 text-slate-900">{m.name}</td>
                  <td><span className="badge badge-slate">{m.category}</span></td>
                  <td className="col-numeric font-mono">{formatBDT(m.costPrice)}</td>
                  <td className="col-numeric font-mono text-slate-500">{m.sellingPrice ? formatBDT(m.sellingPrice) : '—'}</td>
                  <td className="col-numeric font-mono text-slate-600">{m.minStock} {m.unit}</td>
                  <td><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <QuickAddMaterialModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      />
    </motion.div>
  );
}

export function FinishedGoods() {
  const [showAdd, setShowAdd] = useState(false);
  const products = useAppStore(s => s.products);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Finished Goods Catalog"
        subtitle="Slice Mart manufactured infrared cookers and stoves ready for B2B/B2C dispatch"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowAdd(true)}
          >
            Add Product Model
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <motion.div key={p.id} variants={itemVariants} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="badge badge-blue">{p.category.replace('_', ' ').toUpperCase()}</span>
              <span className="font-mono text-xs text-slate-400">{p.sku}</span>
            </div>
            <h3 className="font-600 text-slate-900 text-sm line-clamp-1">{p.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Model: {p.model}</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500">Retail:</span>
              <span className="font-700 font-mono text-slate-900">{formatBDT(p.sellingPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-slate-500">Wholesale:</span>
              <span className="font-600 font-mono text-blue-600">{formatBDT(p.wholesalePrice)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <QuickAddProductModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      />
    </motion.div>
  );
}

export function StockMovements() {
  const movements = useAppStore(s => s.stockMovements);
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Stock Movement Ledger"
        subtitle="Immutable audit trail of all inventory receipts, consumption, outputs, and transfers"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Item Name</th>
                <th>Warehouse</th>
                <th>Type</th>
                <th className="col-numeric">Delta Qty</th>
                <th className="col-numeric">Before</th>
                <th className="col-numeric">After</th>
                <th>Created By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{m.id}</td>
                  <td className="font-500 text-slate-800">{m.itemName}</td>
                  <td><span className="badge badge-navy">{m.warehouseId}</span></td>
                  <td><span className="badge badge-slate">{m.movementType.replace('_', ' ')}</span></td>
                  <td className={cn('col-numeric font-mono font-700', m.qty > 0 ? 'text-success-600' : 'text-error-600')}>
                    {m.qty > 0 ? `+${m.qty}` : m.qty} {m.unit}
                  </td>
                  <td className="col-numeric font-mono text-slate-400">{m.qtyBefore}</td>
                  <td className="col-numeric font-mono text-slate-900 font-600">{m.qtyAfter}</td>
                  <td className="text-xs text-slate-600">{m.createdBy}</td>
                  <td className="text-xs text-slate-400">{m.createdAt.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StockAdjustments() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Stock Adjustments"
        subtitle="Authorized physical inventory reconciliation and adjustment records"
      />
      <motion.div variants={itemVariants} className="card p-6 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <Wrench className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-600 text-slate-800">Inventory Reconciliation Active</h3>
          <p className="text-xs text-slate-500">All adjustments are directly managed with audit trail recording from the primary Inventory Overview panel.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function WarehouseA() {
  const inventory = useAppStore(s => s.inventory);
  const items = inventory.filter(i => i.warehouseId === 'WH-A');
  const totalValue = items.reduce((s, i) => s + i.totalValue, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Warehouse A — Raw Materials Store"
        subtitle="Primary storage facility for electronics, glass, heating elements & packaging"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPICard label="Stored Items" value={items.length} icon={<Building2 className="w-4 h-4" />} iconColor="bg-blue-50 text-blue-600" />
        <KPICard label="Total Valuation" value={formatBDT(totalValue, { compact: true })} icon={<Coins className="w-4 h-4" />} iconColor="bg-success-50 text-success-600" />
        <KPICard label="Storage Utilization" value="78%" icon={<Activity className="w-4 h-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th className="col-numeric">Stock Qty</th>
                <th className="col-numeric">Avg Cost</th>
                <th className="col-numeric">Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td className="font-500 text-slate-900">{it.itemName}</td>
                  <td><span className="badge badge-slate">{it.itemType}</span></td>
                  <td className="col-numeric font-mono font-600">{it.qty} {it.unit}</td>
                  <td className="col-numeric font-mono text-slate-500">{formatBDT(it.avgCost)}</td>
                  <td className="col-numeric font-mono text-slate-900 font-700">{formatBDT(it.totalValue)}</td>
                  <td>
                    <span className={cn('badge', it.qty === 0 ? 'badge-red' : it.qty <= it.minStock ? 'badge-amber' : 'badge-green')}>
                      {it.qty === 0 ? 'Out of Stock' : it.qty <= it.minStock ? 'Low Stock' : 'Optimal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function WarehouseB() {
  const inventory = useAppStore(s => s.inventory);
  const items = inventory.filter(i => i.warehouseId === 'WH-B');
  const totalValue = items.reduce((s, i) => s + i.totalValue, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Warehouse B — Finished Goods & Dispatch"
        subtitle="Completed product staging area and outbound logistics dispatch hub"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPICard label="FG SKUs Available" value={items.length} icon={<Package className="w-4 h-4" />} iconColor="bg-blue-50 text-blue-600" />
        <KPICard label="Inventory Valuation" value={formatBDT(totalValue, { compact: true })} icon={<Coins className="w-4 h-4" />} iconColor="bg-success-50 text-success-600" />
        <KPICard label="Dispatch Readiness" value="100%" icon={<TruckIcon className="w-4 h-4" />} iconColor="bg-purple-50 text-purple-600" />
      </div>
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Finished Product</th>
                <th className="col-numeric">Stock Available</th>
                <th className="col-numeric">Unit Cost</th>
                <th className="col-numeric">Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td className="font-500 text-slate-900">{it.itemName}</td>
                  <td className="col-numeric font-mono font-700">{it.qty} {it.unit}</td>
                  <td className="col-numeric font-mono text-slate-500">{formatBDT(it.avgCost)}</td>
                  <td className="col-numeric font-mono text-slate-900 font-700">{formatBDT(it.totalValue)}</td>
                  <td>
                    <span className={cn('badge', it.qty <= it.minStock ? 'badge-amber' : 'badge-green')}>
                      {it.qty <= it.minStock ? 'Low Stock' : 'Ready'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Transfers() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Inter-Warehouse Stock Transfers"
        subtitle="Track stock movements between Warehouse A (Materials) and Warehouse B (Finished Goods)"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transfer No</th>
                <th>From</th>
                <th>To</th>
                <th>Items Transferred</th>
                <th>Requested By</th>
                <th>Approved By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {WAREHOUSE_TRANSFERS.map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{t.transferNo}</td>
                  <td><span className="badge badge-navy">{t.fromWarehouseId}</span></td>
                  <td><span className="badge badge-blue">{t.toWarehouseId}</span></td>
                  <td className="font-500 text-slate-800">{t.items.map(i => `${i.itemName} (${i.qty} ${i.unit})`).join(', ')}</td>
                  <td className="text-xs text-slate-600">{t.requestedBy}</td>
                  <td className="text-xs text-slate-600">{t.approvedBy}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. PROCUREMENT SUITE
// ─────────────────────────────────────────────────────────────

export function Suppliers() {
  const [showAdd, setShowAdd] = useState(false);
  const suppliers = useAppStore(s => s.suppliers);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Supplier Directory"
        subtitle="Vendor contacts, credit terms, and payment ledger accounts"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowAdd(true)}
          >
            Quick Onboard Supplier
          </Button>
        }
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier Code</th>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Area / Location</th>
                <th>Terms</th>
                <th className="col-numeric">Current Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{s.supplierNo}</td>
                  <td className="font-600 text-slate-900">{s.name}</td>
                  <td className="text-slate-700">{s.contactPerson}</td>
                  <td className="font-mono text-xs text-slate-600">{s.phone}</td>
                  <td className="text-xs text-slate-500">{s.area}</td>
                  <td><span className="badge badge-slate">{s.paymentTerms}</span></td>
                  <td className="col-numeric font-mono font-700 text-error-600">{formatBDT(s.balance)}</td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <QuickAddSupplierModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      />
    </motion.div>
  );
}

export function PurchaseHistory() {
  const pos = useAppStore(s => s.purchaseOrders);
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Purchase History"
        subtitle="Historical procurement orders, invoices, and material receipts"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Warehouse</th>
                <th className="col-numeric">Total Amount</th>
                <th className="col-numeric">Paid</th>
                <th className="col-numeric">Due</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{po.poNo}</td>
                  <td className="font-500 text-slate-900">{po.supplierName}</td>
                  <td><span className="badge badge-navy">{po.warehouseId}</span></td>
                  <td className="col-numeric font-mono font-700 text-slate-900">{formatBDT(po.total)}</td>
                  <td className="col-numeric font-mono text-success-600">{formatBDT(po.paid ?? 0)}</td>
                  <td className="col-numeric font-mono text-error-600 font-600">{formatBDT(po.due ?? 0)}</td>
                  <td><StatusBadge status={po.paymentStatus} /></td>
                  <td><StatusBadge status={po.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ReceiveItems() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Goods Received Note (GRN) Receiving"
        subtitle="Inspect and accept incoming raw material shipments into Warehouse A"
      />
      <motion.div variants={itemVariants} className="card p-5">
        <h3 className="section-title mb-3">Pending Inbound Shipments</h3>
        <div className="space-y-3">
          {PURCHASE_ORDERS.filter(p => p.status === 'ordered').map(po => (
            <div key={po.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <span className="font-mono text-xs font-600 text-blue-600">{po.poNo}</span>
                <h4 className="font-600 text-slate-900 mt-0.5">{po.supplierName}</h4>
                <p className="text-xs text-slate-500">{po.items.map(i => `${i.materialName} (${i.qty} ${i.unit})`).join(', ')}</p>
              </div>
              <Button variant="primary" size="sm" leftIcon={<Check className="w-3.5 h-3.5" />}>
                Receive to WH-A
              </Button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. SALES SUITE
// ─────────────────────────────────────────────────────────────

export function NewSale() {
  const navigate = useNavigate();
  const customers = useAppStore(s => s.customers);
  const products = useAppStore(s => s.products);
  const addSale = useAppStore(s => s.addSale);
  const updateStock = useAppStore(s => s.updateStock);

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [saleType, setSaleType] = useState<'b2b' | 'b2c' | 'raw_material'>('b2b');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState('10');
  const [discount, setDiscount] = useState('0');
  const [saved, setSaved] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);
  const selectedCustomer = customers.find(c => c.id === customerId);
  const unitPrice = selectedProduct?.sellingPrice || 0;
  const numQty = parseInt(qty, 10) || 0;
  const totalAmt = Math.max(0, numQty * unitPrice - (parseFloat(discount) || 0));

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct || numQty <= 0) return;

    const sale = {
      id: `SALE-${Date.now().toString().slice(-4)}`,
      invoiceNo: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      saleType,
      items: [{
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        qty: numQty,
        unitPrice,
        total: numQty * unitPrice,
      }],
      subtotal: numQty * unitPrice,
      discount: parseFloat(discount) || 0,
      tax: 0,
      total: totalAmt,
      paid: totalAmt,
      due: 0,
      paymentStatus: 'paid' as any,
      paymentMethod: 'cash' as any,
      status: 'completed' as any,
      saleDate: new Date().toISOString().split('T')[0],
      warehouseId: 'WH-B' as any,
      createdBy: 'Mushfiqur Rahman',
      createdAt: new Date().toISOString(),
    };

    addSale(sale);
    updateStock(selectedProduct.id, 'WH-B', -numQty, {
      itemId: selectedProduct.id,
      itemType: 'product',
      itemName: selectedProduct.name,
      movementType: 'sale',
      unit: selectedProduct.unit,
      reference: sale.invoiceNo,
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate('/sales');
    }, 1500);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Create New Sales Order"
        subtitle="Process B2B wholesale dealers, direct consumer (B2C), or raw material sales"
      />
      <motion.div variants={itemVariants} className="card p-6 max-w-3xl">
        <form onSubmit={handleConfirm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label text-xs">Customer *</label>
              <QuickAddButton label="Customer" onClick={() => setShowAddCustomer(true)} />
            </div>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="form-select"
            >
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type.toUpperCase()})</option>)}
            </select>
          </div>
          <div>
            <label className="form-label text-xs">Sale Type</label>
            <select
              value={saleType}
              onChange={e => setSaleType(e.target.value as any)}
              className="form-select"
            >
              <option value="b2b">B2B Wholesale</option>
              <option value="b2c">B2C Retail</option>
              <option value="raw_material">Raw Material Sale</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label text-xs">Product Selection *</label>
              <QuickAddButton label="Product" onClick={() => setShowAddProduct(true)} />
            </div>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="form-select"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.model}) — {formatBDT(p.sellingPrice)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label text-xs">Quantity (pcs) *</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="form-input font-mono"
            />
          </div>
          <div>
            <label className="form-label text-xs">Discount (৳)</label>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="form-input font-mono"
            />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-center">
            <span className="text-2xs font-600 text-slate-400 uppercase tracking-wider">Total Payable Amount</span>
            <span className="text-xl font-700 font-mono text-blue-600">{formatBDT(totalAmt)}</span>
          </div>

          <div className="md:col-span-2 pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => navigate('/sales')}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {saved ? '✓ Invoice Created & Stock Deducted!' : 'Confirm & Generate Invoice'}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Quick Entry Modals */}
      <QuickAddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCreated={(c) => setCustomerId(c.id)}
      />
      <QuickAddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onCreated={(p) => setProductId(p.id)}
      />
    </motion.div>
  );
}

export function B2BSales() {
  const sales = useAppStore(s => s.sales).filter(s => s.saleType === 'b2b');
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="B2B Wholesale Sales"
        subtitle="Dealer & distributor transactions with credit and bulk dispatch tracking"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Dealer Name</th>
                <th>Date</th>
                <th className="col-numeric">Total Amount</th>
                <th className="col-numeric">Paid</th>
                <th className="col-numeric">Due Balance</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{s.invoiceNo}</td>
                  <td className="font-600 text-slate-900">{s.customerName}</td>
                  <td className="text-xs text-slate-500">{s.saleDate}</td>
                  <td className="col-numeric font-mono font-700">{formatBDT(s.total)}</td>
                  <td className="col-numeric font-mono text-success-600">{formatBDT(s.paid)}</td>
                  <td className="col-numeric font-mono text-error-600 font-700">{formatBDT(s.due)}</td>
                  <td><StatusBadge status={s.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function B2CSales() {
  const sales = useAppStore(s => s.sales).filter(s => s.saleType === 'b2c');
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="B2C Retail Sales"
        subtitle="Direct-to-consumer orders and point-of-sale customer receipts"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Date</th>
                <th className="col-numeric">Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{s.invoiceNo}</td>
                  <td className="font-500 text-slate-900">{s.customerName}</td>
                  <td className="font-mono text-xs text-slate-500">{s.customerPhone || '—'}</td>
                  <td className="text-xs text-slate-500">{s.saleDate}</td>
                  <td className="col-numeric font-mono font-700 text-slate-900">{formatBDT(s.total)}</td>
                  <td><StatusBadge status={s.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function RawMaterialSales() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Raw Material Direct Sales"
        subtitle="Sale of bulk raw materials, offcuts, and components to third-party partners"
      />
      <motion.div variants={itemVariants} className="card p-6 text-center">
        <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="font-600 text-slate-800">Raw Material Sales Enabled</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Component sales are booked directly into the financial ledger and deduct stock from Warehouse A.</p>
      </motion.div>
    </motion.div>
  );
}

export function Customers() {
  const [showAdd, setShowAdd] = useState(false);
  const customers = useAppStore(s => s.customers);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Customer Directory"
        subtitle="B2B wholesale distributors and B2C retail accounts with credit tracking"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowAdd(true)}
          >
            Quick Register Customer
          </Button>
        }
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Area</th>
                <th className="col-numeric">Credit Limit</th>
                <th className="col-numeric">Current Due</th>
                <th className="col-numeric">Total Purchases</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{c.customerNo}</td>
                  <td className="font-600 text-slate-900">{c.name}</td>
                  <td><span className="badge badge-blue">{c.type.toUpperCase()}</span></td>
                  <td className="font-mono text-xs text-slate-600">{c.phone}</td>
                  <td className="text-xs text-slate-500">{c.area}</td>
                  <td className="col-numeric font-mono text-slate-500">{formatBDT(c.creditLimit, { compact: true })}</td>
                  <td className="col-numeric font-mono font-700 text-error-600">{formatBDT(c.balance)}</td>
                  <td className="col-numeric font-mono text-slate-900 font-600">{formatBDT(c.totalPurchases, { compact: true })}</td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <QuickAddCustomerModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      />
    </motion.div>
  );
}

export function Returns() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Sales Returns & RMA Management"
        subtitle="Customer warranty claims, return authorizations, and restocking workflows"
      />
      <motion.div variants={itemVariants} className="card p-6 text-center">
        <RotateCcw className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="font-600 text-slate-800">Return Rate: 0.4% (Industry Benchmark: &lt;2%)</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">No pending unprocessed customer returns today. Quality metrics are within optimal parameters.</p>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. DELIVERY FLEET SUITE
// ─────────────────────────────────────────────────────────────

export function AllDeliveries() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Delivery Fleet & Dispatch Hub"
        subtitle="Track outbound shipments, driver routes, and proof of delivery confirmations"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Shipments" value={DELIVERIES.length} icon={<TruckIcon className="w-4 h-4" />} iconColor="bg-blue-50 text-blue-600" />
        <KPICard label="Pending Dispatch" value={DELIVERIES.filter(d => d.status === 'pending').length} icon={<AlertTriangle className="w-4 h-4" />} iconColor="bg-amber-50 text-amber-600" />
        <KPICard label="In Transit" value={DELIVERIES.filter(d => d.status === 'in_transit').length} icon={<Clock className="w-4 h-4" />} iconColor="bg-indigo-50 text-indigo-600" />
        <KPICard label="Delivered Today" value={DELIVERIES.filter(d => d.status === 'delivered').length} icon={<CheckCircle className="w-4 h-4" />} iconColor="bg-success-50 text-success-600" />
      </div>
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery No</th>
                <th>Customer</th>
                <th>Destination Address</th>
                <th>Assigned Driver</th>
                <th className="col-numeric">Order Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DELIVERIES.map(d => (
                <tr key={d.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{d.deliveryNo}</td>
                  <td className="font-600 text-slate-900">{d.customerName}</td>
                  <td className="text-xs text-slate-500">{d.customerAddress}</td>
                  <td className="text-xs font-500 text-slate-700">{d.assignedTo || 'Unassigned'}</td>
                  <td className="col-numeric font-mono font-700">{formatBDT(d.totalAmount)}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PendingDeliveries() { return <AllDeliveries />; }
export function InTransit() { return <AllDeliveries />; }
export function Delivered() { return <AllDeliveries />; }

// ─────────────────────────────────────────────────────────────
// 6. QUALITY CONTROL SUITE
// ─────────────────────────────────────────────────────────────

export function QCHistory() {
  const qcList = useAppStore(s => s.qcRecords);
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Quality Control Inspection History"
        subtitle="Complete logs of batch testing, defect analysis, and inspection certificates"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>QC Code</th>
                <th>Order Ref</th>
                <th>Product</th>
                <th className="col-numeric">Inspected</th>
                <th className="col-numeric">Passed</th>
                <th className="col-numeric">Failed</th>
                <th>Inspector</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {qcList.map(q => (
                <tr key={q.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{q.qcNo}</td>
                  <td className="font-mono text-xs text-slate-500">{q.orderNo}</td>
                  <td className="font-500 text-slate-900">{q.productName}</td>
                  <td className="col-numeric font-mono font-600">{q.inspectedQty}</td>
                  <td className="col-numeric font-mono text-success-600 font-600">{q.passedQty}</td>
                  <td className="col-numeric font-mono text-error-600 font-600">{q.failedQty}</td>
                  <td className="text-xs text-slate-600">{q.inspectedBy}</td>
                  <td><StatusBadge status={q.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Rework() {
  const reworks = QC_RECORDS.filter(q => q.status === 'rework' || q.status === 'retested' || q.reworkQty > 0);
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Rework & Defect Rectification Queue"
        subtitle="Units returned from QC for component replacement or re-soldering"
      />
      <div className="space-y-3">
        {reworks.map(r => (
          <motion.div key={r.id} variants={itemVariants} className="card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-600 text-blue-600">{r.qcNo}</span>
                <StatusBadge status={r.status} />
              </div>
              <h4 className="font-600 text-slate-900 mt-1">{r.productName} ({r.reworkQty} units in rework)</h4>
              <p className="text-xs text-error-600 mt-0.5 font-500">Defect: {r.failureReason || 'Glass scratch / PCB issue'}</p>
            </div>
            <Button variant="secondary" size="sm" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Submit for Re-QC
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. WORKFORCE & HR SUITE
// ─────────────────────────────────────────────────────────────

export function EmployeesPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Factory Employees & Roster"
        subtitle="Staff directory, salary grades, assigned shifts and department profiles"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EMPLOYEES.map(e => (
          <motion.div key={e.id} variants={itemVariants} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-navy-900 text-white font-700 text-xs flex items-center justify-center">
                {e.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h4 className="font-600 text-slate-900 text-sm">{e.name}</h4>
                <p className="text-2xs text-slate-400">{e.employeeId} · {e.department}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Designation:</span>
                <span className="font-500 text-slate-800">{e.designation}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shift:</span>
                <span className="badge badge-slate">{e.shift.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Salary:</span>
                <span className="font-mono font-600 text-slate-900">{formatBDT(e.salary)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function Attendance() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Daily Attendance Register"
        subtitle="Biometric & manual shift check-in records for 17 August 2026"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shift</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ATTENDANCE_RECORDS.map(a => (
                <tr key={a.id}>
                  <td className="font-600 text-slate-900">{a.employeeName}</td>
                  <td><span className="badge badge-slate">{a.shift.toUpperCase()}</span></td>
                  <td className="font-mono text-xs text-slate-700">{a.checkIn ? a.checkIn.slice(11, 16) : '—'}</td>
                  <td className="font-mono text-xs text-slate-700">{a.checkOut ? a.checkOut.slice(11, 16) : '—'}</td>
                  <td className="text-xs text-slate-400">{a.notes || 'Normal'}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Shifts() { return <Attendance />; }
export function Performance() { return <ProductionOverview />; }

// ─────────────────────────────────────────────────────────────
// 8. FINANCE & ACCOUNTS SUITE
// ─────────────────────────────────────────────────────────────

export function AccountsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const accounts = useAppStore(s => s.accounts);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Cash, Bank accounts, and Mobile Banking (bKash/Nagad) operational balances"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowAdd(true)}
          >
            Quick Add Account
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map(acc => (
          <motion.div key={acc.id} variants={itemVariants} className="card p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="badge badge-navy">{acc.type.replace('_', ' ').toUpperCase()}</span>
              <span className="w-2 h-2 rounded-full bg-success-500" />
            </div>
            <p className="text-xs text-slate-400 font-500">{acc.name}</p>
            <p className="text-xl font-700 font-mono text-slate-900 mt-1">{formatBDT(acc.balance)}</p>
            {acc.accountNo && <p className="text-2xs font-mono text-slate-400 mt-2">A/C: {acc.accountNo}</p>}
          </motion.div>
        ))}
      </div>

      <QuickAddAccountModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      />
    </motion.div>
  );
}

export function Transactions() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Financial Transactions Ledger"
        subtitle="Real-time general ledger transactions for income, expenses, and supplier payments"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn No</th>
                <th>Account</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th className="col-numeric">Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{t.transactionNo}</td>
                  <td className="text-xs text-slate-700">{t.accountName}</td>
                  <td>
                    <span className={cn('badge', t.type === 'income' ? 'badge-green' : 'badge-red')}>
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td><span className="badge badge-slate">{t.category}</span></td>
                  <td className="font-500 text-slate-900">{t.description}</td>
                  <td className={cn('col-numeric font-mono font-700', t.type === 'income' ? 'text-success-600' : 'text-error-600')}>
                    {t.type === 'income' ? `+${formatBDT(t.amount)}` : `-${formatBDT(t.amount)}`}
                  </td>
                  <td className="text-xs text-slate-400">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Expenses() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Factory & Operational Expenses"
        subtitle="Manage factory utilities, staff salaries, machine maintenance, and transport"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Category</th>
                <th>Notes / Details</th>
                <th>Paid From Account</th>
                <th className="col-numeric">Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSES.map(e => (
                <tr key={e.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{e.expenseNo}</td>
                  <td><span className="badge badge-navy">{e.category}</span></td>
                  <td className="font-500 text-slate-900">{e.notes}</td>
                  <td className="text-xs text-slate-600">{e.accountName}</td>
                  <td className="col-numeric font-mono font-700 text-error-600">-{formatBDT(e.amount)}</td>
                  <td className="text-xs text-slate-400">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Receivables() { return <B2BSales />; }
export function Payables() { return <Suppliers />; }

export function PnL() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Profit & Loss Statement (P&L)"
        subtitle="Monthly operational margin and factory financial performance"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Gross Revenue (Aug)" value={formatBDT(410000)} icon={<TrendingUp className="w-4 h-4" />} iconColor="bg-success-50 text-success-600" />
        <KPICard label="Total Operational Cost" value={formatBDT(268000)} icon={<TrendingDown className="w-4 h-4" />} iconColor="bg-error-50 text-error-600" />
        <KPICard label="Net Profit" value={formatBDT(142000)} icon={<Coins className="w-4 h-4" />} iconColor="bg-blue-50 text-blue-600" delta={14} />
      </div>
      <motion.div variants={itemVariants} className="card p-4">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={FINANCE_TREND_7D}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip />
            <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. MONITORING & CCTV SUITE
// ─────────────────────────────────────────────────────────────

export function Notifications() {
  const notifications = useAppStore(s => s.notifications);
  const markAllRead = useAppStore(s => s.markAllRead);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="System Notifications & Alerts"
        subtitle="Critical inventory shortages, QC alerts, and production events"
        actions={
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Mark All as Read
          </Button>
        }
      />
      <div className="space-y-2">
        {notifications.map(n => (
          <motion.div
            key={n.id}
            variants={itemVariants}
            className={cn(
              'card p-4 flex items-start justify-between border-l-4',
              n.priority === 'critical' ? 'border-l-error-500 bg-error-50/20' :
              n.priority === 'high' ? 'border-l-warning-500 bg-warning-50/20' : 'border-l-blue-500'
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-600 text-slate-900 text-sm">{n.title}</span>
                <span className="badge badge-slate">{n.priority.toUpperCase()}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{n.message}</p>
            </div>
            <span className="text-2xs text-slate-400">{n.createdAt.slice(0, 10)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function CCTV() {
  const cameras = [
    { id: 'CAM-01', name: 'Main Assembly Line — Stove & Cooker', status: 'ONLINE', fps: 30, ip: '192.168.1.101' },
    { id: 'CAM-02', name: 'Warehouse A — Raw Material Racks', status: 'ONLINE', fps: 25, ip: '192.168.1.102' },
    { id: 'CAM-03', name: 'Warehouse B — Finished Goods Bay', status: 'ONLINE', fps: 30, ip: '192.168.1.103' },
    { id: 'CAM-04', name: 'Quality Inspection & Testing Bench', status: 'ONLINE', fps: 30, ip: '192.168.1.104' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Factory CCTV Surveillance Hub"
        subtitle="Real-time multi-camera security feeds and production floor surveillance"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cameras.map(cam => (
          <motion.div key={cam.id} variants={itemVariants} className="card bg-navy-950 text-white overflow-hidden">
            <div className="p-3 bg-navy-900 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error-500 animate-pulse" />
                <span className="font-mono font-600 text-white">{cam.id}</span>
                <span className="text-slate-400">· {cam.name}</span>
              </div>
              <span className="text-2xs font-mono text-success-400">{cam.fps} FPS · LIVE</span>
            </div>
            <div className="h-48 bg-navy-950 flex flex-col items-center justify-center p-6 text-center border-y border-navy-800/50">
              <Video className="w-12 h-12 text-navy-600 mb-2" />
              <p className="text-xs text-slate-400 font-mono">ENCRYPTED RTSP STREAM ACTIVE</p>
              <p className="text-2xs text-slate-600 font-mono mt-1">{cam.ip} · 1080p H.265</p>
            </div>
            <div className="p-2.5 bg-navy-900/60 flex justify-between items-center text-2xs text-slate-400 font-mono">
              <span>{new Date().toLocaleTimeString()} · NVR-01</span>
              <button className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Expand
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. ADMINISTRATION & AUDIT SUITE
// ─────────────────────────────────────────────────────────────

export function AdminUsers() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="User Accounts & Access Control"
        subtitle="Manage operators, factory managers, and finance accounts"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Assigned Station</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-600 text-slate-900">Mushfiqur Rahman</td>
                <td className="text-slate-500 font-mono text-xs">mushfiq@slicemart.com</td>
                <td><span className="badge badge-navy">Factory Manager</span></td>
                <td className="text-xs text-slate-700">Central Plant Control</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td className="font-600 text-slate-900">Meshkat Afrose</td>
                <td className="text-slate-500 font-mono text-xs">meshkat.qc@slicemart.com</td>
                <td><span className="badge badge-blue">QC Inspector</span></td>
                <td className="text-xs text-slate-700">Testing Lab</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td className="font-600 text-slate-900">Rasel Ahmed</td>
                <td className="text-slate-500 font-mono text-xs">rasel.store@slicemart.com</td>
                <td><span className="badge badge-slate">Storekeeper</span></td>
                <td className="text-xs text-slate-700">Warehouse A</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AdminRoles() { return <AdminUsers />; }

export function AdminSettings() {
  const [saved, setSaved] = useState(false);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="System & Company Settings"
        subtitle="Slice Mart operational profile, fiscal year configurations, and unit settings"
      />
      <motion.div variants={itemVariants} className="card p-6">
        <div className="space-y-4 max-w-xl">
          <div>
            <label className="form-label">Company Name</label>
            <input type="text" defaultValue="Slice Mart Electronics Ltd." className="form-input" />
          </div>
          <div>
            <label className="form-label">Factory Location</label>
            <input type="text" defaultValue="Plot 45, Industrial Zone, Dhaka, Bangladesh" className="form-input" />
          </div>
          <div>
            <label className="form-label">Currency Symbol</label>
            <input type="text" defaultValue="BDT (৳)" className="form-input font-mono" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            >
              {saved ? 'Saved Successfully!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AuditLog() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="System Security Audit Trail"
        subtitle="Immutable timestamped log of all critical operations and modifications"
      />
      <motion.div variants={itemVariants} className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOGS.map(a => (
                <tr key={a.id}>
                  <td className="font-mono text-xs text-blue-600 font-500">{a.id}</td>
                  <td className="font-600 text-slate-900">{a.userName}</td>
                  <td><span className="badge badge-slate">{a.action.toUpperCase()}</span></td>
                  <td><span className="badge badge-navy">{a.module}</span></td>
                  <td className="text-slate-800 text-xs">{a.description}</td>
                  <td className="text-xs text-slate-400 font-mono">{a.createdAt.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. REPORTS SUITE
// ─────────────────────────────────────────────────────────────

export function ProductionReports() { return <ProductionOverview />; }
export function InventoryReports() { return <WarehouseA />; }
export function SalesReports() { return <B2BSales />; }
export function FinanceReports() { return <PnL />; }
