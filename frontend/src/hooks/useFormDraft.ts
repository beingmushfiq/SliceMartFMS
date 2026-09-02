import { useState, useCallback, useRef } from 'react';

interface UseFormDraftOptions<T> {
  formKey: string;
  initialValues: T;
  debounceMs?: number;
}

export function useFormDraft<T extends Record<string, unknown>>({
  formKey,
  initialValues,
  debounceMs = 500,
}: UseFormDraftOptions<T>) {
  const storageKey = `form_draft_${formKey}`;

  // Read initial draft synchronously via lazy initializer to avoid cascading renders
  const [draftData, setDraftData] = useState<T | null>(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  });

  const hasDraft = draftData !== null;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save draft with debouncing
  const saveDraft = useCallback(
    (values: T) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(values));
          setDraftData(values);
        } catch {
          // LocalStorage full or private browsing
        }
      }, debounceMs);
    },
    [storageKey, debounceMs]
  );

  // Clear draft on successful submission
  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    try {
      localStorage.removeItem(storageKey);
      setDraftData(null);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  // Restore draft into form
  const restoreDraft = useCallback((): T | null => {
    return draftData;
  }, [draftData]);

  return {
    hasDraft,
    draftData,
    saveDraft,
    clearDraft,
    restoreDraft,
    initialValues,
  };
}
