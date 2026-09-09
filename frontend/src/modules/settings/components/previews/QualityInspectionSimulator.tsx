import React from 'react';
import {
  Sparkles,
  AlertOctagon,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface QualityInspectionSimulatorProps {
  samplingAqlStandard?: string;
  samplingPercentage?: number | string;
  autoRejectOnCriticalDefect?: boolean | string;
  quarantineHoldDays?: number | string;
}

export const QualityInspectionSimulator: React.FC<QualityInspectionSimulatorProps> = ({
  samplingAqlStandard = 'aql_1_5',
  samplingPercentage = 10,
  autoRejectOnCriticalDefect = true,
  quarantineHoldDays = 3,
}) => {
  const percent = Number(samplingPercentage) || 10;
  const sampleBatchSize = 2500;
  const computedSampleSize = Math.round((sampleBatchSize * percent) / 100);
  const isAutoReject = autoRejectOnCriticalDefect === true || autoRejectOnCriticalDefect === '1' || autoRejectOnCriticalDefect === 'true';

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
              Quality Assurance &amp; AQL Sampling Calculator
            </span>
            <span className="text-2xs text-muted block">
              Statistical lot sampling inspection sizes, critical defect zero-tolerance rules, and quarantine hold windows
            </span>
          </div>
        </div>

        <Badge tone="primary-subtle" className="text-2xs uppercase font-mono">
          {samplingAqlStandard.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Sampling Math Card */}
        <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Calculator className="size-3 text-primary" />
              Statistical Lot Inspection Calculator (Specimen: 2,500 Units)
            </span>
            <span className="text-2xs font-mono text-muted">ISO 2859-1 Compliant</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Sampling Intensity</span>
              <span className="font-mono text-sm font-bold text-primary block">
                {percent}% of Batch
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Mandatory Pull Size</span>
              <span className="font-mono text-sm font-bold text-default block">
                {computedSampleSize} Units Checked
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Critical Defect Acceptance</span>
              <span className="font-mono text-sm font-bold text-destructive block">
                Ac = 0 (Zero Tolerance)
              </span>
            </div>
          </div>
        </div>

        {/* Rejection & Quarantine Governance Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-2xs text-muted block uppercase tracking-wider font-medium">
              Critical Defect Policy
            </span>
            <div className="flex items-center gap-1.5">
              <AlertOctagon className="size-3.5 text-destructive" />
              <span className="text-xs font-bold text-default">
                {isAutoReject ? 'Immediate Automatic Lot Rejection' : 'Advisory Quarantine'}
              </span>
            </div>
            <span className="text-2xs text-muted block">
              Any critical non-conformance immediately halts the entire production line.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-2xs text-muted block uppercase tracking-wider font-medium">
              Quarantine Hold Release Period
            </span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" />
              <span className="text-xs font-bold text-default">
                {quarantineHoldDays} Calendar Days Minimum
              </span>
            </div>
            <span className="text-2xs text-muted block">
              Quarantined lots require dual supervisor signoff before re-work or scrap authorization.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
