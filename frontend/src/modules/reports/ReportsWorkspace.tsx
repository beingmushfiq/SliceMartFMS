import React, { useState } from 'react';
import {
  FileText,
  Download,
  Filter,
  Bookmark,
  Clock,
  CheckCircle,
  Calendar,
  Layers,
  Printer,
} from 'lucide-react';
import { PrintPreviewModal } from '../../components/print/PrintPreviewModal';
import { SelectDropdown } from '../../components/ui/Dropdown';
import { ReportPrintDocument } from '../../components/print/reports/ReportPrintDocument';
import { useBusinessConfig } from '../../lib/document/useBusinessConfig';
import type {
  ReportDefinition,
  ReportCategory,
  ReportDataResponse,
  ReportSavedView,
  ExportFormat,
} from '../../types/api/reports';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { useCurrency } from '../../hooks/useCurrency';

const MOCK_DEFINITIONS: ReportDefinition[] = [
  {
    id: 1,
    uuid: 'def-1',
    code: 'production_yield',
    name: 'Production Yield & Scrap Analysis',
    module: 'production',
    category: 'operational',
    description:
      'Detailed analysis of production batch efficiency, actual vs planned output, and wastage percentage.',
    supports_export: true,
    tier: 'live',
    is_active: true,
  },
  {
    id: 2,
    uuid: 'def-2',
    code: 'stock_valuation',
    name: 'Warehouse Stock Valuation & Aging',
    module: 'inventory',
    category: 'financial',
    description:
      'Current on-hand inventory levels valued at weighted average cost across raw materials and finished goods.',
    supports_export: true,
    tier: 'live',
    is_active: true,
  },
  {
    id: 3,
    uuid: 'def-3',
    code: 'sales_performance',
    name: 'Channel Sales & Revenue Ledger',
    module: 'sales',
    category: 'analytical',
    description:
      'Order volume, gross sales revenue, applied discounts, and payment settlement breakdown by channel.',
    supports_export: true,
    tier: 'live',
    is_active: true,
  },
  {
    id: 4,
    uuid: 'def-4',
    code: 'gl_summary',
    name: 'General Ledger Summary Trial Balance',
    module: 'finance',
    category: 'financial',
    description:
      'Debit and credit balance reconciliation across all active asset, liability, equity, income, and expense accounts.',
    supports_export: true,
    tier: 'live',
    is_active: true,
  },
  {
    id: 5,
    uuid: 'def-5',
    code: 'payroll_summary',
    name: 'Disbursed Payroll & Piece-Rate Summary',
    module: 'hr',
    category: 'compliance',
    description:
      'Aggregated gross earnings, piece-rate bonuses, deductions, and net payouts per employee department.',
    supports_export: true,
    tier: 'live',
    is_active: true,
  },
];

