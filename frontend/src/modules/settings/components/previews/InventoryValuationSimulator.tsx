import React from 'react';
import {
  Package,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface InventoryValuationSimulatorProps {
  valuationMethod?: string;
  lowStockThreshold?: number | string;
  allowNegativeStock?: boolean | string;
  autoQuarantineFailedStock?: boolean | string;
}

export const InventoryValuationSimulator: React.FC<InventoryValuationSimulatorProps> = ({
  valuationMethod = 'fifo',
  lowStockThreshold = 15,
  allowNegativeStock = false,
  autoQuarantineFailedStock = true,
}) => {
  const isNegativeAllowed = allowNegativeStock === true || allowNegativeStock === '1' || allowNegativeStock === 'true';
  const isAutoQuarantine = autoQuarantineFailedStock === true || autoQuarantineFailedStock === '1' || autoQuarantineFailedStock === 'true';

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
              Stock Valuation &amp; Quarantine Governance Simulator
            </span>
            <span className="text-2xs text-muted block">
              Real-time cost layer accounting, negative dispatch safeguards, and automatic QC quarantine routing
            </span>
          </div>
        </div>

        <Badge tone="primary-subtle" className="text-2xs uppercase font-mono">
          {valuationMethod.toUpperCase()} Cost Basis
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Cost Method Impact Card */}
        <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Package className="size-3 text-primary" /> Cost of Goods Sold (COGS) Simulation
            </span>
            <span className="text-2xs font-mono text-muted">SKU: RAW-STEEL-001</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-1">
              <span className="text-2xs text-muted block">Current Valuation Accounting</span>
              <span className="font-mono text-sm font-bold text-default block">
                {valuationMethod.toUpperCase() === 'AVCO' ? 'Weighted Average Unit Cost' : 'First-In, First-Out (FIFO)'}
              </span>
              <span className="text-2xs text-muted block">
                {valuationMethod.toUpperCase() === 'AVCO'
                  ? 'Smoothes price volatility across fluctuating vendor receipts.'
                  : 'Earliest received raw material cost layers are depleted first.'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-1">
              <span className="text-2xs text-muted block">Low-Stock Trigger Threshold</span>
              <span className="font-mono text-sm font-bold text-primary block">
                &le; {lowStockThreshold} Units Reorder Line
              </span>
              <span className="text-2xs text-muted block">
                Automatic purchase requisition generated when stock reaches this floor.
              </span>
            </div>
          </div>
        </div>

        {/* Quarantine & Safety Interlock Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Negative Stock Safeguard */}
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1.5">
            <div className="flex items-center justify-between text-2xs">
              <span className="font-bold text-default uppercase tracking-wider">
                Negative Stock Dispatch
              </span>
              {isNegativeAllowed ? (
                <span className="text-warning font-semibold flex items-center gap-1">
                  <AlertTriangle className="size-3" /> Permitted
                </span>
              ) : (
                <span className="text-success font-semibold flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Blocked
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-default">
              {isNegativeAllowed
                ? '⚠️ Warehouse dispatch allowed below 0 (Backorder Mode).'
                : '🛡️ Hard warehouse interlock prevents phantom negative balances.'}
            </p>
          </div>

          {/* Auto Quarantine Routing */}
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1.5">
            <div className="flex items-center justify-between text-2xs">
              <span className="font-bold text-default uppercase tracking-wider">
                QC Quarantine Routing
              </span>
              <span className="font-mono text-primary text-2xs">Bin: #QUAR-A1</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-default">
              <span>Receiving Dock</span>
              <ArrowRight className="size-3 text-muted" />
              <span className={isAutoQuarantine ? 'text-primary font-bold' : 'text-muted'}>
                {isAutoQuarantine ? 'Auto-Isolated on Failure' : 'Manual Bin Move'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
