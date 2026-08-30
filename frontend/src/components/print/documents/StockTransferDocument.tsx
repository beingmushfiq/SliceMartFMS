import React, { useMemo } from 'react';
import type { StockTransfer } from '../../../types/api/inventory';
import type { BusinessConfig } from '../../../lib/document/useBusinessConfig';
import { formatDocumentDate } from '../../../lib/document/formatters';
import { generateBarcodeSvg } from '../../../lib/barcode/engine';

export interface StockTransferDocumentProps {
  transfer: StockTransfer;
  businessConfig: BusinessConfig;
}

export function StockTransferDocument({ transfer, businessConfig }: StockTransferDocumentProps) {
  const barcodeSvg = useMemo(() => {
    return generateBarcodeSvg({
      bcid: 'code128',
      text: transfer.transfer_number,
      scale: 1.5,
      height: 8,
      includeText: false,
    });
  }, [transfer.transfer_number]);

  const items = transfer.items ?? [];

  return (
    <div className="print-doc w-full text-slate-900 bg-white text-[9pt] leading-normal font-sans">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
        <div className="max-w-[55%]">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-slate-900 text-white font-black text-sm flex items-center justify-center">
              TR
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                {businessConfig.name}
              </h1>
              <p className="text-[7.5pt] font-semibold text-slate-600 tracking-wide uppercase">
                Inter-Warehouse Stock Transfer Manifest
              </p>
            </div>
          </div>
          <div className="text-[8pt] text-slate-600 space-y-0.5 mt-1 leading-tight">
            <p>{businessConfig.address}</p>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
            Transfer Manifest
          </h2>
          <div className="font-mono text-xs font-bold text-slate-950 mb-1">
            {transfer.transfer_number}
          </div>
          <div className="text-[8pt] text-slate-600 font-mono">
            <span>Transfer Date: </span>
            <span className="font-bold text-slate-900">{formatDocumentDate(transfer.transfer_date)}</span>
          </div>
        </div>
      </div>

      {/* Warehouse Route Box */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-[8.5pt]">
        <div>
          <span className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Source Dispatch Warehouse
          </span>
          <div className="font-bold text-slate-950 text-[9.5pt]">
            {transfer.from_warehouse_name}
          </div>
        </div>

        <div className="border-l border-slate-200 pl-4">
          <span className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Target Destination Warehouse
          </span>
          <div className="font-bold text-slate-950 text-[9.5pt]">
            {transfer.to_warehouse_name}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse border border-slate-300 text-[8.5pt]">
          <thead className="bg-slate-100 border-b border-slate-300 text-[7.5pt] font-bold uppercase text-slate-700 tracking-wider">
            <tr>
              <th className="py-2 px-2 border-r border-slate-300 w-8 text-center">#</th>
              <th className="py-2 px-2.5 border-r border-slate-300">Item Description</th>
              <th className="py-2 px-2 border-r border-slate-300 text-center w-28">Batch / Lot #</th>
              <th className="py-2 px-2 border-r border-slate-300 text-right w-24">Sent Qty</th>
              <th className="py-2 px-2 border-r border-slate-300 text-right w-24">Received Qty</th>
              <th className="py-2 px-2.5 text-center w-14">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-slate-500">
                  {idx + 1}
                </td>
                <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-slate-900">
                  {item.product_name || 'Inventory Item'}
                </td>
                <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-slate-600">
                  {item.batch_code || 'BAT-AUTO'}
                </td>
                <td className="py-2 px-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {item.sent_quantity}
                </td>
                <td className="py-2 px-2 border-r border-slate-200 text-right font-mono text-slate-700">
                  {transfer.status === 'received' ? item.sent_quantity : '—'}
                </td>
                <td className="py-2 px-2.5 text-center font-mono text-slate-600">
                  {item.unit_code || 'KG'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes & Barcode */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[8pt]">
          <span className="font-bold text-slate-700 block mb-1">Transfer Remarks & Route:</span>
          <p className="text-slate-600">{transfer.notes || 'Inter-facility scheduled inventory transfer.'}</p>
        </div>
        <div className="flex justify-end items-center">
          <div className="max-w-[200px]" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-6 pt-12 mt-8 border-t border-slate-200 text-center text-[7.5pt] break-inside-avoid">
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Dispatching Storekeeper
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Transfer Vehicle Driver
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Receiving Storekeeper Sign-off
          </div>
        </div>
      </div>
    </div>
  );
}
