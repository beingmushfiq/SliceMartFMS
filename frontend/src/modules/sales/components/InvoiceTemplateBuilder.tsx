import { useState } from 'react';
import { Check, Printer, Sliders } from 'lucide-react';
import type { Invoice } from '../../../types/api/sales';

interface InvoiceTemplateBuilderProps {
  invoice?: Invoice | null | undefined;
  onClose?: (() => void) | undefined;
}

export type InvoiceLayout = 'standard' | 'compact' | 'thermal_80mm' | 'commercial_vat';

export function InvoiceTemplateBuilder({ invoice, onClose }: InvoiceTemplateBuilderProps) {
  const [layout, setLayout] = useState<InvoiceLayout>('standard');
  const [showLogo, setShowLogo] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [footerNote, setFooterNote] = useState(
    'Thank you for your business! Goods once sold are subject to warranty terms.'
  );

  // Sample or active invoice data
  const inv = invoice ?? {
    id: 1,
    uuid: 'inv-sample-uuid',
    invoice_number: 'INV-202608-0001',
    customer_name: 'Apex Industrial Corporation',
    invoice_date: '2026-08-28',
    due_date: '2026-09-28',
    subtotal: '25400.0000',
    tax_amount: '3810.0000',
    discount_amount: '0.0000',
    shipping_amount: '500.0000',
    round_off: '0.0000',
    total_amount: '29710.0000',
    paid_amount: '0.0000',
    due_amount: '29710.0000',
    status: 'posted',
    printed_count: 1,
    items: [
      {
        id: 1,
        uuid: 'item-1',
        invoice_id: 1,
        product_name: 'Industrial Bread Slicing Blade 12mm Grade A',
        quantity: '50.0000',
        unit_price: '400.0000',
        discount_amount: '0.0000',
        tax_amount: '3000.0000',
        line_total: '20000.0000',
      },
      {
        id: 2,
        uuid: 'item-2',
        invoice_id: 1,
        product_name: 'Food Grade Heavy Conveyor Belt 2.4m',
        quantity: '3.0000',
        unit_price: '1800.0000',
        discount_amount: '0.0000',
        tax_amount: '810.0000',
        line_total: '5400.0000',
      },
    ],
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 bg-zinc-950 text-zinc-100 min-h-[600px]">
      {/* Left: Customizer Sidebar */}
      <div className="w-full lg:w-80 space-y-5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Sliders className="h-4 w-4 text-emerald-400" />
          <h3 className="font-semibold text-sm text-zinc-100">Invoice Template Designer</h3>
        </div>

        {/* Layout Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Document Layout
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'standard', label: 'Standard VAT' },
              { id: 'compact', label: 'Compact A5' },
              { id: 'thermal_80mm', label: 'POS 80mm' },
              { id: 'commercial_vat', label: 'NBR Mushak 6.3' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setLayout(t.id as InvoiceLayout)}
                className={`flex items-center justify-between rounded-md border p-2.5 text-left text-xs transition-all ${
                  layout === t.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <span>{t.label}</span>
                {layout === t.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Components & Modules
          </label>

          <label className="flex items-center justify-between text-xs text-zinc-300">
            <span>Company Logo & Watermark</span>
            <input
              type="checkbox"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-zinc-300">
            <span>NBR QR Verification Code</span>
            <input
              type="checkbox"
              checked={showQrCode}
              onChange={(e) => setShowQrCode(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-zinc-300">
            <span>Detailed Tax & HS Code Breakdown</span>
            <input
              type="checkbox"
              checked={showTaxBreakdown}
              onChange={(e) => setShowTaxBreakdown(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-zinc-300">
            <span>Bank & Wire Payment Details</span>
            <input
              type="checkbox"
              checked={showBankDetails}
              onChange={(e) => setShowBankDetails(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
            />
          </label>
        </div>

        {/* Custom Footer Note */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Legal Footer Memo
          </label>
          <textarea
            rows={3}
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Print / Actions */}
        <div className="pt-3 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Right: Live Interactive Printable Preview Sheet */}
      <div className="flex-1 flex justify-center overflow-auto p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
        <div
          className={`bg-white text-zinc-900 shadow-2xl rounded-sm transition-all ${
            layout === 'thermal_80mm'
              ? 'w-[320px] p-4 text-[11px] font-mono'
              : 'w-full max-w-[780px] p-8 text-xs font-sans min-h-[950px]'
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
            <div>
              {showLogo && (
                <div className="font-extrabold tracking-tight text-xl text-emerald-700 flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded bg-emerald-600 flex items-center justify-center text-white text-xs">
                    SM
                  </div>
                  SLICEMART FOODS & CO.
                </div>
              )}
              <p className="text-zinc-500 text-[11px]">Factory & Operations HQ</p>
              <p className="text-zinc-500 text-[11px]">
                Plot 42, Tejgaon Industrial Area, Dhaka-1208
              </p>
              <p className="text-zinc-500 text-[11px]">
                BIN / VAT: 001928374-0102 | Phone: +880 2 8878900
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block rounded bg-zinc-100 px-2 py-1 font-mono font-bold text-xs text-zinc-800 uppercase tracking-wide">
                {layout === 'commercial_vat' ? 'NBR Mushak-6.3 Tax Invoice' : 'Tax Invoice'}
              </span>
              <p className="mt-2 font-mono font-bold text-sm text-zinc-900">{inv.invoice_number}</p>
              <p className="text-[11px] text-zinc-500">Date: {inv.invoice_date}</p>
              <p className="text-[11px] text-zinc-500">
                Payment Due: {inv.due_date ?? 'Immediate'}
              </p>
            </div>
          </div>

          {/* Customer Billed To */}
          <div className="mt-4 grid grid-cols-2 gap-4 pb-4 border-b border-zinc-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Billed To:
              </p>
              <p className="font-bold text-zinc-900 text-sm">{inv.customer_name}</p>
              <p className="text-zinc-600 text-[11px]">Authorized Dealer / Client Account</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Payment Status:
              </p>
              <span className="inline-block font-bold text-xs uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {inv.status}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-zinc-900 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  {showTaxBreakdown && <th className="py-2 text-right">VAT (15%)</th>}
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {inv.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-medium text-zinc-800">{item.product_name}</td>
                    <td className="py-2 text-right font-mono">
                      {parseFloat(item.quantity).toFixed(0)}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {parseFloat(item.unit_price).toFixed(2)}
                    </td>
                    {showTaxBreakdown && (
                      <td className="py-2 text-right font-mono text-zinc-600">
                        {parseFloat(item.tax_amount || '0').toFixed(2)}
                      </td>
                    )}
                    <td className="py-2 text-right font-mono font-bold text-zinc-900">
                      {parseFloat(item.line_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="mt-6 flex justify-between items-start border-t border-zinc-200 pt-4">
            {/* Left: Bank details & QR */}
            <div className="space-y-3">
              {showBankDetails && (
                <div className="rounded bg-zinc-50 border border-zinc-200 p-3 text-[11px] max-w-xs">
                  <p className="font-bold text-zinc-800 mb-1">Bank Remittance Details:</p>
                  <p className="text-zinc-600">Bank: Eastern Bank PLC (Gulshan Branch)</p>
                  <p className="text-zinc-600">Account Name: SliceMart Foods Co Ltd</p>
                  <p className="text-zinc-600 font-mono">A/C: 104-102-98471203</p>
                  <p className="text-zinc-600 font-mono">Routing: 095261723</p>
                </div>
              )}

              {showQrCode && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <div className="h-12 w-12 border border-zinc-300 rounded flex items-center justify-center font-mono text-[9px] bg-zinc-50">
                    [QR CODE]
                  </div>
                  <div>
                    <p className="font-bold text-zinc-700">Digital Mushak Verification</p>
                    <p className="font-mono">NBR-HASH-9812A</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Amounts */}
            <div className="w-64 space-y-1.5 text-right font-mono text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span>{parseFloat(inv.subtotal).toFixed(2)} BDT</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>VAT / Tax (15%):</span>
                <span>{parseFloat(inv.tax_amount).toFixed(2)} BDT</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Shipping / Freight:</span>
                <span>{parseFloat(inv.shipping_amount).toFixed(2)} BDT</span>
              </div>
              <div className="flex justify-between border-t-2 border-zinc-900 pt-2 text-sm font-bold text-zinc-900">
                <span>Grand Total:</span>
                <span className="text-emerald-700">
                  {parseFloat(inv.total_amount).toFixed(2)} BDT
                </span>
              </div>
            </div>
          </div>

          {/* Footer Legal Terms */}
          <div className="mt-8 border-t border-zinc-200 pt-4 text-center text-[10px] text-zinc-500">
            <p>{footerNote}</p>
            <p className="mt-1 font-mono">
              Generated automatically via SliceMart FMS Enterprise Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
