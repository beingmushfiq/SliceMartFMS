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
  AlertTriangle,
  ShieldAlert,
  X,
  CreditCard,
  Users,
  Globe,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { m } from 'framer-motion';
import { useAuthStore } from '../../lib/auth/authStore';
import { KPICard } from '../../components/ui/KPICard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { enterBase } from '../../lib/motion/tokens';

const YIELD_DATA = [
  { day: 'Mon', output: 1420, target: 1350, scrap: 14, yieldPct: 98.4 },
  { day: 'Tue', output: 1580, target: 1400, scrap: 11, yieldPct: 99.1 },
  { day: 'Wed', output: 1390, target: 1400, scrap: 19, yieldPct: 97.8 },
  { day: 'Thu', output: 1650, target: 1500, scrap: 9, yieldPct: 99.5 },
  { day: 'Fri', output: 1720, target: 1600, scrap: 13, yieldPct: 99.2 },
  { day: 'Sat', output: 1480, target: 1400, scrap: 15, yieldPct: 98.9 },
  { day: 'Sun', output: 1210, target: 1200, scrap: 10, yieldPct: 99.0 },
];

const REVENUE_CHANNELS = [
  { name: 'B2B Wholesale / PO', value: 124500, color: '#3b82f6' },
  { name: 'POS Retail Registers', value: 48200, color: '#10b981' },
  { name: 'Online Headless Storefront', value: 38400, color: '#8b5cf6' },
];

const LINE_MONITORS = [
  {
    id: 'line-1',
    name: 'Line 01 — Cutting & Precision Shaping',
    status: 'Running',
    batch: 'BAT-202608-042',
    recipe: 'Classic Oxford Cotton Shirt (Grade A)',
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
    name: 'Line 03 — Finishing & Packaging Line',
    status: 'QC Audit',
    batch: 'BAT-202608-041',
    recipe: 'Denim Heavy Overshirt',
    progress: 100,
    speed: 'Inspection in progress',
    operator: 'Tariqul Islam',
    health: 'warning',
    efficiency: '94.8%',
  },
];

interface NoticeItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
}

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice-1',
    type: 'critical',
    title: 'Low Raw Material Stock Warning',
    description: 'Food Grade Poly Packaging Film balance (Warehouse A) is below safety buffer (Current: 140 kg, Reorder threshold: 300 kg).',
    actionText: 'Raise Purchase Requisition',
    actionHref: '/purchasing',
  },
  {
    id: 'notice-2',
    type: 'warning',
    title: 'Unverified Online Storefront Order Flagged',
    description: 'Order #SO-ONL-20260828-9999 has risk score 84/100 (IP geolocation mismatch). Manual verification required.',
    actionText: 'Review Fraud Queue',
    actionHref: '/fraud-verification',
  },
  {
    id: 'notice-3',
    type: 'info',
    title: 'Pending Purchase Approvals (1 PO)',
    description: 'PO-2026-009 for Raw Dyes & Chemicals (৳ 145,000) awaits Management confirmation.',
    actionText: 'Approve PO',
    actionHref: '/purchasing',
  },
];

