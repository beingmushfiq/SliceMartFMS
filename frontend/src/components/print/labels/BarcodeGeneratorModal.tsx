import React, { useState } from 'react';
import {
  Tag,
  Printer,
  FileDown,
  X,
  Plus,
  Trash2,
  Settings2,
  Sliders,
  CheckSquare,
  Square,
  QrCode,
  Layers,
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { BarcodeLabel } from './BarcodeLabel';
import { LabelSheet } from './LabelSheet';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { useDocumentPrint } from '../useDocumentPrint';
import type {
  BarcodeFieldOptions,
  BarcodeFormat,
  LabelProductItem,
  PhysicalLabelPreset,
} from '../../../lib/barcode/types';
import { DEFAULT_LABEL_FIELDS } from '../../../lib/barcode/types';
import { useBusinessConfig } from '../../../lib/document/useBusinessConfig';

export interface BarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProducts?: LabelProductItem[];
}

export function BarcodeGeneratorModal({
  isOpen,
  onClose,
  initialProducts = [],
}: BarcodeGeneratorModalProps) {
  const { config } = useBusinessConfig();
  const { printDocument, isPrinting } = useDocumentPrint();

  const [products, setProducts] = useState<Array<{ product: LabelProductItem; count: number }>>(
    initialProducts.length > 0
      ? initialProducts.map((p) => ({ product: p, count: p.quantity || 1 }))
      : [
          {
            product: {
              id: '1',
              name: 'Artisan Sourdough Loaf (800g)',
              sku: 'FG-BREAD-01',
              barcode: '8901234567890',
              sale_price: '280.00',
              currency: '৳',
              unit_code: 'PCS',
              batch_code: 'BAT-2026-0830',
              mfg_date: '2026-08-30',
              exp_date: '2026-09-02',
            },
            count: 4,
          },
        ]
  );

  const [preset, setPreset] = useState<PhysicalLabelPreset>('standard_50x35');
  const [format, setFormat] = useState<BarcodeFormat>('code128');
  const [fields, setFields] = useState<BarcodeFieldOptions>(DEFAULT_LABEL_FIELDS);
  const [startPosition, setStartPosition] = useState<number>(0);
  const [showFullPreview, setShowFullPreview] = useState(false);

  if (!isOpen) return null;

  const totalLabels = products.reduce((sum, item) => sum + item.count, 0);

  const handleUpdateCount = (idx: number, newCount: number) => {
    setProducts((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, count: Math.max(1, newCount) } : item))
    );
  };

  const handleRemoveProduct = (idx: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleField = (key: keyof BarcodeFieldOptions) => {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleQuickPrint = () => {
    printDocument(
      <LabelSheet
        items={products}
        preset={preset}
        format={format}
        fields={fields}
        gridConfig={{ startPosition }}
        businessName={config.name}
      />,
      {
        documentTitle: `Barcode_Labels_${new Date().toISOString().slice(0, 10)}.pdf`,
        pageClass: 'print-page-label-sheet',
      }
    );
  };

  return (
    <>
      <Modal
        open={isOpen && !showFullPreview}
        onClose={onClose}
        title="Print Barcode & Product Labels"
      >
        <div className="space-y-5 text-xs text-default">
          {/* Top Options Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface-sunken/60 rounded-xl border border-default">
            {/* Label Size */}
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Label Dimension
              </label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as PhysicalLabelPreset)}
                className="w-full rounded-lg border border-default bg-surface px-2.5 py-1.5 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="standard_50x35">Standard (50 × 35 mm)</option>
                <option value="small_35x25">Compact (35 × 25 mm)</option>
              </select>
            </div>

            {/* Symbology */}
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Barcode Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
                className="w-full rounded-lg border border-default bg-surface px-2.5 py-1.5 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="code128">Code 128 (Universal SKU/Alpha)</option>
                <option value="ean13">EAN-13 (Retail standard 13-digit)</option>
                <option value="ean8">EAN-8 (Compact 8-digit)</option>
                <option value="qrcode">QR Code (2D Data Matrix)</option>
                <option value="code39">Code 39</option>
              </select>
            </div>

            {/* Reusable Sheet Starting Position */}
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Sheet Start Slot (Offset)
              </label>
              <input
                type="number"
                min={0}
                max={27}
                value={startPosition}
                onChange={(e) => setStartPosition(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-default bg-surface px-2.5 py-1.5 text-xs text-default focus:border-primary focus:outline-none font-mono"
                title="Skip already used sticker slots on partial A4 sheets"
              />
            </div>
          </div>

          {/* Product Items Table & Quantity Adjuster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-default text-xs flex items-center gap-1.5">
                <Tag className="size-3.5 text-primary" /> Target Products & Print Quantities
              </span>
              <span className="text-[11px] font-mono font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                {totalLabels} Total Labels
              </span>
            </div>

            <div className="max-h-44 overflow-y-auto rounded-xl border border-default bg-surface divide-y divide-default">
              {products.length === 0 ? (
                <div className="p-4 text-center text-muted">No products selected for barcode generation.</div>
              ) : (
                products.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-default truncate">{item.product.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted font-mono">
                        <span>SKU: {item.product.sku}</span>
                        {item.product.barcode && <span>Code: {item.product.barcode}</span>}
                        <span className="text-emerald-600 font-bold">
                          {item.product.currency || '৳'}{item.product.sale_price}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-muted">Qty:</label>
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={item.count}
                        onChange={(e) => handleUpdateCount(idx, parseInt(e.target.value) || 1)}
                        className="w-16 rounded-lg border border-default bg-surface-sunken px-2 py-1 text-center font-mono text-xs font-bold text-default"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                        title="Remove product"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Configurable Label Fields */}
          <div className="space-y-2">
            <span className="font-bold text-default text-xs flex items-center gap-1.5">
              <Sliders className="size-3.5 text-primary" /> Visible Fields on Label
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-sunken/40 p-3 rounded-xl border border-default text-[11px]">
              {(
                [
                  ['showBusinessName', 'Business Name'],
                  ['showProductName', 'Product Name'],
                  ['showSku', 'SKU Code'],
                  ['showPrice', 'Retail MRP Price'],
                  ['showUnit', 'Unit of Measure'],
                  ['showBatchCode', 'Batch/Lot Code'],
                  ['showMfgDate', 'Manufacturing Date'],
                  ['showExpDate', 'Expiry Date'],
                  ['showBarcodeText', 'Barcode Number'],
                  ['showQrCode', '2D QR Code'],
                ] as Array<[keyof BarcodeFieldOptions, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleField(key)}
                  className="flex items-center gap-2 text-left text-muted hover:text-default"
                >
                  {fields[key] ? (
                    <CheckSquare className="size-4 text-primary shrink-0" />
                  ) : (
                    <Square className="size-4 text-muted shrink-0" />
                  )}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Single Label Live Preview Box */}
          {products[0] && (
            <div className="space-y-1.5">
              <span className="font-semibold text-muted text-[11px] block">
                Sample Physical Label Preview:
              </span>
              <div className="flex justify-center p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-default">
                <div className="shadow-md rounded-xs overflow-hidden border border-slate-300">
                  <BarcodeLabel
                    product={products[0].product}
                    preset={preset}
                    format={format}
                    fields={fields}
                    businessName={config.name}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-default">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowFullPreview(true)}
                disabled={totalLabels === 0}
                className="flex items-center gap-1.5"
              >
                <Layers className="size-4 text-blue-500" />
                <span>Full Sheet Preview</span>
              </Button>

              <Button
                variant="primary"
                onClick={handleQuickPrint}
                disabled={totalLabels === 0 || isPrinting}
                className="flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="size-4" />
                <span>{isPrinting ? 'Printing...' : 'Print Labels'}</span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Full Sheet Preview Modal */}
      {showFullPreview && (
        <PrintPreviewModal
          isOpen={showFullPreview}
          onClose={() => setShowFullPreview(false)}
          title="Print Barcode Sticker Sheet"
          documentType="A4 Adhesive Label Sheet"
          pageClass="print-page-label-sheet"
        >
          <LabelSheet
            items={products}
            preset={preset}
            format={format}
            fields={fields}
            gridConfig={{ startPosition }}
            businessName={config.name}
          />
        </PrintPreviewModal>
      )}
    </>
  );
}
