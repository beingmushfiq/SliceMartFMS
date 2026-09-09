import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  FileCheck,
  Receipt,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface ProcurementWorkflowSimulatorProps {
  poApprovalThreshold?: number | string;
  autoGeneratePo?: boolean | string;
  enforceThreeWayMatching?: boolean | string;
  supplierLeadTimeBufferDays?: number | string;
}

export const ProcurementWorkflowSimulator: React.FC<ProcurementWorkflowSimulatorProps> = ({
  poApprovalThreshold = 50000,
  autoGeneratePo = true,
  enforceThreeWayMatching = true,
  supplierLeadTimeBufferDays = 3,
}) => {
  const threshold = Number(poApprovalThreshold) || 50000;
  const is3Way = enforceThreeWayMatching === true || enforceThreeWayMatching === '1' || enforceThreeWayMatching === 'true';
  const isAutoPo = autoGeneratePo === true || autoGeneratePo === '1' || autoGeneratePo === 'true';

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
              Procurement Governance &amp; 3-Way Matching Simulator
            </span>
            <span className="text-2xs text-muted block">
              Automated PO creation triggers, executive signature limits, and invoice reconciliation gates
            </span>
          </div>
        </div>

        <Badge tone="primary-subtle" className="text-2xs">
          3-Way Reconciled
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* 3-Way Matching Gate Card */}
        <div className="p-3.5 rounded-xl bg-surface border border-default space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <ShieldCheck className="size-3 text-primary" />
              Statutory 3-Way Matching Verification Chain
            </span>
            <span className="text-2xs font-mono text-success flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              {is3Way ? 'Enforced' : 'Advisory Only'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-2xs">
            {/* Step 1 */}
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-1">
              <span className="text-muted flex items-center gap-1">
                <FileCheck className="size-3 text-primary" /> 1. Purchase Order
              </span>
              <span className="font-bold text-default block">PO-2026-00109</span>
              <span className="text-2xs text-muted block">Approved Unit Qty: 500</span>
            </div>

            {/* Step 2 */}
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-1">
              <span className="text-muted flex items-center gap-1">
                <Truck className="size-3 text-accent" /> 2. Receiving GRN
              </span>
              <span className="font-bold text-default block">GRN-2026-00084</span>
              <span className="text-2xs text-muted block">Dock Count: 500 Good</span>
            </div>

            {/* Step 3 */}
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-1">
              <span className="text-muted flex items-center gap-1">
                <Receipt className="size-3 text-success" /> 3. Vendor Bill
              </span>
              <span className="font-bold text-default block">BILL-2026-00312</span>
              <span className="text-2xs text-muted block">Billed: ৳ 125,000</span>
            </div>
          </div>
        </div>

        {/* PO Policies Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-2xs text-muted block font-medium uppercase tracking-wider">
              Executive Signoff Threshold
            </span>
            <span className="font-mono text-sm font-bold text-default block">
              ৳ {threshold.toLocaleString()} BDT
            </span>
            <span className="text-2xs text-muted block">
              Orders exceeding this amount require Managing Director or CFO counter-signature.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-2xs text-muted block font-medium uppercase tracking-wider">
              Automated Replenishment Trigger
            </span>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success" />
              <span className="text-xs font-bold text-default">
                {isAutoPo ? 'Active Auto-PO Generator' : 'Manual Requisition Flow'}
              </span>
            </div>
            <span className="text-2xs text-muted block">
              Buffer: +{supplierLeadTimeBufferDays} Days Lead Time Safety Window
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
