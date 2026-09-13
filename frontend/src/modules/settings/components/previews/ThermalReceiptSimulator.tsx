import React, { useState } from 'react';
import {
  Monitor,
  Sparkles,
  Barcode,
  Lock,
  Scissors,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useTenantBranding } from '../../../../lib/theme/useTenantBranding';

interface ThermalReceiptSimulatorProps {
  receiptHeaderNote?: string;
  receiptFooterNote?: string;
  receiptPrinterTemplate?: string;
  requirePinForDiscount?: boolean | string;
  requirePinForVoid?: boolean | string;
}

export const ThermalReceiptSimulator: React.FC<ThermalReceiptSimulatorProps> = ({
  receiptHeaderNote = 'Thank you for your business!',
  receiptFooterNote = 'Goods once sold can be exchanged within 7 days with original receipt.',
  receiptPrinterTemplate = 'standard_80mm',
  requirePinForDiscount = true,
  requirePinForVoid = true,
}) => {
  const { companyName } = useTenantBranding();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(
    receiptPrinterTemplate?.includes('58') ? '58mm' : '80mm'
  );

  const isPinDiscount = requirePinForDiscount === true || requirePinForDiscount === '1' || requirePinForDiscount === 'true';
  const isPinVoid = requirePinForVoid === true || requirePinForVoid === '1' || requirePinForVoid === 'true';

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
              Point of Sale Thermal Receipt Roll &amp; PIN Guardrail Simulator
            </span>
            <span className="text-2xs text-muted block">
              Real-time thermal printer paper roll rendering, VAT itemization, and supervisor override security
            </span>
          </div>
        </div>

        {/* Width Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-surface-sunken border border-default">
          <Button
            type="button"
            variant={paperWidth === '80mm' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPaperWidth('80mm')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            80mm Standard
          </Button>
          <Button
            type="button"
            variant={paperWidth === '58mm' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPaperWidth('58mm')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            58mm Compact
          </Button>
        </div>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 flex flex-col sm:flex-row items-start justify-center gap-4">
        {/* Thermal Receipt Paper Roll */}
        <div
          className={`w-full ${
            paperWidth === '80mm' ? 'max-w-xs' : 'max-w-60'
          } rounded-lg bg-surface border-2 border-dashed border-default p-4 shadow-sm font-mono text-default space-y-3 relative`}
        >
          {/* Top jagged cut indicator */}
          <div className="flex items-center justify-center gap-1 text-2xs text-muted border-b border-default pb-1.5 font-sans">
            <Scissors className="size-3" />
            <span>Thermal Cut Line ({paperWidth})</span>
          </div>

          {/* Store Header */}
          <div className="text-center space-y-0.5 pt-1">
            <h5 className="font-bold text-sm uppercase tracking-tight">{companyName?.toUpperCase() || 'ENTERPRISE ERP'}</h5>
            <p className="text-2xs text-muted">Branch: Metro Outlet #01</p>
            <p className="text-2xs text-muted">BIN: 002918471-0101</p>
            {receiptHeaderNote && (
              <p className="text-2xs italic text-default pt-1 font-sans border-t border-default/50 mt-1">
                "{receiptHeaderNote}"
              </p>
            )}
          </div>

          {/* Itemized Lines */}
          <div className="border-t border-b border-default py-2 space-y-1 text-2xs">
            <div className="flex justify-between font-bold">
              <span>ITEM</span>
              <span>TOTAL</span>
            </div>
            <div className="flex justify-between">
              <span>Industrial Cutting Wheel x2</span>
              <span>৳ 700.00</span>
            </div>
            <div className="flex justify-between">
              <span>Poly Seal Tape x5</span>
              <span>৳ 250.00</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>VAT (Mushak 6.3 - 15%)</span>
              <span>৳ 142.50</span>
            </div>
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-default text-default">
              <span>NET PAYABLE</span>
              <span>৳ 1,092.50</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center space-y-1 pt-1">
            <p className="text-2xs text-muted font-sans leading-tight">
              {receiptFooterNote}
            </p>
            <div className="flex justify-center pt-1">
              <Barcode className="size-6 text-default" />
            </div>
            <span className="text-2xs text-muted block">*REC-2026-00840*</span>
          </div>
        </div>

        {/* POS Guardrail Badge Box */}
        <div className="flex-1 max-w-sm space-y-3">
          <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-muted">
              <Lock className="size-3 text-primary" />
              Cashier Guardrails &amp; PIN Controls
            </div>

            <div className="space-y-2 pt-1 text-2xs">
              <div className="p-2.5 rounded-lg bg-surface-sunken border border-default flex items-center justify-between">
                <span>Manager PIN for Line Discounts</span>
                <span className={isPinDiscount ? 'text-success font-bold' : 'text-muted'}>
                  {isPinDiscount ? '🔒 Required' : 'Open'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-sunken border border-default flex items-center justify-between">
                <span>Manager PIN for Receipt Voids</span>
                <span className={isPinVoid ? 'text-success font-bold' : 'text-muted'}>
                  {isPinVoid ? '🔒 Required' : 'Open'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-default flex items-center gap-2 text-2xs text-muted">
            <Monitor className="size-3.5 text-primary shrink-0" />
            <span>Barcode scanner auto-increments cart quantity on scan detection.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
