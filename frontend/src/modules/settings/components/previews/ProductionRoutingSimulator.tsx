import React from 'react';
import {
  Factory,
  CheckCircle2,
  Sparkles,
  Lock,
  Layers,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface ProductionRoutingSimulatorProps {
  schedulingMode?: string;
  materialAllocationPolicy?: string;
  autoIssueMaterials?: boolean | string;
  scrapTolerancePercent?: number | string;
  minBatchYieldPercent?: number | string;
  enforceMaintenanceLock?: boolean | string;
}

export const ProductionRoutingSimulator: React.FC<ProductionRoutingSimulatorProps> = ({
  schedulingMode = 'finite_capacity',
  materialAllocationPolicy = 'strict_fifo',
  autoIssueMaterials = true,
  scrapTolerancePercent = 3.5,
  minBatchYieldPercent = 95,
  enforceMaintenanceLock = true,
}) => {
  const scrap = Number(scrapTolerancePercent) || 0;
  const yieldTarget = Number(minBatchYieldPercent) || 95;
  const isMaintenanceLocked = enforceMaintenanceLock === true || enforceMaintenanceLock === '1' || enforceMaintenanceLock === 'true';
  const isAutoIssue = autoIssueMaterials === true || autoIssueMaterials === '1' || autoIssueMaterials === 'true';

  return (
    <div className="rounded-xl border border-default bg-surface-sunken/60 overflow-hidden space-y-0 transition-all">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-surface border-b border-default flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-default block">
              Production Floor Scheduling &amp; Yield Simulator
            </span>
            <span className="text-2xs text-muted block">
              Live batch routing policy, automated material staging, and scrap wastage threshold meters
            </span>
          </div>
        </div>

        <Badge tone="primary-subtle" className="text-2xs">
          Finite Work Center Routing
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Work Order Staging Card */}
        <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Factory className="size-3" />
              Batch Execution Lifecycle #PB-2026-081
            </span>
            <span className="text-2xs font-mono text-muted">BOM: Industrial Unit #4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Routing Mode</span>
              <span className="text-xs font-bold text-default capitalize block truncate">
                {schedulingMode.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Material Allocation</span>
              <span className="text-xs font-bold text-default capitalize block truncate">
                {materialAllocationPolicy.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Auto-Issue on Release</span>
              <span className="text-xs font-bold text-success flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                {isAutoIssue ? 'Immediate BOM Draw' : 'Manual Requisition'}
              </span>
            </div>
          </div>
        </div>

        {/* Tolerances & Safety Interlock Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Yield & Scrap Gauge */}
          <div className="p-3 rounded-lg bg-surface border border-default space-y-2">
            <div className="flex items-center justify-between text-2xs">
              <span className="font-bold text-default uppercase tracking-wider flex items-center gap-1">
                <Layers className="size-3 text-primary" /> Yield &amp; Scrap Safeguard
              </span>
              <span className="font-mono font-bold text-default">{yieldTarget}% Target</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-2xs text-muted">
                <span>Allowable Scrap Tolerance:</span>
                <span className="font-bold text-warning font-mono">Max {scrap}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-sunken border border-default overflow-hidden flex">
                <div
                  className="h-full bg-success rounded-l-full"
                  style={{ width: `${Math.max(10, 100 - scrap * 5)}%` }}
                />
                <div
                  className="h-full bg-warning rounded-r-full"
                  style={{ width: `${Math.min(90, scrap * 5)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Machine Maintenance Interlock */}
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1.5">
            <div className="flex items-center justify-between text-2xs">
              <span className="font-bold text-default uppercase tracking-wider flex items-center gap-1">
                <Lock className="size-3 text-primary" /> Maintenance Interlock
              </span>
              <span className="font-mono text-success text-2xs">OSHA Compliant</span>
            </div>

            <p className="text-xs font-bold text-default">
              {isMaintenanceLocked
                ? '🔒 Hard Workstation Lock Active'
                : '⚠️ Soft Maintenance Advisory'}
            </p>
            <span className="text-2xs text-muted block">
              {isMaintenanceLocked
                ? 'Machines with overdue service are locked from batch assignment.'
                : 'Operators may bypass overdue preventive maintenance alerts.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
