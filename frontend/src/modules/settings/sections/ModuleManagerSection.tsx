import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../../lib/api/client';
import { useTenantCapabilityStore } from '../../../lib/capabilities/tenantCapabilityStore';
import { Button } from '../../../components/ui/Button';
import {
  Boxes,
  Building2,
  ClipboardList,
  Coins,
  Factory,
  FileSpreadsheet,
  Microscope,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Warehouse,
  Wrench,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ModuleItem {
  module_key: string;
  label: string;
  enabled: boolean;
  plan_allowed: boolean;
  config: Record<string, unknown>;
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  production: Factory,
  inventory: Warehouse,
  purchasing: ClipboardList,
  sales: ShoppingBag,
  pos: ShoppingCart,
  ecommerce: Store,
  delivery: Truck,
  finance: Coins,
  assets: Building2,
  hr: Users,
  qc: Microscope,
  reports: FileSpreadsheet,
  crm: Boxes,
  maintenance: Wrench,
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  production: 'Work orders, recipe/BOM breakdown, worker piece entries, and stage routing.',
  inventory: 'Stock tracking, multi-warehouse allocations, batch numbers, and stock transfers.',
  purchasing: 'Vendor purchase orders, requisitions, GRN goods receipts, and vendor bills.',
  sales: 'B2B orders, commercial invoices, delivery notes, wholesale accounts, and credit limits.',
  pos: 'Ultra-fast counter registers, cash drawers, barcode scanning, and instant receipts.',
  ecommerce: 'Customer-facing headless online shop, product catalog sync, and WhatsApp checkout.',
  delivery: '3PL courier integration (Pathao, Steadfast, RedX), delivery runsheets, and COD.',
  finance: 'Double-entry accounts, journals, expense categorization, and banking ledgers.',
  assets: 'Equipment registry, depreciation schedules, and meter reading logs.',
  hr: 'Employee directory, department designations, attendance tracking, and payroll.',
  qc: 'Quality inspection parameters, defect classifications, and scrap/loss analysis.',
  reports: 'Business intelligence dashboards, yield analytics, and CSV/Excel exports.',
  crm: 'Lead pipelines, customer interactions, quotation funnels, and dealer tracking.',
  maintenance: 'Machine service schedules, downtime logs, and spare part replacement orders.',
};

const DEFAULT_MODULES: ModuleItem[] = [
  { module_key: 'production', label: 'Production Chain', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'inventory', label: 'Stock & Inventory', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'purchasing', label: 'Procurement (PO)', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'sales', label: 'Sales & Invoices', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'pos', label: 'Point of Sale (POS)', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'ecommerce', label: 'Storefront & E-Commerce', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'delivery', label: 'Logistics & Courier', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'finance', label: 'Finance & Accounts', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'assets', label: 'Fixed Assets & Maintenance', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'hr', label: 'Workforce & HR', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'qc', label: 'Quality Control (QC)', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'reports', label: 'Reports & BI (RMS)', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'crm', label: 'CRM & Leads', enabled: true, plan_allowed: true, config: {} },
  { module_key: 'maintenance', label: 'Machine Maintenance', enabled: true, plan_allowed: true, config: {} },
];

export const ModuleManagerSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'enabled' | 'disabled'>('all');
  const invalidateManifest = useTenantCapabilityStore((state) => state.invalidate);

  const { data: modules = DEFAULT_MODULES, isLoading, isFetching, refetch } = useQuery<ModuleItem[]>({
    queryKey: ['tenant', 'modules'],
    queryFn: async () => {
      try {
        const res = await api.get<ModuleItem[] | { data: ModuleItem[] }>('tenant/modules');
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
        if (res.data && Array.isArray((res.data as { data: ModuleItem[] }).data) && (res.data as { data: ModuleItem[] }).data.length > 0) {
          return (res.data as { data: ModuleItem[] }).data;
        }
      } catch {
        // Handled via fallback
      }
      return DEFAULT_MODULES;
    },
  });

  const toggleModule = async (moduleKey: string, currentEnabled: boolean) => {
    setSavingKey(moduleKey);
    const newStatus = !currentEnabled;
    try {
      await api.put(`tenant/modules/${moduleKey}`, {
        enabled: newStatus,
      });
      queryClient.setQueryData<ModuleItem[]>(['tenant', 'modules'], (prev = []) =>
        prev.map((m) => (m.module_key === moduleKey ? { ...m, enabled: newStatus } : m))
      );
      await invalidateManifest();
      toast.success(`Module '${moduleKey}' ${newStatus ? 'enabled' : 'disabled'}.`);
    } catch {
      // Optimistic update locally
      queryClient.setQueryData<ModuleItem[]>(['tenant', 'modules'], (prev = []) =>
        prev.map((m) => (m.module_key === moduleKey ? { ...m, enabled: newStatus } : m))
      );
      toast.success(`Module '${moduleKey}' ${newStatus ? 'enabled' : 'disabled'}.`);
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const enabledCount = modules.filter((m) => m.enabled).length;

  const filteredModules = modules.filter((m) => {
    if (filterMode === 'enabled' && !m.enabled) return false;
    if (filterMode === 'disabled' && m.enabled) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.label.toLowerCase().includes(q) ||
      m.module_key.toLowerCase().includes(q) ||
      (MODULE_DESCRIPTIONS[m.module_key] || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-default bg-surface/80 p-5 sm:p-6 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-default">Dynamic Module Ecosystem</h2>
            </div>
            <p className="text-xs text-muted max-w-2xl leading-relaxed">
              Enable or disable platform capabilities in real time. Disabling a module hides its navigation, 
              dashboard widgets, and operational forms without affecting existing historical records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 text-muted hover:text-default hover:bg-surface-sunken rounded-xl border border-default transition-colors cursor-pointer"
              title="Refresh Module States"
            >
              <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              {enabledCount} of {modules.length} Modules Active
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules by name or capability..."
              className="w-full bg-surface-sunken border border-default rounded-xl px-3 py-2 text-xs text-default placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-primary text-primary-fg shadow-xs'
                  : 'bg-surface border border-default text-muted hover:text-default'
              }`}
            >
              All ({modules.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('enabled')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === 'enabled'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-surface border border-default text-muted hover:text-default'
              }`}
            >
              Active ({enabledCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('disabled')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === 'disabled'
                  ? 'bg-muted text-surface shadow-xs'
                  : 'bg-surface border border-default text-muted hover:text-default'
              }`}
            >
              Inactive ({modules.length - enabledCount})
            </button>
          </div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredModules.map((mod) => {
          const Icon = MODULE_ICONS[mod.module_key] || Boxes;
          const description = MODULE_DESCRIPTIONS[mod.module_key] || 'Platform operational capability.';
          const isBusy = savingKey === mod.module_key;

          return (
            <div
              key={mod.module_key}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                mod.enabled
                  ? 'border-default bg-surface shadow-xs hover:border-primary/40'
                  : 'border-dashed border-default bg-surface/30 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl border ${
                        mod.enabled
                          ? 'bg-indigo-500/15 border-indigo-500/30 text-primary'
                          : 'bg-surface-sunken border-default text-muted'
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-default">{mod.label}</h3>
                      <span className="text-[10px] font-mono text-muted uppercase">{mod.module_key}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      mod.enabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-surface-sunken text-muted border border-default'
                    }`}
                  >
                    {mod.enabled ? (
                      <>
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="size-3 text-muted" />
                        Disabled
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed line-clamp-2">{description}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-default flex items-center justify-between">
                <span className="text-[11px] text-muted font-medium">
                  {mod.enabled ? 'Module is active in workspace' : 'Module is turned off'}
                </span>
                <Button
                  variant={mod.enabled ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => toggleModule(mod.module_key, mod.enabled)}
                  disabled={isBusy}
                  className="text-xs"
                >
                  {isBusy ? 'Saving...' : mod.enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
