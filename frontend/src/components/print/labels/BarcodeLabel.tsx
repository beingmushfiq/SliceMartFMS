import { useMemo } from 'react';
import { generateBarcodeSvg } from '../../../lib/barcode/engine';
import type {
  BarcodeFieldOptions,
  BarcodeFormat,
  LabelProductItem,
  PhysicalLabelPreset,
} from '../../../lib/barcode/types';
import { PRESET_LABEL_DIMENSIONS } from '../../../lib/barcode/types';
import { formatCurrency } from '../../../lib/document/formatters';

export interface BarcodeLabelProps {
  product: LabelProductItem;
  preset?: PhysicalLabelPreset;
  format?: BarcodeFormat;
  fields?: Partial<BarcodeFieldOptions>;
  businessName?: string;
  className?: string;
}

export function BarcodeLabel({
  product,
  preset = 'standard_50x35',
  format = 'code128',
  fields = {},
  businessName = 'Enterprise Commercial Corp',
  className = '',
}: BarcodeLabelProps) {
  const showFields: BarcodeFieldOptions = {
    showBusinessName: true,
    showProductName: true,
    showSku: true,
    showPrice: true,
    showUnit: true,
    showBatchCode: false,
    showMfgDate: false,
    showExpDate: false,
    showQrCode: false,
    showBarcodeText: true,
    ...fields,
  };

  const isSmall = preset === 'small_35x25';
  const dimensions = isSmall ? PRESET_LABEL_DIMENSIONS.small_35x25 : PRESET_LABEL_DIMENSIONS.standard_50x35;

  const barcodeValue = product.barcode || product.sku;

  const barcodeSvgHtml = useMemo(() => {
    const isQr = format === 'qrcode' || showFields.showQrCode;
    return generateBarcodeSvg({
      bcid: isQr ? 'qrcode' : format,
      text: barcodeValue,
      scale: isSmall ? 1.5 : 2,
      height: isSmall ? 6 : 9,
      includeText: showFields.showBarcodeText && !isQr,
      textxalign: 'center',
    });
  }, [barcodeValue, format, isSmall, showFields.showBarcodeText, showFields.showQrCode]);

  return (
    <div
      style={{
        width: `${dimensions.widthMm}mm`,
        height: `${dimensions.heightMm}mm`,
        padding: `${dimensions.marginTopMm}mm ${dimensions.marginRightMm}mm`,
        boxSizing: 'border-box',
      }}
      className={`relative flex flex-col justify-between overflow-hidden bg-white text-black font-sans leading-none select-none ${className}`}
    >
      {/* Header: Business & SKU */}
      <div className="flex items-center justify-between border-b border-black/20 pb-0.5">
        {showFields.showBusinessName && (
          <span
            style={{ fontSize: isSmall ? '5pt' : '6.5pt' }}
            className="font-bold uppercase tracking-wider truncate max-w-[65%]"
          >
            {businessName}
          </span>
        )}
        {showFields.showSku && (
          <span
            style={{ fontSize: isSmall ? '5pt' : '6pt' }}
            className="font-mono font-bold text-black/80 truncate text-right ml-auto"
          >
            {product.sku}
          </span>
        )}
      </div>

      {/* Product Name */}
      {showFields.showProductName && (
        <div
          style={{ fontSize: isSmall ? '6pt' : '7.5pt', lineHeight: '1.15' }}
          className="font-bold text-black text-center line-clamp-1 py-0.5"
        >
          {product.name}
        </div>
      )}

      {/* Center: Barcode or QR Code SVG */}
      <div
        className="flex-1 flex items-center justify-center my-0.5 max-h-[45%]"
        dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
      />

      {/* Footer Info: Batch, Dates, Price & Unit */}
      <div className="space-y-0.5 border-t border-black/20 pt-0.5">
        {(showFields.showBatchCode || showFields.showMfgDate || showFields.showExpDate) && (
          <div
            style={{ fontSize: isSmall ? '4.5pt' : '5.5pt' }}
            className="flex items-center justify-between font-mono text-black/70"
          >
            {showFields.showBatchCode && product.batch_code && (
              <span>Lot: {product.batch_code}</span>
            )}
            {showFields.showMfgDate && product.mfg_date && (
              <span>Mfg: {product.mfg_date.slice(0, 10)}</span>
            )}
            {showFields.showExpDate && product.exp_date && (
              <span>Exp: {product.exp_date.slice(0, 10)}</span>
            )}
          </div>
        )}

        {showFields.showPrice && (
          <div className="flex items-baseline justify-between font-bold">
            <span style={{ fontSize: isSmall ? '5pt' : '6pt' }} className="text-black/60 uppercase">
              MRP (Incl. VAT)
            </span>
            <span
              style={{ fontSize: isSmall ? '7pt' : '9pt' }}
              className="font-mono font-black text-black"
            >
              {formatCurrency(product.sale_price, product.currency || '')}
              {showFields.showUnit && product.unit_code && (
                <span style={{ fontSize: isSmall ? '4.5pt' : '5.5pt' }} className="font-normal text-black/70 ml-0.5">
                  /{product.unit_code}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
