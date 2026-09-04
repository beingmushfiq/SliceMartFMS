import React from 'react';
import {
  Clock,
  Layers,
  FileText,
  FileSpreadsheet,
  Cpu,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import type { SettingFieldSchema } from '../../../types/api/settings';
import { MultiChannelChipSelect } from './fields/MultiChannelChipSelect';
import { RangeSliderField } from './fields/RangeSliderField';
import { CurrencyAmountField } from './fields/CurrencyAmountField';
import { DurationStepperField } from './fields/DurationStepperField';
import { SegmentedRadioCards, type RadioOption } from './fields/SegmentedRadioCards';
import { BrandAssetField } from './fields/BrandAssetField';
import { PrefixSerialField } from './fields/PrefixSerialField';
import { EncryptedVaultField } from './fields/EncryptedVaultField';
import { SettingToggleCard } from './fields/SettingToggleCard';
import { LegalIdentifierField } from './fields/LegalIdentifierField';
import { AddressLocationField } from './fields/AddressLocationField';
import { ContactPhoneField } from './fields/ContactPhoneField';
import { ContactEmailField } from './fields/ContactEmailField';
import { NumericStepperField } from './fields/NumericStepperField';
import { FormattedNoteField } from './fields/FormattedNoteField';
import { DynamicTextField } from './fields/DynamicTextField';
import { SelectDropdown } from '../../../components/ui/Dropdown';

interface SettingFieldDispatcherProps {
  settingKey: string;
  meta: SettingFieldSchema;
  value: unknown;
  onChange: (val: unknown) => void;
  currencySymbol?: string;
  currencyCode?: string;
}

const SEGMENTED_OPTIONS: Record<string, RadioOption[]> = {
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

const DROPDOWN_OPTIONS: Record<string, Array<{ label: string; value: string }>> = {
  material_allocation_policy: [
    { label: 'FIFO (Earliest Received Stock First)', value: 'fifo' },
    { label: 'FEFO (First Expired, First Out)', value: 'fefo' },
    { label: 'LIFO (Latest In, First Out)', value: 'lifo' },
  ],
  default_payment_terms: [
    { label: 'Immediate / Due on Receipt', value: 'due_on_receipt' },
    { label: 'Net 15 Days', value: 'net_15' },
    { label: 'Net 30 Days', value: 'net_30' },
    { label: 'Net 60 Days', value: 'net_60' },
  ],
  credit_limit_action: [
    { label: 'Strictly Block New Sales Orders', value: 'block_order' },
    { label: 'Warn Sales Agent but Allow Submission', value: 'warn' },
    { label: 'Require Financial Director PIN Override', value: 'supervisor_pin' },
  ],
  receipt_printer_template: [
    { label: 'Standard Thermal POS (80mm Width)', value: 'thermal_80mm' },
    { label: 'Compact Thermal POS (58mm Width)', value: 'thermal_58mm' },
    { label: 'Formal Full-Page Invoice (A4 Standard)', value: 'standard_a4' },
  ],
  default_courier_provider: [
    { label: 'Steadfast Courier Logistics', value: 'steadfast' },
    { label: 'Pathao Courier & Parcel API', value: 'pathao' },
    { label: 'REDX Express Logistics', value: 'redx' },
    { label: 'Paperfly Smart Logistics', value: 'paperfly' },
  ],
  sms_provider: [
    { label: 'Greenweb SMS Gateway (Bangladesh)', value: 'greenweb' },
    { label: 'Twilio Global Communications', value: 'twilio' },
    { label: 'BulkSMS BD Enterprise', value: 'bulksmsbd' },
    { label: 'Infobip Global Messaging', value: 'infobip' },
  ],
  sampling_aql_standard: [
    { label: 'ISO 2859-1 / AQL Level II (Normal)', value: 'aql_level_ii' },
    { label: 'ISO 2859-1 / AQL Level I (Reduced Sampling)', value: 'aql_level_i' },
    { label: 'ISO 2859-1 / AQL Level III (Tightened Sampling)', value: 'aql_level_iii' },
  ],
  default_depreciation_method: [
    { label: 'Straight-Line Depreciation Method', value: 'straight_line' },
    { label: 'Declining-Balance Method', value: 'declining_balance' },
  ],
  default_paper_size: [
    { label: 'ISO A4 (210mm × 297mm)', value: 'a4' },
    { label: 'US Letter (8.5in × 11in)', value: 'letter' },
    { label: 'US Legal (8.5in × 14in)', value: 'legal' },
  ],
  asset_disposal_auth_role: [
    { label: 'Master SaaS Super Administrator', value: 'super_admin' },
    { label: 'Plant General Manager / Admin', value: 'admin' },
    { label: 'Chief Financial Officer / Director', value: 'finance_director' },
  ],
  date_format: [
    { label: 'YYYY-MM-DD (2026-08-29)', value: 'YYYY-MM-DD' },
    { label: 'DD/MM/YYYY (29/08/2026)', value: 'DD/MM/YYYY' },
    { label: 'MM/DD/YYYY (08/29/2026)', value: 'MM/DD/YYYY' },
    { label: 'DD-MMM-YYYY (29-Aug-2026)', value: 'DD-MMM-YYYY' },
  ],
  system_timezone: [
    { label: 'Asia/Dhaka (UTC+06:00)', value: 'Asia/Dhaka' },
    { label: 'Asia/Kolkata (UTC+05:30)', value: 'Asia/Kolkata' },
    { label: 'Asia/Dubai (UTC+04:00)', value: 'Asia/Dubai' },
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
    { label: 'America/New_York (UTC-05:00)', value: 'America/New_York' },
    { label: 'Europe/London (UTC+00:00)', value: 'Europe/London' },
  ],
  system_language: [
    { label: 'English (US / International)', value: 'en' },
    { label: 'Bengali / বাংলা (Local BD Interface)', value: 'bn' },
  ],
};

export const SettingFieldDispatcher: React.FC<SettingFieldDispatcherProps> = ({
  settingKey,
  meta,
  value,
  onChange,
  currencySymbol = '৳',
  currencyCode = 'BDT',
}) => {
  // 1. Encrypted Sensitive Credential Fields
  if (meta.sensitive) {
    return (
      <EncryptedVaultField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={onChange}
      />
    );
  }

  // 2. Boolean Operational Toggle Switches
  if (meta.type === 'boolean') {
    return (
      <SettingToggleCard
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={onChange}
      />
    );
  }

  // 3. Multi-Channel JSON Array Fields
  if (
    meta.type === 'json' ||
    settingKey.endsWith('_channels') ||
    settingKey === 'allowed_payment_methods'
  ) {
    return (
      <MultiChannelChipSelect
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={onChange}
      />
    );
  }

  // 4. Percentage & Ratio Slider Fields
  if (
    settingKey.includes('percent') ||
    settingKey.includes('tolerance') ||
    settingKey === 'sampling_percentage' ||
    settingKey === 'cod_charge_percentage'
  ) {
    return (
      <RangeSliderField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={onChange}
        min={0}
        max={settingKey.includes('yield') ? 100 : settingKey.includes('discount') ? 50 : 30}
        step={0.5}
      />
    );
  }

  // 5. Monetary Amount Fields
  if (
    settingKey.includes('_amount') ||
    settingKey.includes('threshold_amount') ||
    settingKey === 'min_order_amount' ||
    settingKey === 'free_shipping_threshold' ||
    settingKey === 'max_cash_drawer_variance_alert'
  ) {
    return (
      <CurrencyAmountField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={onChange}
        currencySymbol={currencySymbol}
        currencyCode={currencyCode}
      />
    );
  }

  // 6. Corporate & Legal Registration Identifiers
  if (
    settingKey === 'company_legal_name' ||
    settingKey === 'trade_license_no' ||
    settingKey === 'tax_identification_number' ||
    settingKey === 'rjsc_registration_no' ||
    settingKey === 'factory_license_no' ||
    settingKey === 'bin_branch_code'
  ) {
    return (
      <LegalIdentifierField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={(val) => onChange(val)}
      />
    );
  }

  // 7. Headquarters & Plant Physical Address Fields
  if (settingKey.includes('address') || settingKey.includes('location')) {
    return (
      <AddressLocationField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={(val) => onChange(val)}
      />
    );
  }

  // 8. Telephone & Direct Operations Hotline Fields
  if (
    settingKey.includes('phone') ||
    settingKey.includes('hotline') ||
    settingKey.includes('mobile') ||
    settingKey === 'whatsapp_business_number'
  ) {
    return (
      <ContactPhoneField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={(val) => onChange(val)}
      />
    );
  }

  // 9. Official & Transactional Email Fields
  if (settingKey.includes('email')) {
    return (
      <ContactEmailField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={(val) => onChange(val)}
      />
    );
  }

  // 10. Customer Greetings, Receipt Notes & Hero Copy
  if (
    settingKey.includes('note') ||
    settingKey.includes('tagline') ||
    settingKey.includes('hero_') ||
    settingKey.includes('message') ||
    settingKey === 'default_walk_in_customer'
  ) {
    return (
      <FormattedNoteField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={(val) => onChange(val)}
      />
    );
  }

  // 11. Duration & Lead-Time Stepper Fields
  if (
    settingKey.endsWith('_days') ||
    settingKey.endsWith('_minutes') ||
    settingKey.endsWith('_months')
  ) {
    const unit = settingKey.endsWith('_minutes')
      ? 'Minutes'
      : settingKey.endsWith('_months')
      ? 'Months'
      : 'Days';

    return (
      <DurationStepperField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={onChange}
        unit={unit}
        min={1}
        max={unit === 'Minutes' ? 1440 : unit === 'Months' ? 24 : 365}
      />
    );
  }

  // 12. Brand Asset & Image Fields
  if (
    settingKey === 'brand_logo_url' ||
    settingKey === 'brand_favicon_url' ||
    (settingKey.endsWith('_url') && !settingKey.includes('api'))
  ) {
    return (
      <BrandAssetField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={onChange}
      />
    );
  }

  // 13. Document Prefix Fields
  if (settingKey.endsWith('_prefix')) {
    return (
      <PrefixSerialField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={onChange}
      />
    );
  }

  // 14. Visual Segmented Radio Cards
  if (SEGMENTED_OPTIONS[settingKey]) {
    return (
      <SegmentedRadioCards
        label={meta.label}
        settingKey={settingKey}
        value={value}
        options={SEGMENTED_OPTIONS[settingKey]}
        onChange={onChange}
      />
    );
  }

  // 15. Curated Dropdowns with High-Polish Header & Badge
  const dropdownOpts = DROPDOWN_OPTIONS[settingKey];
  if (dropdownOpts) {
    return (
      <div className="p-4 rounded-xl border border-default bg-surface space-y-3 hover:border-primary/30 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <SlidersHorizontal className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-default">{meta.label}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  Curated Policy
                </span>
              </div>
              <p className="text-2xs text-muted mt-0.5">Select approved enterprise standard.</p>
            </div>
          </div>
        </div>
        <SelectDropdown
          options={dropdownOpts}
          value={typeof value === 'string' ? value : String(meta.default ?? '')}
          onChange={(val) => onChange(val)}
          size="md"
          buttonClassName="w-full"
          aria-label={meta.label}
        />
      </div>
    );
  }

  // 16. Purpose-Built Numeric Steppers for Counts, Multipliers, Chars, Hours
  if (meta.type === 'number') {
    return (
      <NumericStepperField
        label={meta.label}
        settingKey={settingKey}
        value={value}
        onChange={(val) => onChange(val)}
        min={0}
      />
    );
  }

  // 17. High-Polish Dynamic Text Field (Replaces plain raw text input)
  return (
    <DynamicTextField
      label={meta.label}
      settingKey={settingKey}
      value={value}
      onChange={(val) => onChange(val)}
    />
  );
};
