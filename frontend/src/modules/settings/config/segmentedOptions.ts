import {
  Clock,
  FileText,
  FileSpreadsheet,
  Layers,
  Zap,
  Cpu,
} from 'lucide-react';
import type { RadioOption } from '../components/fields/SegmentedRadioCards';

export const SEGMENTED_OPTIONS: Record<string, RadioOption[]> = {
  time_format: [
    {
      value: '24h',
      label: '24-Hour Military Format',
      description: 'Standard factory floor format (e.g. 14:30:00). Prevents AM/PM shift ambiguities.',
      icon: Clock,
    },
    {
      value: '12h',
      label: '12-Hour AM/PM Format',
      description: 'Customer-facing commercial format (e.g. 02:30 PM). Ideal for retail storefronts.',
      icon: Clock,
    },
  ],
  default_report_orientation: [
    {
      value: 'portrait',
      label: 'Portrait (Vertical)',
      description: 'Standard document flow for invoices, bills, and single-column summaries.',
      icon: FileText,
    },
    {
      value: 'landscape',
      label: 'Landscape (Horizontal)',
      description: 'Wide multi-column layout for financial ledgers, inventory matrices, and payroll tables.',
      icon: FileSpreadsheet,
    },
  ],
  valuation_method: [
    {
      value: 'fifo',
      label: 'FIFO (First-In, First-Out)',
      description: 'Earliest purchased materials are expensed first. Ideal for perishable and batch manufacturing.',
      icon: Layers,
    },
    {
      value: 'avco',
      label: 'AVCO (Weighted Moving Average)',
      description: 'Continuously recalculates inventory unit cost on every goods receipt note (GRN).',
      icon: Layers,
    },
    {
      value: 'standard',
      label: 'Standard Costing',
      description: 'Fixed planned cost per unit with automated posting of price/quantity variances to GL.',
      icon: Layers,
    },
  ],
  scheduling_mode: [
    {
      value: 'strict_sequential',
      label: 'Strict Sequential Execution',
      description: 'Work orders must complete preceding stages before moving to subsequent work centers.',
      icon: Zap,
    },
    {
      value: 'parallel_batch',
      label: 'Parallel Batch Scheduling',
      description: 'Allows concurrent routing across multiple production lines and assembly cells.',
      icon: Cpu,
    },
    {
      value: 'capacity_driven',
      label: 'Dynamic Capacity-Driven',
      description: 'Auto-schedules based on machine uptime, worker availability, and stage queue limits.',
      icon: Layers,
    },
  ],
  default_export_format: [
    {
      value: 'pdf',
      label: 'Adobe PDF Document',
      description: 'Print-ready vector document with official letterhead, watermarks, and verification QR.',
      icon: FileText,
    },
    {
      value: 'excel',
      label: 'Microsoft Excel (*.xlsx)',
      description: 'Structured spreadsheet with formulated formulas, table headers, and raw numeric data.',
      icon: FileSpreadsheet,
    },
    {
      value: 'csv',
      label: 'Comma-Separated Values (*.csv)',
      description: 'Raw plain-text tabular stream for data warehouse ingestion and third-party BI pipelines.',
      icon: FileText,
    },
  ],
};
