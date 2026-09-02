import type { BusinessConfig } from '../../../lib/document/useBusinessConfig';
import { formatDocumentDate } from '../../../lib/document/formatters';

export interface ReportColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'numeric' | 'currency' | 'date' | 'badge' | 'percentage';
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface ReportPrintDocumentProps {
  reportTitle: string;
  reportCode?: string | undefined;
  moduleName?: string | undefined;
  businessConfig: BusinessConfig;
  periodText?: string | undefined;
  filtersText?: string | undefined;
  generatedBy?: string | undefined;
  columns: ReportColumnDef[];
  data: Record<string, unknown>[];
  summaryCards?: Array<{ label: string; value: string }> | undefined;
  orientation?: ('portrait' | 'landscape') | undefined;
}

export function ReportPrintDocument({
  reportTitle,
  reportCode,
  moduleName = 'General Enterprise Report',
  businessConfig,
  periodText = 'All Time / Current Fiscal Period',
  filtersText = 'Filters: None (All Records)',
  generatedBy = 'System Auditor (Admin)',
  columns,
  data,
  summaryCards,
  orientation = 'portrait',
}: ReportPrintDocumentProps) {
  const isLandscape = orientation === 'landscape';

  return (
    <div
      className={`print-doc w-full text-slate-900 bg-white text-[8.5pt] leading-normal font-sans ${
        isLandscape ? 'print-page-a4-landscape' : 'print-page-a4'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
        <div className="max-w-[60%]">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded bg-slate-900 text-white font-black text-xs flex items-center justify-center">
              ERP
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                {businessConfig.name}
              </h1>
              <p className="text-[7pt] font-semibold text-slate-600 uppercase">
                {moduleName.toUpperCase()} &bull; OFFICIAL FINANCIAL & OPERATIONAL REPORT
              </p>
            </div>
          </div>
          <div className="text-[7.5pt] text-slate-600 mt-1">
            {businessConfig.address} &bull; {businessConfig.vatNumber}
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">
            {reportTitle}
          </h2>
          {reportCode && (
            <div className="font-mono text-[8pt] font-bold text-slate-700">
              Code: {reportCode}
            </div>
          )}
          <div className="text-[7.5pt] text-slate-500 font-mono mt-1">
            Generated on: {formatDocumentDate(new Date().toISOString(), true)}
          </div>
        </div>
      </div>

      {/* Filter & Period Parameter Strip */}
      <div className="bg-slate-100 border border-slate-300 rounded-lg p-2 mb-3 flex flex-wrap items-center justify-between text-[7.5pt]">
        <div>
          <span className="font-bold text-slate-700">Reporting Period: </span>
          <span className="font-semibold text-slate-900 font-mono">{periodText}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Scope & Filters: </span>
          <span className="text-slate-800">{filtersText}</span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Audited By: </span>
          <span className="font-medium text-slate-800">{generatedBy}</span>
        </div>
      </div>

      {/* Optional Summary Cards */}
      {summaryCards && summaryCards.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-300 p-2 rounded text-center">
              <span className="text-[7pt] uppercase font-bold text-slate-500 block">{card.label}</span>
              <span className="text-[10pt] font-black text-slate-900 font-mono">{card.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Table */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse border border-slate-300 text-[8pt]">
          <thead className="bg-slate-200 border-b-2 border-slate-400 text-[7pt] font-bold uppercase text-slate-800 tracking-wider">
            <tr>
              <th className="py-1.5 px-2 border-r border-slate-300 w-8 text-center">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`py-1.5 px-2 border-r border-slate-300 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-6 text-center text-slate-400 italic">
                  No records found matching the query criteria.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50">
                  <td className="py-1 px-2 border-r border-slate-200 text-center font-mono text-slate-500">
                    {rowIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`py-1 px-2 border-r border-slate-200 ${
                          col.align === 'right' || col.type === 'currency' || col.type === 'numeric'
                            ? 'text-right font-mono'
                            : col.align === 'center'
                            ? 'text-center font-mono'
                            : 'text-left'
                        } ${col.type === 'currency' ? 'font-semibold text-slate-950' : 'text-slate-800'}`}
                      >
                        {val !== undefined && val !== null ? String(val) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Sign-off & Audit Signatures */}
      <div className="grid grid-cols-3 gap-6 pt-8 mt-6 border-t border-slate-200 text-center text-[7.5pt] break-inside-avoid">
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Report Prepared By
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Internal Audit & Compliance
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Managing Director / CFO Approval
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-[6.5pt] text-slate-400 pt-3 mt-3 border-t border-dashed border-slate-200 font-mono">
        <span>Confidential &bull; SliceMart Management Information System</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
}
