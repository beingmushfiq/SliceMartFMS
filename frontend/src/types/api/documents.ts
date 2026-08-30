// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT TEMPLATES & PRINTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DocumentType =
  | 'sales_invoice'
  | 'delivery_challan'
  | 'purchase_order'
  | 'goods_receipt'
  | 'credit_note'
  | 'debit_note'
  | 'stock_transfer'
  | 'payment_receipt'
  | 'pos_receipt_80mm'
  | 'pos_receipt_58mm'
  | 'barcode_label'
  | 'report';

export type PaperUnit = 'mm' | 'inch';
export type PageOrientation = 'portrait' | 'landscape';
export type TemplateStatus = 'active' | 'draft' | 'archived';

export interface PaperSize {
  id: number;
  uuid: string;
  code: string;
  name: string;
  width_mm: number;
  height_mm: number | null;
  unit: PaperUnit;
  orientation_default: PageOrientation;
  margin_top_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  margin_right_mm: number;
  is_builtin: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PrintProfile {
  id: number;
  uuid: string;
  name: string;
  paper_size_id: number | null;
  paper_size?: PaperSize;
  orientation: PageOrientation;
  margin_top_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  margin_right_mm: number;
  scale: number;
  copies: number;
  is_printer_friendly: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentTemplateLayoutConfig {
  showLogo?: boolean;
  showCompanyTax?: boolean;
  showCustomerTax?: boolean;
  showVendorTax?: boolean;
  showBatchNumber?: boolean;
  showSku?: boolean;
  showDiscount?: boolean;
  showVat?: boolean;
  showAmountInWords?: boolean;
  showTerms?: boolean;
  showSignatures?: boolean;
  showQrCode?: boolean;
  showBarcode?: boolean;
  showVehicleInfo?: boolean;
  showDriverInfo?: boolean;
  showExpectedDate?: boolean;
  showPaymentMethod?: boolean;
  showTransactionRef?: boolean;
  showCashierName?: boolean;
  showTaxSummary?: boolean;
  showChangeDue?: boolean;
  showPrice?: boolean;
  showName?: boolean;
  showMfgDate?: boolean;
  showExpDate?: boolean;
  barcodeFormat?: 'code128' | 'ean13' | 'ean8' | 'qrcode' | 'upca' | 'code39';
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: 'sm' | 'base' | 'lg';
  headerTitle?: string;
  footerGreeting?: string;
  customTerms?: string;
  signaturePreparedBy?: string;
  signatureCheckedBy?: string;
  signatureApprovedBy?: string;
  signatureAuthorizedBy?: string;
  signatureReceiver?: string;
  columnVisibility?: Record<string, boolean>;
}

export interface DocumentTemplateVersion {
  id: number;
  uuid: string;
  template_id: number;
  version: number;
  status: TemplateStatus;
  change_summary?: string | null;
  layout_config: DocumentTemplateLayoutConfig;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: number;
  uuid: string;
  company_id?: number | null;
  branch_id?: number | null;
  name: string;
  document_type: DocumentType;
  paper_size_id?: number | null;
  paper_size?: PaperSize;
  print_profile_id?: number | null;
  print_profile?: PrintProfile;
  status: TemplateStatus;
  is_default: boolean;
  current_version: number;
  active_version_id?: number | null;
  active_version?: DocumentTemplateVersion;
  versions?: DocumentTemplateVersion[];
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentNumberingSequence {
  id: number;
  tenant_id: number;
  uuid: string;
  company_id?: number | null;
  branch_id?: number | null;
  document_type: string;
  prefix: string | null;
  suffix: string | null;
  padding: number;
  next_number: number;
  reset_period: 'never' | 'yearly' | 'monthly';
  last_reset_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentPrintHistory {
  id: number;
  uuid: string;
  document_type: DocumentType;
  document_id: number;
  document_number: string;
  template_id?: number | null;
  template_name?: string;
  template_version: number;
  print_profile_id?: number | null;
  print_profile?: string;
  action: 'print' | 'pdf' | 'reprint';
  copies: number;
  user_id?: number | null;
  user_name?: string;
  ip_address?: string | null;
  created_at: string;
}

export interface DocumentRenderRequest {
  type: DocumentType;
  data: any;
  templateId?: number;
  printProfileId?: number;
  documentNumber?: string;
  title?: string;
}
