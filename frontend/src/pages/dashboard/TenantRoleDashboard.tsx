import React from 'react';
import { Link } from 'react-router-dom';
import {
  Factory,
  Microscope,
  Warehouse,
  ShoppingBag,
  ShoppingCart,
  Coins,
  ShieldAlert,
  Truck,
  ArrowRight,
  Boxes,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import { m } from 'framer-motion';
import { useAuthStore } from '../../lib/auth/authStore';
import { KPICard } from '../../components/ui/KPICard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { enterBase } from '../../lib/motion/tokens';

export const TenantRoleDashboard: React.FC = () => {
  const { user, tenant, activeBranch, hasPermission } = useAuthStore();

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
  if (isSuperOrAdmin) roleTitle = 'Tenant Administrator / Factory GM';
  else if (isProductionLead) roleTitle = 'Production Line Specialist';
  else if (isQcInspector) roleTitle = 'Quality Control Officer';
  else if (isInventoryClerk) roleTitle = 'Inventory & Warehouse Lead';
  else if (isSalesOfficer) roleTitle = 'Commercial & Sales Officer';
  else if (isFinanceOfficer) roleTitle = 'Accounts & Finance Manager';

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Welcome Banner */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enterBase}
        className="relative overflow-hidden rounded-(--card-radius) border border-default bg-surface p-6 sm:p-8 shadow-(--card-shadow)"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="primary-subtle" icon={Sparkles}>
                {roleTitle}
              </Badge>
              {activeBranch && (
                <Badge tone="surface-sunken">
                  📍 {activeBranch.name}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-default sm:text-3xl">
              Welcome back, {user?.name || 'Operator'}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
              Industrial operations dashboard for <strong className="text-default">{tenant?.name || 'SliceMart'}</strong>. 
              Real-time factory telemetry, workflow action gates, and line performance overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/pos">
              <Button variant="primary" size="md">
                <ShoppingCart className="size-4 mr-2" aria-hidden="true" />
                Launch POS
              </Button>
            </Link>
            <Link to="/fraud-verification">
              <Button variant="secondary" size="md">
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
          label="Active Production"
          value={12}
          subValue="Batches running on main line"
          delta={8.4}
          deltaLabel="vs yesterday"
          icon={<Factory className="size-5 text-primary" />}
          iconColor="bg-primary-subtle"
          index={0}
        />

        <KPICard
          label="Quality Assurance"
          value="99.4%"
          subValue="Pass rate across 48 audits"
          delta={0.6}
          deltaLabel="vs target"
          icon={<Microscope className="size-5 text-success" />}
          iconColor="bg-success-subtle"
          alert="success"
          index={1}
        />

        <KPICard
          label="Stock Availability"
          value="96.8%"
          subValue="Finished goods & silos OK"
          delta={-1.2}
          deltaLabel="vs last week"
          icon={<Warehouse className="size-5 text-info" />}
          iconColor="bg-info-subtle"
          index={2}
        />

        <KPICard
          label="Today's Commercial Revenue"
          value="৳ 184,200"
          subValue="POS & e-commerce combined"
          delta={14.2}
          deltaLabel="vs avg daily"
          icon={<ShoppingBag className="size-5 text-accent" />}
          iconColor="bg-accent-subtle"
          index={3}
        />
      </div>

      {/* Role-Tailored Operational Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-default flex items-center gap-2">
            <Zap className="size-4 text-primary" aria-hidden="true" />
            <span>Operational Navigation & Workspaces</span>
          </h2>
          <span className="text-2xs sm:text-xs text-muted">Tailored to your active roles</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Production Plan & Batches */}
          <Link
            to="/production"
            className="group rounded-(--card-radius) border border-default bg-surface p-5 space-y-3 hover:border-strong hover:shadow-(--card-shadow) transition-token-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary-subtle text-primary group-hover:scale-105 transition-transform">
                <Factory className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-default group-hover:text-primary transition-colors">
                Production Batches & Floor Output
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Plan industrial recipe schedules, issue materials, and log worker output.
              </p>
            </div>
          </Link>

          {/* Quality Control */}
          <Link
            to="/qc"
            className="group rounded-(--card-radius) border border-default bg-surface p-5 space-y-3 hover:border-strong hover:shadow-(--card-shadow) transition-token-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-(--radius-md) bg-success-subtle text-success group-hover:scale-105 transition-transform">
                <Microscope className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-success group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-default group-hover:text-success transition-colors">
                QC Inspections & Wastage Log
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Execute batch sample inspections against sensory, moisture, and weight tolerances.
              </p>
            </div>
          </Link>

          {/* Stock & Inventory */}
          <Link
            to="/inventory"
            className="group rounded-(--card-radius) border border-default bg-surface p-5 space-y-3 hover:border-strong hover:shadow-(--card-shadow) transition-token-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-(--radius-md) bg-info-subtle text-info group-hover:scale-105 transition-transform">
                <Warehouse className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-info group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-default group-hover:text-info transition-colors">
                Stock Balances & Transfers
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Real-time bin balances, inter-warehouse movements, and physical stock variance.
              </p>
            </div>
          </Link>

          {/* Storefront Customizer & CMS */}
          <Link
            to="/storefront"
            className="group rounded-(--card-radius) border border-default bg-surface p-5 space-y-3 hover:border-strong hover:shadow-(--card-shadow) transition-token-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary-subtle text-primary group-hover:scale-105 transition-transform">
                <Boxes className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-default group-hover:text-primary transition-colors">
                Storefront CMS & Page Builder
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Customize brand themes, drag-and-drop page sections, and configure WhatsApp order channels.
              </p>
            </div>
          </Link>

          {/* Logistics & Deliveries */}
          <Link
            to="/logistics"
            className="group rounded-(--card-radius) border border-default bg-surface p-5 space-y-3 hover:border-strong hover:shadow-(--card-shadow) transition-token-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-(--radius-md) bg-warning-subtle text-warning group-hover:scale-105 transition-transform">
                <Truck className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-warning group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-default group-hover:text-warning transition-colors">
                Logistics & Courier Hub
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Steadfast, Pathao & REDX booking, driver run sheets, and COD cash reconciliation.
              </p>
            </div>
          </Link>

          {/* Finance & General Ledger */}
          <Link
            to="/finance"
            className="group rounded-(--card-radius) border border-default bg-surface p-5 space-y-3 hover:border-strong hover:shadow-(--card-shadow) transition-token-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-(--radius-md) bg-success-subtle text-success group-hover:scale-105 transition-transform">
                <Coins className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted group-hover:text-success group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-default group-hover:text-success transition-colors">
                Finance & General Ledger
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Double-entry journal postings, VAT registers, balance sheet, and bank accounts.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Operational Activity Stream */}
      <div className="rounded-(--card-radius) border border-default bg-surface p-6 space-y-4 shadow-(--card-shadow)">
        <div className="flex items-center justify-between border-b border-default pb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted" aria-hidden="true" />
            <h3 className="text-sm font-bold text-default">Recent Factory Operations</h3>
          </div>
          <Badge tone="success-subtle">Live Telemetry</Badge>
        </div>

        <div className="divide-y divide-default text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-success shrink-0" aria-hidden="true" />
              <span className="text-default">Production Batch <strong className="font-mono text-default">PB-202608-042</strong> completed output yield (450 units)</span>
            </div>
            <span className="text-muted text-2xs font-mono">12 min ago</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-success shrink-0" aria-hidden="true" />
              <span className="text-default">QC Inspection passed for batch <strong className="font-mono text-default">PB-202608-041</strong></span>
            </div>
            <span className="text-muted text-2xs font-mono">34 min ago</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-info shrink-0" aria-hidden="true" />
              <span className="text-default">Delivery Order <strong className="font-mono text-default">DO-2026-089</strong> booked on Steadfast Logistics</span>
            </div>
            <span className="text-muted text-2xs font-mono">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};