export const ReportsWorkspace: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useWorkspaceTab<ReportCategory | 'all'>(
    'all',
    ['all', 'operational', 'financial', 'analytical', 'compliance'] as const,
    'category'
  );
  const [selectedReportCode, setSelectedReportCode] = useWorkspaceTab<string>(
    'production_yield',
    [
      'production_yield',
      'stock_valuation',
      'sales_performance',
      'general_ledger',
      'payroll_summary',
    ] as const,
    'report'
  );
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-28');
  const [loading, setLoading] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [savedViews] = useState<ReportSavedView[]>([
    {
      id: 1,
      uuid: 'view-1',
      report_definition_id: 1,
      name: 'Default Live View',
      filters: {},
      columns: [
        'batch_number',
        'product_name',
        'planned_quantity',
        'actual_quantity',
        'yield_percentage',
        'status',
      ],
      is_default: true,
      created_at: '2026-08-28T10:00:00Z',
    },
  ]);
  const [selectedView, setSelectedView] = useState<string>('Default Live View');

  // Report runtime sample state
  const [reportResult] = useState<ReportDataResponse | null>({
    columns: {
      batch_number: { label: 'Batch Number', type: 'string', sortable: true },
      product_name: { label: 'Product / SKU', type: 'string' },
      batch_date: { label: 'Batch Date', type: 'date', sortable: true },
      planned_quantity: { label: 'Planned Qty', type: 'number' },
      actual_quantity: { label: 'Produced Qty', type: 'number' },
      rejected_quantity: { label: 'Wastage', type: 'number' },
      yield_percentage: { label: 'Yield Efficiency', type: 'percentage' },
      status: { label: 'Status', type: 'badge' },
    },
    data: [
      {
        batch_number: 'BAT-202608-001',
        product_name: 'Cotton Crew T-Shirt (TSH-001)',
        batch_date: '2026-08-28',
        planned_quantity: '1,000.00',
        actual_quantity: '980.00',
        rejected_quantity: '20.00',
        yield_percentage: '98.00%',
        status: 'completed',
      },
      {
        batch_number: 'BAT-202608-002',
        product_name: 'Denim Slim Jeans (JNS-002)',
        batch_date: '2026-08-27',
        planned_quantity: '500.00',
        actual_quantity: '492.00',
        rejected_quantity: '8.00',
        yield_percentage: '98.40%',
        status: 'completed',
      },
      {
        batch_number: 'BAT-202608-003',
        product_name: 'Fleece Hoodie (HOD-003)',
        batch_date: '2026-08-26',
        planned_quantity: '750.00',
        actual_quantity: '730.00',
        rejected_quantity: '20.00',
        yield_percentage: '97.33%',
        status: 'in_progress',
      },
    ],
    summary: {
      total_batches: 3,
      total_planned_quantity: '2,250.00',
      total_actual_quantity: '2,202.00',
      average_yield_percentage: '97.87%',
    },
    pagination: {
      total: 3,
      current_page: 1,
      per_page: 25,
      last_page: 1,
    },
    meta: {
      freshness: {
        as_of: new Date().toISOString(),
        tier: 'live',
        stale: false,
      },
    },
  });

  const categories: Array<{ id: ReportCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All Reports' },
    { id: 'operational', label: 'Operational' },
    { id: 'analytical', label: 'Analytical' },
    { id: 'financial', label: 'Financial' },
    { id: 'compliance', label: 'Compliance' },
  ];

  const filteredDefinitions = MOCK_DEFINITIONS.filter(
    (def) => selectedCategory === 'all' || def.category === selectedCategory
  );

  const activeDef =
    MOCK_DEFINITIONS.find((d) => d.code === selectedReportCode) || MOCK_DEFINITIONS[0];

  const handleRunReport = async () => {
    setLoading(true);
    // Simulating API query execution
    setTimeout(() => {
      setLoading(false);
    }, 400);
  };

  const handleExport = () => {
    setExportStatus('Queued (Job ID: SM-EXP-' + Math.floor(Math.random() * 90000 + 10000) + ')');
    setTimeout(() => {
      setExportStatus('Ready for download');
    }, 1200);
  };

  const { config: businessConfig } = useBusinessConfig();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Reports & Analytics (RMS Engine)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise report execution matrix with multi-tiered data freshness, customizable views,
            and asynchronous export workers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {filteredDefinitions.map((def) => {
          const isSelected = def.code === selectedReportCode;
          return (
            <button
              type="button"
              key={def.code}
              onClick={() => setSelectedReportCode(def.code)}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-500 uppercase">{def.module}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                  {def.tier}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{def.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{def.description}</p>
            </button>
          );
        })}
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 border-l border-default pl-3">
              <SelectDropdown
                icon={Bookmark}
                options={savedViews.map((v) => ({ value: v.name, label: v.name }))}
                value={selectedView}
                onChange={(val) => setSelectedView(val)}
                size="sm"
                aria-label="Select saved report view"
              />
            </div>

            <button
              onClick={handleRunReport}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              <Filter className="w-3.5 h-3.5" />
              {loading ? 'Executing...' : 'Apply Filters'}
            </button>
          </div>

          {/* Freshness Badge */}
          {reportResult && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Freshness:</span>
              <span className="font-semibold text-emerald-600 uppercase">
                {reportResult.meta.freshness.tier}
              </span>
              <span className="text-slate-400">|</span>
              <span>As of: {new Date(reportResult.meta.freshness.as_of).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Summary Metric Cards */}
        {reportResult?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            {Object.entries(reportResult.summary).map(([key, value]) => (
              <div key={key} className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{String(value)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">{activeDef?.name ?? 'Report Data'}</h2>
          </div>
          <span className="text-xs text-slate-500">
            Showing {reportResult?.data.length || 0} of {reportResult?.pagination.total || 0} rows
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                {reportResult &&
                  Object.entries(reportResult.columns).map(([colKey, col]) => (
                    <th key={colKey} className="px-4 py-3">
                      {col.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportResult?.data.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  {Object.keys(reportResult.columns).map((colKey) => {
                    const val = row[colKey];
                    const colDef = reportResult.columns[colKey];

                    if (colDef?.type === 'badge') {
                      return (
                        <td key={colKey} className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                              val === 'completed' || val === 'posted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {val}
                          </span>
                        </td>
                      );
                    }

                    if (colDef?.type === 'percentage') {
                      return (
                        <td key={colKey} className="px-4 py-3 font-semibold text-indigo-600">
                          {val}
                        </td>
                      );
                    }

                    if (colDef?.type === 'currency') {
                      return (
                        <td key={colKey} className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(Number(val) || 0)}
                        </td>
                      );
                    }

                    return (
                      <td key={colKey} className="px-4 py-3 text-slate-700">
                        {val ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Page 1 of 1</span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="px-2 py-1 border border-slate-300 rounded bg-white disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled
              className="px-2 py-1 border border-slate-300 rounded bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Async Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Export Report Data</h3>
              <button
                onClick={() => {
                  setExportModalOpen(false);
                  setExportStatus(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Large reports are processed asynchronously by our background queue worker. You will
              receive a notification when the download package is assembled.
            </p>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['xlsx', 'csv', 'pdf'] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`py-2 text-xs font-semibold uppercase rounded-lg border text-center transition-all ${
                      exportFormat === fmt
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {exportStatus && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center gap-2 text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{exportStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setExportModalOpen(false);
                  setExportStatus(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Queue Export (202)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {isPrintModalOpen && reportResult && (
        <PrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={`Print Report: ${activeDef?.name || 'Enterprise Ledger'}`}
          documentNumber={`RPT-${selectedReportCode.toUpperCase()}`}
          documentType="Official ERP Audit Report"
          pageClass={
            Object.keys(reportResult.columns).length > 5
              ? 'print-page-a4-landscape'
              : 'print-page-a4'
          }
        >
          <ReportPrintDocument
            reportTitle={activeDef?.name || 'Enterprise Analytical Report'}
            reportCode={selectedReportCode}
            moduleName={activeDef?.module || 'ERP Analytics'}
            businessConfig={businessConfig}
            periodText="Last 30 Days (Active Fiscal Quarter)"
            filtersText={`Category: ${selectedCategory.toUpperCase()} | Saved View: ${selectedView}`}
            columns={Object.entries(reportResult.columns).map(([k, col]) => {
              const mappedType =
                col.type === 'number'
                  ? ('numeric' as const)
                  : col.type === 'percentage'
                  ? ('percentage' as const)
                  : col.type === 'currency'
                  ? ('currency' as const)
                  : col.type === 'date'
                  ? ('date' as const)
                  : col.type === 'badge'
                  ? ('badge' as const)
                  : ('text' as const);
              return {
                key: k,
                label: col.label,
                type: mappedType,
                align: (mappedType === 'numeric' || mappedType === 'currency' || mappedType === 'percentage') ? ('right' as const) : ('left' as const),
              };
            })}
            data={reportResult.data}
            summaryCards={
              reportResult.summary
                ? Object.entries(reportResult.summary).map(([k, v]) => ({
                    label: k.replace(/_/g, ' '),
                    value: String(v),
                  }))
                : undefined
            }
            orientation={Object.keys(reportResult.columns).length > 5 ? 'landscape' : 'portrait'}
          />
        </PrintPreviewModal>
      )}
    </div>
  );
};
