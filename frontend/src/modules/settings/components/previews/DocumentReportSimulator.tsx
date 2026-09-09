import React, { useState } from 'react';
import {
  Sparkles,
  Printer,
  Calendar,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface DocumentReportSimulatorProps {
  defaultExportFormat?: string;
  defaultPaperSize?: string;
  defaultReportOrientation?: string;
  printCompanyHeader?: boolean | string;
  includeTimestampFooter?: boolean | string;
}

export const DocumentReportSimulator: React.FC<DocumentReportSimulatorProps> = ({
  defaultExportFormat = 'pdf',
  defaultPaperSize = 'a4',
  defaultReportOrientation = 'portrait',
  printCompanyHeader = true,
  includeTimestampFooter = true,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    defaultReportOrientation === 'landscape' ? 'landscape' : 'portrait'
  );

  const isHeader = printCompanyHeader === true || printCompanyHeader === '1' || printCompanyHeader === 'true';
  const isFooter = includeTimestampFooter === true || includeTimestampFooter === '1' || includeTimestampFooter === 'true';

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
              Executive Report Layout &amp; PDF Export Simulator
            </span>
            <span className="text-2xs text-muted block">
              Printable letterhead presentation, sheet orientation, and statutory audit verification footers
            </span>
          </div>
        </div>

        {/* Orientation Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-surface-sunken border border-default">
          <Button
            type="button"
            variant={orientation === 'portrait' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setOrientation('portrait')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            Portrait (A4)
          </Button>
          <Button
            type="button"
            variant={orientation === 'landscape' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setOrientation('landscape')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            Landscape (Spreadsheet)
          </Button>
        </div>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 flex items-center justify-center">
        {/* Paper Sheet Mockup */}
        <div
          className={`w-full ${
            orientation === 'portrait' ? 'max-w-xs' : 'max-w-md'
          } rounded-lg bg-surface border-2 border-default p-4 shadow-sm space-y-3 transition-all`}
        >
          {/* Company Letterhead Banner */}
          {isHeader && (
            <div className="border-b-2 border-primary/30 pb-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-default block">
                  SLICEMART ENTERPRISE FMS
                </span>
                <span className="text-2xs text-muted block">
                  Audited Operational &amp; Financial Statement
                </span>
              </div>
              <div className="p-1.5 rounded bg-primary/10 text-primary">
                <Printer className="size-3.5" />
              </div>
            </div>
          )}

          {/* Document Content Skeleton Lines */}
          <div className="space-y-1.5 py-1">
            <div className="flex justify-between items-center text-2xs font-semibold text-default border-b border-default pb-1">
              <span>Departmental Activity</span>
              <span>Audited Total</span>
            </div>
            <div className="flex justify-between text-2xs text-muted">
              <span>Plant A — Tejgaon Production Batch Yield</span>
              <span className="font-mono text-default">98.4%</span>
            </div>
            <div className="flex justify-between text-2xs text-muted">
              <span>Finished Goods Dispatch — Steadfast Logistics</span>
              <span className="font-mono text-default">1,240 Units</span>
            </div>
            <div className="flex justify-between text-2xs text-muted">
              <span>Net Commercial VAT Realization</span>
              <span className="font-mono text-success font-bold">৳ 482,910</span>
            </div>
          </div>

          {/* Audit Timestamp Footer */}
          {isFooter && (
            <div className="border-t border-default pt-2 flex items-center justify-between text-2xs text-muted font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="size-2.5" /> 2026-09-10 14:45
              </span>
              <span>
                {defaultPaperSize.toUpperCase()} &middot; {defaultExportFormat.toUpperCase()} &middot; Page 1 of 1
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
