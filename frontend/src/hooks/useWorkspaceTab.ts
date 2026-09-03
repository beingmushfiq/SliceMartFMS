import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Enterprise hook for workspace secondary navigation tabs with URL deep-linking.
 *
 * @param defaultTab The default tab ID to activate when query param is absent or invalid.
 * @param validTabs Optional array of valid tab IDs. If provided, invalid tabs fall back to defaultTab.
 * @param paramKey The URL query parameter key (defaults to 'tab').
 */
export function useWorkspaceTab<T extends string>(
  defaultTab: T,
  validTabs?: readonly T[],
  paramKey: string = 'tab'
): [T, (newTab: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const raw = searchParams.get(paramKey);
    if (!raw) return defaultTab;
    if (validTabs && !validTabs.includes(raw as T)) {
      return defaultTab;
    }
    return raw as T;
  }, [searchParams, paramKey, defaultTab, validTabs]);

  const setActiveTab = useCallback(
    (newTab: T) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newTab === defaultTab) {
            next.delete(paramKey);
          } else {
            next.set(paramKey, newTab);
          }
          return next;
        },
        { replace: true }
      );
    },
    [defaultTab, paramKey, setSearchParams]
  );

  return [activeTab, setActiveTab];
}
