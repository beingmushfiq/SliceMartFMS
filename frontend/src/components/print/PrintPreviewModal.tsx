import { useState, useEffect } from 'react';
import {
  Printer,
  FileDown,
  X,
  ZoomIn,
  ZoomOut,
  FileText,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { useDocumentPrint } from './useDocumentPrint';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentNumber?: string;
  documentType?: string;
  pageClass?:
    | 'print-page-a4'
    | 'print-page-a4-landscape'
    | 'print-page-a3-landscape'
    | 'print-page-thermal-80'
    | 'print-page-thermal-58'
    | 'print-page-label-sheet'
    | 'print-page-label-35x25'
    | 'print-page-label-50x35';
  children: React.ReactNode;
}

export function PrintPreviewModal({
  isOpen,
  onClose,
  title,
  documentNumber,
  documentType = 'Commercial Document',
  pageClass = 'print-page-a4',
  children,
}: PrintPreviewModalProps) {
  const { printDocument, isPrinting } = useDocumentPrint();
  const [zoom, setZoom] = useState<number>(100);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    printDocument(<div>{children}</div>, {
      documentTitle: documentNumber ? `${documentNumber}.pdf` : `${title}.pdf`,
      pageClass,
    });
  };

  const getSheetContainerClass = () => {
    switch (pageClass) {
      case 'print-page-a4-landscape':
      case 'print-page-a3-landscape':
        return 'document-preview-sheet-a4-landscape';
      case 'print-page-thermal-80':
        return 'document-preview-thermal-80';
      case 'print-page-thermal-58':
        return 'document-preview-thermal-58';
      case 'print-page-label-35x25':
        return 'document-preview-label-35x25';
      case 'print-page-label-50x35':
        return 'document-preview-label-50x35';
      case 'print-page-label-sheet':
      case 'print-page-a4':
      default:
        return 'document-preview-sheet-a4';
    }
  };

  const getFormatBadge = () => {
    switch (pageClass) {
      case 'print-page-a4':
        return 'A4 Portrait (210 × 297 mm)';
      case 'print-page-a4-landscape':
        return 'A4 Landscape (297 × 210 mm)';
      case 'print-page-a3-landscape':
        return 'A3 Landscape (420 × 297 mm)';
      case 'print-page-thermal-80':
        return '80mm POS Thermal Roll';
      case 'print-page-thermal-58':
        return '58mm POS Thermal Roll';
      case 'print-page-label-sheet':
        return 'A4 Label Sheet (Die-cut)';
      case 'print-page-label-35x25':
        return '35 × 25 mm Label Roll';
      case 'print-page-label-50x35':
        return '50 × 35 mm Label Roll';
      default:
        return 'Standard Sheet';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm text-slate-800 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-700 bg-slate-900 px-4 text-white shrink-0">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer shadow-xs"
            title="Return to Setup / Editor"
          >
            <ArrowLeft className="size-4 text-emerald-400" />
            <span>Back to Setup</span>
          </button>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          <div className="hidden sm:flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
              {documentNumber && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {documentNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {documentType} &bull; <span className="text-emerald-400 font-medium">{getFormatBadge()}</span>
            </p>
          </div>
        </div>

        {/* Center Zoom Controls */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(50, prev - 15))}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="font-mono w-12 text-center text-slate-200">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(200, prev + 15))}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <FileDown className="size-3.5 text-blue-400" />
            <span>Save PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>{isPrinting ? 'Preparing...' : 'Print Document'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            title="Close Preview (Esc)"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* Main Preview Area */}
      <main className="flex-1 overflow-auto bg-slate-950/60 p-4 sm:p-8 flex justify-center items-start">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="print-doc"
        >
          <div className={getSheetContainerClass()}>{children}</div>
        </div>
      </main>
    </div>
  );
}
