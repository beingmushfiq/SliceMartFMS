// ═══════════════════════════════════════════════════════════════════════════
// USE DOCUMENT ENGINE HOOK — Platform-Wide Document Invocation Hub
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { DocumentType, DocumentRenderRequest } from '../../types/api/documents';

export interface DocumentEngineState {
  isOpen: boolean;
  documentType: DocumentType;
  data: Record<string, unknown> | null;
  documentNumber?: string | undefined;
  title?: string | undefined;
  templateId?: number | undefined;
  printProfileId?: number | undefined;
}

export function useDocumentEngine() {
  const [state, setState] = useState<DocumentEngineState>({
    isOpen: false,
    documentType: 'sales_invoice',
    data: null,
  });

  const openDocument = useCallback((req: DocumentRenderRequest) => {
    setState({
      isOpen: true,
      documentType: req.type,
      data: req.data,
      documentNumber: req.documentNumber,
      title: req.title,
      templateId: req.templateId,
      printProfileId: req.printProfileId,
    });
  }, []);

  const closeDocument = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    isOpen: state.isOpen,
    documentProps: {
      isOpen: state.isOpen,
      onClose: closeDocument,
      documentType: state.documentType,
      data: state.data,
      documentNumber: state.documentNumber,
      title: state.title,
      templateId: state.templateId,
      printProfileId: state.printProfileId,
    },
    openDocument,
    closeDocument,
  };
}
