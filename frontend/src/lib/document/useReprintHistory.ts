// ═══════════════════════════════════════════════════════════════════════════
// REPRINT HISTORY HOOK & API CLIENT
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import type { DocumentPrintHistory } from '../../types/api/documents';

export interface ReprintHistoryFilter {
  [key: string]: string | number | boolean | readonly string[] | null | undefined;
  document_type?: string | undefined;
  action?: string | undefined;
  q?: string | undefined;
  page?: number | undefined;
  per_page?: number | undefined;
}

export function useReprintHistory(initialFilters?: ReprintHistoryFilter) {
  const [history, setHistory] = useState<DocumentPrintHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ReprintHistoryFilter>(initialFilters || { per_page: 25 });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: DocumentPrintHistory[]; meta?: { total: number } }>(
        '/documents/print-history',
        { params: filters }
      );
      if (res.data) {
        setHistory(res.data.data || []);
        if (res.data.meta?.total !== undefined) {
          setTotal(res.data.meta.total);
        }
      }
    } catch {
      // Fallback empty or mock
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        void fetchHistory();
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchHistory]);

  const recordPrintEvent = useCallback(
    async (payload: {
      document_type: string;
      document_id: number;
      document_number: string;
      template_id?: number | null;
      template_version?: number;
      print_profile_id?: number | null;
      action: 'print' | 'pdf' | 'reprint';
      copies?: number;
    }) => {
      try {
        await api.post('/documents/print-history', payload);
      } catch (err) {
        console.warn('Failed to record print history audit log:', err);
      }
    },
    []
  );

  return {
    history,
    loading,
    total,
    filters,
    setFilters,
    refetch: fetchHistory,
    recordPrintEvent,
  };
}
