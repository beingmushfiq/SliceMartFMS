// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS CENTER WORKSPACE — Enterprise Governance & Configuration
// ───────────────────────────────────────────────────────────────────────────
// Fully token-compliant architecture (UI_SYSTEM.md §2, §10.2).
// - Zero hardcoded primitive colors
// - WAI-ARIA accessible overlays with focus trapping (Modal, ConfirmDialog)
// - Native design system form controls (FormElements)
// - Transient confirmations via notify (Sonner)
// - Motion-enhanced panel crossfades with AnimatePresence
// - Shimmer skeleton states
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Settings,
  Building2,
  Factory,
  Package,
  ShoppingCart,
  BadgePercent,
  Monitor,
  ShoppingBag,
  Globe,
  Truck,
  PlugZap,
  CheckSquare,
  Users,
  Cpu,
  Landmark,
  Bell,
  ShieldCheck,
  FileSpreadsheet,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  RefreshCw,
  Copy,
  Plus,
  Trash2,
  Lock,
  Activity,
  Check,
  AlertTriangle,
  CircleCheckBig,
  Boxes,
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api/client';
import { cn } from '../../lib/utils';
import { enterFast } from '../../lib/motion/tokens';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Input, Select, SearchInput, FormGroup } from '../../components/ui/FormElements';
import { notify } from '../../components/ui/Toast';
import { DocumentsSection } from './documents/DocumentsSection';
import { ModuleManagerSection } from './sections/ModuleManagerSection';
import { ProductionStagesSection } from './sections/ProductionStagesSection';
import { CustomFieldsManagerSection } from './sections/CustomFieldsManagerSection';
import { TerminologySection } from './sections/TerminologySection';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import type {
  SettingsSchemaDictionary,
  SettingItem,
  ConnectionTestResult,
} from '../../types/api/settings';
import type { TenantDomainRecord } from '../../types/api/domains';

const GROUP_ICONS: Record<string, React.ElementType> = {
  general: Building2,
  modules: Boxes,
  terminology: FileSpreadsheet,
  production_stages: Factory,
  custom_fields: Sparkles,
  documents: FileSpreadsheet,
  production: Factory,
  inventory: Package,
  purchase: ShoppingCart,
  sales: BadgePercent,
  pos: Monitor,
  ecommerce: ShoppingBag,
  custom_domains: Globe,
  delivery: Truck,
  integrations: PlugZap,
  qc: CheckSquare,
  hr_payroll: Users,
  assets: Cpu,
  finance: Landmark,
  notifications: Bell,
  security: ShieldCheck,
  reports: FileSpreadsheet,
};

const CATEGORIES = [
  {
    name: 'Universal Architecture & Config',
    groups: ['modules', 'terminology', 'production_stages', 'custom_fields'],
  },
  {
    name: 'Enterprise Core',
    groups: ['general', 'documents', 'security', 'notifications', 'reports'],
  },
  {
    name: 'Manufacturing & Stock',
    groups: ['production', 'inventory', 'qc', 'assets'],
  },
  {
    name: 'Procurement & Commercial',
    groups: ['purchase', 'sales', 'pos'],
  },
  {
    name: 'E-Commerce & Domains',
    groups: ['ecommerce', 'custom_domains'],
  },
  {
    name: 'Logistics & Connected APIs',
    groups: ['delivery', 'integrations', 'finance', 'hr_payroll'],
  },
];

type SettingFieldValue = string | number | boolean | string[] | Record<string, unknown>;

