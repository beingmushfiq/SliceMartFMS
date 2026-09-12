import * as XLSX from 'xlsx';
import type { ImportErrorItem, ParsedRowState } from './types';

/**
 * Downloads a spreadsheet containing only the failed rows, with error descriptions appended as the final column.
 */
export function exportFailedRowsSpreadsheet(
  failedRows: ParsedRowState[],
  serverErrors?: ImportErrorItem[],
  baseFileName: string = 'failed_import_rows',
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  if (failedRows.length === 0) return;

  // Build a map of row numbers to server error messages
  const serverErrorMap = new Map<number, string[]>();
  if (serverErrors) {
    for (const err of serverErrors) {
      const existing = serverErrorMap.get(err.row) || [];
      existing.push(err.message);
      serverErrorMap.set(err.row, existing);
    }
  }

  const exportData = failedRows.map((row) => {
    // Combine client pre-validation errors and server errors
    const clientErrs = Object.entries(row.errors).map(
      ([k, msg]) => `[${k}]: ${msg}`
    );
    const srvErrs = serverErrorMap.get(row.rowNumber) || [];
    const allErrors = [...clientErrs, ...srvErrs].join('; ');

    return {
      _row_number: row.rowNumber,
      ...row.raw,
      _error_reason: allErrors || 'Unknown validation error',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

  const fileName = `${baseFileName}_${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === 'csv') {
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(workbook, fileName);
  }
}
