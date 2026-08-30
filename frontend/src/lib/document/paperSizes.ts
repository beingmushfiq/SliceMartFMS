// ═══════════════════════════════════════════════════════════════════════════
// CENTRALIZED PAPER SIZE REGISTRY & PAGE CLASS RESOLVER
// ═══════════════════════════════════════════════════════════════════════════

import type { PaperSize, PageOrientation } from '../../types/api/documents';

export const BUILT_IN_PAPER_SIZES: PaperSize[] = [
  {
    id: 1,
    uuid: 'size-a4-portrait',
    code: 'a4_portrait',
    name: 'ISO A4 Portrait (210 × 297 mm)',
    width_mm: 210,
    height_mm: 297,
    unit: 'mm',
    orientation_default: 'portrait',
    margin_top_mm: 12,
    margin_bottom_mm: 12,
    margin_left_mm: 15,
    margin_right_mm: 15,
    is_builtin: true,
    is_active: true,
  },
  {
    id: 2,
    uuid: 'size-a4-landscape',
    code: 'a4_landscape',
    name: 'ISO A4 Landscape (297 × 210 mm)',
    width_mm: 297,
    height_mm: 210,
    unit: 'mm',
    orientation_default: 'landscape',
    margin_top_mm: 10,
    margin_bottom_mm: 10,
    margin_left_mm: 12,
    margin_right_mm: 12,
    is_builtin: true,
    is_active: true,
  },
  {
    id: 3,
    uuid: 'size-a5-portrait',
    code: 'a5_portrait',
    name: 'ISO A5 Portrait (148 × 210 mm)',
    width_mm: 148,
    height_mm: 210,
    unit: 'mm',
    orientation_default: 'portrait',
    margin_top_mm: 8,
    margin_bottom_mm: 8,
    margin_left_mm: 10,
    margin_right_mm: 10,
    is_builtin: true,
    is_active: true,
  },
  {
    id: 4,
    uuid: 'size-a3-landscape',
    code: 'a3_landscape',
    name: 'ISO A3 Wide Ledger (420 × 297 mm)',
    width_mm: 420,
    height_mm: 297,
    unit: 'mm',
    orientation_default: 'landscape',
    margin_top_mm: 12,
    margin_bottom_mm: 12,
    margin_left_mm: 15,
    margin_right_mm: 15,
    is_builtin: true,
    is_active: true,
  },
  {
    id: 5,
    uuid: 'size-letter-portrait',
    code: 'letter_portrait',
    name: 'US Letter (8.5 × 11 in)',
    width_mm: 215.9,
    height_mm: 279.4,
    unit: 'inch',
    orientation_default: 'portrait',
    margin_top_mm: 12.7,
    margin_bottom_mm: 12.7,
    margin_left_mm: 12.7,
    margin_right_mm: 12.7,
    is_builtin: true,
    is_active: true,
  },
  {
    id: 6,
    uuid: 'size-thermal-80',
    code: 'thermal_80',
    name: '80mm POS Thermal Roll',
    width_mm: 80,
    height_mm: null,
    unit: 'mm',
    orientation_default: 'portrait',
    margin_top_mm: 2,
    margin_bottom_mm: 2,
    margin_left_mm: 3,
    margin_right_mm: 3,
    is_builtin: true,
    is_active: true,
  },
  {
    id: 7,
    uuid: 'size-thermal-58',
    code: 'thermal_58',
    name: '58mm Compact POS Roll',
    width_mm: 58,
    height_mm: null,
    unit: 'mm',
    orientation_default: 'portrait',
    margin_top_mm: 2,
    margin_bottom_mm: 2,
    margin_left_mm: 2,
    margin_right_mm: 2,
    is_builtin: true,
    is_active: true,
  },
  {
    id: 8,
    uuid: 'size-label-35x25',
    code: 'label_35x25',
    name: '35 × 25 mm Barcode Label',
    width_mm: 35,
    height_mm: 25,
    unit: 'mm',
    orientation_default: 'portrait',
    margin_top_mm: 1,
    margin_bottom_mm: 1,
    margin_left_mm: 1,
    margin_right_mm: 1,
    is_builtin: true,
    is_active: true,
  },
  {
    id: 9,
    uuid: 'size-label-50x35',
    code: 'label_50x35',
    name: '50 × 35 mm Product Price Label',
    width_mm: 50,
    height_mm: 35,
    unit: 'mm',
    orientation_default: 'portrait',
    margin_top_mm: 1.5,
    margin_bottom_mm: 1.5,
    margin_left_mm: 1.5,
    margin_right_mm: 1.5,
    is_builtin: true,
    is_active: true,
  },
];

/**
 * Returns CSS print class for a paper size code and orientation.
 */
export function getPrintPageClass(code?: string, orientation: PageOrientation = 'portrait'): string {
  switch (code) {
    case 'a4_landscape':
      return 'print-page-a4-landscape';
    case 'a3_landscape':
      return 'print-page-a3-landscape';
    case 'thermal_80':
      return 'print-page-thermal-80';
    case 'thermal_58':
      return 'print-page-thermal-58';
    case 'label_35x25':
      return 'print-page-label-35x25';
    case 'label_50x35':
      return 'print-page-label-50x35';
    case 'label_sheet_a4':
      return 'print-page-label-sheet';
    case 'letter_portrait':
      return 'print-page-letter';
    case 'a4_portrait':
    default:
      return orientation === 'landscape' ? 'print-page-a4-landscape' : 'print-page-a4';
  }
}

/**
 * Returns preview container CSS class.
 */
export function getSheetContainerClass(code?: string, orientation: PageOrientation = 'portrait'): string {
  switch (code) {
    case 'a4_landscape':
      return 'document-preview-sheet-a4-landscape';
    case 'a3_landscape':
      return 'document-preview-sheet-a3-landscape';
    case 'thermal_80':
      return 'document-preview-thermal-80';
    case 'thermal_58':
      return 'document-preview-thermal-58';
    case 'label_35x25':
      return 'document-preview-label-35x25';
    case 'label_50x35':
      return 'document-preview-label-50x35';
    case 'label_sheet_a4':
      return 'document-preview-label-sheet';
    case 'a4_portrait':
    default:
      return orientation === 'landscape' ? 'document-preview-sheet-a4-landscape' : 'document-preview-sheet-a4';
  }
}
