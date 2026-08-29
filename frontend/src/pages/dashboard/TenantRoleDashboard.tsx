import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Factory,
  Microscope,
  Warehouse,
  ShoppingBag,
  ShoppingCart,
  ShieldAlert,
  Truck,
  ArrowRight,
  Boxes,
  Zap,
  Clock,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { m } from 'framer-motion';
import { useAuthStore } from '../../lib/auth/authStore';
import { KPICard } from '../../components/ui/KPICard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { enterBase } from '../../lib/motion/tokens';

const YIELD_DATA = [
  { day: 'Mon', output: 1420, target: 1350, yieldPct: 98.4 },
  { day: 'Tue', output: 1580, target: 1400, yieldPct: 99.1 },
  { day: 'Wed', output: 1390, target: 1400, yieldPct: 97.8 },
  { day: 'Thu', output: 1650, target: 1500, yieldPct: 99.5 },
  { day: 'Fri', output: 1720, target: 1600, yieldPct: 99.2 },
  { day: 'Sat', output: 1480, target: 1400, yieldPct: 98.9 },
  { day: 'Sun', output: 1210, target: 1200, yieldPct: 99.0 },
];

const LINE_MONITORS = [
  {
    id: 'line-1',
    name: 'Line 01 — Cutting & Precision',
    status: 'Running',
    batch: 'BAT-202608-042',
    recipe: 'Classic Oxford Cotton Shirt',
    progress: 84,
    speed: '124 pcs/hr',
    operator: 'Rahim Uddin (Lead)',
    health: 'optimal',
  },
  {
    id: 'line-2',
    name: 'Line 02 — High-Speed Sewing Assembly',
    status: 'Running',
    batch: 'BAT-202608-043',
    recipe: 'Slim Fit Chino Trouser',
    progress: 62,
    speed: '96 pcs/hr',
    operator: 'Fatema Begum',
    health: 'optimal',
  },
  {
    id: 'line-3',
    name: 'Line 03 — Finishing & Ironing Press',
    status: 'QC Audit',
    batch: 'BAT-202608-041',
    recipe: 'Denim Denim Overshirt',
    progress: 100,
    speed: 'Inspection in progress',
    operator: 'Tariqul Islam',
    health: 'warning',
  },
];

