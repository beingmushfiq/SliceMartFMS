import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Receipt,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface VatLedgerSimulatorProps {
  defaultVatRatePercent?: number | string;
  autoPostGlVouchers?: boolean | string;
  allowUnbalancedJournals?: boolean | string;
  lockHistoricalDepreciation?: boolean | string;
  roundingAccountCode?: string;
}

export const VatLedgerSimulator: React.FC<VatLedgerSimulatorProps> = ({
  defaultVatRatePercent = 15,
  autoPostGlVouchers = true,
  allowUnbalancedJournals = false,
  lockHistoricalDepreciation = true,
  roundingAccountCode = 'EXP-90100',
}) => {
  const vat = Number(defaultVatRatePercent) || 15;
  const sampleTaxableAmount = 10000;
  const computedVat = (sampleTaxableAmount * vat) / 100;
  const grandTotal = sampleTaxableAmount + computedVat;

  const isAutoPost = autoPostGlVouchers === true || autoPostGlVouchers === '1' || autoPostGlVouchers === 'true';
  const isLockDepr = lockHistoricalDepreciation === true || lockHistoricalDepreciation === '1' || lockHistoricalDepreciation === 'true';

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
              NBR Statutory VAT &amp; General Ledger Simulator
            </span>
            <span className="text-2xs text-muted block">
              Form Mushak 6.3 tax calculation, automatic voucher posting, and balance checks
            </span>
          </div>
        </div>

        <Badge tone="primary-subtle" className="text-2xs">
          {vat}% NBR Standard VAT
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Sample Tax Calculation Card */}
        <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Receipt className="size-3 text-primary" />
              Tax Breakdown on ৳ 10,000 Commercial Sale
            </span>
            <span className="text-2xs font-mono text-muted">Round: {roundingAccountCode}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Net Taxable Sale</span>
              <span className="font-mono text-sm font-bold text-default block">
                ৳ {sampleTaxableAmount.toLocaleString()}.00
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Statutory Output VAT ({vat}%)</span>
              <span className="font-mono text-sm font-bold text-primary block">
                ৳ {computedVat.toLocaleString()}.00
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Mushak 6.3 Gross Total</span>
              <span className="font-mono text-sm font-bold text-success block">
                ৳ {grandTotal.toLocaleString()}.00
              </span>
            </div>
          </div>
        </div>

        {/* GL Automation & Audit Lock Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-2xs text-muted block uppercase tracking-wider font-medium">
              Voucher Posting Automation
            </span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" />
              <span className="text-xs font-bold text-default">
                {isAutoPost ? 'Instant Journal Post on Invoice' : 'Manual Review Queue'}
              </span>
            </div>
            <span className="text-2xs text-muted block">
              {allowUnbalancedJournals ? '⚠️ Unbalanced journals permitted' : '🛡️ Strict zero-variance balancing enforced'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-2xs text-muted block uppercase tracking-wider font-medium">
              Historical Asset Depreciation Lock
            </span>
            <div className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-primary" />
              <span className="text-xs font-bold text-default">
                {isLockDepr ? 'Past Periods Sealed' : 'Open for Retro Adjustments'}
              </span>
            </div>
            <span className="text-2xs text-muted block">
              Prevents retroactive changes to posted depreciation runs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
