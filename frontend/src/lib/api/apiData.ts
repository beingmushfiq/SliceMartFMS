/**
 * Utility helpers to reliably extract data collections and items from
 * Laravel REST API responses, regardless of whether they are wrapped in
 * standard envelopes ({ success: true, data: [...] }), paginator objects
 * ({ data: [...], meta: {...} }), or nested TanStack/Axios ApiResults.
 */

export function extractList<T>(res: unknown): T[] {
  if (!res) return [];

  if (Array.isArray(res)) {
    return res as T[];
  }

  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;

    // Case 1: Direct 'data' array (ApiResult.data is array or envelope.data is array)
    if (Array.isArray(obj['data'])) {
      return obj['data'] as T[];
    }

    // Case 2: Paginated object in 'data' ({ data: { data: [...], current_page: 1 } })
    if (obj['data'] && typeof obj['data'] === 'object') {
      const nested = obj['data'] as Record<string, unknown>;
      if (Array.isArray(nested['data'])) {
        return nested['data'] as T[];
      }
      if (Array.isArray(nested['items'])) {
        return nested['items'] as T[];
      }
    }

    // Case 3: 'items' array
    if (Array.isArray(obj['items'])) {
      return obj['items'] as T[];
    }
  }

  return [];
}

export function extractItem<T>(res: unknown): T | null {
  if (!res) return null;

  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;

    if ('data' in obj) {
      const d = obj['data'];
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        const nested = d as Record<string, unknown>;
        if ('data' in nested && nested['data'] && typeof nested['data'] === 'object' && !Array.isArray(nested['data'])) {
          return nested['data'] as T;
        }
        return d as T;
      }
      if (d && !Array.isArray(d)) {
        return d as T;
      }
    }

    if (!Array.isArray(res)) {
      return res as T;
    }
  }

  return null;
}
