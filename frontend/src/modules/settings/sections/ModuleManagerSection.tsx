import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api/client';
import { useTenantCapabilityStore } from '../../../lib/capabilities/tenantCapabilityStore';
import { Button } from '../../../components/ui/Button';
import { notify } from '../../../components/ui/Toast';
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

export const ModuleManagerSection: React.FC = () => {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const invalidateManifest = useTenantCapabilityStore((state) => state.invalidate);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ModuleItem[] }>('/tenant/modules');
      if (res.data?.data) {
        setModules(res.data.data);
      }
    } catch {
      notify.error('Failed to load module configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const toggleModule = async (moduleKey: string, currentEnabled: boolean) => {
    setSavingKey(moduleKey);
    const newStatus = !currentEnabled;
    try {
      await api.put(`/tenant/modules/${moduleKey}`, {
        enabled: newStatus,
      });
      setModules((prev) =>
        prev.map((m) => (m.module_key === moduleKey ? { ...m, enabled: newStatus } : m))
      );
      await invalidateManifest();
      notify.success(`Module '${moduleKey}' ${newStatus ? 'enabled' : 'disabled'}.`);
    } catch {
      notify.error(`Failed to update module '${moduleKey}'.`);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const enabledCount = modules.filter((m) => m.enabled).length;

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
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              {enabledCount} of {modules.length} Modules Active
            </span>
          </div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((mod) => {
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
