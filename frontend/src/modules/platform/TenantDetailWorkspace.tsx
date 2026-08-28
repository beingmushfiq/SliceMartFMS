import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api/client';
import type { PlatformTenant, PlatformPlan } from '../../types/api/platform';
import {
  Building2,
  CreditCard,
  Users,
  ArrowLeft,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const TenantDetailWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'users' | 'usage'>('overview');

  // Action Modals
  const [modalType, setModalType] = useState<'status' | 'extend' | 'plan' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [extendDays, setExtendDays] = useState(30);
  const [newPlanId, setNewPlanId] = useState<number | ''>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchTenant = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get<PlatformTenant>(`/platform/tenants/${id}`);
      setTenant(response.data);
      if (response.data.plan_id) {
        setNewPlanId(response.data.plan_id);
      }
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPlans = React.useCallback(async () => {
    try {
      const res = await api.get<PlatformPlan[]>('/platform/plans');
      setPlans(res.data);
    } catch {
      // Best-effort
    }
  }, []);

  useEffect(() => {
    fetchTenant();
    fetchPlans();
  }, [fetchTenant, fetchPlans]);

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
      fetchTenant();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
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
      fetchTenant();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Subscription update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!tenant) return;
    if (!confirm(`Launch diagnostic impersonation session for "${tenant.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post<{
        data: {
          token: string;
          tenant: { id: number; name: string; slug: string };
          user: { id: number; name: string; email: string };
          impersonator: { id: number; name: string; email: string };
        };
      }>(`/platform/tenants/${tenant.id}/impersonate`);

      localStorage.setItem('is_impersonating', 'true');
      localStorage.setItem('impersonated_tenant_name', res.data.data.tenant.name);
      localStorage.setItem('impersonated_tenant_id', String(res.data.data.tenant.id));
      localStorage.setItem('impersonator_email', res.data.data.impersonator.email);

      window.location.href = '/catalogue';
    } catch (err: any) {
      alert(err.message ?? 'Impersonation failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !tenant) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono animate-pulse">
        Loading tenant dossier #{id}...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs font-mono">
        Tenant #{id} not found in platform registry.
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <Link
        to="/platform/tenants"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tenant Directory</span>
      </Link>

      {/* Header Profile Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shadow-inner">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{tenant.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                {tenant.plan?.name ?? 'Starter'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
              <span>{tenant.slug}.devcenterpoint.com</span>
              <a
                href={`https://${tenant.slug}.devcenterpoint.com`}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>Storefront / Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <button
            onClick={handleImpersonate}
            disabled={actionLoading || tenant.status === 'suspended'}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            Impersonate Tenant
          </button>
          <button
            onClick={() => setModalType('extend')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Extend Sub (+Days)
          </button>
          <button
            onClick={() => setModalType('plan')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Change Plan
          </button>
          {tenant.status === 'active' ? (
            <button
              onClick={() => setModalType('status')}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-colors cursor-pointer"
            >
              Suspend Tenant
            </button>
          ) : (
            <button
              onClick={() => setModalType('status')}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 transition-colors cursor-pointer"
            >
              Reactivate Tenant
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 font-mono text-xs">
        {[
          { key: 'overview', label: 'Overview & Config', icon: Building2 },
          { key: 'billing', label: 'Subscriptions & Billing', icon: CreditCard },
          { key: 'users', label: 'Scoped Users', icon: Users },
          { key: 'usage', label: 'Usage & Quotas', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
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
                <span className="text-slate-400">Subdomain Identifier:</span>
                <span className="text-amber-400">{tenant.slug}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Custom FQDN Domain:</span>
                <span className="text-slate-200">{tenant.domain || 'Not configured'}</span>
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
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
              {JSON.stringify(tenant.settings || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Billing & Subscriptions */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
              Active Subscription
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Plan Tier</span>
                <span className="text-base font-bold text-amber-400">{tenant.plan?.name}</span>
                <span className="text-slate-400 block mt-1">${tenant.plan?.price}/month</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Current Lifecycle Status</span>
                <span className="text-base font-bold text-emerald-400 capitalize">{tenant.status}</span>
                <span className="text-slate-400 block mt-1">
                  {tenant.trial_ends_at ? `Trial until ${new Date(tenant.trial_ends_at).toLocaleDateString()}` : 'Standard Paid'}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Billing Period</span>
                <span className="text-base font-bold text-slate-200 uppercase">{tenant.plan?.billing_period ?? 'Monthly'}</span>
                <span className="text-slate-400 block mt-1">Auto-renewing</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
              Subscription Ledger History
            </h2>
            {tenant.subscriptions && tenant.subscriptions.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="pb-3">Sub ID</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">Starts At</th>
                    <th className="pb-3">Ends At</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tenant.subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30">
                      <td className="py-3 text-slate-400">#{sub.id}</td>
                      <td className="py-3 text-slate-200 font-bold">{sub.plan?.name ?? 'Starter'}</td>
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

      {/* Tab 3: Scoped Users */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4">
            Users Enrolled in Tenant #{tenant.id}
          </h2>
          {tenant.users && tenant.users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="pb-3">User ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tenant.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="py-3 text-slate-400">#{u.id}</td>
                      <td className="py-3 text-slate-100 font-bold">{u.name}</td>
                      <td className="py-3 text-slate-300">{u.email}</td>
                      <td className="py-3 text-amber-400">
                        {u.roles?.map((r) => r.name).join(', ') || 'Administrator'}
                      </td>
                      <td className="py-3 text-emerald-400 uppercase">{u.status}</td>
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

      {/* Tab 4: Usage & Quotas */}
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
                Limit: {tenant.plan?.limits?.max_monthly_orders ?? 'Unlimited'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Active User Accounts</span>
              <span className="text-xl font-bold text-slate-100">{tenant.users?.length ?? 1}</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Limit: {tenant.plan?.limits?.max_users ?? 'Unlimited'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Storage Usage (GB)</span>
              <span className="text-xl font-bold text-slate-100">0.05 GB</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Limit: {tenant.plan?.limits?.storage_gb ?? '50'} GB
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
              <label className="block text-xs text-slate-300 mb-1">Days to Extend:</label>
              <input
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleManageSubscription('extend')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
              >
                {actionLoading ? 'Extending...' : 'Confirm Extension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {modalType === 'plan' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono">
            <h2 className="text-lg font-bold text-slate-100 font-sans">Upgrade / Change Plan</h2>
            <p className="text-xs text-slate-400 mt-1">Select new plan tier for {tenant.name}.</p>

            <div className="mt-4 space-y-2">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setNewPlanId(p.id)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                    newPlanId === p.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{p.name}</span>
                  <span>${p.price}/{p.billing_period}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleManageSubscription('change_plan')}
                disabled={actionLoading || !newPlanId}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                rows={3}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              {tenant.status === 'active' ? (
                <button
                  onClick={() => handleUpdateStatus('suspended')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus('active')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Reactivating...' : 'Confirm Reactivation'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TenantDetailWorkspace;
