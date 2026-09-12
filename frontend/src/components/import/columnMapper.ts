import type { ImportColumnDef } from './types';

function normalizeHeader(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Automatically computes best column mapping from uploaded file headers to target schema columns.
 */
export function autoMapColumns(
  uploadedHeaders: string[],
  targetColumns: ImportColumnDef[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedUploadedHeaders = new Set<string>();

  for (const col of targetColumns) {
    const normKey = normalizeHeader(col.key);
    const normLabel = normalizeHeader(col.label);
    const normAliases = (col.aliases || []).map(normalizeHeader);

    // 1. Exact match with label or key
    let matchedHeader = uploadedHeaders.find(
      (h) => !usedUploadedHeaders.has(h) && (h === col.label || h === col.key)
    );

    // 2. Normalized match with key or label
    if (!matchedHeader) {
      matchedHeader = uploadedHeaders.find((h) => {
        if (usedUploadedHeaders.has(h)) return false;
        const nh = normalizeHeader(h);
        return nh === normKey || nh === normLabel;
      });
    }

    // 3. Alias match
    if (!matchedHeader && normAliases.length > 0) {
      matchedHeader = uploadedHeaders.find((h) => {
        if (usedUploadedHeaders.has(h)) return false;
        const nh = normalizeHeader(h);
        return normAliases.includes(nh);
      });
    }

    // 4. Substring / partial fuzzy match (e.g. "Employee Code" vs "Code")
    if (!matchedHeader) {
      matchedHeader = uploadedHeaders.find((h) => {
        if (usedUploadedHeaders.has(h)) return false;
        const nh = normalizeHeader(h);
        return (
          (nh.length > 3 && normLabel.includes(nh)) ||
          (normLabel.length > 3 && nh.includes(normLabel))
        );
      });
    }

    if (matchedHeader) {
      mapping[col.key] = matchedHeader;
      usedUploadedHeaders.add(matchedHeader);
    } else {
      mapping[col.key] = ''; // Unmapped
    }
  }

  return mapping;
}
