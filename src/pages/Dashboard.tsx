// ─────────────────────────────────────────────────────────────
// DASHBOARD — Operational command center for Slice Mart
// Answers: "What is happening in the factory right now?"
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Factory, Package, AlertTriangle, TrendingUp,
  TrendingDown, ArrowRight, ChevronRight,
  PackageOpen, ShieldCheck, RotateCcw,
  Zap, Users, Truck, DollarSign, ArrowUpRight,
} from 'lucide-react';
import {
  XAxis, YAxis, AreaChart, Area,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { cn, formatBDT, calcPct } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { KPICard, ProgressKPI } from '../components/ui/KPICard';
import { StatusBadge } from '../components/ui/Badge';
import { OperationalAlerts } from '../components/dashboard/OperationalAlerts';
import {
  EMPLOYEES, PRODUCTION_TREND_7D, DELIVERIES,
} from '../data/mockData';

// ── Framer Motion variants ────────────────────────────────────
const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

// ── Custom Recharts Tooltip ───────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-xs">
      <p className="font-600 text-slate-900 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-600 text-slate-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Section Header ────────────────────────────────────────────
function SectionHeader({
  title, subtitle, action
}: {
  title: string; subtitle?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && (
        <motion.button
          whileHover={{ x: 2 }}
          onClick={action.onClick}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800
                     font-500 transition-colors cursor-pointer"
        >
          {action.label}
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </motion.button>
      )}
    </div>
  );
}

