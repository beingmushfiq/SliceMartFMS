// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT ENGINE PORTAL — Centralized Document Render & Print Modal
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  FileDown,
  X,
  Sparkles,
  Sliders,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useBusinessConfig } from '../../lib/document/useBusinessConfig';
import { useDocumentPrint } from './useDocumentPrint';
import { api } from '../../lib/api/client';
import type {
  DocumentType,
  DocumentTemplate,
  PrintProfile,
  PaperSize,
} from '../../types/api/documents';
import { SalesInvoiceDocument } from './documents/SalesInvoiceDocument';
import { DeliveryChallanDocument } from './documents/DeliveryChallanDocument';
import { PurchaseOrderDocument } from './documents/PurchaseOrderDocument';
import { GoodsReceiptDocument } from './documents/GoodsReceiptDocument';
import { CreditNoteDocument } from './documents/CreditNoteDocument';
import { PaymentReceiptDocument } from './documents/PaymentReceiptDocument';
import { StockTransferDocument } from './documents/StockTransferDocument';
import { ThermalReceipt } from './receipts/ThermalReceipt';
import { BarcodeLabel } from './labels/BarcodeLabel';
import { ReportPrintDocument } from './reports/ReportPrintDocument';

export interface DocumentEnginePortalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  data: any;
  documentNumber?: string | undefined;
  title?: string | undefined;
  templateId?: number | undefined;
  printProfileId?: number | undefined;
  defaultCopies?: number | undefined;
}

