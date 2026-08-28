import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api/client';
import type { PlatformPlan } from '../../types/api/platform';
import {
  Plus,
  Check,
  Building2,
  Users,
  HardDrive,
  ShoppingBag,
} from 'lucide-react';

export const PlanManagerWorkspace: React.FC = () => {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // New Plan Form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 99,
    billing_period: 'monthly' as 'monthly' | 'yearly',
    max_users: 25,
    max_factories: 2,
    max_warehouses: 4,
    max_monthly_orders: 5000,
    storage_gb: 50,
    pos_enabled: true,
    ecommerce_storefront: true,
    advanced_analytics: false,
    multi_branch: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get<PlatformPlan[]>('/platform/plans');
      setPlans(response.data);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/platform/plans', {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description,
        price: Number(formData.price),
        billing_period: formData.billing_period,
        limits: {
          max_users: Number(formData.max_users),
          max_factories: Number(formData.max_factories),
          max_warehouses: Number(formData.max_warehouses),
          max_monthly_orders: Number(formData.max_monthly_orders),
          storage_gb: Number(formData.storage_gb),
        },
        features: {
          pos_enabled: formData.pos_enabled,
          ecommerce_storefront: formData.ecommerce_storefront,
          advanced_analytics: formData.advanced_analytics,
          multi_branch: formData.multi_branch,
        },
      });

      setIsCreating(false);
      fetchPlans();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Subscription Plans & Tiers</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Define multi-tenant SaaS quotas, feature flags, and billing rates.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>Create Plan Tier</span>
        </button>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
            Loading subscription catalog...
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-mono">
            No subscription plans found.
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-800 text-amber-400">
                    {plan.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {plan.tenants_count ?? 0} Active Tenants
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-100">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
                  {plan.description || 'Full SaaS industrial operational suite.'}
                </p>

                <div className="my-5 flex items-baseline gap-1 font-mono">
                  <span className="text-3xl font-bold text-slate-100">${plan.price}</span>
                  <span className="text-xs text-slate-400">/{plan.billing_period}</span>
                </div>

                {/* Limits */}
                <div className="space-y-2 border-t border-slate-800/80 pt-4 font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Max Users: <strong>{plan.limits?.max_users ?? 'Unlimited'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Max Factories: <strong>{plan.limits?.max_factories ?? 'Unlimited'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Max Monthly Orders: <strong>{plan.limits?.max_monthly_orders ?? 'Unlimited'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Storage: <strong>{plan.limits?.storage_gb ?? '50'} GB</strong></span>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>POS Terminal Module</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>B2C E-Commerce Storefront</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Multi-Branch Operational Scope</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-400 text-center">
                System Managed Plan
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Plan Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-100 font-sans">Create SaaS Subscription Tier</h2>
            <p className="text-xs text-slate-400 mt-1">Configure quotas and rate limits for new tenants.</p>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1 font-semibold">Plan Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Global"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Plan Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="ENTERPRISE_GLOBAL"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Price ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Max Users</label>
                  <input
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Max Factories</label>
                  <input
                    type="number"
                    value={formData.max_factories}
                    onChange={(e) => setFormData({ ...formData, max_factories: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name || !formData.code}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlanManagerWorkspace;