export const TenantRoleDashboard: React.FC = () => {
  const { user, tenant, activeBranch, hasPermission } = useAuthStore();
  const [activeActivityFilter, setActiveActivityFilter] = useState<'all' | 'production' | 'qc' | 'sales'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);

  const dismissNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

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
      {/* Top Glassmorphic Executive Hero */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enterBase}
        className="relative overflow-hidden rounded-2xl border border-default bg-surface/95 p-6 sm:p-7 shadow-xs backdrop-blur-xl transition-token-colors"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/3 -bottom-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl"
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
                Shift A Active • Factory Line 100% Operational
              </span>
              <button
                onClick={handleManualSync}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-muted hover:text-default transition-colors px-2 py-0.5 rounded bg-surface-sunken border border-default cursor-pointer"
                title="Click to sync factory telemetry"
              >
                <RefreshCw className={`size-3 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{lastRefreshedAt.toLocaleTimeString()}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default font-sans">
              Welcome, {user?.name || 'Operator'} • {tenant?.name || 'SliceMart Ltd'}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
              Industrial operations command center: Real-time production piece tally, automated QC tolerances, 
              omnichannel POS & e-commerce sales ledger, and live logistics dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/pos">
              <Button variant="primary" size="md" className="shadow-md shadow-emerald-600/20 text-xs">
                <ShoppingCart className="size-3.5 mr-1.5" />
                Launch POS Register
              </Button>
            </Link>
            <Link to="/production">
              <Button variant="secondary" size="md" className="border border-default text-xs">
                <Factory className="size-3.5 mr-1.5 text-emerald-500" />
                Production Batches
              </Button>
            </Link>
            <Link to="/storefront">
              <Button variant="secondary" size="md" className="border border-default text-xs">
                <Globe className="size-3.5 mr-1.5 text-blue-500" />
                Storefront CMS
              </Button>
            </Link>
          </div>
        </div>
      </m.div>

      {/* Critical Alert & Factory Notice System */}
      {notices.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <h2 className="text-xs font-bold text-default uppercase tracking-wider">
                Operational Alerts & Action Notices ({notices.length})
              </h2>
            </div>
            <button
              onClick={() => setNotices([])}
              className="text-[11px] text-muted hover:text-default underline cursor-pointer"
            >
              Dismiss all
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 text-xs shadow-xs transition-all ${
                  notice.type === 'critical'
                    ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
                    : notice.type === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {notice.type === 'critical' ? (
                    <ShieldAlert className="size-4 text-red-500 shrink-0 mt-0.5" />
                  ) : notice.type === 'warning' ? (
                    <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="size-4 text-blue-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-default">{notice.title}</p>
                    <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">{notice.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    to={notice.actionHref}
                    className="rounded-lg bg-surface px-3 py-1 text-[11px] font-bold text-default border border-default hover:bg-surface-sunken transition-colors shadow-2xs"
                  >
                    {notice.actionText} →
                  </Link>
                  <button
                    onClick={() => dismissNotice(notice.id)}
                    className="rounded-lg p-1 text-muted hover:text-default hover:bg-surface transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Executive Real-Time KPI Cards Deck */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          label="Today's Factory Output"
          value="1,720 pcs"
          subValue="Target: 1,600 pcs (107.5%)"
          delta={7.5}
          deltaLabel="vs schedule"
          icon={<Factory className="size-4 text-emerald-500" />}
          iconColor="bg-emerald-500/15"
          alert="success"
          index={0}
        />

        <KPICard
          label="Today's Omnichannel Gross"
          value="৳ 211,100"
          subValue="ERP + POS + Storefront"
          delta={16.8}
          deltaLabel="vs daily avg"
          icon={<CreditCard className="size-4 text-indigo-500" />}
          iconColor="bg-indigo-500/15"
          index={1}
        />

        <KPICard
          label="Quality First-Pass Yield"
          value="99.2%"
          subValue="Scrap loss: 0.8% (Target < 2%)"
          delta={0.4}
          deltaLabel="vs standard"
          icon={<Microscope className="size-4 text-emerald-500" />}
          iconColor="bg-emerald-500/15"
          alert="success"
          index={2}
        />

        <KPICard
          label="Online Storefront Orders"
          value="28 orders"
          subValue="৳ 38.4k volume today"
          delta={24.0}
          deltaLabel="conversion: 4.2%"
          icon={<ShoppingBag className="size-4 text-purple-500" />}
          iconColor="bg-purple-500/15"
          index={3}
        />

        <KPICard
          label="Inventory Stockout Risks"
          value="3 items"
          subValue="Below buffer threshold"
          delta={-1}
          deltaLabel="PO placed for 2"
          icon={<Warehouse className="size-4 text-amber-500" />}
          iconColor="bg-amber-500/15"
          index={4}
        />

        <KPICard
          label="Line Operators on Duty"
          value="34 staff"
          subValue="3 lines full capacity"
          delta={94.2}
          deltaLabel="efficiency rate"
          icon={<Users className="size-4 text-blue-500" />}
          iconColor="bg-blue-500/15"
          index={5}
        />
      </div>

      {/* Analytics & Throughput Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Production Volume vs Plan Target & Scrap */}
        <div className="lg:col-span-2 rounded-2xl border border-default bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
            <div>
              <h3 className="text-sm font-bold text-default">Weekly Production Volume vs Master Plan Target</h3>
              <p className="text-2xs text-muted mt-0.5">Daily completed garment/food units against planned capacity</p>
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

        {/* Right 1 Col: Omnichannel Revenue Breakdown */}
        <div className="rounded-2xl border border-default bg-surface p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-sm font-bold text-default">Omnichannel Revenue Mix</h3>
              <Badge tone="success-subtle">৳ 211.1k Today</Badge>
            </div>
            <p className="text-2xs text-muted mt-2">Combined sales across B2B Wholesale, Retail POS, and E-Commerce</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REVENUE_CHANNELS}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {REVENUE_CHANNELS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number | string | readonly (string | number)[] | undefined) => [
                    `৳ ${Number(val ?? 0).toLocaleString()}`,
                    'Revenue',
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'var(--color-text)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {REVENUE_CHANNELS.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                  <span className="text-muted">{channel.name}</span>
                </div>
                <span className="font-bold text-default font-mono">৳ {channel.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Production Line Monitors */}
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

      {/* Operational Workspaces Quick Launcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-default flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <span>Industrial Workspaces & Fast Actions</span>
          </h2>
          <span className="text-2xs text-muted">Instant module navigation</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <Clock className="size-4 text-muted" />
            <h3 className="text-sm font-bold text-default">Live Operational Event Stream</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveActivityFilter('all')}
              className={`px-3 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                activeActivityFilter === 'all'
                  ? 'bg-primary-subtle text-primary border border-primary/30'
                  : 'text-muted hover:text-default hover:bg-surface-sunken'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveActivityFilter('production')}
              className={`px-3 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                activeActivityFilter === 'production'
                  ? 'bg-primary-subtle text-primary border border-primary/30'
                  : 'text-muted hover:text-default hover:bg-surface-sunken'
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setActiveActivityFilter('qc')}
              className={`px-3 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
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
