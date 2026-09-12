import * as XLSX from 'xlsx';
import type { ImportSchemaConfig } from './types';

/**
 * Generates and triggers instant browser download for an import template (.xlsx or .csv).
 */
export function downloadImportTemplate(
  config: ImportSchemaConfig,
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const headers = config.columns.map((c) => c.label || c.key);
  const sampleRow1 = config.columns.map((c) =>
    c.sampleValue !== undefined ? String(c.sampleValue) : ''
  );

  // Optional guidance / description row
  const hasDescriptions = config.columns.some((c) => !!c.description);
  const descriptionRow = hasDescriptions
    ? config.columns.map((c) => (c.description ? `[${c.description}]` : ''))
    : null;

  const aoaData: string[][] = [headers];
  if (descriptionRow) {
    aoaData.push(descriptionRow);
  }
  aoaData.push(sampleRow1);

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Set friendly column widths based on label lengths
  worksheet['!cols'] = config.columns.map((col) => {
    const len = Math.max(col.label.length, String(col.sampleValue || '').length, 14);
    return { wch: len + 3 };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const fileName = `${config.templateFileName || 'import_template'}.${format}`;

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
