import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Factory,
  Microscope,
  Warehouse,
  ShoppingBag,
  ShoppingCart,
  Truck,
  ArrowRight,
  Boxes,
  Zap,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Activity,
  RefreshCw,
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
    efficiency: '98.6%',
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
    efficiency: '97.2%',
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
    efficiency: '94.8%',
  },
];

export const TenantRoleDashboard: React.FC = () => {
  const { user, tenant, activeBranch, hasPermission } = useAuthStore();
  const [activeActivityFilter, setActiveActivityFilter] = useState<'all' | 'production' | 'qc' | 'sales'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isQuickTallyOpen, setIsQuickTallyOpen] = useState(false);
  const [quickTallyCount, setQuickTallyCount] = useState(50);
  const [quickWorkerName, setQuickWorkerName] = useState('Rahim Uddin (W-104 - Lead Cutter)');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setLastRefreshedAt(new Date());
      setIsSyncing(false);
    }, 600);
  };

  // Role persona detection
  const isSuperOrAdmin =
    hasPermission('platform.tenant.manage') ||
    (hasPermission('production.batch.manage') && hasPermission('sales.order.manage'));
  const isProductionLead = hasPermission('production.batch.view') || hasPermission('production.plan.view');
  const isQcInspector = hasPermission('qc.inspection.view') || hasPermission('qc.inspection.manage');
  const isInventoryClerk = hasPermission('inventory.stock.view') || hasPermission('inventory.transfer.manage');
  const isSalesOfficer = hasPermission('sales.order.view') || hasPermission('pos.sales.view');
  const isFinanceOfficer = hasPermission('finance.gl.view') || hasPermission('finance.invoice.manage');

  let roleTitle = 'Operations Associate';
  if (isSuperOrAdmin) roleTitle = 'Factory GM / Enterprise Admin';
  else if (isProductionLead) roleTitle = 'Production Line Lead';
  else if (isQcInspector) roleTitle = 'Quality Assurance Inspector';
  else if (isInventoryClerk) roleTitle = 'Inventory & Warehouse Manager';
  else if (isSalesOfficer) roleTitle = 'Commercial & POS Lead';
  else if (isFinanceOfficer) roleTitle = 'Finance & Accounts Controller';

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-1">
      {/* Adaptive Luxury Glassmorphic Hero Banner */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enterBase}
        className="relative overflow-hidden rounded-2xl border border-default bg-surface/95 p-6 sm:p-7 shadow-xs backdrop-blur-xl transition-token-colors"
      >
        {/* Atmospheric Ambient Lighting Mesh */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/15"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/3 -bottom-20 h-60 w-60 rounded-full bg-emerald-500/5 blur-3xl dark:bg-emerald-500/10"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-0.5 text-xs font-semibold text-primary border border-primary/30 shadow-xs">
                <Sparkles className="size-3" />
                {roleTitle}
              </span>
              {activeBranch && (
                <span className="inline-flex items-center rounded-full bg-surface-sunken px-3 py-0.5 text-xs font-medium text-muted border border-default">
                  📍 {activeBranch.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-2xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Shift A Active (09:00 - 17:00)
              </span>
              <button
                onClick={handleManualSync}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-muted hover:text-default transition-colors px-2 py-0.5 rounded bg-surface-sunken border border-default"
                title="Click to sync factory telemetry"
              >
                <RefreshCw className={`size-3 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{lastRefreshedAt.toLocaleTimeString()}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default font-sans">
              Welcome back, {user?.name || 'Operator'}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
              Live manufacturing command hub for <strong className="text-default font-semibold">{tenant?.name || 'SliceMart'}</strong>. 
              Real-time BOM costing simulations, multi-cart POS transactions, and automated 3PL courier sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/pos">
              <Button variant="primary" size="md" className="shadow-md shadow-indigo-600/20">
                <ShoppingCart className="size-4 mr-2" aria-hidden="true" />
                Launch POS Terminal
              </Button>
            </Link>
            <Link to="/production">
              <Button variant="secondary" size="md" className="border border-default">
                <Factory className="size-4 mr-2 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Production Floor
              </Button>
            </Link>
          </div>
        </div>
      </m.div>

      {/* Quick Tally Modal for Factory Floor */}
      {isQuickTallyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-default bg-surface-raised p-6 shadow-2xl space-y-4 text-default">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-amber-500" />
                <h3 className="font-bold text-base text-default">Factory Floor Quick Piece-Rate Tally</h3>
              </div>
              <button
                onClick={() => setIsQuickTallyOpen(false)}
                className="text-xs text-muted hover:text-default"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted mb-1 font-semibold">Worker / Operator:</label>
                <select
                  value={quickWorkerName}
                  onChange={(e) => setQuickWorkerName(e.target.value)}
                  className="w-full h-9 rounded-lg bg-surface border border-default px-3 text-default focus:outline-none"
                >
                  <option>Rahim Uddin (W-104 - Lead Cutter)</option>
                  <option>Fatema Begum (W-108 - Sewing Assembly)</option>
                  <option>Tariqul Islam (W-112 - Ironing & Finishing)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted mb-1 font-semibold">Active Batch Run:</label>
                <div className="p-2.5 rounded-lg bg-surface-sunken border border-default font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                  BAT-202608-042 (Classic Oxford Cotton Shirt)
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1 font-semibold">Tally Completed Units:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuickTallyCount(Math.max(0, quickTallyCount - 5))}
                    className="size-10 rounded-lg bg-surface-sunken hover:bg-surface font-bold text-lg text-default border border-default transition-colors"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={quickTallyCount}
                    onChange={(e) => setQuickTallyCount(Number(e.target.value))}
                    className="flex-1 h-10 text-center rounded-lg bg-surface border border-default font-mono font-bold text-xl text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={() => setQuickTallyCount(quickTallyCount + 5)}
                    className="size-10 rounded-lg bg-surface-sunken hover:bg-surface font-bold text-lg text-default border border-default transition-colors"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => setQuickTallyCount(quickTallyCount + 25)}
                    className="h-10 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-sm"
                  >
                    +25
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-sunken border border-default flex justify-between font-mono">
                <span className="text-muted">Estimated Wage (৳ 2.50/pc):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">৳ {(quickTallyCount * 2.5).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-default">
              <button
                onClick={() => setIsQuickTallyOpen(false)}
                className="flex-1 h-10 rounded-lg bg-surface-sunken hover:bg-surface text-xs font-semibold text-default border border-default transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Tally recorded: ${quickTallyCount} units logged for ${quickWorkerName}.`);
                  setIsQuickTallyOpen(false);
                }}
                className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                ✓ Commit Tally
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operational Highlights / KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Active Floor Batches"
          value={12}
          subValue="3 lines running in parallel"
          delta={8.4}
          deltaLabel="vs yesterday"
          icon={<Factory className="size-5 text-indigo-600 dark:text-indigo-400" />}
          iconColor="bg-indigo-500/15"
          index={0}
        />

        <KPICard
          label="Quality Pass Rate"
          value="99.4%"
          subValue="48 batch inspections logged"
          delta={0.6}
          deltaLabel="vs target tolerance"
          icon={<Microscope className="size-5 text-emerald-600 dark:text-emerald-400" />}
          iconColor="bg-emerald-500/15"
          alert="success"
          index={1}
        />

        <KPICard
          label="Inventory Health"
          value="96.8%"
          subValue="Raw fabric & silos in stock"
          delta={-1.2}
          deltaLabel="safety reorders: 3"
          icon={<Warehouse className="size-5 text-cyan-600 dark:text-cyan-400" />}
          iconColor="bg-cyan-500/15"
          index={2}
        />

        <KPICard
          label="Daily Commercial Gross"
          value="৳ 184,200"
          subValue="POS + Storefront orders"
          delta={14.2}
          deltaLabel="vs avg daily run-rate"
          icon={<ShoppingBag className="size-5 text-amber-600 dark:text-amber-400" />}
          iconColor="bg-amber-500/15"
          index={3}
        />
      </div>

      {/* Floor Telemetry & Line Shift Monitors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-default tracking-tight">Active Production Lines & Floor Telemetry</h2>
          </div>
          <Link to="/production" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>Manage All Schedules</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LINE_MONITORS.map((line) => (
            <div
              key={line.id}
              className="group relative overflow-hidden rounded-2xl border border-default bg-surface p-5 space-y-3 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-default group-hover:text-primary transition-colors">{line.name}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    line.health === 'optimal'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
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

              {/* Progress bar with indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>Yield Completion</span>
                  <span className="font-mono font-bold text-default">{line.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden p-0.5 border border-default">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      line.health === 'optimal'
                        ? 'bg-linear-to-r from-emerald-500 to-teal-400'
                        : 'bg-linear-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${line.progress}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-default flex items-center justify-between text-[11px] text-muted">
                <span>Lead: {line.operator}</span>
                <Link to="/production" className="text-primary hover:underline font-semibold flex items-center gap-1">
                  <span>Manage</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics & Throughput Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Production Output & Target */}
        <div className="lg:col-span-2 rounded-2xl border border-default bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
            <div>
              <h3 className="text-sm font-bold text-default">Weekly Production Volume vs Master Plan Target</h3>
              <p className="text-2xs text-muted mt-0.5">Daily completed garment units against scheduled capacity</p>
            </div>
            <div className="flex items-center gap-3 text-2xs font-semibold">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="size-2 rounded-full bg-primary" />
                Actual Output
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <span className="size-2 rounded-full bg-slate-400" />
                Planned Target
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={YIELD_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="output"
                  name="Actual Output"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOutput)"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  name="Planned Target"
                  stroke="var(--color-text-subtle)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Quality Yield Benchmark Bar */}
        <div className="rounded-2xl border border-default bg-surface p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-sm font-bold text-default">Daily QC Yield Rate</h3>
              <Badge tone="success-subtle">99.4% Avg</Badge>
            </div>
            <p className="text-2xs text-muted mt-2">Pass rate benchmarked against ISO sensory & dimension tolerances</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={YIELD_DATA} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={[95, 100]} stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'var(--color-text)',
                  }}
                />
                <Bar dataKey="yieldPct" name="Yield %" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-surface-sunken border border-default text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-default">
              <span>Wastage Tolerance</span>
              <span className="text-emerald-600 dark:text-emerald-400">0.6% (Threshold: &lt; 2.0%)</span>
            </div>
            <p className="text-[10px] text-muted">Scrap maintained well within fabric cutting allowances</p>
          </div>
        </div>
      </div>

      {/* Operational Workspaces Quick Launcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-default flex items-center gap-2">
            <Zap className="size-4 text-primary" aria-hidden="true" />
            <span>Industrial Workspaces & Execution Hub</span>
          </h2>
          <span className="text-2xs text-muted">Instant module access</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Production Batches */}
          <Link
            to="/production"
            className="group rounded-2xl border border-default bg-surface p-5 space-y-3 hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-primary group-hover:scale-110 transition-transform">
                <Factory className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-primary transition-colors">
                Production Batches & Schedules
              </h3>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Issue BOM raw materials, execute shift runs, and record worker piece-rate output.
              </p>
            </div>
          </Link>

          {/* Quality Control */}
          <Link
            to="/qc"
            className="group rounded-2xl border border-default bg-surface p-5 space-y-3 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Microscope className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                QC Inspections & Wastage Log
              </h3>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Log batch sample audits against weight, dimension tolerances, and scrap defects.
              </p>
            </div>
          </Link>

          {/* Stock & Inventory */}
          <Link
            to="/inventory"
            className="group rounded-2xl border border-default bg-surface p-5 space-y-3 hover:border-cyan-500/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                <Warehouse className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                Stock Balances & Ledger
              </h3>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Per-bin balances, inter-warehouse transfers, and physical stock cycle counts.
              </p>
            </div>
          </Link>

          {/* Procurement & PO */}
          <Link
            to="/purchasing"
            className="group rounded-2xl border border-default bg-surface p-5 space-y-3 hover:border-purple-500/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Procurement & GRN Receiving
              </h3>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Purchase requisitions, vendor PO issuance, 3-way match gate receiving, and AP bills.
              </p>
            </div>
          </Link>

          {/* Storefront CMS */}
          <Link
            to="/storefront"
            className="group rounded-2xl border border-default bg-surface p-5 space-y-3 hover:border-indigo-500/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-primary group-hover:scale-110 transition-transform">
                <Boxes className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-primary transition-colors">
                Storefront CMS & Page Builder
              </h3>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Custom block builder, SEO SERP preview, and headless commerce themes.
              </p>
            </div>
          </Link>

          {/* Logistics Hub */}
          <Link
            to="/logistics"
            className="group rounded-2xl border border-default bg-surface p-5 space-y-3 hover:border-amber-500/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Truck className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-default group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Logistics & 3PL Courier Hub
              </h3>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Steadfast, Pathao & REDX integration, rider dispatch sheets, and COD remittance.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Operational Activity Stream */}
      <div className="rounded-2xl border border-default bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted" aria-hidden="true" />
            <h3 className="text-sm font-bold text-default">Live Operational Event Stream</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveActivityFilter('all')}
              className={`px-3 py-1 rounded-lg text-2xs font-semibold transition-all ${
                activeActivityFilter === 'all'
                  ? 'bg-primary-subtle text-primary border border-primary/30'
                  : 'text-muted hover:text-default hover:bg-surface-sunken'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveActivityFilter('production')}
              className={`px-3 py-1 rounded-lg text-2xs font-semibold transition-all ${
                activeActivityFilter === 'production'
                  ? 'bg-primary-subtle text-primary border border-primary/30'
                  : 'text-muted hover:text-default hover:bg-surface-sunken'
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setActiveActivityFilter('qc')}
              className={`px-3 py-1 rounded-lg text-2xs font-semibold transition-all ${
                activeActivityFilter === 'qc'
                  ? 'bg-primary-subtle text-primary border border-primary/30'
                  : 'text-muted hover:text-default hover:bg-surface-sunken'
              }`}
            >
              Quality (QC)
            </button>
          </div>
        </div>

        <div className="divide-y divide-default text-xs">
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />
              <span className="text-default truncate">
                Batch <strong className="font-mono text-default">PB-202608-042</strong> completed shift run (450 pcs yield)
              </span>
            </div>
            <span className="text-muted text-[11px] font-mono shrink-0">12m ago</span>
          </div>

          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />
              <span className="text-default truncate">
                QC Inspection passed for batch <strong className="font-mono text-default">PB-202608-041</strong> (Tolerance score: 99.2%)
              </span>
            </div>
            <span className="text-muted text-[11px] font-mono shrink-0">34m ago</span>
          </div>

          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)] shrink-0" />
              <span className="text-default truncate">
                Delivery Order <strong className="font-mono text-default">DO-2026-089</strong> booked with Steadfast Courier (Tracking: ST-88910)
              </span>
            </div>
            <span className="text-muted text-[11px] font-mono shrink-0">1h ago</span>
          </div>

          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0" />
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