// ── Mini stat cell ────────────────────────────────────────────
function StatCell({
  label, value, color = 'text-slate-900', onClick
}: {
  label: string; value: string | number; color?: string; onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn('text-center', onClick && 'cursor-pointer')}
    >
      <div className={cn('text-xl font-700 font-mono', color)}>{value}</div>
      <div className="text-2xs text-slate-400 font-500 mt-0.5">{label}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const inventory         = useAppStore(s => s.inventory);
  const productionOrders  = useAppStore(s => s.productionOrders);
  const sales             = useAppStore(s => s.sales);
  const qcRecords         = useAppStore(s => s.qcRecords);
  const accounts          = useAppStore(s => s.accounts);
  const expenses          = useAppStore(s => s.expenses);

  const [trendRange, setTrendRange] = useState<'7d' | '30d'>('7d');

  // ── Live computed stats ────────────────────────────────────

  // Production
  const todayOrders   = productionOrders.filter(po => po.productionDate === '2026-08-17');
  const todayTarget   = todayOrders.reduce((s, po) => s + po.targetQty, 0);
  const todayProduced = todayOrders.reduce((s, po) => s + po.producedQty, 0);
  const todayPct      = calcPct(todayProduced, todayTarget);
  const qcPending     = productionOrders.filter(po => po.status === 'qc_pending').length;
  const reworkQty     = productionOrders.reduce((s, po) => s + po.reworkQty, 0);

  // Inventory
  const rawMaterials    = inventory.filter(i => i.itemType === 'material');
  const finishedGoods   = inventory.filter(i => i.itemType === 'product');
  const lowStockItems   = inventory.filter(i => i.qty > 0 && i.qty <= i.minStock);
  const outOfStock      = inventory.filter(i => i.qty === 0);
  const fgTotalValue    = finishedGoods.reduce((s, i) => s + i.totalValue, 0);
  const rmTotalValue    = rawMaterials.reduce((s, i) => s + i.totalValue, 0);
  const rmQty           = rawMaterials.reduce((s, i) => s + i.qty, 0);
  const fgQty           = finishedGoods.reduce((s, i) => s + i.qty, 0);

  // Sales (today)
  const todaySales   = sales.filter(s => s.saleDate === '2026-08-17');
  const todaySaleAmt = todaySales.reduce((s, sale) => s + sale.total, 0);
  const monthlySales = sales.reduce((s, sale) => s + sale.total, 0);
  const outstanding  = sales.reduce((s, sale) => s + sale.due, 0);
  const pendingDel   = sales.filter(s => s.status === 'confirmed' || s.status === 'processing').length;

  // Finance
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const todayExpenses = expenses.filter(e => e.date === '2026-08-17').reduce((s, e) => s + e.amount, 0);

  // Alerts
  const outOfStockMats   = inventory.filter(i => i.itemType === 'material' && i.qty === 0);
  const lowStockMats     = lowStockItems.filter(i => i.qty > 0 && i.itemType === 'material');

  // Employee performance today
  const empPerf = EMPLOYEES.slice(0, 6).map(emp => {
    const target   = emp.shift === 'morning' ? 18 : 16;
    const produced =
      emp.id === 'EMP-001' ? 17 :
      emp.id === 'EMP-002' ? 16 :
      emp.id === 'EMP-004' ? 15 :
      emp.id === 'EMP-009' ? 18 :
      emp.id === 'EMP-010' ? 14 : 0;
    return { ...emp, target, produced, pct: calcPct(produced, target) };
  }).filter(e => e.produced > 0);

  // 30-day trend data (simulate)
  const trend30d = Array.from({ length: 30 }, (_, i) => {
    const base = 200 + Math.sin(i * 0.4) * 20;
    const target = Math.round(base + 10);
    const produced = Math.round(base + Math.random() * 15 - 5);
    const passed = Math.round(produced * 0.95);
    const date = new Date('2026-07-19');
    date.setDate(date.getDate() + i);
    return { date: `${date.getDate()}/${date.getMonth() + 1}`, target, produced, passed };
  });

  const trendData = trendRange === '7d' ? PRODUCTION_TREND_7D : trend30d;

  return (
    <div className="space-y-6">

      {/* ── Operational Attention Center (Graceful Alert Bar) ── */}
      <OperationalAlerts
        outOfStockItems={outOfStockMats}
        lowStockItems={lowStockMats.slice(0, 2)}
      />

      {/* ── Row 1: Production Summary ──────────────────── */}
      <motion.section
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        aria-labelledby="prod-summary"
      >
        <SectionHeader
          title="Today's Production"
          subtitle="17 August 2026 · Morning Shift"
          action={{ label: 'View orders', onClick: () => navigate('/production/orders') }}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            index={0}
            label="Today's Target"
            value={todayTarget}
            icon={<Factory className="w-4.5 h-4.5" />}
            iconColor="bg-blue-50 text-blue-600"
            onClick={() => navigate('/production/orders')}
          />
          <KPICard
            index={1}
            label="Produced"
            value={todayProduced}
            subValue={`${todayPct}% of target`}
            icon={<TrendingUp className="w-4.5 h-4.5" />}
            iconColor="bg-success-50 text-success-600"
            alert={todayPct >= 90 ? 'success' : todayPct >= 70 ? undefined : 'warning'}
            onClick={() => navigate('/production/orders')}
          />
          <KPICard
            index={2}
            label="Pending Orders"
            value={productionOrders.filter(po => po.status === 'ready' || po.status === 'planned').length}
            icon={<PackageOpen className="w-4.5 h-4.5" />}
            iconColor="bg-slate-100 text-slate-500"
            onClick={() => navigate('/production/orders')}
          />
          <KPICard
            index={3}
            label="QC Pending"
            value={qcPending}
            icon={<ShieldCheck className="w-4.5 h-4.5" />}
            iconColor="bg-warning-50 text-warning-600"
            alert={qcPending > 0 ? 'warning' : undefined}
            onClick={() => navigate('/qc')}
          />
          <KPICard
            index={4}
            label="Rework Qty"
            value={reworkQty}
            icon={<RotateCcw className="w-4.5 h-4.5" />}
            iconColor="bg-amber-50 text-amber-600"
            onClick={() => navigate('/qc/rework')}
          />
          <KPICard
            index={5}
            label="Achievement"
            value={`${todayPct}%`}
            icon={todayPct >= 90 ? <TrendingUp className="w-4.5 h-4.5" /> : <TrendingDown className="w-4.5 h-4.5" />}
            iconColor={todayPct >= 90 ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'}
          />
        </div>
      </motion.section>

      {/* ── Row 2: Production Trend + Inventory Health ──── */}
      <motion.div
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >

        {/* Production Trend Chart */}
        <section className="card lg:col-span-2" aria-labelledby="trend-title">
          <div className="card-header">
            <div>
              <h2 id="trend-title" className="section-title">Production Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Target vs Produced vs Passed QC</p>
            </div>
            <div className="flex items-center gap-1">
              {(['7d', '30d'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setTrendRange(r)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-500 rounded-md transition-colors duration-150 cursor-pointer',
                    trendRange === r
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {r === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="colorProduced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                <Area dataKey="target"   name="Target"    stroke="#e2e8f0" strokeWidth={2} fill="none" strokeDasharray="4 4" dot={false} />
                <Area dataKey="produced" name="Produced"  stroke="#2563eb" strokeWidth={2} fill="url(#colorProduced)" dot={false} activeDot={{ r: 4, fill: '#2563eb' }} />
                <Area dataKey="passed"   name="QC Passed" stroke="#16a34a" strokeWidth={2} fill="url(#colorPassed)"   dot={false} activeDot={{ r: 4, fill: '#16a34a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Inventory Health */}
        <section className="card" aria-labelledby="inv-title">
          <div className="card-header">
            <h2 id="inv-title" className="section-title">Inventory Health</h2>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer"
            >
              View all
            </button>
          </div>
          <div className="card-body space-y-4">
            {/* Stock overview stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Raw Materials', value: rawMaterials.length, sub: formatBDT(rmTotalValue, { compact: true }), subLabel: `${rmQty.toLocaleString()} pcs` },
                { label: 'Finished Goods', value: fgQty, sub: formatBDT(fgTotalValue, { compact: true }), subLabel: `${finishedGoods.length} SKUs` },
              ].map(stat => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-50 rounded-lg p-3 text-center cursor-pointer"
                  onClick={() => navigate('/inventory')}
                >
                  <div className="text-2xl font-700 font-mono text-slate-900">{stat.value}</div>
                  <div className="text-2xs text-slate-500 mt-0.5 font-500">{stat.label}</div>
                  <div className="text-xs text-slate-400 font-mono">{stat.sub}</div>
                  <div className="text-2xs text-slate-400 mt-0.5">{stat.subLabel}</div>
                </motion.div>
              ))}
            </div>

            {/* Stock alerts */}
            <div className="space-y-2">
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate('/inventory/materials')}
                className="flex items-center justify-between py-2 px-3 bg-error-50 border border-error-100
                           rounded-lg cursor-pointer hover:bg-error-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-error-600" aria-hidden="true" />
                  <span className="text-sm font-500 text-error-800">Out of stock</span>
                </div>
                <span className="text-sm font-700 font-mono text-error-700">{outOfStock.length}</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate('/inventory/materials')}
                className="flex items-center justify-between py-2 px-3 bg-warning-50 border border-warning-100
                           rounded-lg cursor-pointer hover:bg-warning-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-warning-600" aria-hidden="true" />
                  <span className="text-sm font-500 text-warning-800">Low stock</span>
                </div>
                <span className="text-sm font-700 font-mono text-warning-700">{lowStockItems.length}</span>
              </motion.div>
            </div>

            {/* Warehouse split */}
            <div>
              <p className="text-xs text-slate-400 font-600 uppercase tracking-wide mb-2">Warehouse Distribution</p>
              <ProgressKPI label="WH-A Raw Materials" value={rmQty} total={5000} color="blue" />
              <div className="mt-3">
                <ProgressKPI label="WH-B Finished Goods" value={fgQty} total={1000} color="green" />
              </div>
            </div>
          </div>
        </section>
      </motion.div>

      {/* ── Row 3: Sales Overview + Employee Performance ── */}
      <motion.div
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >

        {/* Sales Overview */}
        <section className="card lg:col-span-2" aria-labelledby="sales-title">
          <div className="card-header">
            <div>
              <h2 id="sales-title" className="section-title">Sales Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">August 2026</p>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer"
            >
              View all sales
            </button>
          </div>
          <div className="card-body">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <StatCell label="Today's Sales"    value={formatBDT(todaySaleAmt)}                           onClick={() => navigate('/sales')} />
              <StatCell label="Monthly Revenue"  value={formatBDT(monthlySales, { compact: true })}        onClick={() => navigate('/sales')} />
              <StatCell label="Outstanding"      value={formatBDT(outstanding, { compact: true })}  color="text-error-700" onClick={() => navigate('/sales')} />
              <StatCell label="Pending Delivery" value={pendingDel} color="text-warning-700"               onClick={() => navigate('/delivery/pending')} />
            </div>

            {/* Recent sales table */}
            <div className="overflow-x-auto">
              <table className="data-table" aria-label="Recent sales">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th className="col-numeric">Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 4).map((sale, i) => (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="cursor-pointer"
                      onClick={() => navigate('/sales')}
                    >
                      <td className="font-mono text-xs text-blue-600 font-500">{sale.invoiceNo}</td>
                      <td className="text-slate-800 font-500">{sale.customerName}</td>
                      <td>
                        <span className={cn(
                          'badge border text-2xs',
                          sale.saleType === 'b2b'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        )}>
                          {sale.saleType.toUpperCase()}
                        </span>
                      </td>
                      <td className="col-numeric text-slate-900">{formatBDT(sale.total)}</td>
                      <td><StatusBadge status={sale.status ?? 'confirmed'} /></td>
                      <td><StatusBadge status={sale.paymentStatus} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Finance quick stats */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
              {[
                { label: 'Total Balance', value: formatBDT(totalBalance, { compact: true }), icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-slate-900' },
                { label: "Today's Expenses", value: formatBDT(todayExpenses), icon: <ArrowUpRight className="w-3.5 h-3.5" />, color: 'text-error-600' },
                { label: 'Active Accounts', value: accounts.filter(a => a.isActive).length, icon: <Zap className="w-3.5 h-3.5" />, color: 'text-blue-700' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => navigate('/finance')}
                >
                  <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <div className={cn('text-sm font-700 font-mono', stat.color)}>{stat.value}</div>
                    <div className="text-2xs text-slate-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Employee Performance */}
        <section className="card" aria-labelledby="emp-perf-title">
          <div className="card-header">
            <h2 id="emp-perf-title" className="section-title">Today's Performance</h2>
            <button
              onClick={() => navigate('/workforce/performance')}
              className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer"
            >
              Full report
            </button>
          </div>
          <div className="card-body space-y-4">
            {empPerf.map((emp, i) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-navy-900 flex items-center justify-center shrink-0">
                  <span className="text-xs font-700 text-white">
                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-500 text-slate-800 truncate">{emp.name.split(' ')[1]}</span>
                    <span className={cn(
                      'text-xs font-600 font-mono ml-2',
                      emp.pct >= 90 ? 'text-success-600' : emp.pct >= 70 ? 'text-warning-600' : 'text-error-600'
                    )}>
                      {emp.pct}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${emp.pct}%` }}
                      transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                      className={cn(
                        'progress-fill',
                        emp.pct >= 90 ? 'bg-success-500' : emp.pct >= 70 ? 'bg-warning-500' : 'bg-error-500'
                      )}
                      aria-label={`${emp.name}: ${emp.pct}%`}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-2xs text-slate-400">{emp.produced}/{emp.target} pcs</span>
                    <span className="text-2xs text-slate-400">{emp.designation.split(' ')[0]}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => navigate('/workforce/performance')}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500
                           hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
              >
                View all {EMPLOYEES.length} employees
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </motion.div>

      {/* ── Row 4: Active Production Orders + QC Status ── */}
      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >

        {/* Active Production Orders */}
        <section className="card" aria-labelledby="active-orders-title">
          <div className="card-header">
            <h2 id="active-orders-title" className="section-title">Active Production Orders</h2>
            <button onClick={() => navigate('/production/orders')}
              className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table" aria-label="Active production orders">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th className="col-numeric">Target</th>
                  <th className="col-numeric">Produced</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {productionOrders.slice(0, 5).map((po, i) => {
                  const pct = calcPct(po.producedQty, po.targetQty);
                  return (
                    <motion.tr
                      key={po.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      onClick={() => navigate('/production/orders')}
                      className="cursor-pointer"
                    >
                      <td className="font-mono text-xs text-blue-600 font-500">{po.orderNo}</td>
                      <td>
                        <div className="text-slate-800 font-500 text-sm">{po.model}</div>
                        <div className="text-xs text-slate-400">{po.productName.split(' ').slice(0, 3).join(' ')}</div>
                      </td>
                      <td className="col-numeric font-mono text-slate-700">{po.targetQty}</td>
                      <td className="col-numeric font-mono text-slate-900 font-600">{po.producedQty}</td>
                      <td>
                        <div className="flex items-center gap-2 min-w-20">
                          <div className="progress-bar flex-1">
                            <div
                              className={cn('progress-fill', pct >= 90 ? 'bg-success-500' : 'bg-blue-500')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-2xs text-slate-400 font-mono w-8">{pct}%</span>
                        </div>
                      </td>
                      <td><StatusBadge status={po.status} /></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* QC Summary */}
        <section className="card" aria-labelledby="qc-summary-title">
          <div className="card-header">
            <h2 id="qc-summary-title" className="section-title">Quality Control</h2>
            <button onClick={() => navigate('/qc')}
              className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer">
              QC Queue
            </button>
          </div>
          <div className="card-body space-y-3">
            {qcRecords.map((qc, i) => (
              <motion.div
                key={qc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                whileHover={{ scale: 1.01 }}
                className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg
                           hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate('/qc')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-600 text-blue-600">{qc.qcNo}</span>
                    <StatusBadge status={qc.status} />
                  </div>
                  <p className="text-sm font-500 text-slate-800">{qc.productName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{qc.orderNo}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-700 font-mono text-slate-900">{qc.inspectedQty} pcs</div>
                  {qc.failedQty > 0 && (
                    <div className="text-xs text-error-600 font-500 mt-0.5">{qc.failedQty} failed</div>
                  )}
                  {qc.reworkQty > 0 && (
                    <div className="text-xs text-warning-600 font-500">{qc.reworkQty} rework</div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* QC Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              {[
                { label: 'Pending',  value: qcRecords.filter(q => q.status === 'pending').length,  color: 'text-warning-700 bg-warning-50' },
                { label: 'Passed',   value: qcRecords.filter(q => q.status === 'passed').length,   color: 'text-success-700 bg-success-50' },
                { label: 'Rework',   value: qcRecords.filter(q => q.status === 'rework' || q.status === 'retested').length, color: 'text-amber-700 bg-amber-50' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.07 }}
                  className={cn('text-center py-2 rounded-lg', s.color)}
                >
                  <div className="text-xl font-700 font-mono">{s.value}</div>
                  <div className="text-2xs font-600 uppercase tracking-wide mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </motion.div>

      {/* ── Row 5: Deliveries + Key Financial Snapshot ── */}
      <motion.div
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Recent Deliveries */}
        <section className="card" aria-labelledby="deliveries-title">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              <h2 id="deliveries-title" className="section-title">Recent Deliveries</h2>
            </div>
            <button onClick={() => navigate('/delivery')}
              className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table" aria-label="Recent deliveries">
              <thead>
                <tr>
                  <th>Delivery #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {DELIVERIES.slice(0, 5).map((del, i) => (
                  <motion.tr
                    key={del.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="cursor-pointer"
                    onClick={() => navigate('/delivery')}
                  >
                    <td className="font-mono text-xs text-blue-600 font-500">{del.deliveryNo}</td>
                    <td>
                      <div className="text-slate-800 font-500 text-sm truncate max-w-35">{del.customerName}</div>
                    </td>
                    <td className="text-slate-600 text-xs">
                      {del.items.reduce((s, it) => s + it.qty, 0)} pcs
                    </td>
                    <td><StatusBadge status={del.status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Workforce snapshot */}
        <section className="card" aria-labelledby="workforce-title">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <h2 id="workforce-title" className="section-title">Workforce Today</h2>
            </div>
            <button onClick={() => navigate('/workforce')}
              className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer">
              Full roster
            </button>
          </div>
          <div className="card-body">
            {/* Shift breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Morning Shift', value: EMPLOYEES.filter(e => e.shift === 'morning' && e.status === 'active').length, color: 'bg-blue-50 text-blue-700' },
                { label: 'Afternoon Shift', value: EMPLOYEES.filter(e => e.shift === 'afternoon' && e.status === 'active').length, color: 'bg-amber-50 text-amber-700' },
                { label: 'Total Active', value: EMPLOYEES.filter(e => e.status === 'active').length, color: 'bg-success-50 text-success-700' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className={cn('text-center py-3 rounded-lg', s.color)}
                >
                  <div className="text-2xl font-700 font-mono">{s.value}</div>
                  <div className="text-2xs font-500 mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Top 4 employees attendance */}
            <p className="text-xs text-slate-400 font-600 uppercase tracking-wide mb-2">Present Today</p>
            <div className="space-y-2">
              {EMPLOYEES.filter(e => e.status === 'active').slice(0, 5).map((emp, i) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="flex items-center gap-2 py-1"
                >
                  <div className="w-6 h-6 rounded-full bg-navy-800 flex items-center justify-center shrink-0">
                    <span className="text-2xs font-700 text-white">
                      {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-800 font-500 truncate">{emp.name}</span>
                  </div>
                  <div className="text-2xs text-slate-400">{emp.designation.split(' ')[0]}</div>
                  <div className="w-1.5 h-1.5 rounded-full bg-success-500" title="Present" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </motion.div>

    </div>
  );
}