export function DocumentEnginePortal({
  isOpen,
  onClose,
  documentType,
  data,
  documentNumber,
  title,
  templateId,
  printProfileId,
  defaultCopies = 1,
}: DocumentEnginePortalProps) {
  const { config: businessConfig } = useBusinessConfig();
  const { printDocument, isPrinting } = useDocumentPrint();
  const printDocRef = useRef<HTMLDivElement>(null);

  // Resolution States
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [profiles, setProfiles] = useState<PrintProfile[]>([]);
  const [paperSizes, setPaperSizes] = useState<PaperSize[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | undefined>(printProfileId);
  const [selectedPaperSizeId, setSelectedPaperSizeId] = useState<number | undefined>(undefined);

  // Print parameter states
  const [copies, setCopies] = useState<number>(defaultCopies);
  const [scale, setScale] = useState<number>(1.0);
  const [zoom, setZoom] = useState<number>(0.9);
  const [copyType, setCopyType] = useState<'ORIGINAL' | 'DUPLICATE' | 'ACCOUNTS COPY' | 'CUSTOMER COPY'>('ORIGINAL');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Fetch / Resolve Template and Profiles
  useEffect(() => {
    if (!isOpen) return;

    // Load available printer profiles and paper sizes
    api.get<{ data: PrintProfile[] }>('/documents/print-profiles').then((res) => {
      if (res.data?.data) {
        setProfiles(res.data.data);
        if (!selectedProfileId && res.data.data.length > 0) {
          const defaultProf = res.data.data.find((p) => p.is_default) || res.data.data[0];
          if (defaultProf) {
            setSelectedProfileId(defaultProf.id);
            setCopies(defaultProf.copies || 1);
            setScale(defaultProf.scale || 1.0);
          }
        }
      }
    });

    api.get<{ data: PaperSize[] }>('/documents/paper-sizes').then((res) => {
      if (res.data?.data) {
        setPaperSizes(res.data.data);
      }
    });

    // Resolve Template via hierarchy API
    const fetchTemplate = async () => {
      try {
        if (templateId) {
          const res = await api.get<{ data: DocumentTemplate }>(`/documents/templates/${templateId}`);
          if (res.data?.data) setTemplate(res.data.data);
        } else {
          const res = await api.get<{ data: DocumentTemplate }>('/documents/templates/resolve', {
            params: { document_type: documentType },
          });
          if (res.data?.data) setTemplate(res.data.data);
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchTemplate();
  }, [isOpen, documentType, templateId, selectedProfileId]);

  const handleProfileChange = (profileId: number | undefined) => {
    setSelectedProfileId(profileId);
    if (profileId && profiles.length > 0) {
      const prof = profiles.find((p) => p.id === profileId);
      if (prof) {
        if (prof.paper_size_id) setSelectedPaperSizeId(prof.paper_size_id);
        if (prof.scale) setScale(prof.scale);
        if (prof.copies) setCopies(prof.copies);
      }
    }
  };

  // Derive active paper size code & CSS class
  const activePaperSize = useMemo(() => {
    if (selectedPaperSizeId) {
      return paperSizes.find((p) => p.id === selectedPaperSizeId);
    }
    if (template?.paper_size) {
      return template.paper_size;
    }
    return undefined;
  }, [selectedPaperSizeId, paperSizes, template]);

  const activePaperClass = useMemo(() => {
    const code = activePaperSize?.code || 'a4_portrait';
    switch (code) {
      case 'a4_portrait': return 'print-page-a4';
      case 'a4_landscape': return 'print-page-a4-landscape';
      case 'a5_portrait': return 'print-page-a5';
      case 'a5_landscape': return 'print-page-a5-landscape';
      case 'pos_80mm': return 'print-page-80mm';
      case 'pos_58mm': return 'print-page-58mm';
      case 'label_50x35': return 'print-page-label';
      default: return 'print-page-a4';
    }
  }, [activePaperSize]);

  if (!isOpen) return null;

  const displayTitle = title || (
    documentType === 'sales_invoice' ? 'Sales Tax Invoice' :
    documentType === 'delivery_challan' ? 'Delivery Challan' :
    documentType === 'purchase_order' ? 'Purchase Order' :
    documentType === 'goods_receipt' ? 'Goods Receipt Note' :
    documentType === 'credit_note' ? 'Credit Note' :
    documentType === 'debit_note' ? 'Debit Note' :
    documentType === 'stock_transfer' ? 'Stock Transfer Manifest' :
    documentType === 'payment_receipt' ? 'Money Collection Receipt' :
    documentType === 'pos_receipt_80mm' ? 'POS 80mm Receipt' :
    documentType === 'pos_receipt_58mm' ? 'POS 58mm Receipt' :
    documentType === 'barcode_label' ? 'Barcode Label' :
    'Business Document'
  );

  const activeDocNumber = documentNumber || data?.invoice_number || data?.po_number || data?.challan_number || data?.transfer_number || data?.receipt_number || 'DOC-001';

  // Render the appropriate inner document based on type
  const renderDocumentContent = () => {
    switch (documentType) {
      case 'sales_invoice':
        return <SalesInvoiceDocument invoice={data} businessConfig={businessConfig} copyType={copyType} />;
      case 'delivery_challan':
        return <DeliveryChallanDocument delivery={data} businessConfig={businessConfig} />;
      case 'purchase_order':
        return <PurchaseOrderDocument po={data} businessConfig={businessConfig} />;
      case 'goods_receipt':
        return <GoodsReceiptDocument grn={data} businessConfig={businessConfig} />;
      case 'credit_note':
        return <CreditNoteDocument salesReturn={data} businessConfig={businessConfig} />;
      case 'payment_receipt':
        return <PaymentReceiptDocument payment={data} businessConfig={businessConfig} />;
      case 'stock_transfer':
        return <StockTransferDocument transfer={data} businessConfig={businessConfig} />;
      case 'pos_receipt_80mm':
      case 'pos_receipt_58mm':
        return <ThermalReceipt invoice={data} businessConfig={businessConfig} paperWidth={documentType === 'pos_receipt_58mm' ? '58mm' : '80mm'} />;
      case 'barcode_label':
        return <BarcodeLabel product={data} preset="standard_50x35" />;
      case 'report':
        return (
          <ReportPrintDocument
            reportTitle={data?.title || 'System Report'}
            reportCode={data?.code}
            moduleName={data?.moduleName}
            filtersText={data?.filtersSummary}
            columns={data?.columns || []}
            data={data?.rows || data?.data || []}
            businessConfig={businessConfig}
          />
        );
      default:
        return <div className="p-8 text-center text-muted">Unsupported document format: {documentType}</div>;
    }
  };

  const handlePrint = (actionType: 'print' | 'pdf' | 'reprint' = 'print') => {
    printDocument(renderDocumentContent(), {
      pageClass: activePaperClass,
      documentTitle: activeDocNumber,
    });

    // Record audit event asynchronously
    api.post('/documents/print-history', {
      document_type: documentType,
      document_id: data?.id || 1,
      document_number: activeDocNumber,
      template_id: template?.id,
      template_version: template?.current_version || 1,
      print_profile_id: selectedProfileId,
      action: actionType,
      copies: copies,
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/90 text-slate-100 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
            <Printer className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 text-white">
              <span>{displayTitle}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                {activeDocNumber}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Template: <strong className="text-slate-200">{template?.name || 'System Standard'}</strong></span>
              <span>•</span>
              <span>Paper: <strong className="text-slate-200">{activePaperSize?.name || 'A4 Standard'}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Copy Type Tag (for Tax Invoices) */}
          {documentType === 'sales_invoice' && (
            <select
              value={copyType}
              onChange={(e) => setCopyType(e.target.value as 'ORIGINAL' | 'DUPLICATE' | 'ACCOUNTS COPY' | 'CUSTOMER COPY')}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-medium cursor-pointer"
            >
              <option value="ORIGINAL">ORIGINAL FOR RECIPIENT</option>
              <option value="DUPLICATE">DUPLICATE FOR TRANSPORTER</option>
              <option value="ACCOUNTS COPY">TRIPLICATE FOR SUPPLIER (ACCOUNTS)</option>
              <option value="CUSTOMER COPY">CUSTOMER RECORD COPY</option>
            </select>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="text-[11px] font-mono font-semibold text-slate-300 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>

          {/* Quick Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showSettingsDrawer
                ? 'bg-primary text-primary-fg border-primary'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Printer & Layout Settings"
          >
            <Sliders className="size-4" />
          </button>

          {/* PDF Export Button */}
          <button
            onClick={() => handlePrint('pdf')}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer shadow-xs"
          >
            <FileDown className="size-3.5" />
            <span>Save PDF</span>
          </button>

          {/* Physical Print Button */}
          <button
            onClick={() => handlePrint('print')}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-fg hover:opacity-90 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="size-4" />
            <span>{isPrinting ? 'Printing...' : 'Print Document'}</span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-700/60 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors ml-1 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Area (Split or Centered) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Sheet Viewer Container */}
        <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-950/60">
          <div
            ref={printDocRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="shadow-2xl rounded-sm transition-all duration-150"
          >
            {renderDocumentContent()}
          </div>
        </div>

        {/* Right Settings Drawer */}
        {showSettingsDrawer && (
          <div className="w-80 border-l border-slate-800 bg-slate-900/95 p-5 space-y-5 overflow-y-auto text-xs text-slate-300 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <span>Print & Profile Setup</span>
              </h3>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Profile Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Output Device Profile
              </label>
              <select
                value={selectedProfileId || ''}
                onChange={(e) => handleProfileChange(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-primary text-xs cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Size Override */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Paper Size Media
              </label>
              <select
                value={selectedPaperSizeId || activePaperSize?.id || ''}
                onChange={(e) => setSelectedPaperSizeId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-primary text-xs cursor-pointer"
              >
                {paperSizes.map((ps) => (
                  <option key={ps.id} value={ps.id}>
                    {ps.name} ({ps.width_mm} × {ps.height_mm ? `${ps.height_mm}mm` : 'Roll'})
                  </option>
                ))}
              </select>
            </div>

            {/* Copies and Scale */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Copies
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-primary text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Scale Factor
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="2.0"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-primary text-xs font-mono"
                />
              </div>
            </div>

            {/* Information Callout */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Zero-Screenshot Print Engine</span>
              </div>
              <p>
                Documents are directly rendered via isolated DOM mount portal with high-contrast vector CSS without browser canvas downscaling.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
