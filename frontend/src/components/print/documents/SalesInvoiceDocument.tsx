import { useMemo } from 'react';
import type { Invoice } from '../../../types/api/sales';
import type { BusinessConfig } from '../../../lib/document/useBusinessConfig';
import {
  formatCurrency,
  formatDocumentDate,
  numberToWords,
} from '../../../lib/document/formatters';
import { generateBarcodeSvg } from '../../../lib/barcode/engine';

export interface SalesInvoiceDocumentProps {
  invoice: Invoice;
  businessConfig: BusinessConfig;
  copyType?: 'ORIGINAL' | 'DUPLICATE' | 'ACCOUNTS COPY' | 'CUSTOMER COPY' | undefined;
  signatureLabels?: {
    preparedBy?: string | undefined;
    checkedBy?: string | undefined;
    authorizedBy?: string | undefined;
    receiver?: string | undefined;
  } | undefined;
}

export function SalesInvoiceDocument({
  invoice,
  businessConfig,
  copyType = 'ORIGINAL',
  signatureLabels,
}: SalesInvoiceDocumentProps) {
  const qrSvg = useMemo(() => {
    return generateBarcodeSvg({
      bcid: 'qrcode',
      text: `SLICEMART-INV:${invoice.invoice_number}|AMT:${invoice.total_amount}|DATE:${invoice.invoice_date}|BIN:${businessConfig.vatNumber}`,
      scale: 1.5,
      height: 16,
    });
  }, [invoice.invoice_number, invoice.total_amount, invoice.invoice_date, businessConfig.vatNumber]);

  const barcodeSvg = useMemo(() => {
    return generateBarcodeSvg({
      bcid: 'code128',
      text: invoice.invoice_number,
      scale: 1.5,
      height: 8,
      includeText: false,
    });
  }, [invoice.invoice_number]);

  const items = invoice.items ?? [];
  const dueAmountNum = parseFloat(invoice.due_amount || '0');

  return (
    <div className="print-doc w-full text-slate-900 bg-white text-[9pt] leading-normal font-sans">
      {/* Top Header Grid */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
        {/* Company Identity */}
        <div className="max-w-[55%]">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-slate-900 text-white font-black text-sm flex items-center justify-center tracking-tighter">
              SM
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                {businessConfig.name}
              </h1>
              <p className="text-[7.5pt] font-semibold text-slate-600 tracking-wide uppercase">
                {businessConfig.tagline}
              </p>
            </div>
          </div>
          <div className="text-[8pt] text-slate-600 space-y-0.5 mt-1.5 leading-tight">
            <p>{businessConfig.address}</p>
            <p>
              <span className="font-semibold text-slate-800">Phone:</span> {businessConfig.phone} &bull;{' '}
              <span className="font-semibold text-slate-800">Email:</span> {businessConfig.email}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{businessConfig.vatNumber}</span> &bull;{' '}
              <span className="font-semibold text-slate-800">{businessConfig.tinNumber}</span> &bull;{' '}
              <span>{businessConfig.tradeLicense}</span>
            </p>
          </div>
        </div>

        {/* Invoice Title, Meta & QR */}
        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[7.5pt] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
              {copyType}
            </span>
            <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
              Tax Invoice
            </h2>
          </div>

          <div className="font-mono text-xs font-bold text-slate-950 mb-1">
            {invoice.invoice_number}
          </div>

          <div
            className="my-1 size-14 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <div className="text-[8pt] text-slate-600 space-y-0.5 font-mono">
            <div>
              <span className="text-slate-500 font-sans">Date: </span>
              <span className="font-bold text-slate-900">{formatDocumentDate(invoice.invoice_date)}</span>
            </div>
            {invoice.due_date && (
              <div>
                <span className="text-slate-500 font-sans">Due Date: </span>
                <span className="font-bold text-slate-900">{formatDocumentDate(invoice.due_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Transaction Details Strip */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-[8.5pt]">
        {/* Customer Info */}
        <div>
          <span className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Bill To (Customer Information)
          </span>
          <div className="font-bold text-slate-950 text-[9.5pt]">
            {invoice.customer_name || 'Walk-in Retail Customer'}
          </div>
          <div className="text-slate-600 mt-0.5 space-y-0.5">
            <p>Client ID: <span className="font-mono font-semibold text-slate-800">CUST-{invoice.party_id || 'RETAIL'}</span></p>
            <p>Branch / POS: <span className="font-medium text-slate-800">Gulshan Flagship Store</span></p>
          </div>
        </div>

        {/* Order & Shipment Reference */}
        <div className="border-l border-slate-200 pl-4 space-y-1">
          <span className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Sale & Reference Details
          </span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-600 text-[8pt]">
            <div>
              <span className="text-slate-500">Sales Order:</span>{' '}
              <span className="font-mono font-semibold text-slate-900">
                {invoice.sales_order_number || 'DIRECT-POS'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Payment Status:</span>{' '}
              <span
                className={`font-bold uppercase text-[7.5pt] px-1.5 py-0.2 rounded ${
                  dueAmountNum <= 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {dueAmountNum <= 0 ? 'PAID' : 'DUE / CREDIT'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Payment Mode:</span>{' '}
              <span className="font-medium text-slate-900">Cash / Mobile Banking</span>
            </div>
            <div>
              <span className="text-slate-500">Warehouse:</span>{' '}
              <span className="font-medium text-slate-900">Central Retail Floor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table with Header Repeat for multi-page */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse border border-slate-300 text-[8.5pt]">
          <thead className="bg-slate-100 border-b border-slate-300 text-[7.5pt] font-bold uppercase text-slate-700 tracking-wider">
            <tr>
              <th className="py-2 px-2 border-r border-slate-300 w-8 text-center">#</th>
              <th className="py-2 px-2.5 border-r border-slate-300">Item Description & SKU</th>
              <th className="py-2 px-2 border-r border-slate-300 text-right w-16">Qty</th>
              <th className="py-2 px-2 border-r border-slate-300 text-right w-20">Rate (৳)</th>
              <th className="py-2 px-2 border-r border-slate-300 text-right w-16">Disc (৳)</th>
              <th className="py-2 px-2 border-r border-slate-300 text-right w-16">VAT (৳)</th>
              <th className="py-2 px-2.5 text-right w-24">Total Amount (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-400">
                  No line items listed on this invoice.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200">
                    <div className="font-bold text-slate-900">{item.product_name || 'Standard Product'}</div>
                    {item.description && (
                      <div className="text-[7.5pt] text-slate-500">{item.description}</div>
                    )}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-200 text-right font-mono text-slate-700">
                    {parseFloat(item.unit_price || '0').toFixed(2)}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-200 text-right font-mono text-slate-500">
                    {parseFloat(item.discount_amount || '0') > 0
                      ? parseFloat(item.discount_amount).toFixed(2)
                      : '—'}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-200 text-right font-mono text-slate-500">
                    {parseFloat(item.tax_amount || '0') > 0
                      ? parseFloat(item.tax_amount).toFixed(2)
                      : '0.00'}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-950">
                    {parseFloat(item.line_total || '0').toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary & Amount in Words Block */}
      <div className="grid grid-cols-12 gap-4 mb-5 break-inside-avoid">
        {/* Left 7 cols: Amount in Words & Notes */}
        <div className="col-span-7 space-y-3">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[7pt] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
              Total Amount in Words
            </span>
            <p className="font-bold text-slate-900 italic text-[8.5pt]">
              {numberToWords(invoice.total_amount, 'Taka', 'Paisa')}
            </p>
          </div>

          <div className="text-[7.5pt] text-slate-600 space-y-1">
            <span className="font-bold uppercase tracking-wider text-slate-700 block">
              Terms & Legal Declaration:
            </span>
            <p className="whitespace-pre-line leading-relaxed">{businessConfig.invoiceTerms}</p>
          </div>

          <div className="pt-2">
            <div
              className="max-w-[200px]"
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
          </div>
        </div>

        {/* Right 5 cols: Financial Calculation Summary */}
        <div className="col-span-5 border border-slate-300 rounded-lg overflow-hidden text-[8.5pt]">
          <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase text-[7.5pt] text-slate-700 border-b border-slate-300">
            Payment & Settlement Breakdown
          </div>
          <div className="divide-y divide-slate-200 px-3 py-1">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {parseFloat(invoice.discount_amount || '0') > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Total Discount:</span>
                <span className="font-mono font-medium text-emerald-600">
                  - {formatCurrency(invoice.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 text-slate-600">
              <span>VAT / Tax (Standard Rate):</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.tax_amount)}</span>
            </div>
            {parseFloat(invoice.shipping_amount || '0') > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Delivery & Shipping:</span>
                <span className="font-mono font-medium">{formatCurrency(invoice.shipping_amount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 font-bold text-slate-950 text-[10pt] border-t-2 border-slate-900 bg-slate-50/50">
              <span>Grand Total:</span>
              <span className="font-mono">{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-700 font-semibold">
              <span>Paid Amount:</span>
              <span className="font-mono text-emerald-700">{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-900 font-bold bg-amber-50/50">
              <span>Net Due Balance:</span>
              <span className="font-mono text-rose-600">{formatCurrency(invoice.due_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Authorization Block */}
      <div className="grid grid-cols-4 gap-4 pt-12 mt-4 border-t border-slate-200 text-center text-[7.5pt] break-inside-avoid">
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            {signatureLabels?.preparedBy || businessConfig.signaturePreparedBy}
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            {signatureLabels?.checkedBy || businessConfig.signatureCheckedBy}
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            {signatureLabels?.authorizedBy || businessConfig.signatureAuthorized}
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            {signatureLabels?.receiver || businessConfig.signatureReceiver}
          </div>
        </div>
      </div>

      {/* Document Footer */}
      <div className="flex justify-between items-center text-[7pt] text-slate-400 pt-4 mt-4 border-t border-dashed border-slate-200 font-mono">
        <span>Document ID: {invoice.uuid || invoice.invoice_number}</span>
        <span>Generated via SliceMart FMS &bull; Printed on {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
