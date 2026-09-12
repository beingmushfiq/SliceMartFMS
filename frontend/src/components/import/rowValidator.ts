import type { ImportColumnDef, ParsedRowState } from './types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates and parses raw file rows according to column schema definitions and active mapping.
 */
export function validateImportRows(
  rawRows: Record<string, unknown>[],
  columnMapping: Record<string, string>,
  columns: ImportColumnDef[],
  uniqueIdentifierKey: string
): {
  parsedRows: ParsedRowState[];
  validCount: number;
  invalidCount: number;
} {
  const seenUniqueKeys = new Set<string>();
  let validCount = 0;
  let invalidCount = 0;

  const parsedRows: ParsedRowState[] = rawRows.map((rawRow, index) => {
    const rowNumber = index + 2; // +1 for 1-based index, +1 for header row
    const errors: Record<string, string> = {};
    const parsed: Record<string, unknown> = {};

    for (const col of columns) {
      const sourceHeader = columnMapping[col.key];
      const rawCell = sourceHeader ? rawRow[sourceHeader] : undefined;
      const rawVal = rawCell !== undefined && rawCell !== null ? String(rawCell).trim() : '';

      // Check required
      if (col.required && (!rawVal || rawVal.length === 0)) {
        errors[col.key] = `${col.label} is required.`;
        continue;
      }

      if (!rawVal || rawVal.length === 0) {
        parsed[col.key] = null;
        continue;
      }

      // Type validations
      switch (col.type) {
        case 'email':
          if (!EMAIL_REGEX.test(rawVal)) {
            errors[col.key] = `Invalid email address format.`;
          } else {
            parsed[col.key] = rawVal.toLowerCase();
          }
          break;

        case 'number': {
          const num = Number(rawVal.replace(/[^0-9.-]/g, ''));
          if (isNaN(num)) {
            errors[col.key] = `Must be a valid numeric value.`;
          } else {
            parsed[col.key] = num;
          }
          break;
        }

        case 'date': {
          // Normalize possible formats (e.g. DD/MM/YYYY or YYYY-MM-DD)
          let dateStr = rawVal;
          if (rawVal.includes('/')) {
            const parts = rawVal.split('/');
            if (parts.length === 3) {
              if (parts[0] && parts[0].length === 4) {
                // YYYY/MM/DD
                dateStr = `${parts[0]}-${parts[1]?.padStart(2, '0')}-${parts[2]?.padStart(2, '0')}`;
              } else if (parts[2] && parts[2].length === 4) {
                // DD/MM/YYYY or MM/DD/YYYY -> assume YYYY-MM-DD
                dateStr = `${parts[2]}-${parts[1]?.padStart(2, '0')}-${parts[0]?.padStart(2, '0')}`;
              }
            }
          }

          if (!DATE_REGEX.test(dateStr) || isNaN(Date.parse(dateStr))) {
            errors[col.key] = `Invalid date (use YYYY-MM-DD format).`;
          } else {
            parsed[col.key] = dateStr;
          }
          break;
        }

        case 'enum': {
          if (col.options && col.options.length > 0) {
            const match = col.options.find(
              (opt) => opt.toLowerCase() === rawVal.toLowerCase()
            );
            if (!match) {
              errors[col.key] = `Value must be one of: ${col.options.join(', ')}`;
            } else {
              parsed[col.key] = match;
            }
          } else {
            parsed[col.key] = rawVal;
          }
          break;
        }

        case 'boolean': {
          const lower = rawVal.toLowerCase();
          if (['true', '1', 'yes', 'y'].includes(lower)) {
            parsed[col.key] = true;
          } else if (['false', '0', 'no', 'n'].includes(lower)) {
            parsed[col.key] = false;
          } else {
            errors[col.key] = `Must be Yes/No or True/False.`;
          }
          break;
        }

        case 'string':
        default:
          parsed[col.key] = rawVal;
          break;
      }

      // Custom column validator
      if (!errors[col.key] && col.validate) {
        const customErr = col.validate(parsed[col.key], rawRow);
        if (customErr) {
          errors[col.key] = customErr;
        }
      }
    }

    // Check duplicate unique identifier within file
    if (uniqueIdentifierKey && parsed[uniqueIdentifierKey]) {
      const keyVal = String(parsed[uniqueIdentifierKey]).toLowerCase().trim();
      if (seenUniqueKeys.has(keyVal)) {
        errors[uniqueIdentifierKey] = `Duplicate ${uniqueIdentifierKey} found in uploaded file.`;
      } else {
        seenUniqueKeys.add(keyVal);
      }
    }

    const isValid = Object.keys(errors).length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    const rawStringMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawRow)) {
      rawStringMap[k] = v !== undefined && v !== null ? String(v) : '';
    }

    return {
      rowNumber,
      raw: rawStringMap,
      parsed,
      errors,
      isValid,
    };
  });

  return {
    parsedRows,
    validCount,
    invalidCount,
  };
}
