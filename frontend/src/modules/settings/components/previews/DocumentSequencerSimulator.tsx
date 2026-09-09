import React from 'react';
import {
  Barcode,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface DocumentSequencerSimulatorProps {
  invoicePrefix?: string;
  purchaseOrderPrefix?: string;
  batchPrefix?: string;
  challanPrefix?: string;
  quotationPrefix?: string;
  receiptPrefix?: string;
}

export const DocumentSequencerSimulator: React.FC<DocumentSequencerSimulatorProps> = ({
  invoicePrefix = 'INV-',
  purchaseOrderPrefix = 'PO-',
  batchPrefix = 'PB-',
  challanPrefix = 'DC-',
  quotationPrefix = 'QT-',
  receiptPrefix = 'REC-',
}) => {
  const steps = [
    {
      stage: '01. Sales Quotation',
      prefix: quotationPrefix || 'QT-',
      sample: `${quotationPrefix || 'QT-'}2026-00042`,
      hint: 'Client Proposal',
    },
    {
      stage: '02. Purchase Order',
      prefix: purchaseOrderPrefix || 'PO-',
      sample: `${purchaseOrderPrefix || 'PO-'}2026-00109`,
      hint: 'Procurement Gate',
    },
    {
      stage: '03. Production Batch',
      prefix: batchPrefix || 'PB-',
      sample: `${batchPrefix || 'PB-'}2026-081`,
      hint: 'Factory Floor',
    },
    {
      stage: '04. Delivery Challan',
      prefix: challanPrefix || 'DC-',
      sample: `${challanPrefix || 'DC-'}2026-00320`,
      hint: 'Logistics Gate Pass',
    },
    {
      stage: '05. Commercial Invoice',
      prefix: invoicePrefix || 'INV-',
      sample: `${invoicePrefix || 'INV-'}2026-00482`,
      hint: 'Statutory VAT 6.3',
    },
    {
      stage: '06. Payment Receipt',
      prefix: receiptPrefix || 'REC-',
      sample: `${receiptPrefix || 'REC-'}2026-00840`,
      hint: 'Bank / Cash Voucher',
    },
  ];

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
              Sequential Document Pipeline &amp; Barcode Simulator
            </span>
            <span className="text-2xs text-muted block">
              Live chronological chain tracing automated prefix serials from initial quote to final settlement
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-2xs text-muted">
          <Barcode className="size-3.5 text-primary" />
          <span>Code-128 Ready</span>
        </div>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Pipeline Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {steps.map((s, idx) => (
            <div
              key={s.stage}
              className="p-3 rounded-lg bg-surface border border-default space-y-1.5 flex flex-col justify-between hover:border-primary/30 transition-all"
            >
              <div>
                <span className="text-2xs font-semibold text-muted block truncate">
                  {s.stage}
                </span>
                <span className="font-mono text-xs font-bold text-primary block truncate pt-0.5">
                  {s.sample}
                </span>
              </div>

              <div className="pt-1.5 border-t border-default flex items-center justify-between">
                <span className="text-2xs text-muted truncate">{s.hint}</span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="size-2.5 text-muted shrink-0 hidden lg:block" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live Barcode Render Strip */}
        <div className="p-3 rounded-lg bg-surface border border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-success" />
              <span className="text-2xs font-bold uppercase tracking-wider text-default">
                Next Generated Barcode Specimen
              </span>
            </div>
            <p className="text-2xs text-muted">
              Auto-scanned by thermal laser guns at receiving dock and counter POS
            </p>
          </div>

          <div className="p-2 rounded-md bg-surface-sunken border border-default flex items-center gap-3 shrink-0">
            {/* SVG Simulated Code-128 Barcode */}
            <div className="flex items-center gap-0.5 h-6 px-1">
              <span className="w-1 h-full bg-default inline-block" />
              <span className="w-0.5 h-full bg-default inline-block" />
              <span className="w-1.5 h-full bg-default inline-block" />
              <span className="w-0.5 h-full bg-default inline-block" />
              <span className="w-1 h-full bg-default inline-block" />
              <span className="w-2 h-full bg-default inline-block" />
              <span className="w-0.5 h-full bg-default inline-block" />
              <span className="w-1.5 h-full bg-default inline-block" />
              <span className="w-0.5 h-full bg-default inline-block" />
              <span className="w-1 h-full bg-default inline-block" />
              <span className="w-2 h-full bg-default inline-block" />
              <span className="w-0.5 h-full bg-default inline-block" />
              <span className="w-1 h-full bg-default inline-block" />
            </div>
            <span className="font-mono text-2xs font-bold text-default">
              *{invoicePrefix || 'INV-'}2026-00482*
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
