export type ImportFieldType = 'string' | 'number' | 'email' | 'date' | 'enum' | 'boolean';

export interface ImportColumnDef {
  key: string;
  label: string;
  required?: boolean;
  type?: ImportFieldType;
  options?: string[]; // for 'enum'
  sampleValue?: string | number | boolean;
  description?: string;
  aliases?: string[];
  validate?: (value: unknown, row: Record<string, unknown>) => string | null;
}

export interface ImportSchemaConfig {
  entityTitle: string; // e.g. "Employees" or "Products"
  templateFileName: string; // e.g. "employees_import_template"
  columns: ImportColumnDef[];
  uniqueIdentifierKey: string; // e.g. "employee_code" or "sku"
  supportsUpsert?: boolean; // defaults to true
  apiEndpoint: string; // e.g. "/employees/bulk-import"
  sampleRows?: Record<string, unknown>[];
}

export interface ParsedRowState {
  rowNumber: number;
  raw: Record<string, string>;
  parsed: Record<string, unknown>;
  errors: Record<string, string>;
  isValid: boolean;
}

export interface ImportErrorItem {
  row: number;
  field?: string;
  value?: string;
  message: string;
}

export interface BulkImportResponse {
  success: boolean;
  message?: string;
  total: number;
  imported: number;
  updated?: number;
  skipped: number;
  failed: number;
  errors?: ImportErrorItem[];
}
