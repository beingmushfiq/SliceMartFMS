// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT ENGINE PORTAL — Centralized Document Rendering & Print Dispatcher
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Printer,
  FileDown,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  FileText,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { useBusinessConfig } from '../../lib/document/useBusinessConfig';
import { useDocumentPrint } from './useDocumentPrint';
import { useReprintHistory } from '../../lib/document/useReprintHistory';
import { getPrintPageClass, getSheetContainerClass, BUILT_IN_PAPER_SIZES } from '../../lib/document/paperSizes';
import type { DocumentType, DocumentTemplate, PrintProfile } from '../../types/api/documents';

// Standard Document Templates
import { SalesInvoiceDocument } from './documents/SalesInvoiceDocument';
import { PurchaseOrderDocument } from './documents/PurchaseOrderDocument';
import { DeliveryChallanDocument } from './documents/DeliveryChallanDocument';
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
  documentNumber?: string;
  title?: string;
  templateId?: number;
  printProfileId?: number;
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
}: DocumentEnginePortalProps) {
  const { config: businessConfig } = useBusinessConfig();
  const { printDocument, isPrinting } = useDocumentPrint();
  const { recordPrintEvent } = useReprintHistory();

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [profiles, setProfiles] = useState<PrintProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | undefined>(printProfileId);
  const [copyType, setCopyType] = useState<'ORIGINAL' | 'DUPLICATE' | 'CUSTOMER COPY' | 'ACCOUNTS COPY'>('ORIGINAL');
  const [zoom, setZoom] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  // Fetch resolved template and print profiles
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const resolveTemplate = async () => {
      try {
        const res = await api.get<{ data: DocumentTemplate }>('/documents/templates/resolve', {
          params: {
            document_type: documentType,
            template_id: templateId,
          },
        });
        if (isMounted && res.data?.data) {
          setTemplate(res.data.data);
          if (res.data.data.print_profile_id && !printProfileId) {
            setSelectedProfileId(res.data.data.print_profile_id);
          }
        }
      } catch {
        // Use default fallback state
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchProfiles = async () => {
      try {
        const res = await api.get<{ data: PrintProfile[] }>('/documents/print-profiles');
        if (isMounted && res.data?.data) {
          setProfiles(res.data.data);
        }
      } catch {
        // Fallback
      }
    };

    resolveTemplate();
    fetchProfiles();

    return () => {
      isMounted = false;
    };
  }, [isOpen, documentType, templateId, printProfileId]);

  const activeProfile = useMemo(() => {
    if (selectedProfileId) {
      const found = profiles.find((p) => p.id === selectedProfileId);
      if (found) return found;
    }
    return template?.printProfile;
  }, [selectedProfileId, profiles, template]);

  const pageCode = activeProfile?.paperSize?.code || template?.paperSize?.code || (
    documentType === 'pos_receipt_80mm' ? 'thermal_80' :
    documentType === 'pos_receipt_58mm' ? 'thermal_58' :
    documentType === 'barcode_label' ? 'label_50x35' :
    'a4_portrait'
  );

  const orientation = activeProfile?.orientation || (
    pageCode === 'a4_landscape' || pageCode === 'a3_landscape' ? 'landscape' : 'portrait'
  );

  const pageClass = getPrintPageClass(pageCode, orientation);
  const containerClass = getSheetContainerClass(pageCode, orientation);

  const docTitle = title || (
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
        return <DeliveryChallanDocument order={data} businessConfig={businessConfig} copyType={copyType} />;
      case 'purchase_order':
        return <PurchaseOrderDocument po={data} businessConfig={businessConfig} />;
      case 'goods_receipt':
        return <GoodsReceiptDocument grn={data} businessConfig={businessConfig} />;
      case 'credit_note':
        return <CreditNoteDocument returnRecord={data} businessConfig={businessConfig} copyType={copyType} />;
      case 'payment_receipt':
        return <PaymentReceiptDocument payment={data} businessConfig={businessConfig} copyType={copyType} />;
      case 'stock_transfer':
        return <StockTransferDocument transfer={data} businessConfig={businessConfig} />;
      case 'pos_receipt_80mm':
      case 'pos_receipt_58mm':
        return <ThermalReceipt invoice={data} businessConfig={businessConfig} width={documentType === 'pos_receipt_58mm' ? '58mm' : '80mm'} />;
      case 'barcode_label':
        return <BarcodeLabel product={data} width={50} height={35} />;
      case 'report':
        return (
          <ReportPrintDocument
            title={data?.title || 'System Report'}
            subtitle={data?.subtitle}
            filtersSummary={data?.filtersSummary}
            columns={data?.columns || []}
            data={data?.rows || []}
            businessConfig={businessConfig}
            totalsRow={data?.totalsRow}
          />
        );
      default:
        return <div className="p-8 text-center text-muted">Unsupported document format: {documentType}</div>;
    }
  };

  const handlePrint = (actionType: 'print' | 'pdf' | 'reprint' = 'print') => {
    printDocument(<div>{renderDocumentContent()}</div>, {
      documentTitle: `${activeDocNumber}.pdf`,
      pageClass,
      onAfterPrint: () => {
        recordPrintEvent({
          document_type: documentType,
          document_id: data?.id || 0,
          document_number: activeDocNumber,
          template_id: template?.id,
          template_version: template?.current_version || 1,
          print_profile_id: activeProfile?.id,
          action: actionType,
          copies: activeProfile?.copies || 1,
        });
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-xs text-slate-800">
      {/* Top Action Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">{docTitle}</h2>
              {activeDocNumber && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {activeDocNumber}
                </span>
              )}
              {template && (
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  <Sparkles className="size-3 text-emerald-400" />
                  {template.name} (v{template.current_version})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Format: <span className="text-sky-400 font-medium">{activeProfile?.name || pageCode}</span> &bull; Copies: {activeProfile?.copies || 1}
            </p>
          </div>
        </div>

        {/* Center Controls: Copy Type & Zoom */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Copy Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700 text-xs">
            <Copy className="size-3.5 text-slate-400" />
            <select
              value={copyType}
              onChange={(e) => setCopyType(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="ORIGINAL" className="bg-slate-800 text-white">ORIGINAL COPY</option>
              <option value="DUPLICATE" className="bg-slate-800 text-white">DUPLICATE COPY</option>
              <option value="CUSTOMER COPY" className="bg-slate-800 text-white">CUSTOMER COPY</option>
              <option value="ACCOUNTS COPY" className="bg-slate-800 text-white">ACCOUNTS COPY</option>
            </select>
          </div>

          {/* Print Profile Selector */}
          {profiles.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <Sliders className="size-3.5 text-slate-400" />
              <select
                value={selectedProfileId || ''}
                onChange={(e) => setSelectedProfileId(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-transparent text-slate-200 text-xs focus:outline-hidden font-medium cursor-pointer max-w-[140px] truncate"
              >
                <option value="" className="bg-slate-800 text-white">Default Profile</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setZoom((prev) => Math.max(40, prev - 15))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="font-mono w-11 text-center text-slate-200">{zoom}%</span>
            <button
              onClick={() => setZoom((prev) => Math.min(200, prev + 15))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <div className="h-3.5 w-px bg-slate-700 mx-0.5" />
            <button
              onClick={() => setZoom(100)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePrint('pdf')}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <FileDown className="size-3.5 text-sky-400" />
            <span className="hidden sm:inline">Save PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrint('print')}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>{isPrinting ? 'Generating...' : 'Print Document'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            title="Close Preview"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* Viewport Render Area */}
      <main className="flex-1 overflow-auto bg-slate-950/70 p-4 sm:p-8 flex justify-center items-start">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="print-doc"
        >
          <div className={containerClass}>{renderDocumentContent()}</div>
        </div>
      </main>
    </div>
  );
}
