import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, setAccessToken } from '../../lib/api/client';
import type { PlatformTenant, PlatformPlan } from '../../types/api/platform';
import { PlatformPulseLoader } from '../../components/platform/PlatformPulseLoader';
import { Button } from '../../components/ui/Button';
import {
  Building2,
  CreditCard,
  Users,
  ArrowLeft,
  ExternalLink,
  Zap,
  ShieldAlert,
  Cpu,
  Key,
  Trash2,
  Sliders,
  Save,
  Lock,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

interface TenantDetailPayload {
  tenant: PlatformTenant & {
    modules?: Array<{
      id: number;
      module_key: string;
      enabled: boolean;
      plan_allowed: boolean;
    }>;
    custom_limits?: Record<string, number | string>;
  };
  users: Array<{
    id: number;
    uuid: string;
    name: string;
    email: string;
    status: string;
    last_login_at?: string;
  }>;
  subscriptions: Array<{
    id: number;
    uuid: string;
    plan_id: number;
    plan?: { name: string };
    status: string;
    amount: number;
    starts_at: string;
    ends_at?: string;
  }>;
  usage_counters: Array<{
    metric: string;
    period: string;
    value: number;
  }>;
  recent_audit: Array<{
    id: number;
    action: string;
    actor_name: string;
    created_at: string;
    details?: Record<string, unknown>;
  }>;
}

const AVAILABLE_MODULES = [
  { key: 'pos', label: 'POS Terminal Engine', icon: ShoppingCart },
  { key: 'production', label: 'Production Batches & Routing', icon: Cpu },
  { key: 'qc', label: 'Quality Control & Rework', icon: ShieldAlert },
  { key: 'storefront', label: 'B2C E-Commerce Storefront', icon: Package },
  { key: 'multi_branch', label: 'Multi-Branch Scope', icon: Building2 },
  { key: 'accounting', label: 'Financials & Invoicing', icon: DollarSign },
];

export const TenantDetailWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'users' | 'usage' | 'authority'>('overview');

  // Action Modals
  const [modalType, setModalType] = useState<'status' | 'extend' | 'plan' | 'delete' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [extendDays, setExtendDays] = useState(30);
  const [newPlanId, setNewPlanId] = useState<number | ''>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Authority Overrides State
  const [moduleOverrides, setModuleOverrides] = useState<Record<string, { enabled: boolean; plan_allowed: boolean }>>({});
  const [customLimits, setCustomLimits] = useState<Record<string, number>>({
    max_users: 10,
    max_warehouses: 2,
    max_monthly_orders: 1000,
    max_products: 500,
  });
  const [ownerNewPassword, setOwnerNewPassword] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);

  const {
    data: detailData,
    isLoading: tenantLoading,
    error: queryError,
    refetch,
  } = useQuery<TenantDetailPayload | null>({
    queryKey: ['platform', 'tenant', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<{ data: TenantDetailPayload } | TenantDetailPayload>(`/platform/tenants/${id}`);
      const res = response.data;
      if ('data' in res && res.data && 'tenant' in res.data) {
        return res.data;
      } else if ('tenant' in res) {
        return res as TenantDetailPayload;
      } else {
        // Flatten fallback
        return {
          tenant: res as unknown as PlatformTenant,
          users: [],
          subscriptions: [],
          usage_counters: [],
          recent_audit: [],
        };
      }
    },
    enabled: Boolean(id),
    retry: 1,
  });

  const tenant = detailData?.tenant;
  const users = detailData?.users ?? [];
  const subscriptions = detailData?.subscriptions ?? [];

  const { data: plans = [] } = useQuery<PlatformPlan[]>({
    queryKey: ['platform', 'plans'],
    queryFn: async () => {
      try {
        const res = await api.get<PlatformPlan[]>('/platform/plans');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray((res.data as { data?: PlatformPlan[] }).data)) {
          return (res.data as { data: PlatformPlan[] }).data;
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  // Sync loaded modules & limits to state
  useEffect(() => {
    if (!tenant) return;
    const timer = setTimeout(() => {
      if (tenant.plan_id) setNewPlanId(tenant.plan_id);

      // Populate module overrides from tenant.modules
      const currentModules: Record<string, { enabled: boolean; plan_allowed: boolean }> = {};
      AVAILABLE_MODULES.forEach((m) => {
        const existing = tenant.modules?.find((mod) => mod.module_key === m.key);
        currentModules[m.key] = {
          enabled: existing ? existing.enabled : true,
          plan_allowed: existing ? existing.plan_allowed : true,
        };
      });
      setModuleOverrides(currentModules);

      // Populate custom limits
      if (tenant.custom_limits) {
        setCustomLimits({
          max_users: Number(tenant.custom_limits['max_users'] ?? 10),
          max_warehouses: Number(tenant.custom_limits['max_warehouses'] ?? 2),
          max_monthly_orders: Number(tenant.custom_limits['max_monthly_orders'] ?? 1000),
          max_products: Number(tenant.custom_limits['max_products'] ?? 500),
        });
      } else if (tenant.plan?.limits) {
        setCustomLimits({
          max_users: Number(tenant.plan.limits['max_users'] ?? 10),
          max_warehouses: Number(tenant.plan.limits['max_warehouses'] ?? 2),
          max_monthly_orders: Number(tenant.plan.limits['max_monthly_orders'] ?? 1000),
          max_products: Number(tenant.plan.limits['max_products'] ?? 500),
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [tenant]);

  const handleUpdateStatus = async (newStatus: 'active' | 'suspended') => {
    if (!tenant) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/platform/tenants/${tenant.id}/status`, {
        status: newStatus,
        reason: actionReason || (newStatus === 'suspended' ? 'Administrative suspension' : 'Reactivation approved'),
      });
      setModalType(null);
      setActionReason('');
      toast.success(`Tenant status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['platform', 'tenant', id] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async (action: 'extend' | 'change_plan') => {
    if (!tenant) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === 'extend') {
        payload['days'] = extendDays;
      } else if (action === 'change_plan') {
        payload['plan_id'] = newPlanId;
      }

      await api.post(`/platform/tenants/${tenant.id}/manage-subscription`, payload);
      setModalType(null);
      toast.success(action === 'extend' ? `Subscription extended by ${extendDays} days` : 'Subscription plan updated');
      queryClient.invalidateQueries({ queryKey: ['platform', 'tenant', id] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Subscription update failed';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!tenant) return;
    if (!confirm(`Launch diagnostic super-admin session for "${tenant.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post<{
        token: string;
        tenant: { id: number; name: string; slug: string };
        user: { id: number; name: string; email: string };
        impersonator: { id: number; name: string; email: string };
      }>(`/platform/tenants/${tenant.id}/impersonate`);

      const payload = (res.data as unknown as { data?: typeof res.data })?.data ?? res.data;
      const token = payload?.token;
      const targetTenant = payload?.tenant;
      const targetUser = payload?.user;
      const impersonator = payload?.impersonator;

      if (token) {
        setAccessToken(token);
        localStorage.setItem('access_token', token);
      }
      localStorage.setItem('is_impersonating', 'true');
      localStorage.setItem('impersonated_tenant_name', targetTenant?.name ?? tenant.name);
      localStorage.setItem('impersonated_tenant_id', String(targetTenant?.id ?? tenant.id));
      localStorage.setItem('impersonator_email', impersonator?.email ?? '');
      if (targetUser) {
        localStorage.setItem('auth_user', JSON.stringify(targetUser));
      }
      if (targetTenant) {
        localStorage.setItem('auth_tenant', JSON.stringify(targetTenant));
      }

      toast.success(`Entering ${tenant.name}...`);
      window.location.assign('/catalogue');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impersonation failed';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveModuleOverrides = async () => {
    if (!tenant) return;
    setOverrideSaving(true);
    try {
      await api.post(`/platform/tenants/${tenant.id}/override-capabilities`, {
        modules: moduleOverrides,
      });
      toast.success('Module capability overrides applied to tenant.');
      queryClient.invalidateQueries({ queryKey: ['platform', 'tenant', id] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save module overrides.';
      toast.error(msg);
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleSaveQuotaOverrides = async () => {
    if (!tenant) return;
    setOverrideSaving(true);
    try {
      await api.post(`/platform/tenants/${tenant.id}/override-quotas`, {
        custom_limits: customLimits,
      });
      toast.success('Custom resource quotas saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['platform', 'tenant', id] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save quotas.';
      toast.error(msg);
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleResetOwnerPassword = async () => {
    if (!tenant || !ownerNewPassword) return;
    if (ownerNewPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    setOverrideSaving(true);
    try {
      const res = await api.post<{ data: { message: string } }>(`/platform/tenants/${tenant.id}/reset-password`, {
        password: ownerNewPassword,
      });
      toast.success(res.data?.data?.message || 'Owner password successfully overridden.');
      setOwnerNewPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed.';
      toast.error(msg);
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!tenant) return;
    if (deleteConfirmation !== tenant.slug) {
      setActionError(`Please type "${tenant.slug}" to confirm deletion.`);
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/platform/tenants/${tenant.id}`);
      toast.success(`Tenant ${tenant.name} purged from active fleet.`);
      navigate('/platform/tenants');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (tenantLoading && !tenant) {
    return (
      <div className="py-24">
        <PlatformPulseLoader
          label="Decrypting & Syncing Tenant Isolation State..."
          sublabel="Verifying tenant cryptographic credentials and license bounds"
        />
      </div>
    );
  }

  if (queryError) {
    const errorMsg = queryError instanceof Error ? queryError.message : 'Failed to load tenant record';
    return (
      <div className="p-12 text-center text-xs font-mono space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300">
          <p className="font-semibold mb-1 text-rose-200">Unable to load tenant #{id}</p>
          <p className="text-rose-400">{errorMsg}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry Query
          </Button>
          <Link
            to="/platform/tenants"
            className="text-xs text-amber-400 hover:text-amber-300 underline font-mono"
          >
            ← Return to Tenant Directory
          </Link>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-3">
        <p>Tenant #{id} not found in master platform registry.</p>
        <Link
          to="/platform/tenants"
          className="text-xs text-amber-400 hover:text-amber-300 underline font-mono inline-block"
        >
          ← Return to Tenant Directory
        </Link>
      </div>
    );
  }

  type DetailTabKey = 'overview' | 'billing' | 'users' | 'usage' | 'authority';
  const tabs: Array<{ key: DetailTabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'authority', label: 'Master Authority Overrides', icon: ShieldAlert },
    { key: 'billing', label: 'Billing & Subscriptions', icon: CreditCard },
    { key: 'users', label: 'Scoped Users', icon: Users },
    { key: 'usage', label: 'Usage & Quotas', icon: Sliders },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <Link
        to="/platform/tenants"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
      >
        <ArrowLeft className="size-4" />
        <span>Back to Tenant Directory</span>
      </Link>

      {/* Header Profile Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shadow-inner">
            <Building2 className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{tenant.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                {tenant.plan?.name ?? 'Standard Plan'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  tenant.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : tenant.status === 'trial'
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {tenant.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
              <span>{tenant.slug}.devcenterpoint.com</span>
              <a
                href={`https://${tenant.slug}.devcenterpoint.com`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-amber-400 transition-colors"
                title="Launch Subdomain"
              >
                <ExternalLink className="size-3.5" />
              </a>
              <span>•</span>
              <span>Provisioned: {new Date(tenant.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <button
            onClick={handleImpersonate}
            disabled={actionLoading}
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Zap className="size-4" />
            <span>Impersonate Tenant</span>
          </button>

          <button
            onClick={() => {
              setActionError(null);
              setModalType('plan');
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            Change Plan Tier
          </button>

          <button
            onClick={() => {
              setActionError(null);
              setModalType('status');
            }}
            className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ${
              tenant.status === 'active'
                ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/40'
                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/40'
            }`}
          >
            {tenant.status === 'active' ? 'Suspend Access' : 'Reactivate Access'}
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto font-mono text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Master Authority Overrides */}
      {activeTab === 'authority' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Module Capabilities Overrides */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-slate-100 font-sans uppercase tracking-wider">
                    Tenant Module Capability Overrides
                  </h2>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Super-Admin privilege: Bypass subscription plan tier limits and force-enable or revoke modules for this tenant.
                </p>
              </div>

              <button
                onClick={handleSaveModuleOverrides}
                disabled={overrideSaving}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="size-3.5" />
                <span>{overrideSaving ? 'Saving...' : 'Save Module Overrides'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_MODULES.map((m) => {
                const Icon = m.icon;
                const state = moduleOverrides[m.key] || { enabled: true, plan_allowed: true };
                const isEnabled = state.enabled && state.plan_allowed;

                return (
                  <div
                    key={m.key}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isEnabled
                        ? 'bg-slate-950 border-emerald-500/40 text-slate-100'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="font-sans font-semibold text-xs text-slate-200">{m.label}</div>
                        <div className="text-[10px] text-slate-500">{m.key}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setModuleOverrides({
                          ...moduleOverrides,
                          [m.key]: {
                            enabled: !isEnabled,
                            plan_allowed: !isEnabled,
                          },
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quota Limits Overrides */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="size-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-slate-100 font-sans uppercase tracking-wider">
                    Custom Resource Quota Overrides
                  </h2>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Assign bespoke high quotas or relaxed thresholds independent of standard subscription tier specs.
                </p>
              </div>

              <button
                onClick={handleSaveQuotaOverrides}
                disabled={overrideSaving}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="size-3.5" />
                <span>{overrideSaving ? 'Saving...' : 'Save Quota Overrides'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Max Users</label>
                <input
                  type="number"
                  min="1"
                  value={customLimits.max_users}
                  onChange={(e) => setCustomLimits({ ...customLimits, max_users: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max Warehouses</label>
                <input
                  type="number"
                  min="1"
                  value={customLimits.max_warehouses}
                  onChange={(e) => setCustomLimits({ ...customLimits, max_warehouses: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Monthly Orders Limit</label>
                <input
                  type="number"
                  min="10"
                  value={customLimits.max_monthly_orders}
                  onChange={(e) => setCustomLimits({ ...customLimits, max_monthly_orders: parseInt(e.target.value) || 10 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max Products</label>
                <input
                  type="number"
                  min="10"
                  value={customLimits.max_products}
                  onChange={(e) => setCustomLimits({ ...customLimits, max_products: parseInt(e.target.value) || 10 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Owner Password Override */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Key className="size-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100 font-sans uppercase tracking-wider">
                Emergency Owner Password Reset
              </h2>
            </div>
            <p className="text-slate-400 text-[11px] mb-4">
              Directly override and assign a new password for the primary administrator account of this tenant.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                <input
                  type="password"
                  value={ownerNewPassword}
                  onChange={(e) => setOwnerNewPassword(e.target.value)}
                  placeholder="Enter new 8+ character password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-hidden focus:border-amber-500 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleResetOwnerPassword}
                disabled={overrideSaving || ownerNewPassword.length < 8}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap"
              >
                Force Reset Password
              </button>
            </div>
          </div>

          {/* Danger Zone: Tenant Deletion */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-rose-900/60 shadow-xl">
            <div className="flex items-center gap-2 text-rose-400 mb-1 font-bold">
              <AlertTriangle className="size-4" />
              <span className="font-sans uppercase tracking-wider text-sm">Danger Zone: Deprovision Tenant</span>
            </div>
            <p className="text-slate-400 text-[11px] mb-4">
              Soft-delete this tenant, revoke all associated active authentication tokens, and detach domain bindings.
            </p>

            <button
              onClick={() => {
                setActionError(null);
                setDeleteConfirmation('');
                setModalType('delete');
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer"
            >
              Deprovision & Delete Tenant
            </button>
          </div>
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-sans">
              Tenancy Identifiers
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Database ID:</span>
                <span className="text-slate-200 font-bold">#{tenant.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">UUID:</span>
                <span className="text-slate-300 font-mono text-[11px]">{tenant.uuid}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Subdomain:</span>
                <span className="text-amber-400 font-bold">{tenant.slug}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Custom Domain:</span>
                <span className="text-slate-200">{tenant.domain || 'None configured'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Currency / Locale:</span>
                <span className="text-slate-200">{tenant.currency_code} ({tenant.timezone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Provisioned At:</span>
                <span className="text-slate-200">{new Date(tenant.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-sans">
              Tenant Settings & Metadata
            </h2>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-72">
              {JSON.stringify(tenant.settings || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: Billing & Subscriptions */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
              Active Subscription
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Plan Tier</span>
                <span className="text-base font-bold text-amber-400">{tenant.plan?.name ?? 'Starter'}</span>
                <span className="text-slate-400 block mt-1">${tenant.plan?.price}/month</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Current Lifecycle Status</span>
                <span className="text-base font-bold text-emerald-400 capitalize">{tenant.status}</span>
                <span className="text-slate-400 block mt-1">
                  {tenant.trial_ends_at ? `Trial ends ${new Date(tenant.trial_ends_at).toLocaleDateString()}` : 'Standard Active'}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block mb-1">Subscription Actions</span>
                  <button
                    onClick={() => {
                      setActionError(null);
                      setModalType('extend');
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                  >
                    + Extend Term
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
              Subscription Transition History
            </h2>
            {subscriptions && subscriptions.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="pb-3">Sub ID</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">Starts At</th>
                    <th className="pb-3">Expires At</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30">
                      <td className="py-3 text-slate-400">#{sub.id}</td>
                      <td className="py-3 text-slate-200 font-bold">{sub.plan?.name ?? 'Tier'}</td>
                      <td className="py-3 text-slate-400">{new Date(sub.starts_at).toLocaleDateString()}</td>
                      <td className="py-3 text-slate-400">
                        {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'Permanent'}
                      </td>
                      <td className="py-3 text-emerald-400 uppercase">{sub.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs font-mono">
                No past subscription transitions recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Scoped Users */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
            Users Enrolled in Tenant #{tenant.id}
          </h2>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="pb-3">User ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="py-3 text-slate-400">#{u.id}</td>
                      <td className="py-3 text-slate-100 font-bold">{u.name}</td>
                      <td className="py-3 text-slate-300">{u.email}</td>
                      <td className="py-3 text-emerald-400 uppercase">{u.status}</td>
                      <td className="py-3 text-slate-400">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-mono">
              No users loaded for this tenant.
            </div>
          )}
        </div>
      )}

      {/* Tab: Usage & Quotas */}
      {activeTab === 'usage' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
            Current Resource Usage & Plan Quotas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Monthly Orders Processed</span>
              <span className="text-xl font-bold text-slate-100">0</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Limit: {customLimits.max_monthly_orders ?? tenant.plan?.limits?.['max_monthly_orders'] ?? 'Unlimited'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Active User Accounts</span>
              <span className="text-xl font-bold text-slate-100">{users.length}</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Limit: {customLimits.max_users ?? tenant.plan?.limits?.['max_users'] ?? 'Unlimited'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Warehouses Scope</span>
              <span className="text-xl font-bold text-slate-100">1</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Limit: {customLimits.max_warehouses ?? tenant.plan?.limits?.['max_warehouses'] ?? '2'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Extend Subscription Modal */}
      {modalType === 'extend' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono">
            <h2 className="text-lg font-bold text-slate-100 font-sans">Extend Subscription</h2>
            <p className="text-xs text-slate-400 mt-1">
              Add days to {tenant.name}&apos;s current active period.
            </p>

            <div className="mt-4">
              <label className="block text-xs text-slate-300 mb-1">Additional Validity (Days):</label>
              <input
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleManageSubscription('extend')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Extending...' : 'Apply Extension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {modalType === 'plan' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono">
            <h2 className="text-lg font-bold text-slate-100 font-sans">Switch SaaS Plan Tier</h2>
            <p className="text-xs text-slate-400 mt-1">
              Target Tenant: <strong className="text-slate-200">{tenant.name}</strong>
            </p>

            <div className="mt-4 space-y-2">
              {plans.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setNewPlanId(p.id)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-left ${
                    newPlanId === p.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{p.name}</span>
                  <span>${p.price}/{p.billing_period}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleManageSubscription('change_plan')}
                disabled={actionLoading || !newPlanId}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Apply Plan Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {modalType === 'status' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono">
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              {tenant.status === 'active' ? 'Suspend Tenant Access' : 'Reactivate Tenant'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Target: <strong className="text-slate-200">{tenant.name}</strong>
            </p>

            {actionError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs text-slate-300 mb-1">Reason for state change:</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Logged in platform audit trail..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-hidden focus:border-amber-500"
                rows={3}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              {tenant.status === 'active' ? (
                <button
                  onClick={() => handleUpdateStatus('suspended')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus('active')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Reactivating...' : 'Confirm Reactivation'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Tenant Modal */}
      {modalType === 'delete' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base font-sans">
              <Trash2 className="size-5" />
              <span>Deprovision Tenant</span>
            </div>
            <p className="text-slate-400 mt-2 leading-relaxed">
              This will deprovision and soft-delete <strong className="text-slate-100">{tenant.name}</strong>.
            </p>

            <div className="my-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300">
              Please type <strong className="text-white select-all">{tenant.slug}</strong> to confirm.
            </div>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300">
                {actionError}
              </div>
            )}

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={tenant.slug}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-rose-500"
            />

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setModalType(null);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTenant}
                disabled={actionLoading || deleteConfirmation !== tenant.slug}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-40"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Deprovision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDetailWorkspace;
