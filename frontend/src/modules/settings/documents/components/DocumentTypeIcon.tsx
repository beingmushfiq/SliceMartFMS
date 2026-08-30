// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT TYPE ICON HELPER
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  FileText,
  Truck,
  ShoppingCart,
  PackageCheck,
  RotateCcw,
  Receipt,
  ArrowLeftRight,
  Monitor,
  Barcode,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import type { DocumentType } from '../../../../types/api/documents';

interface DocumentTypeIconProps {
  type: DocumentType | string;
  className?: string;
}

export function DocumentTypeIcon({ type, className = 'size-4' }: DocumentTypeIconProps) {
  switch (type) {
    case 'sales_invoice':
      return <FileText className={className} />;
    case 'delivery_challan':
      return <Truck className={className} />;
    case 'purchase_order':
      return <ShoppingCart className={className} />;
    case 'goods_receipt':
      return <PackageCheck className={className} />;
    case 'credit_note':
    case 'debit_note':
      return <RotateCcw className={className} />;
    case 'stock_transfer':
      return <ArrowLeftRight className={className} />;
    case 'payment_receipt':
      return <Receipt className={className} />;
    case 'pos_receipt_80mm':
    case 'pos_receipt_58mm':
      return <Monitor className={className} />;
    case 'barcode_label':
      return <Barcode className={className} />;
    case 'report':
      return <FileSpreadsheet className={className} />;
    default:
      return <Layers className={className} />;
  }
}
