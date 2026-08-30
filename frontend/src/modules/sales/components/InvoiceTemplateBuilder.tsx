import { useState } from 'react';
import { Check, Printer, Sliders } from 'lucide-react';
import type { Invoice } from '../../../types/api/sales';
import { useBusinessConfig } from '../../../lib/document/useBusinessConfig';
import { useDocumentPrint } from '../../../components/print/useDocumentPrint';
import { SalesInvoiceDocument } from '../../../components/print/documents/SalesInvoiceDocument';
import { ThermalReceipt } from '../../../components/print/receipts/ThermalReceipt';

interface InvoiceTemplateBuilderProps {
  invoice?: Invoice | null | undefined;
  onClose?: (() => void) | undefined;
}

export type InvoiceLayout = 'standard' | 'compact' | 'thermal_80mm' | 'commercial_vat';

export function InvoiceTemplateBuilder({ invoice, onClose }: InvoiceTemplateBuilderProps) {
  const { config: businessConfig } = useBusinessConfig();
  const { printDocument, isPrinting } = useDocumentPrint();

  const [layout, setLayout] = useState<InvoiceLayout>('standard');
  const [copyType, setCopyType] = useState<'ORIGINAL' | 'DUPLICATE' | 'CUSTOMER COPY'>('ORIGINAL');

  // Sample or active invoice data
  const inv: Invoice = invoice ?? {
    id: 1,
    uuid: 'inv-sample-uuid',
    invoice_number: 'INV-202608-0001',
    customer_name: 'Apex Industrial Corporation',
    party_id: 101,
    sales_order_number: 'SO-202608-088',
    invoice_date: '2026-08-28',
    due_date: '2026-09-28',
    subtotal: '25400.00',
    tax_amount: '3810.00',
    discount_amount: '0.00',
    shipping_amount: '500.00',
    round_off: '0.00',
    total_amount: '29710.00',
    paid_amount: '29710.00',
    due_amount: '0.00',
    status: 'paid',
    printed_count: 1,
    items: [
      {
        id: 1,
        uuid: 'item-1',
        invoice_id: 1,
        product_name: 'Artisan Sourdough Loaf (800g Master Case)',
        quantity: '50',
        unit_price: '400.00',
        discount_amount: '0.00',
        tax_amount: '3000.00',
        line_total: '20000.00',
      },
      {
        id: 2,
        uuid: 'item-2',
        invoice_id: 1,
        product_name: 'Chocolate Fudge Brownie Catering Tray',
        quantity: '3',
        unit_price: '1800.00',
        discount_amount: '0.00',
        tax_amount: '810.00',
        line_total: '5400.00',
      },
    ],
  };

  const handlePrint = () => {
    const isThermal = layout === 'thermal_80mm';
    printDocument(
      isThermal ? (
        <ThermalReceipt invoice={inv} businessConfig={businessConfig} paperWidth="80mm" />
      ) : (
        <SalesInvoiceDocument invoice={inv} businessConfig={businessConfig} copyType={copyType} />
      ),
      {
        documentTitle: `${inv.invoice_number}.pdf`,
        pageClass: isThermal ? 'print-page-thermal-80' : 'print-page-a4',
      }
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 bg-surface text-default min-h-[600px] rounded-2xl">
      {/* Left: Customizer Sidebar */}
      <div className="w-full lg:w-80 space-y-5 rounded-2xl border border-default bg-surface-sunken p-5">
        <div className="flex items-center gap-2 border-b border-default pb-3">
          <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-sm text-default">Invoice Document Engine</h3>
        </div>

        {/* Layout Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">
            Document Paper & Layout
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'standard', label: 'Standard A4 Tax' },
              { id: 'commercial_vat', label: 'NBR Mushak 6.3' },
              { id: 'thermal_80mm', label: 'POS 80mm Roll' },
              { id: 'compact', label: 'Compact Office' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setLayout(t.id as InvoiceLayout)}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                  layout === t.id
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-default bg-surface text-muted hover:bg-surface-sunken hover:text-default'
                }`}
              >
                <span>{t.label}</span>
                {layout === t.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Copy Stamp */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">
            Copy Type Stamp
          </label>
          <select
            value={copyType}
            onChange={(e) => setCopyType(e.target.value as any)}
            className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
          >
            <option value="ORIGINAL">ORIGINAL (Customer Copy)</option>
            <option value="DUPLICATE">DUPLICATE (Accounts Copy)</option>
            <option value="CUSTOMER COPY">CUSTOMER COPY (Retail)</option>
          </select>
        </div>

        {/* Document Specifications Summary */}
        <div className="p-3 bg-surface rounded-xl border border-default text-[11px] space-y-1 text-muted">
          <div className="flex justify-between">
            <span>Paper Specification:</span>
            <span className="font-mono font-semibold text-default">
              {layout === 'thermal_80mm' ? '80mm Thermal Roll' : 'A4 Portrait (210×297mm)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Barcode Symbology:</span>
            <span className="font-mono text-default">Code128 + QR</span>
          </div>
          <div className="flex justify-between">
            <span>NBR Compliance:</span>
            <span className="font-semibold text-emerald-600">Mushak Verified</span>
          </div>
        </div>

        {/* Print / Actions */}
        <div className="pt-3 flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>{isPrinting ? 'Preparing Document...' : 'Print / Save PDF'}</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-default bg-surface px-3 py-2.5 text-xs font-medium text-muted hover:bg-surface-sunken hover:text-default transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Right: Live Interactive Printable Preview Sheet */}
      <div className="flex-1 flex justify-center overflow-auto p-4 rounded-2xl border border-default bg-surface-sunken">
        <div
          className={`bg-white shadow-2xl rounded-sm transition-all ${
            layout === 'thermal_80mm'
              ? 'document-preview-thermal-80'
              : 'document-preview-sheet-a4'
          }`}
        >
          {layout === 'thermal_80mm' ? (
            <ThermalReceipt invoice={inv} businessConfig={businessConfig} paperWidth="80mm" />
          ) : (
            <SalesInvoiceDocument invoice={inv} businessConfig={businessConfig} copyType={copyType} />
          )}
        </div>
      </div>
    </div>
  );
}
