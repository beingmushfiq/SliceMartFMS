import { BarcodeLabel } from './BarcodeLabel';
import type {
  BarcodeFieldOptions,
  BarcodeFormat,
  LabelProductItem,
  LabelSheetGridConfig,
  PhysicalLabelPreset,
} from '../../../lib/barcode/types';
import { PRESET_LABEL_DIMENSIONS } from '../../../lib/barcode/types';

export interface LabelSheetProps {
  items: Array<{ product: LabelProductItem; count: number }>;
  preset?: PhysicalLabelPreset;
  format?: BarcodeFormat;
  fields?: Partial<BarcodeFieldOptions>;
  gridConfig?: Partial<LabelSheetGridConfig>;
  businessName?: string;
}

export function LabelSheet({
  items,
  preset = 'standard_50x35',
  format = 'code128',
  fields = {},
  gridConfig = {},
  businessName = 'SliceMart',
}: LabelSheetProps) {
  const isSmall = preset === 'small_35x25';
  const isLarge = preset === 'thermal_100x150';
  const isRoll = preset === 'thermal_50x30' || gridConfig.paperSize === 'roll';
  const labelDim =
    preset !== 'custom' && preset in PRESET_LABEL_DIMENSIONS
      ? PRESET_LABEL_DIMENSIONS[preset as keyof typeof PRESET_LABEL_DIMENSIONS]
      : PRESET_LABEL_DIMENSIONS.standard_50x35;

  // Defaults for A4 Sheet or continuous Thermal Roll
  const columns = gridConfig.columns ?? (isRoll ? 1 : isSmall ? 5 : isLarge ? 2 : 4);
  const rows = gridConfig.rows ?? (isRoll ? 1 : isSmall ? 10 : isLarge ? 2 : 7);
  const labelsPerPage = columns * rows;
  const startOffset = isRoll ? 0 : (gridConfig.startPosition ?? 0);

  // Expand all items based on their requested quantity
  const expandedProducts: LabelProductItem[] = [];
  items.forEach(({ product, count }) => {
    for (let i = 0; i < count; i++) {
      expandedProducts.push(product);
    }
  });

  // Create array with empty placeholders for offset
  const allCells: Array<LabelProductItem | null> = [
    ...Array(startOffset).fill(null),
    ...expandedProducts,
  ];

  // Chunk cells into individual A4 pages
  const pages: Array<Array<LabelProductItem | null>> = [];
  for (let i = 0; i < allCells.length; i += labelsPerPage) {
    pages.push(allCells.slice(i, i + labelsPerPage));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <div className="label-sheet-container">
      {pages.map((pageCells, pageIdx) => (
        <div
          key={pageIdx}
          style={{
            width: isRoll ? `${labelDim.widthMm + 2}mm` : '210mm',
            minHeight: isRoll ? `${labelDim.heightMm + 2}mm` : '297mm',
            padding: isRoll ? '1mm' : `${gridConfig.pageMarginTopMm ?? 10}mm ${gridConfig.pageMarginLeftMm ?? 8}mm`,
            boxSizing: 'border-box',
          }}
          className={`bg-white text-black print-page-label-sheet ${
            pageIdx < pages.length - 1 ? 'page-break-after' : ''
          }`}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, ${labelDim.widthMm}mm)`,
              gridAutoRows: `${labelDim.heightMm}mm`,
              gap: `${gridConfig.gapVerticalMm ?? 2}mm ${gridConfig.gapHorizontalMm ?? 2}mm`,
              justifyContent: 'center',
            }}
          >
            {pageCells.map((prod, cellIdx) => {
              if (!prod) {
                // Empty blank space on sheet
                return (
                  <div
                    key={`blank-${cellIdx}`}
                    style={{
                      width: `${labelDim.widthMm}mm`,
                      height: `${labelDim.heightMm}mm`,
                    }}
                    className="border border-dashed border-slate-200/50 bg-slate-50/20"
                  />
                );
              }

              return (
                <div
                  key={`label-${cellIdx}`}
                  style={{
                    width: `${labelDim.widthMm}mm`,
                    height: `${labelDim.heightMm}mm`,
                  }}
                  className="border border-dashed border-slate-300 print:border-none"
                >
                  <BarcodeLabel
                    product={prod}
                    preset={preset}
                    format={format}
                    fields={fields}
                    businessName={businessName}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
