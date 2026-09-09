import React from 'react';
import {
  Clock,
  Calendar,
  Lock,
  Sparkles,
  Calculator,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface CurrencyFiscalSimulatorProps {
  currencyCode?: string;
  currencySymbol?: string;
  decimalPlaces?: number | string;
  thousandSeparator?: string;
  dateFormat?: string;
  timeFormat?: string;
  systemTimezone?: string;
  fiscalYearStartMonth?: string | number;
  lockClosedFinancialPeriods?: boolean | string;
}

export const CurrencyFiscalSimulator: React.FC<CurrencyFiscalSimulatorProps> = ({
  currencyCode = 'BDT',
  currencySymbol = '৳',
  decimalPlaces = 2,
  thousandSeparator = ',',
  dateFormat = 'YYYY-MM-DD',
  timeFormat = '24h',
  systemTimezone = 'Asia/Dhaka',
  fiscalYearStartMonth = '7',
  lockClosedFinancialPeriods = true,
}) => {
  const dec = Math.max(0, Math.min(4, Number(decimalPlaces) || 0));
  const sampleAmount = 1485290.75;
  const parts = sampleAmount.toFixed(dec).split('.');
  const intPart = (parts[0] || '0').replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator || ',');
  const formattedFigure = `${currencySymbol} ${intPart}${parts[1] ? '.' + parts[1] : ''} ${currencyCode}`;

  let sampleDate = '2026-09-10';
  if (dateFormat === 'DD/MM/YYYY') sampleDate = '10/09/2026';
  else if (dateFormat === 'MM/DD/YYYY') sampleDate = '09/10/2026';
  else if (dateFormat === 'DD-MMM-YYYY') sampleDate = '10-Sep-2026';

  const sampleTime = timeFormat === '12h' ? '02:45 PM' : '14:45';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const startMonthIndex = Math.max(0, Math.min(11, (Number(fiscalYearStartMonth) || 7) - 1));
  const fiscalMonthName = monthNames[startMonthIndex] || 'July';

  const isLocked = lockClosedFinancialPeriods === true || lockClosedFinancialPeriods === '1';

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
              Real-Time Currency &amp; Fiscal Ledger Simulator
            </span>
            <span className="text-2xs text-muted block">
              Live mathematical rendering of accounting figures, timestamp formatting, and audit period controls
            </span>
          </div>
        </div>

        <Badge tone="primary-subtle" className="text-2xs">
          Dynamic Computed
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Sample Journal Voucher Line */}
        <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Calculator className="size-3 text-primary" />
              Sample General Ledger Journal Entry
            </span>
            <span className="text-2xs font-mono text-muted">Acc: #10100 &middot; Cash &amp; Bank</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Debit Allocation</span>
              <span className="font-mono text-sm sm:text-base font-bold text-success block truncate">
                {formattedFigure}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Credit Offsetting Account</span>
              <span className="font-mono text-sm sm:text-base font-bold text-default block truncate">
                {formattedFigure}
              </span>
            </div>
          </div>
        </div>

        {/* Timestamp & Fiscal Governance Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Timestamp formatting */}
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <Clock className="size-3 text-primary" /> Timestamp Rendering
              </span>
              <span className="text-2xs text-muted font-mono">{systemTimezone}</span>
            </div>
            <div className="font-mono text-xs font-bold text-default">
              {sampleDate} &middot; {sampleTime}
            </div>
            <span className="text-2xs text-muted block">
              Format: {dateFormat} ({timeFormat})
            </span>
          </div>

          {/* Fiscal policy lock */}
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <Calendar className="size-3 text-primary" /> Fiscal Cycle &amp; Audit Lock
              </span>
              {isLocked ? (
                <span className="text-2xs text-success font-semibold flex items-center gap-0.5">
                  <Lock className="size-2.5" /> Locked
                </span>
              ) : (
                <span className="text-2xs text-warning font-semibold">Open</span>
              )}
            </div>
            <div className="text-xs font-bold text-default">
              Starts in {fiscalMonthName} (BD Standard)
            </div>
            <span className="text-2xs text-muted flex items-center gap-1">
              <ShieldCheck className="size-3 text-primary" />
              {isLocked
                ? 'Historical vouchers sealed against tampering'
                : 'Warning: Closed periods permit backdated adjustments'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