// Predefined option definitions for dropdown fields
const FIELD_OPTIONS: Record<string, Array<{ label: string; value: string }>> = {
  valuation_method: [
    { label: 'FIFO (First-In, First-Out)', value: 'fifo' },
    { label: 'AVCO (Weighted Moving Average Cost)', value: 'avco' },
    { label: 'Standard Costing', value: 'standard' },
  ],
  scheduling_mode: [
    { label: 'Strict Sequential Execution', value: 'strict_sequential' },
    { label: 'Parallel Batch Scheduling', value: 'parallel_batch' },
    { label: 'Dynamic Capacity-Driven', value: 'capacity_driven' },
  ],
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
  default_export_format: [
    { label: 'Adobe PDF Document (*.pdf)', value: 'pdf' },
    { label: 'Microsoft Excel Spreadsheet (*.xlsx)', value: 'excel' },
    { label: 'Comma-Separated Values (*.csv)', value: 'csv' },
  ],
  default_paper_size: [
    { label: 'ISO A4 (210mm × 297mm)', value: 'a4' },
    { label: 'US Letter (8.5in × 11in)', value: 'letter' },
    { label: 'US Legal (8.5in × 14in)', value: 'legal' },
  ],
  default_report_orientation: [
    { label: 'Portrait (Vertical Layout)', value: 'portrait' },
    { label: 'Landscape (Horizontal Table View)', value: 'landscape' },
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
  time_format: [
    { label: '24-Hour Military Format (14:30)', value: '24h' },
    { label: '12-Hour AM/PM Format (02:30 PM)', value: '12h' },
  ],
  system_timezone: [
    { label: 'Asia/Dhaka (UTC+06:00)', value: 'Asia/Dhaka' },
    { label: 'Asia/Kolkata (UTC+05:30)', value: 'Asia/Kolkata' },
    { label: 'Asia/Dubai (UTC+04:00)', value: 'Asia/Dubai' },
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
    { label: 'America/New_York (UTC-05:00)', value: 'America/New_York' },
    { label: 'Europe/London (UTC+00:00)', value: 'Europe/London' },
  ],
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export const SettingsCenterWorkspace: React.FC = () => {
  const [schema, setSchema] = useState<SettingsSchemaDictionary>({});
  const [activeGroup, setActiveGroup] = useWorkspaceTab<string>(
    'general',
    [
      'general',
      'modules',
      'terminology',
      'production_stages',
      'custom_fields',
      'documents',
      'production',
      'inventory',
      'purchase',
      'sales',
      'pos',
      'ecommerce',
      'custom_domains',
      'delivery',
      'integrations',
      'qc',
      'hr_payroll',
      'assets',
      'finance',
      'notifications',
      'security',
      'reports',
    ] as const,
    'tab'
  );
  const [formValues, setFormValues] = useState<Record<string, SettingFieldValue>>({});
  const [initialValues, setInitialValues] = useState<Record<string, SettingFieldValue>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Inline error message for region
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dialog & Modal states
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmDeleteDomain, setConfirmDeleteDomain] = useState<{ id: number; domain: string } | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testProvider, setTestProvider] = useState('steadfast');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  // Custom Domains State
  const [domains, setDomains] = useState<TenantDomainRecord[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [addDomainModalOpen, setAddDomainModalOpen] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [newDomainType, setNewDomainType] = useState<'custom_primary' | 'custom_alias'>('custom_alias');
  const [domainActionLoading, setDomainActionLoading] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    notify.info('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Load Schema Dictionary
  useEffect(() => {
    let isMounted = true;
    const loadSchema = async () => {
      try {
        const res = await api.get<SettingsSchemaDictionary>('/settings/schema');
        if (isMounted && res.data) {
          setSchema(res.data);
        }
      } catch (err: unknown) {
        console.error('Failed to load settings schema', err);
      }
    };
    loadSchema();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadDomains = useCallback(async () => {
    try {
      setDomainsLoading(true);
      setErrorMessage(null);
      const res = await api.get<TenantDomainRecord[]>('/storefront/domains');
      if (Array.isArray(res.data)) {
        setDomains(res.data);
      }
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'Failed to load custom domains'));
    } finally {
      setDomainsLoading(false);
      setLoading(false);
    }
  }, []);

  const loadGroupSettings = useCallback(async (group: string) => {
    if (['modules', 'terminology', 'production_stages', 'custom_fields', 'documents'].includes(group)) {
      setLoading(false);
      return;
    }

    if (group === 'custom_domains') {
      await loadDomains();
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.get<{ group: string; settings: Record<string, SettingItem> }>(
        `/settings/${group}`
      );

      if (res.data?.settings) {
        const fetched = res.data.settings;

        const initial: Record<string, SettingFieldValue> = {};
        Object.entries(fetched).forEach(([k, v]) => {
          initial[k] = (v as SettingItem).value;
        });
        setFormValues(initial);
        setInitialValues(initial);
      }
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, [loadDomains]);

  useEffect(() => {
    let ignore = false;
    const executeLoad = async () => {
      if (ignore) return;
      await loadGroupSettings(activeGroup);
    };
    void executeLoad();
    return () => {
      ignore = true;
    };
  }, [activeGroup, loadGroupSettings]);

  // Compute Unsaved Changes
  const hasChanges = useMemo(() => {
    if (activeGroup === 'custom_domains') return false;
    return Object.keys(formValues).some((key) => {
      return JSON.stringify(formValues[key]) !== JSON.stringify(initialValues[key]);
    });
  }, [formValues, initialValues, activeGroup]);

  // Save Settings Handler
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);

      const payload: Record<string, SettingFieldValue> = {};
      Object.keys(formValues).forEach((key) => {
        if (JSON.stringify(formValues[key]) !== JSON.stringify(initialValues[key])) {
          const val = formValues[key];
          if (val !== undefined) {
            payload[key] = val;
          }
        }
      });

      const res = await api.put<{ group: string; settings: Record<string, SettingItem> }>(
        `/settings/${activeGroup}`,
        { settings: payload }
      );

      if (res.data?.settings) {
        notify.success('Settings saved successfully');
        const updated = res.data.settings;

        const initial: Record<string, SettingFieldValue> = {};
        Object.entries(updated).forEach(([k, v]) => {
          initial[k] = (v as SettingItem).value;
        });
        setFormValues(initial);
        setInitialValues(initial);
      }
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  // Reset Group to Defaults
  const handleResetToDefault = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      const res = await api.post<{ group: string; settings: Record<string, SettingItem> }>(
        `/settings/${activeGroup}/reset`
      );

      if (res.data?.settings) {
        notify.success('Settings reset to default values');
        const updated = res.data.settings;

        const initial: Record<string, SettingFieldValue> = {};
        Object.entries(updated).forEach(([k, v]) => {
          initial[k] = (v as SettingItem).value;
        });
        setFormValues(initial);
        setInitialValues(initial);
        setConfirmResetOpen(false);
      }
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'Failed to reset settings'));
    } finally {
      setSaving(false);
    }
  };

  // Live Test Connection Handler
  const handleRunTestConnection = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);

      const res = await api.post<ConnectionTestResult>(
        `/settings/${activeGroup === 'integrations' ? 'integrations' : 'delivery'}/test-connection`,
        {
          provider: testProvider,
          credentials: formValues,
        }
      );

      if (res.data) {
        setTestResult(res.data);
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        provider: testProvider,
        status: 'failed',
        message: extractErrorMessage(err, 'Connection test failed'),
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Custom Domain Handlers
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;

    try {
      setDomainActionLoading(-1);
      setErrorMessage(null);

      const res = await api.post<TenantDomainRecord>('/storefront/domains', {
        domain: newDomainInput.trim(),
        type: newDomainType,
      });

      if (res.data) {
        notify.success('Domain registered. Please configure DNS records.');
        setAddDomainModalOpen(false);
        setNewDomainInput('');
        loadDomains();
      }
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'Failed to add custom domain'));
    } finally {
      setDomainActionLoading(null);
    }
  };

  const handleVerifyDomain = async (id: number) => {
    try {
      setDomainActionLoading(id);
      setErrorMessage(null);

      const res = await api.post<TenantDomainRecord>(`/storefront/domains/${id}/verify`);

      if (res.data) {
        notify.success('Domain ownership verified successfully');
        loadDomains();
      }
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'DNS verification record was not detected yet. Check propagation.'));
      loadDomains();
    } finally {
      setDomainActionLoading(null);
    }
  };

  const handleSetPrimaryDomain = async (id: number) => {
    try {
      setDomainActionLoading(id);
      setErrorMessage(null);

      const res = await api.post<TenantDomainRecord>(`/storefront/domains/${id}/set-primary`);

      if (res.data) {
        notify.success('Primary storefront domain updated');
        loadDomains();
      }
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'Failed to set primary domain'));
    } finally {
      setDomainActionLoading(null);
    }
  };

  const handleDeleteDomain = async () => {
    if (!confirmDeleteDomain) return;

    try {
      setDomainActionLoading(confirmDeleteDomain.id);
      setErrorMessage(null);

      await api.delete(`/storefront/domains/${confirmDeleteDomain.id}`);
      notify.success('Custom domain removed successfully');
      setConfirmDeleteDomain(null);
      loadDomains();
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'Failed to remove domain'));
    } finally {
      setDomainActionLoading(null);
    }
  };

  // Filtered settings by search query
  const filteredKeys = useMemo(() => {
    if (activeGroup === 'custom_domains') return [];
    const groupSettings = schema[activeGroup]?.settings || {};
    if (!searchQuery.trim()) {
      return Object.keys(groupSettings);
    }

    const q = searchQuery.toLowerCase();
    return Object.keys(groupSettings).filter((key) => {
      const meta = groupSettings[key];
      return (
        key.toLowerCase().includes(q) ||
        (meta && meta.label.toLowerCase().includes(q))
      );
    });
  }, [schema, activeGroup, searchQuery]);

  const activeGroupMeta = schema[activeGroup];
  const ActiveIcon = GROUP_ICONS[activeGroup] || Settings;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 bg-danger-subtle border border-danger rounded-(--card-radius) text-danger flex items-center justify-between text-sm shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden="true" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-danger hover:opacity-80 font-bold text-lg leading-none p-1 focus-visible:ring-focus rounded-md"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Surface */}
      <div className="bg-surface border border-default rounded-(--card-radius) p-6 shadow-(--card-shadow)">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="primary-subtle" icon={Sparkles}>
                Enterprise Governance
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-default flex items-center gap-2.5">
              <Settings className="size-6 text-primary" aria-hidden="true" />
              Platform Configuration Center
            </h1>
            <p className="text-muted text-xs sm:text-sm max-w-2xl leading-relaxed">
              Configure industrial thresholds, policy rules, API gateways, custom storefront domains, and multi-channel notifications. All mutations are secured with audit logging.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search parameters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Navigation: 16 Categorized Domains + Custom Domains */}
        <div className="lg:col-span-1 space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="space-y-1.5">
              <div className="px-3 text-2xs font-bold uppercase tracking-wider text-muted">
                {cat.name}
              </div>
              <div className="space-y-1">
                {cat.groups.map((groupKey) => {
                  const meta = schema[groupKey];
                  const Icon = GROUP_ICONS[groupKey] || Settings;
                  const isActive = activeGroup === groupKey;
                  const label = groupKey === 'custom_domains' ? 'Custom Domains' : meta?.title || groupKey;

                  return (
                    <button
                      key={groupKey}
                      onClick={() => {
                        if (hasChanges) {
                          notify.info('You have unsaved changes in this domain. Please save or discard before switching.');
                          return;
                        }
                        setActiveGroup(groupKey);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-(--button-radius) text-xs font-semibold transition-token-colors focus-visible:ring-focus outline-none text-left',
                        isActive
                          ? 'bg-primary text-primary-fg shadow-xs font-bold'
                          : 'bg-surface text-default border border-default hover:bg-surface-sunken'
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary-fg' : 'text-primary')} aria-hidden="true" />
                        <span className="truncate">{label}</span>
                      </div>
                      {hasChanges && isActive && (
                        <span className="size-2 rounded-full bg-accent animate-pulse shrink-0" aria-label="Unsaved changes" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <m.div
              key={activeGroup}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={enterFast}
              className="bg-surface rounded-(--card-radius) border border-default shadow-(--card-shadow) p-6 space-y-6"
            >
              {activeGroup === 'modules' ? (
                /* Dynamic Module Ecosystem Activation */
                <ModuleManagerSection />
              ) : activeGroup === 'terminology' ? (
                /* Dynamic Vocabulary & Terminology */
                <TerminologySection />
              ) : activeGroup === 'production_stages' ? (
                /* Dynamic Production Stages & Routing */
                <ProductionStagesSection />
              ) : activeGroup === 'custom_fields' ? (
                /* Custom Attributes & Extended Metadata */
                <CustomFieldsManagerSection />
              ) : activeGroup === 'documents' ? (
                /* Centralized Document Templates & Printing Infrastructure */
                <DocumentsSection />
              ) : activeGroup === 'custom_domains' ? (
                /* Custom Domain Management Hub */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-default">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="size-5 text-primary" aria-hidden="true" />
                        <h2 className="text-md font-bold text-default">Custom Storefront Domains</h2>
                      </div>
                      <p className="text-xs text-muted">
                        Connect your brand domain to your e-commerce storefront with automated DNS verification and edge SSL termination.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadDomains}
                        disabled={domainsLoading}
                      >
                        <RefreshCw className={cn('size-3.5 mr-1.5', domainsLoading && 'animate-spin')} aria-hidden="true" />
                        Refresh
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setAddDomainModalOpen(true)}
                      >
                        <Plus className="size-3.5 mr-1.5" aria-hidden="true" />
                        Add Custom Domain
                      </Button>
                    </div>
                  </div>

                  {/* Domains Table / List */}
                  {domainsLoading ? (
                    <div className="space-y-3 py-4">
                      <div className="skeleton-shimmer h-20 w-full" />
                      <div className="skeleton-shimmer h-20 w-full" />
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <Globe className="size-10 text-muted mx-auto" aria-hidden="true" />
                      <h3 className="text-sm font-semibold text-default">No Custom Domains Registered</h3>
                      <p className="text-xs text-muted max-w-sm mx-auto">
                        You are currently serving the default platform subdomain. Add your branded domain to initiate DNS ownership verification.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {domains.map((dom) => {
                        const isPrimary = dom.is_primary;
                        const isPlatform = dom.type === 'platform_subdomain';
                        const isVerified = dom.verification_status === 'verified';

                        return (
                          <div
                            key={dom.id}
                            className={cn(
                              'p-5 rounded-(--card-radius) border transition-token-colors',
                              isPrimary
                                ? 'border-primary bg-primary-subtle'
                                : 'border-default bg-surface hover:border-strong'
                            )}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="font-mono text-sm font-bold text-default">{dom.domain}</span>
                                  {isPrimary && (
                                    <Badge tone="primary-subtle">
                                      Primary Storefront
                                    </Badge>
                                  )}
                                  {isPlatform && (
                                    <Badge tone="surface-sunken">
                                      Platform Managed
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <span>Verification:</span>
                                    <StatusBadge
                                      status={dom.verification_status === 'verified' ? 'approved' : dom.verification_status === 'failed' ? 'failed' : 'pending'}
                                      label={dom.verification_status.toUpperCase()}
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span>SSL Status:</span>
                                    {dom.ssl_status === 'active' ? (
                                      <Badge tone="success-subtle" icon={CircleCheckBig}>SSL Active</Badge>
                                    ) : (
                                      <Badge tone="surface-sunken">SSL Inactive</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {!isVerified && !isPlatform && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleVerifyDomain(dom.id)}
                                    loading={domainActionLoading === dom.id}
                                  >
                                    <RefreshCw className="size-3.5 mr-1.5" aria-hidden="true" />
                                    Verify DNS
                                  </Button>
                                )}

                                {isVerified && !isPrimary && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleSetPrimaryDomain(dom.id)}
                                    loading={domainActionLoading === dom.id}
                                  >
                                    Set as Primary
                                  </Button>
                                )}

                                {!isPlatform && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmDeleteDomain({ id: dom.id, domain: dom.domain })}
                                    disabled={domainActionLoading === dom.id}
                                    aria-label={`Remove domain ${dom.domain}`}
                                  >
                                    <Trash2 className="size-4 text-danger" aria-hidden="true" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* DNS Instructions Card for Unverified Domain */}
                            {!isVerified && !isPlatform && dom.dns_records_expected && (
                              <div className="mt-4 pt-4 border-t border-default bg-surface-sunken p-3.5 rounded-lg space-y-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-default">
                                  <Info className="size-4 text-primary" aria-hidden="true" />
                                  Required DNS Configuration Records
                                </div>
                                <p className="text-2xs text-muted">
                                  Add the following DNS records at your domain registrar (e.g. Cloudflare, Namecheap, GoDaddy):
                                </p>

                                <div className="space-y-2 font-mono text-xs">
                                  {dom.dns_records_expected.txt_record && (
                                    <div className="p-2.5 bg-surface border border-default rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div className="space-y-0.5 min-w-0">
                                        <div className="text-2xs font-bold text-primary uppercase">TXT Record (Ownership Challenge)</div>
                                        <div className="text-default break-all">
                                          <span className="text-muted">Host:</span> {dom.dns_records_expected.txt_record.host}
                                        </div>
                                        <div className="text-default break-all">
                                          <span className="text-muted">Value:</span> {dom.dns_records_expected.txt_record.value}
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(dom.dns_records_expected?.txt_record?.value || '', `txt-${dom.id}`)}
                                        aria-label="Copy TXT Value"
                                      >
                                        {copiedKey === `txt-${dom.id}` ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                                      </Button>
                                    </div>
                                  )}

                                  {dom.dns_records_expected.cname_record && (
                                    <div className="p-2.5 bg-surface border border-default rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div className="space-y-0.5 min-w-0">
                                        <div className="text-2xs font-bold text-primary uppercase">CNAME Record (Storefront Routing)</div>
                                        <div className="text-default break-all">
                                          <span className="text-muted">Host:</span> {dom.dns_records_expected.cname_record.host}
                                        </div>
                                        <div className="text-default break-all">
                                          <span className="text-muted">Target:</span> {dom.dns_records_expected.cname_record.value}
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(dom.dns_records_expected?.cname_record?.value || '', `cname-${dom.id}`)}
                                        aria-label="Copy CNAME Target"
                                      >
                                        {copiedKey === `cname-${dom.id}` ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Standard 16-Domain Form View */
                <div className="space-y-6">
                  {/* Domain Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-default">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ActiveIcon className="size-5 text-primary" aria-hidden="true" />
                        <h2 className="text-md font-bold text-default">
                          {activeGroupMeta?.title || activeGroup}
                        </h2>
                      </div>
                      <p className="text-xs text-muted max-w-xl">
                        {activeGroupMeta?.description || 'Configure parameters for this domain.'}
                      </p>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2">
                      {(activeGroup === 'delivery' || activeGroup === 'integrations') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setTestProvider(activeGroup === 'delivery' ? 'steadfast' : 'bkash');
                            setTestResult(null);
                            setTestModalOpen(true);
                          }}
                        >
                          <Activity className="size-3.5 mr-1.5 text-primary" aria-hidden="true" />
                          Test Connection
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmResetOpen(true)}
                        disabled={saving}
                      >
                        <RotateCcw className="size-3.5 mr-1.5" aria-hidden="true" />
                        Reset to Default
                      </Button>
                    </div>
                  </div>

                  {/* Loading Skeleton */}
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton-shimmer h-24 rounded-(--card-radius)" />
                      ))}
                    </div>
                  ) : filteredKeys.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted">
                      No configuration parameters match "{searchQuery}".
                    </div>
                  ) : (
                    /* Dynamic Form Fields Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredKeys.map((key) => {
                        const meta = activeGroupMeta?.settings[key];
                        if (!meta) return null;

                        const currentValue = formValues[key];
                        const isSensitive = meta.sensitive;
                        const isRevealed = revealedSecrets[key];
                        const options = FIELD_OPTIONS[key];

                        return (
                          <div
                            key={key}
                            className={cn(
                              'p-4 rounded-(--card-radius) border transition-token-colors',
                              meta.type === 'boolean'
                                ? 'flex items-center justify-between gap-4 md:col-span-2 bg-surface-sunken border-default'
                                : 'space-y-2 bg-surface border-default'
                            )}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-default">{meta.label}</span>
                                {isSensitive && (
                                  <Badge tone="danger-subtle" icon={Lock}>
                                    Encrypted
                                  </Badge>
                                )}
                              </div>
                              <span className="font-mono text-2xs text-muted block">{key}</span>
                            </div>

                            {/* Input Controls */}
                            {meta.type === 'boolean' ? (
                              <button
                                type="button"
                                role="switch"
                                aria-checked={Boolean(currentValue)}
                                onClick={() => setFormValues((prev) => ({ ...prev, [key]: !prev[key] }))}
                                className={cn(
                                  'w-11 h-6 flex items-center rounded-full p-1 transition-token-colors focus-visible:ring-focus outline-none cursor-pointer',
                                  currentValue ? 'bg-primary' : 'bg-surface-sunken border border-default'
                                )}
                              >
                                <div
                                  className={cn(
                                    'bg-surface w-4 h-4 rounded-full shadow-xs transform transition-transform duration-150',
                                    currentValue ? 'translate-x-5 bg-primary-fg' : 'translate-x-0'
                                  )}
                                />
                              </button>
                            ) : options ? (
                              /* Predefined Select */
                              <Select
                                value={typeof currentValue === 'string' ? currentValue : String(meta.default ?? '')}
                                onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                              >
                                {options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </Select>
                            ) : meta.type === 'number' ? (
                              /* Number Input */
                              <Input
                                type="number"
                                step="any"
                                value={typeof currentValue === 'number' || typeof currentValue === 'string' ? currentValue : ''}
                                onChange={(e) =>
                                  setFormValues((prev) => ({
                                    ...prev,
                                    [key]: e.target.value === '' ? '' : Number(e.target.value),
                                  }))
                                }
                              />
                            ) : meta.type === 'json' ? (
                              /* JSON Array Input */
                              <Input
                                type="text"
                                value={Array.isArray(currentValue) ? currentValue.join(', ') : JSON.stringify(currentValue ?? [])}
                                onChange={(e) => {
                                  const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                  setFormValues((prev) => ({ ...prev, [key]: arr }));
                                }}
                                placeholder="e.g. in_app, email, sms"
                              />
                            ) : isSensitive ? (
                              /* Masked Sensitive Secret Input */
                              <Input
                                type={isRevealed ? 'text' : 'password'}
                                value={typeof currentValue === 'string' ? currentValue : ''}
                                onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                                placeholder="••••••••"
                                rightElement={
                                  <button
                                    type="button"
                                    onClick={() => setRevealedSecrets((prev) => ({ ...prev, [key]: !prev[key] }))}
                                    className="p-1 text-muted hover:text-default transition-token-colors focus-visible:ring-focus rounded-md"
                                    aria-label={isRevealed ? 'Hide secret' : 'Show secret'}
                                  >
                                    {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                  </button>
                                }
                              />
                            ) : (
                              /* Default Text Input */
                              <Input
                                type="text"
                                value={typeof currentValue === 'string' || typeof currentValue === 'number' ? currentValue : ''}
                                onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Unsaved Changes Bottom Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-raised text-default px-6 py-3.5 rounded-(--card-radius) shadow-overlay border border-default flex items-center gap-6 animate-rise-in">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
            <span className="text-xs font-semibold">You have unsaved changes in this domain.</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFormValues(initialValues)}
              disabled={saving}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={saving}
            >
              <Save className="size-3.5 mr-1.5" aria-hidden="true" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Add Custom Domain Modal */}
      <Modal
        open={addDomainModalOpen}
        onClose={() => setAddDomainModalOpen(false)}
        title="Add Custom Storefront Domain"
        size="md"
      >
        <form onSubmit={handleAddDomain} className="space-y-4">
          <FormGroup
            label="Domain Name (FQDN)"
            required
            helper="Do not include http:// or trailing slashes (e.g. shop.slicemart.tech or slicemart.com)."
          >
            <Input
              type="text"
              placeholder="shop.slicemart.tech"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup label="Domain Role" required>
            <Select
              value={newDomainType}
              onChange={(e) => setNewDomainType(e.target.value as 'custom_primary' | 'custom_alias')}
            >
              <option value="custom_alias">Custom Alias Domain</option>
              <option value="custom_primary">Primary Brand Storefront Domain</option>
            </Select>
          </FormGroup>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setAddDomainModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={domainActionLoading === -1}
            >
              Register Domain
            </Button>
          </div>
        </form>
      </Modal>

      {/* Test Live Connection Modal */}
      <Modal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Live Gateway Diagnostic Tester"
        size="md"
      >
        <div className="space-y-4">
          <FormGroup label="Select Integration / Gateway">
            <Select
              value={testProvider}
              onChange={(e) => {
                setTestProvider(e.target.value);
                setTestResult(null);
              }}
            >
              <option value="steadfast">Steadfast Courier Logistics API</option>
              <option value="pathao">Pathao Logistics OAuth2 API</option>
              <option value="redx">REDX Parcel API</option>
              <option value="bkash">bKash Payment Gateway (PGW)</option>
              <option value="nagad">Nagad Direct Payment API</option>
              <option value="sslcommerz">SSLCommerz Hosted Gateway</option>
              <option value="sms">SMS Provider Gateway</option>
              <option value="whatsapp">Meta WhatsApp Cloud API</option>
            </Select>
          </FormGroup>

          {testResult && (
            <div
              className={cn(
                'p-4 rounded-(--card-radius) border text-xs space-y-2',
                testResult.success
                  ? 'bg-success-subtle border-success text-success'
                  : 'bg-danger-subtle border-danger text-danger'
              )}
            >
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5">
                  {testResult.success ? (
                    <CircleCheckBig className="size-4 text-success" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="size-4 text-danger" aria-hidden="true" />
                  )}
                  <span>{testResult.provider || testProvider}</span>
                </div>
                {testResult.latency_ms && (
                  <span className="px-2 py-0.5 bg-surface rounded-md text-2xs font-mono border border-default text-default">
                    {testResult.latency_ms} ms
                  </span>
                )}
              </div>
              <p className="text-2xs leading-relaxed text-default">{testResult.message}</p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setTestModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={handleRunTestConnection}
              loading={testLoading}
            >
              <RefreshCw className={cn('size-3.5 mr-1.5', testLoading && 'animate-spin')} aria-hidden="true" />
              Run Diagnostic
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetToDefault}
        title={`Reset '${schema[activeGroup]?.title || activeGroup}' Settings?`}
        message="Are you sure you want to reset this domain's configuration to platform defaults? Any custom overrides will be lost."
        confirmLabel="Reset to Defaults"
        variant="danger"
        loading={saving}
      />

      {/* Delete Domain Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmDeleteDomain)}
        onClose={() => setConfirmDeleteDomain(null)}
        onConfirm={handleDeleteDomain}
        title={`Remove Custom Domain '${confirmDeleteDomain?.domain}'?`}
        message="Are you sure you want to remove this domain? Web traffic routing to your storefront through this domain will cease immediately."
        confirmLabel="Remove Domain"
        variant="danger"
        loading={domainActionLoading === confirmDeleteDomain?.id}
      />
    </div>
  );
};