export const TenantRoleDashboard: React.FC = () => {
  const { user, tenant, activeBranch, hasPermission } = useAuthStore();
  const [activeActivityFilter, setActiveActivityFilter] = useState<'all' | 'production' | 'qc' | 'sales'>('all');

  // Role persona detection
  const isSuperOrAdmin =
    hasPermission('platform.tenant.manage') ||
    (hasPermission('production.batch.manage') && hasPermission('sales.order.manage'));
  const isProductionLead = hasPermission('production.batch.view') || hasPermission('production.plan.view');
  const isQcInspector = hasPermission('qc.inspection.view') || hasPermission('qc.inspection.manage');
  const isInventoryClerk = hasPermission('inventory.stock.view') || hasPermission('inventory.transfer.manage');
  const isSalesOfficer = hasPermission('sales.order.view') || hasPermission('pos.sales.view');
  const isFinanceOfficer = hasPermission('finance.gl.view') || hasPermission('finance.invoice.manage');

  // Determine primary persona title
  let roleTitle = 'Operations Associate';
  if (isSuperOrAdmin) roleTitle = 'Factory GM / Enterprise Admin';
  else if (isProductionLead) roleTitle = 'Production Line Lead';
  else if (isQcInspector) roleTitle = 'Quality Assurance Inspector';
  else if (isInventoryClerk) roleTitle = 'Inventory & Warehouse Manager';
  else if (isSalesOfficer) roleTitle = 'Commercial & POS Lead';
  else if (isFinanceOfficer) roleTitle = 'Finance & Accounts Controller';

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-1">
      {/* Welcome Banner */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enterBase}
        className="relative overflow-hidden rounded-xl border border-default bg-surface p-6 sm:p-7 shadow-xs"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                <Sparkles className="size-3" />
                {roleTitle}
              </span>
              {activeBranch && (
                <span className="inline-flex items-center rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-muted border border-default">
                  📍 {activeBranch.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Shift 01 Active (09:00 - 17:00)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-default sm:text-3xl">
              Welcome back, {user?.name || 'Operator'}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
              Real-time telemetry and management hub for <strong className="text-default">{tenant?.name || 'SliceMart'}</strong>. 
              Monitor line capacity, batch yield tolerances, POS checkouts, and dispatch fulfillment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/pos">
              <Button variant="primary" size="md">
                <ShoppingCart className="size-4 mr-2" aria-hidden="true" />
                Launch POS Terminal
              </Button>
            </Link>
            <Link to="/production">
              <Button variant="secondary" size="md">
                <Factory className="size-4 mr-2" aria-hidden="true" />
                Production Floor
              </Button>
            </Link>
            <Link to="/fraud-verification">
              <Button variant="ghost" size="md">
                <ShieldAlert className="size-4 mr-2 text-warning" aria-hidden="true" />
                Fraud Queue
              </Button>
            </Link>
          </div>
        </div>
      </m.div>

      {/* Operational Highlights / KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Active Floor Batches"
          value={12}
          subValue="3 lines running in parallel"
          delta={8.4}
          deltaLabel="vs yesterday"
          icon={<Factory className="size-5 text-blue-500" />}
          iconColor="bg-blue-500/10"
          index={0}
        />

        <KPICard
          label="Quality Pass Rate"
          value="99.4%"
          subValue="48 batch inspections logged"
          delta={0.6}
          deltaLabel="vs target tolerance"
          icon={<Microscope className="size-5 text-emerald-500" />}
          iconColor="bg-emerald-500/10"
          alert="success"
          index={1}
        />

        <KPICard
          label="Inventory Health"
          value="96.8%"
          subValue="Raw fabric & silos in stock"
          delta={-1.2}
          deltaLabel="safety reorder items: 3"
          icon={<Warehouse className="size-5 text-cyan-500" />}
          iconColor="bg-cyan-500/10"
          index={2}
        />

        <KPICard
          label="Daily Commercial Gross"
          value="৳ 184,200"
          subValue="POS + Storefront orders"
          delta={14.2}
          deltaLabel="vs avg daily run-rate"
          icon={<ShoppingBag className="size-5 text-amber-500" />}
          iconColor="bg-amber-500/10"
          index={3}
        />
      </div>

      {/* Floor Telemetry & Line Shift Monitors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-default">Active Production Lines & Line Telemetry</h2>
          </div>
          <Link to="/production" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>View All Schedules</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LINE_MONITORS.map((line) => (
            <div
              key={line.id}
              className="rounded-xl border border-default bg-surface p-4.5 space-y-3 shadow-xs hover:border-strong transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-default">{line.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    line.health === 'optimal'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  }`}
                >
                  {line.status}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-muted flex items-center justify-between">
                  <span>Batch: <strong className="font-mono text-default">{line.batch}</strong></span>
                  <span className="font-semibold text-default">{line.speed}</span>
                </div>
                <div className="text-xs font-semibold text-default truncate">{line.recipe}</div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>Yield Completion</span>
                  <span className="font-mono font-bold text-default">{line.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      line.health === 'optimal' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${line.progress}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-default flex items-center justify-between text-[11px] text-muted">
                <span>Supervisor: {line.operator}</span>
                <Link to="/production" className="text-primary hover:underline font-semibold">
                  Manage →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics & Throughput Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Production Output & Target */}
        <div className="lg:col-span-2 rounded-xl border border-default bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
            <div>
              <h3 className="text-sm font-bold text-default">Weekly Production Volume & Target Output</h3>
              <p className="text-2xs text-muted mt-0.5">Daily unit yields vs scheduled master manufacturing plan</p>
            </div>
            <div className="flex items-center gap-3 text-2xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="size-2 rounded-full bg-blue-500" />
                Actual Units
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="size-2 rounded-full bg-slate-500" />
                Planned Target
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={YIELD_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="output"
                  name="Actual Output"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOutput)"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  name="Planned Target"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Quality Yield Benchmark Bar */}
        <div className="rounded-xl border border-default bg-surface p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-sm font-bold text-default">Daily QC Yield (%)</h3>
              <Badge tone="success-subtle">99.4% Avg</Badge>
            </div>
            <p className="text-2xs text-muted mt-2">Pass rate against sensory & dimension audits</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={YIELD_DATA} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[95, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="yieldPct" name="Yield %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-lg bg-surface-sunken border border-default text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-default">
              <span>Wastage Factor</span>
              <span className="text-emerald-400">0.6% (Tolerance: &lt; 2.0%)</span>
            </div>
            <p className="text-[10px] text-muted">All scrap within standard fabric cutting allowance</p>
          </div>
        </div>
      </div>

      {/* Operational Workspaces Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-default flex items-center gap-2">
            <Zap className="size-4 text-primary" aria-hidden="true" />
            <span>Industrial Workspaces & Navigation</span>
          </h2>
          <span className="text-2xs text-muted">Role-authorized fast links</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Production Batches */}
          <Link
            to="/production"
            className="group rounded-xl border border-default bg-surface p-4.5 space-y-2.5 hover:border-strong hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                <Factory className="size-4.5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-primary transition-colors">
                Production Batches & Schedules
              </h3>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Issue BOM raw materials, execute shift runs, and record worker piece-rate output.
              </p>
            </div>
          </Link>

          {/* Quality Control */}
          <Link
            to="/qc"
            className="group rounded-xl border border-default bg-surface p-4.5 space-y-2.5 hover:border-strong hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                <Microscope className="size-4.5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-emerald-400 transition-colors">
                QC Inspections & Wastage Log
              </h3>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Log batch sample audits against weight, dimension tolerances, and scrap defects.
              </p>
            </div>
          </Link>

          {/* Stock & Inventory */}
          <Link
            to="/inventory"
            className="group rounded-xl border border-default bg-surface p-4.5 space-y-2.5 hover:border-strong hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                <Warehouse className="size-4.5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-cyan-400 transition-colors">
                Stock Balances & Ledger
              </h3>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Per-bin balances, inter-warehouse transfers, and physical stock cycle counts.
              </p>
            </div>
          </Link>

          {/* Procurement & PO */}
          <Link
            to="/purchasing"
            className="group rounded-xl border border-default bg-surface p-4.5 space-y-2.5 hover:border-strong hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="size-4.5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-indigo-400 transition-colors">
                Procurement & GRN Receiving
              </h3>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Purchase requisitions, vendor PO issuance, 3-way match gate receiving, and AP bills.
              </p>
            </div>
          </Link>

          {/* Storefront CMS */}
          <Link
            to="/storefront"
            className="group rounded-xl border border-default bg-surface p-4.5 space-y-2.5 hover:border-strong hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                <Boxes className="size-4.5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-primary transition-colors">
                Storefront CMS & Page Builder
              </h3>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Branding themes, product collections, and direct headless e-commerce settings.
              </p>
            </div>
          </Link>

          {/* Logistics Hub */}
          <Link
            to="/logistics"
            className="group rounded-xl border border-default bg-surface p-4.5 space-y-2.5 hover:border-strong hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Truck className="size-4.5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-amber-400 transition-colors">
                Logistics & Courier Hub
              </h3>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Steadfast, Pathao & REDX integration, rider dispatch sheets, and COD remittance.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Operational Activity Stream */}
      <div className="rounded-xl border border-default bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted" aria-hidden="true" />
            <h3 className="text-sm font-bold text-default">Live Operational Telemetry & Event Stream</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveActivityFilter('all')}
              className={`px-2.5 py-1 rounded-md text-2xs font-semibold transition-colors ${
                activeActivityFilter === 'all'
                  ? 'bg-primary-subtle text-primary'
                  : 'text-muted hover:bg-surface-sunken'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveActivityFilter('production')}
              className={`px-2.5 py-1 rounded-md text-2xs font-semibold transition-colors ${
                activeActivityFilter === 'production'
                  ? 'bg-primary-subtle text-primary'
                  : 'text-muted hover:bg-surface-sunken'
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setActiveActivityFilter('qc')}
              className={`px-2.5 py-1 rounded-md text-2xs font-semibold transition-colors ${
                activeActivityFilter === 'qc'
                  ? 'bg-primary-subtle text-primary'
                  : 'text-muted hover:bg-surface-sunken'
              }`}
            >
              Quality (QC)
            </button>
          </div>
        </div>

        <div className="divide-y divide-default text-xs">
          <div className="py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
              <span className="text-default truncate">
                Batch <strong className="font-mono text-default">PB-202608-042</strong> completed shift run (450 pcs yield)
              </span>
            </div>
            <span className="text-muted text-[11px] font-mono shrink-0">12m ago</span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
              <span className="text-default truncate">
                QC Inspection passed for batch <strong className="font-mono text-default">PB-202608-041</strong> (Tolerance score: 99.2%)
              </span>
            </div>
            <span className="text-muted text-[11px] font-mono shrink-0">34m ago</span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="size-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
              <span className="text-default truncate">
                Delivery Order <strong className="font-mono text-default">DO-2026-089</strong> booked with Steadfast Courier (Tracking: ST-88910)
              </span>
            </div>
            <span className="text-muted text-[11px] font-mono shrink-0">1h ago</span>
          </div>

          <div className="py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="size-2 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
              <span className="text-default truncate">
                Purchase Order <strong className="font-mono text-default">PO-2026-004</strong> approved by Accounts (Amount: ৳ 420,000)
              </span>
            </div>
            <span className="text-muted text-[11px] font-mono shrink-0">2h ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

