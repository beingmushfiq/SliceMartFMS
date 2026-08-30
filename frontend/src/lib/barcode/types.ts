/**
 * Barcode & Label Engine Types
 */

export type BarcodeFormat =
  | 'code128'
  | 'ean13'
  | 'ean8'
  | 'qrcode'
  | 'upca'
  | 'code39';

export type PhysicalLabelPreset = 'small_35x25' | 'standard_50x35' | 'custom';

export interface LabelDimensions {
  widthMm: number;
  heightMm: number;
  marginTopMm?: number;
  marginRightMm?: number;
  marginBottomMm?: number;
  marginLeftMm?: number;
}

export const PRESET_LABEL_DIMENSIONS: Record<Exclude<PhysicalLabelPreset, 'custom'>, LabelDimensions> = {
  small_35x25: {
    widthMm: 35,
    heightMm: 25,
    marginTopMm: 1,
    marginRightMm: 1,
    marginBottomMm: 1,
    marginLeftMm: 1,
  },
  standard_50x35: {
    widthMm: 50,
    heightMm: 35,
    marginTopMm: 1.5,
    marginRightMm: 1.5,
    marginBottomMm: 1.5,
    marginLeftMm: 1.5,
  },
};

export interface BarcodeFieldOptions {
  showBusinessName: boolean;
  showProductName: boolean;
  showSku: boolean;
  showPrice: boolean;
  showUnit: boolean;
  showBatchCode: boolean;
  showMfgDate: boolean;
  showExpDate: boolean;
  showQrCode: boolean;
  showBarcodeText: boolean;
}

export const DEFAULT_LABEL_FIELDS: BarcodeFieldOptions = {
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
};

export interface LabelProductItem {
  id: string | number;
  name: string;
  sku: string;
  barcode?: string | null;
  sale_price: string | number;
  currency?: string;
  unit_code?: string;
  batch_code?: string;
  mfg_date?: string;
  exp_date?: string;
  category_name?: string;
  quantity?: number;
}

export interface LabelSheetGridConfig {
  paperSize: 'a4' | 'letter' | 'roll';
  columns: number;
  rows: number;
  pageMarginTopMm: number;
  pageMarginLeftMm: number;
  gapHorizontalMm: number;
  gapVerticalMm: number;
  startPosition?: number; // 0-indexed offset on sheet for reused sheets
}

export const DEFAULT_A4_SHEET_GRID: LabelSheetGridConfig = {
  paperSize: 'a4',
  columns: 4,
  rows: 7,
  pageMarginTopMm: 12,
  pageMarginLeftMm: 8,
  gapHorizontalMm: 2.5,
  gapVerticalMm: 2.5,
  startPosition: 0,
};
