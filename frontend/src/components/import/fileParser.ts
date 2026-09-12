import * as XLSX from 'xlsx';

export interface ParsedFileResult {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  totalRows: number;
}

/**
 * Reads a File (CSV or XLSX/XLS) and parses it into standard tabular data.
 */
export async function parseImportFile(file: File): Promise<ParsedFileResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellText: false,
    raw: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file does not contain any sheets or data.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error('Could not access the first worksheet in the file.');
  }
  // Extract raw JSON rows as 2D array first to sanitize headers
  const data: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (data.length === 0) {
    throw new Error('The uploaded sheet is completely empty.');
  }

  // Find header row (first row with non-empty string values)
  const rawHeaders = (data[0] || []).map((h) => String(h || '').trim());
  const headers = rawHeaders.filter((h) => h.length > 0);

  if (headers.length === 0) {
    throw new Error('No valid column headers found in the first row.');
  }

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < data.length; i++) {
    const rowArray = data[i] || [];
    const rowObj: Record<string, string> = {};
    let hasAnyValue = false;

    rawHeaders.forEach((header, colIdx) => {
      if (!header) return;
      const val = rowArray[colIdx];
      let strVal = '';
      if (val instanceof Date) {
        // Format as YYYY-MM-DD
        const year = val.getFullYear();
        const month = String(val.getMonth() + 1).padStart(2, '0');
        const day = String(val.getDate()).padStart(2, '0');
        strVal = `${year}-${month}-${day}`;
      } else if (val !== null && val !== undefined) {
        strVal = String(val).trim();
      }

      if (strVal.length > 0) {
        hasAnyValue = true;
      }
      rowObj[header] = strVal;
    });

    if (hasAnyValue) {
      rows.push(rowObj);
    }
  }

  return {
    headers,
    rows,
    fileName: file.name,
    totalRows: rows.length,
  };
}
