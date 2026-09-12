import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Check,
  Wand2,
  Trash2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api/client';
import { notify } from '../ui/Toast';
import type {
  ImportSchemaConfig,
  BulkImportResponse,
  ImportErrorItem,
} from './types';
import { parseImportFile, type ParsedFileResult } from './fileParser';
import { downloadImportTemplate } from './templateGenerator';
import { autoMapColumns } from './columnMapper';
import { validateImportRows } from './rowValidator';
import { exportFailedRowsSpreadsheet } from './errorExporter';

export interface UniversalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: ImportSchemaConfig;
  schema?: ImportSchemaConfig;
  onSuccess?: (result: BulkImportResponse) => void;
  onImportSuccess?: () => void;
}

type PreviewTab = 'all' | 'valid' | 'errors';

export const UniversalImportModal: React.FC<UniversalImportModalProps> = ({
  isOpen,
  onClose,
  config: propConfig,
  schema: propSchema,
  onSuccess,
  onImportSuccess,
}) => {
  const config = propConfig || propSchema;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow states
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedFileResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMappingConfig, setShowMappingConfig] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('all');
  const [conflictMode, setConflictMode] = useState<'skip' | 'upsert'>('skip');
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const [serverErrors, setServerErrors] = useState<ImportErrorItem[]>([]);

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);

  // Safe columns accessor for hooks
  const configColumns = useMemo(() => config?.columns ?? [], [config?.columns]);

  // Compute unmapped required columns (unconditional hook)
  const unmappedRequiredColumns = useMemo(() => {
    return configColumns.filter((c) => c.required && !columnMapping[c.key]);
  }, [configColumns, columnMapping]);

  // Compute validated rows based on current mapping (unconditional hook)
  const { parsedRows, validCount, invalidCount } = useMemo(() => {
    if (!parsedFile || !config) {
      return { parsedRows: [], validCount: 0, invalidCount: 0 };
    }
    return validateImportRows(
      parsedFile.rows,
      columnMapping,
      config.columns,
      config.uniqueIdentifierKey
    );
  }, [parsedFile, columnMapping, config]);

  // Filtered rows for preview table (unconditional hook)
  const displayedRows = useMemo(() => {
    if (previewTab === 'valid') {
      return parsedRows.filter((r) => r.isValid);
    }
    if (previewTab === 'errors') {
      return parsedRows.filter((r) => !r.isValid);
    }
    return parsedRows;
  }, [parsedRows, previewTab]);

  // Reset all state when closing or starting fresh
  const handleReset = () => {
    setParsedFile(null);
    setColumnMapping({});
    setShowMappingConfig(false);
    setPreviewTab('all');
    setResult(null);
    setServerErrors([]);
    setIsParsing(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Process selected file
  const handleFileSelect = async (file: File) => {
    if (!config) return;

    const validExts = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExts.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      notify.error('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setIsParsing(true);
    setResult(null);
    setServerErrors([]);

    try {
      const parsed = await parseImportFile(file);
      if (parsed.rows.length === 0) {
        notify.error('The selected file contains no data rows.');
        setIsParsing(false);
        return;
      }

      setParsedFile(parsed);
      const initialMapping = autoMapColumns(parsed.headers, config.columns);
      setColumnMapping(initialMapping);

      // If any required column is unmapped, auto-open the mapping accordion
      const hasUnmappedRequired = config.columns.some(
        (c) => c.required && !initialMapping[c.key]
      );
      setShowMappingConfig(hasUnmappedRequired);

      notify.success(`Parsed ${parsed.rows.length} rows from "${file.name}".`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to read the file.';
      notify.error(msg);
    } finally {
      setIsParsing(false);
    }
  };

  // Execute import against backend API
  const handleExecuteImport = async () => {
    if (!config || !parsedFile || validCount === 0) return;

    if (unmappedRequiredColumns.length > 0) {
      notify.error(
        `Please map required column${
          unmappedRequiredColumns.length > 1 ? 's' : ''
        }: ${unmappedRequiredColumns.map((c) => c.label).join(', ')}`
      );
      setShowMappingConfig(true);
      return;
    }

    setIsSubmitting(true);
    setServerErrors([]);

    // Collect valid rows payload
    const rowsToSubmit = parsedRows
      .filter((r) => r.isValid)
      .map((r) => r.parsed);

    try {
      const endpoint = config.apiEndpoint.startsWith('/api/v1')
        ? config.apiEndpoint.replace(/^\/api\/v1/, '')
        : config.apiEndpoint;
      const response = await api.post<BulkImportResponse>(endpoint, {
        mode: conflictMode,
        rows: rowsToSubmit,
      });

      const resData = response.data;
      setResult(resData);

      if (resData.errors && resData.errors.length > 0) {
        setServerErrors(resData.errors);
      }

      if (resData.imported > 0 || (resData.updated && resData.updated > 0)) {
        notify.success(
          `Successfully imported ${resData.imported} ${config.entityTitle.toLowerCase()}${
            resData.updated ? ` and updated ${resData.updated}` : ''
          }.`
        );
        onSuccess?.(resData);
        onImportSuccess?.();
      } else if (resData.skipped > 0 && resData.failed === 0) {
        notify.info(
          `All ${resData.skipped} records already exist and were skipped.`
        );
      } else {
        notify.warning('Import completed with errors. See summary below.');
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: {
            errors?: ImportErrorItem[];
            message?: string;
            imported?: number;
            updated?: number;
            skipped?: number;
            failed?: number;
          };
        };
        message?: string;
      };
      const errResponse = axiosErr.response?.data;
      if (errResponse?.errors && Array.isArray(errResponse.errors)) {
        setServerErrors(errResponse.errors);
        const imported = errResponse.imported ?? 0;
        const updated = errResponse.updated ?? 0;
        const skipped = errResponse.skipped ?? 0;
        const failed = errResponse.failed ?? errResponse.errors.length;
        setResult({
          success: false,
          total: imported + updated + skipped + failed,
          imported,
          updated,
          skipped,
          failed,
          errors: errResponse.errors,
          message: errResponse.message || 'Import failed with validation errors.',
        });
      }
      notify.error(
        errResponse?.message || axiosErr.message || 'Import request failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download failed rows helper (combining client validation and server rejection errors)
  const handleDownloadFailedRows = (format: 'xlsx' | 'csv' = 'xlsx') => {
    if (!config) return;

    const failedClientRows = parsedRows.filter((r) => !r.isValid);
    const validSubmittedRows = parsedRows.filter((r) => r.isValid);

    // If server errors exist, map them by index into submitted valid rows
    const serverFailedRows: typeof parsedRows = [];
    if (serverErrors.length > 0) {
      serverErrors.forEach((srvErr) => {
        const target = validSubmittedRows[srvErr.row - 1];
        if (target) {
          serverFailedRows.push({
            ...target,
            isValid: false,
            errors: {
              ...target.errors,
              [srvErr.field || 'server']: srvErr.message,
            },
          });
        }
      });
    }

    // Combine without duplicate row numbers
    const combinedFailed = [
      ...failedClientRows,
      ...serverFailedRows.filter(
        (sf) => !failedClientRows.some((cf) => cf.rowNumber === sf.rowNumber)
      ),
    ];

    if (combinedFailed.length > 0) {
      exportFailedRowsSpreadsheet(
        combinedFailed,
        serverErrors,
        `${config.templateFileName}_failed_rows`,
        format
      );
      notify.info(`Downloaded ${combinedFailed.length} failed rows for inspection.`);
    } else if (serverErrors.length > 0) {
      const syntheticRows = serverErrors.map((e) => ({
        rowNumber: e.row,
        raw: { error: e.message, field: e.field || '' },
        parsed: {},
        isValid: false,
        errors: { [e.field || 'server']: e.message },
      }));
      exportFailedRowsSpreadsheet(
        syntheticRows,
        serverErrors,
        `${config.templateFileName}_failed_rows`,
        format
      );
      notify.info(`Downloaded error report for inspection.`);
    } else {
      notify.info('No failed rows to export.');
    }
  };

  // Safe render check after all hooks are evaluated
  if (!config) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={`Bulk Import ${config.entityTitle}`}
      size="xl"
    >
      <div className="space-y-4 max-h-[82vh] flex flex-col">
        {/* Results Screen */}
        {result ? (
          <div className="space-y-5 py-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Import Process Completed
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {result.message || 'The data batch has been processed.'}
              </p>

              {/* Statistics Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-left">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    Imported
                  </span>
                  <span className="text-xl font-bold text-emerald-600">
                    {result.imported}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    Updated
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {result.updated ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    Skipped (Existing)
                  </span>
                  <span className="text-xl font-bold text-amber-600">
                    {result.skipped}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                    Failed
                  </span>
                  <span className="text-xl font-bold text-rose-600">
                    {result.failed}
                  </span>
                </div>
              </div>
            </div>

            {/* Server Errors List */}
            {serverErrors.length > 0 && (
              <div className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Server Rejection Details ({serverErrors.length})</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Download className="size-3.5" />}
                    onClick={() => handleDownloadFailedRows('xlsx')}
                  >
                    Download Error Report (.xlsx)
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs text-rose-800 dark:text-rose-300 pr-1">
                  {serverErrors.map((err, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 bg-white/70 dark:bg-slate-900/60 rounded flex items-start gap-2 border border-rose-100 dark:border-rose-950/40"
                    >
                      <span className="font-mono text-[10px] bg-rose-100 dark:bg-rose-900/50 text-rose-700 px-1.5 py-0.5 rounded">
                        Row {err.row}
                      </span>
                      {err.field && (
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          [{err.field}]:
                        </span>
                      )}
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={handleReset}>
                Import Another File
              </Button>
              <Button variant="primary" onClick={handleClose}>
                Done & Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header Description & Starter Template Downloads */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Step 1: Download Standard Template
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Use our official spreadsheet template with pre-set columns, formats, and sample data.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<FileSpreadsheet className="size-3.5" />}
                  onClick={() => downloadImportTemplate(config, 'xlsx')}
                  title="Download Microsoft Excel template (.xlsx)"
                >
                  Excel (.xlsx)
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<FileText className="size-3.5" />}
                  onClick={() => downloadImportTemplate(config, 'csv')}
                  title="Download standard CSV template (.csv)"
                >
                  CSV (.csv)
                </Button>
              </div>
            </div>

            {/* Step 2: Upload Area or Loaded File Card */}
            {!parsedFile ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload spreadsheet file"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  {isParsing ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {isParsing ? 'Analyzing spreadsheet...' : 'Drop your file here, or browse'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                {/* File Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate block">
                        {parsedFile.fileName}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {parsedFile.totalRows} data row{parsedFile.totalRows === 1 ? '' : 's'} detected
                      </span>
                    </div>
                  </div>

                  {/* Summary Badges & Re-upload */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validCount} Valid
                    </span>

                    {invalidCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                        <XCircle className="w-3.5 h-3.5" />
                        {invalidCount} Error{invalidCount === 1 ? '' : 's'}
                      </span>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      title="Choose a different file"
                    >
                      Change File
                    </Button>
                  </div>
                </div>

                {/* Column Mapping Accordion */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  <div className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/50">
                    <button
                      type="button"
                      onClick={() => setShowMappingConfig(!showMappingConfig)}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors"
                    >
                      <span>Column Alignment</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                        {Object.values(columnMapping).filter(Boolean).length} /{' '}
                        {config.columns.length} Mapped
                      </span>
                      {unmappedRequiredColumns.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-semibold">
                          {unmappedRequiredColumns.length} Required Missing
                        </span>
                      )}
                      {showMappingConfig ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    {showMappingConfig && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const remapped = autoMapColumns(
                              parsedFile.headers,
                              config.columns
                            );
                            setColumnMapping(remapped);
                            notify.info('Auto-mapped columns based on headers.');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          <Wand2 className="size-3" />
                          Auto-Map
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <button
                          type="button"
                          onClick={() => setColumnMapping({})}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors font-medium"
                        >
                          <Trash2 className="size-3" />
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {showMappingConfig && (
                    <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20">
                      {config.columns.map((col) => {
                        const isMapped = Boolean(columnMapping[col.key]);
                        const isMissingRequired = col.required && !isMapped;
                        return (
                          <div
                            key={col.key}
                            className={`space-y-1 p-1.5 rounded-lg border transition-colors ${
                              isMissingRequired
                                ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20'
                                : 'border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                {col.label}{' '}
                                {col.required && (
                                  <span className="text-rose-500">*</span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {col.type || 'string'}
                              </span>
                            </div>
                            <select
                              value={columnMapping[col.key] || ''}
                              onChange={(e) =>
                                setColumnMapping((prev) => ({
                                  ...prev,
                                  [col.key]: e.target.value,
                                }))
                              }
                              className={`w-full text-xs py-1 px-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                                isMissingRequired
                                  ? 'border-amber-400 focus:ring-amber-500'
                                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                              }`}
                            >
                              <option value="">(Not Mapped)</option>
                              {parsedFile.headers.map((hdr) => (
                                <option key={hdr} value={hdr}>
                                  {hdr}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Unmapped Required Columns Warning Banner */}
                {unmappedRequiredColumns.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="flex-1">
                      Required column{unmappedRequiredColumns.length > 1 ? 's' : ''} not mapped:{' '}
                      <strong>
                        {unmappedRequiredColumns.map((c) => c.label).join(', ')}
                      </strong>
                      . Expand &quot;Column Alignment&quot; to map {unmappedRequiredColumns.length > 1 ? 'them' : 'it'}.
                    </span>
                    {!showMappingConfig && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-800 dark:text-amber-200 underline text-xs h-6 py-0 px-2"
                        onClick={() => setShowMappingConfig(true)}
                      >
                        Map Columns
                      </Button>
                    )}
                  </div>
                )}

                {/* Conflict Handling & Preview Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {/* Tabs: All / Valid / Errors */}
                  <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('all')}
                      className={`px-3 py-1 rounded-md font-medium transition-all ${
                        previewTab === 'all'
                          ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      All ({parsedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('valid')}
                      className={`px-3 py-1 rounded-md font-medium transition-all ${
                        previewTab === 'valid'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      Valid ({validCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('errors')}
                      className={`px-3 py-1 rounded-md font-medium transition-all ${
                        previewTab === 'errors'
                          ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      Errors ({invalidCount})
                    </button>
                  </div>

                  {/* Conflict Resolution Selector (Default: Skip) */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Duplicate Keys:
                    </span>
                    <select
                      value={conflictMode}
                      onChange={(e) =>
                        setConflictMode(e.target.value as 'skip' | 'upsert')
                      }
                      className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="skip">
                        Skip existing records
                        {config.uniqueIdentifierKey
                          ? ` (by ${config.uniqueIdentifierKey})`
                          : ''}
                      </option>
                      {config.supportsUpsert !== false && (
                        <option value="upsert">
                          Update existing (Upsert)
                          {config.uniqueIdentifierKey
                            ? ` (by ${config.uniqueIdentifierKey})`
                            : ''}
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Data Preview Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto overflow-y-auto flex-1 min-h-50 max-h-75">
                  <table className="w-full text-left text-xs border-collapse min-w-160">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2 text-[11px] font-semibold text-slate-500 w-14 sticky left-0 bg-slate-50 dark:bg-slate-800 z-30">
                          Row
                        </th>
                        <th className="px-3 py-2 text-[11px] font-semibold text-slate-500 w-20 sticky left-14 bg-slate-50 dark:bg-slate-800 z-30">
                          Status
                        </th>
                        {config.columns.map((col) => {
                          const isMapped = Boolean(columnMapping[col.key]);
                          return (
                            <th
                              key={col.key}
                              className="px-3 py-2 text-[11px] font-semibold text-slate-500 whitespace-nowrap min-w-32.5"
                            >
                              <div className="flex items-center gap-1">
                                <span>{col.label}</span>
                                {col.required && (
                                  <span className="text-rose-500">*</span>
                                )}
                                {!isMapped && (
                                  <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500 italic">
                                    (unmapped)
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                        {invalidCount > 0 && (
                          <th className="px-3 py-2 text-[11px] font-semibold text-slate-500 min-w-50">
                            Validation Messages
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={
                              2 +
                              config.columns.length +
                              (invalidCount > 0 ? 1 : 0)
                            }
                            className="px-4 py-8 text-center text-slate-600 dark:text-slate-400"
                          >
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        displayedRows.slice(0, 100).map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                              !row.isValid
                                ? 'bg-rose-50/20 dark:bg-rose-950/10'
                                : ''
                            }`}
                          >
                            <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                              #{row.rowNumber}
                            </td>
                            <td className="px-3 py-1.5 sticky left-14 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                                  Error
                                </span>
                              )}
                            </td>
                            {config.columns.map((col) => {
                              const isMapped = Boolean(columnMapping[col.key]);
                              const val = row.parsed[col.key];
                              const err = row.errors[col.key];
                              return (
                                <td
                                  key={col.key}
                                  className={`px-3 py-1.5 truncate max-w-45 whitespace-nowrap ${
                                    err
                                      ? 'text-rose-600 font-medium bg-rose-50/60 dark:bg-rose-900/20'
                                      : !isMapped
                                      ? 'text-slate-400 italic'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                  title={
                                    err
                                      ? `Error: ${err}`
                                      : String(val ?? '')
                                  }
                                >
                                  {err ? (
                                    <span className="flex items-center gap-1">
                                      <AlertCircle className="size-3 shrink-0 text-rose-500 inline" />
                                      {val !== null && val !== undefined && val !== ''
                                        ? String(val)
                                        : '(empty)'}
                                    </span>
                                  ) : val !== null && val !== undefined && val !== '' ? (
                                    String(val)
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              );
                            })}
                            {invalidCount > 0 && (
                              <td
                                className="px-3 py-1.5 text-rose-600 dark:text-rose-400 text-[11px] max-w-65 truncate"
                                title={Object.values(row.errors).join(', ')}
                              >
                                {Object.values(row.errors).join(', ')}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {displayedRows.length > 100 && (
                  <p className="text-[11px] text-slate-500 text-right px-1">
                    Showing preview of first 100 of {displayedRows.length} rows.
                  </p>
                )}

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div>
                    {invalidCount > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Download className="size-3.5" />}
                        onClick={() => handleDownloadFailedRows('xlsx')}
                      >
                        Export Errors ({invalidCount})
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      leftIcon={<Upload className="size-3.5" />}
                      loading={isSubmitting}
                      disabled={
                        validCount === 0 ||
                        isSubmitting ||
                        unmappedRequiredColumns.length > 0
                      }
                      onClick={handleExecuteImport}
                    >
                      Import {validCount} Record{validCount === 1 ? '' : 's'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
