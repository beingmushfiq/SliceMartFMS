import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Factory,
  Warehouse,
  Microscope,
  Cpu,
  ArrowRight,
  ShoppingCart,
  Plus,
  FileText,
  Boxes,
  ClipboardCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import type { DashboardInvoice } from './SalesDashboardView';

interface ExecutiveDashboardViewProps {
  onOpenOrderPO?: (item: unknown) => void;
  onOpenReviewStock?: (item: unknown) => void;
  onOpenQC?: (item: unknown) => void;
  onOpenInvoice?: (invoice: DashboardInvoice) => void;
}

const REVENUE_DATA = [
  { day: 'Mon', revenue: 62000, production: 42 },
  { day: 'Tue', revenue: 71000, production: 46 },
  { day: 'Wed', revenue: 58000, production: 39 },
  { day: 'Thu', revenue: 84000, production: 50 },
  { day: 'Fri', revenue: 92000, production: 54 },
  { day: 'Sat', revenue: 68000, production: 45 },
  { day: 'Sun', revenue: 75250, production: 48 },
];

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  onOpenInvoice,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & EXECUTIVE GREETING
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-default font-sans">
              Executive Operations Overview
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Cross-functional enterprise summary • Commercial, Factory, Inventory & Quality
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reports"
            className="flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-all shadow-2xs"
          >
            <FileText className="size-3.5 text-muted" />
            <span>RMS Reports</span>
          </Link>
          <Link
            to="/pos"
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:from-blue-500 hover:to-indigo-500 transition-all"
          >
            <ShoppingCart className="size-3.5" />
            <span>POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 6-KPI EXECUTIVE STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: Total Revenue */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              TODAY'S REVENUE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 75,250
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              +18.4% vs yesterday
            </span>
          </div>
        </div>

        {/* KPI 2: Active Orders */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              ACTIVE ORDERS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              14 Orders
            </div>
            <span className="text-[10px] font-semibold text-muted">
              4 Ready for Dispatch
            </span>
          </div>
        </div>

        {/* KPI 3: Factory Production */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              TODAY'S OUTPUT
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Factory className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              48 pcs
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              96% Target Achieved
            </span>
          </div>
        </div>

        {/* KPI 4: Inventory Valuation */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              STOCK VALUATION
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Warehouse className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 14.6M
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              3 Reorder Warnings
            </span>
          </div>
        </div>

        {/* KPI 5: QC Pass Rate */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              QC PASS RATE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Microscope className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              97.5%
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Grade A Compliance
            </span>
          </div>
        </div>

        {/* KPI 6: Line Capacity */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              FACILITY CAPACITY
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Cpu className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              82%
            </div>
            <span className="text-[10px] font-semibold text-muted">
              4 Active Lines
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. EXECUTIVE QUICK COMMAND HUB
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Executive Command Actions
          </span>
          <span className="text-[11px] text-muted">Quick access to key operational workflows</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Link
            to="/sales"
            className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken/60 hover:bg-primary-subtle hover:border-primary/40 p-2.5 text-left transition-all group cursor-pointer shadow-2xs"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 group-hover:scale-105 transition-transform">
              <Plus className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-default group-hover:text-primary transition-colors truncate">
                Sales Order
              </div>
              <div className="text-[10px] text-muted truncate">New Commercial PO</div>
            </div>
          </Link>

          <Link
            to="/production"
            className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken/60 hover:bg-primary-subtle hover:border-primary/40 p-2.5 text-left transition-all group cursor-pointer shadow-2xs"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:scale-105 transition-transform">
              <Factory className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-default group-hover:text-primary transition-colors truncate">
                Production Plan
              </div>
              <div className="text-[10px] text-muted truncate">Schedule Batch</div>
            </div>
          </Link>

          <Link
            to="/inventory"
            className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken/60 hover:bg-primary-subtle hover:border-primary/40 p-2.5 text-left transition-all group cursor-pointer shadow-2xs"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-transform">
              <Boxes className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-default group-hover:text-primary transition-colors truncate">
                Stock Transfer
              </div>
              <div className="text-[10px] text-muted truncate">WH-A to WH-B</div>
            </div>
          </Link>

          <Link
            to="/purchasing"
            className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken/60 hover:bg-primary-subtle hover:border-primary/40 p-2.5 text-left transition-all group cursor-pointer shadow-2xs"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 group-hover:scale-105 transition-transform">
              <FileText className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-default group-hover:text-primary transition-colors truncate">
                Purchase PO
              </div>
              <div className="text-[10px] text-muted truncate">Procure Raw Materials</div>
            </div>
          </Link>

          <Link
            to="/qc"
            className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken/60 hover:bg-primary-subtle hover:border-primary/40 p-2.5 text-left transition-all group cursor-pointer shadow-2xs"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-default group-hover:text-primary transition-colors truncate">
                QC Inspections
              </div>
              <div className="text-[10px] text-muted truncate">Audit Active Batches</div>
            </div>
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken/60 hover:bg-primary-subtle hover:border-primary/40 p-2.5 text-left transition-all group cursor-pointer shadow-2xs"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 group-hover:scale-105 transition-transform">
              <Building2 className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-default group-hover:text-primary transition-colors truncate">
                Organization
              </div>
              <div className="text-[10px] text-muted truncate">Settings & Master</div>
            </div>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CROSS-DEPARTMENT OPERATIONAL HEALTH MATRIX
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Commercial Department */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-2.5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-blue-500" />
                <span className="text-xs font-bold text-default">Commercial & POS</span>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                12 Orders
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Today's Revenue:</span>
                <strong className="text-default font-mono">৳ 75,250</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Invoices Pending:</span>
                <strong className="text-amber-500 font-mono">৳ 73,500</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">POS Register:</span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Terminal #01 Active
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/sales"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-2 border-t border-default"
          >
            <span>Open Commercial Hub</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Factory Production */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-2.5">
              <div className="flex items-center gap-2">
                <Factory className="size-4 text-indigo-500" />
                <span className="text-xs font-bold text-default">Factory Floor</span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                96% Output
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Units Produced:</span>
                <strong className="text-default font-mono">48 / 50 pcs</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Active Batches:</span>
                <strong className="text-default font-mono">2 In-Progress</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Shift Status:</span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Morning Shift Lead
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/production"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-2 border-t border-default"
          >
            <span>View Factory Floor</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Warehouse & Inventory */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-2.5">
              <div className="flex items-center gap-2">
                <Warehouse className="size-4 text-amber-500" />
                <span className="text-xs font-bold text-default">Warehouse Stock</span>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                3 Low Items
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Finished Goods:</span>
                <strong className="text-default font-mono">482 Units</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Raw Materials:</span>
                <strong className="text-default font-mono">15 Categories</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Pending Inbound:</span>
                <span className="text-blue-500 font-semibold">3 GRNs Expected</span>
              </div>
            </div>
          </div>
          <Link
            to="/inventory"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-2 border-t border-default"
          >
            <span>Open Warehouse Ledger</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Quality Assurance */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-2.5">
              <div className="flex items-center gap-2">
                <Microscope className="size-4 text-cyan-500" />
                <span className="text-xs font-bold text-default">Quality Control</span>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                97.5% Pass
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Inspections Done:</span>
                <strong className="text-default font-mono">40 Passed</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Queue Pending:</span>
                <strong className="text-amber-500 font-mono">1 Batch (48 pcs)</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Rework Quantity:</span>
                <span className="text-muted font-semibold">5 Units</span>
              </div>
            </div>
          </div>
          <Link
            to="/qc"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-2 border-t border-default"
          >
            <span>Audit QA Queue</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. DUAL PERFORMANCE TRENDS & RECENT TRANSACTIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Revenue & Production Output Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-default bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-default">Commercial & Production Trends</h3>
              <p className="text-[11px] text-muted">Weekly revenue correlation with manufacturing output</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Revenue (৳)
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Output (pcs)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="execRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.07} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.6 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.6 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-raised, #18181b)',
                    borderColor: 'var(--border-default, #27272a)',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#execRevenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent High-Priority Transactions */}
        <div className="rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-default pb-2">
              <h3 className="text-sm font-bold text-default">Executive Activity</h3>
              <span className="text-[10px] text-muted uppercase font-semibold">Live Audit</span>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onOpenInvoice?.({ id: 'INV-0717', customer: 'Karim Trading Corporation', type: 'B2B', amount: '৳ 59,500', status: 'CONFIRMED', payment: 'UNPAID' })}
                className="w-full text-left flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-sunken transition-colors cursor-pointer"
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-default truncate">Karim Trading Corporation</div>
                  <div className="text-[10px] text-muted">B2B Invoice INV-0717 • ৳ 59,500</div>
                </div>
                <span className="text-[10px] font-mono text-muted">10m ago</span>
              </button>

              <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-sunken transition-colors">
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0 mt-0.5">
                  <Factory className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-default truncate">Batch PO-00125 Completed</div>
                  <div className="text-[10px] text-muted">48 pcs Infrared Cooker IR-101</div>
                </div>
                <span className="text-[10px] font-mono text-muted">45m ago</span>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-sunken transition-colors">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
                  <Warehouse className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-default truncate">Stock Transfer Approved</div>
                  <div className="text-[10px] text-muted">50 pcs IR-102 moved to WH-B</div>
                </div>
                <span className="text-[10px] font-mono text-muted">2h ago</span>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-sunken transition-colors">
                <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 shrink-0 mt-0.5">
                  <Microscope className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-default truncate">Batch PO-00124 QC Passed</div>
                  <div className="text-[10px] text-muted">40 pcs Infrared Stove IS-201</div>
                </div>
                <span className="text-[10px] font-mono text-muted">3h ago</span>
              </div>
            </div>
          </div>

          <Link
            to="/activity-logs"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-2 border-t border-default"
          >
            <span>View Full Audit Trail</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
