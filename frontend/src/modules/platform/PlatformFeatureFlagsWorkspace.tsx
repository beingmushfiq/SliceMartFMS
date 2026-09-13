import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api/client';
import type { PlatformFeatureFlag, PlatformTenant } from '../../types/api/platform';
import { SelectDropdown } from '../../components/ui/Dropdown';
import { Button } from '../../components/ui/Button';
import {
  Flag,
  Search,
  RotateCcw,
  Plus,
  Building2,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
} from 'lucide-react';

interface ModuleRegistryItem {
  key: string;
  name: string;
  description: string;
  category: string;
  version: string;
  is_core: boolean;
  default_enabled: boolean;
  permissions: string[];
}

export const PlatformFeatureFlagsWorkspace: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'flags' | 'registry'>('flags');
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'global' | 'tenant'>('global');
  const [targetTenantId, setTargetTenantId] = useState<number | ''>('');
  const [rolloutPercentage, setRolloutPercentage] = useState<number>(100);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // Fetch Tenants for scope assignment
  const { data: tenants = [] } = useQuery<PlatformTenant[]>({
    queryKey: ['platform', 'tenants', 'simple-list'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: PlatformTenant[] } | PlatformTenant[]>('/platform/tenants?per_page=100');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && 'data' in res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  // Fetch Feature Flags
  const { data: flags = [], isLoading: flagsLoading, isFetching: flagsFetching, refetch: refetchFlags } = useQuery<PlatformFeatureFlag[]>({
    queryKey: ['platform', 'feature-flags', tenantFilter, search],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (tenantFilter !== 'all') params['tenant_id'] = tenantFilter;
      if (search) params['search'] = search;
      const res = await api.get<{ data: PlatformFeatureFlag[] } | PlatformFeatureFlag[]>('/platform/feature-flags', { params });
      if (Array.isArray(res.data)) return res.data;
      if (res.data && 'data' in res.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    },
  });

  // Fetch Module Registry
  const { data: moduleRegistry = [], isLoading: registryLoading } = useQuery<ModuleRegistryItem[]>({
    queryKey: ['platform', 'module-registry'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: ModuleRegistryItem[] } | ModuleRegistryItem[]>('/platform/module-registry');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && 'data' in res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  // Toggle Flag Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await api.patch(`/platform/feature-flags/${id}`, { enabled });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Feature flag state toggled');
      queryClient.invalidateQueries({ queryKey: ['platform', 'feature-flags'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to toggle flag';
      toast.error(msg);
    },
  });

  // Create Flag Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: {
      key: string;
      description: string;
      tenant_id?: number;
      rollout_percentage?: number;
      enabled: boolean;
    }) => {
      const res = await api.post('/platform/feature-flags', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Feature flag defined successfully');
      setShowCreateModal(false);
      setKey('');
      setDescription('');
      setTargetTenantId('');
      setRolloutPercentage(100);
      setIsEnabled(true);
      queryClient.invalidateQueries({ queryKey: ['platform', 'feature-flags'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create feature flag';
      toast.error(msg);
    },
  });

  const handleCreateFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) {
      toast.error('Flag key is required');
      return;
    }
    if (scope === 'tenant' && !targetTenantId) {
      toast.error('Target tenant required for tenant-scoped flag');
      return;
    }

    const payload: {
      key: string;
      description: string;
      tenant_id?: number;
      rollout_percentage: number;
      enabled: boolean;
    } = {
      key,
      description: description || `Feature flag ${key}`,
      rollout_percentage: rolloutPercentage,
      enabled: isEnabled,
    };
    if (scope === 'tenant' && targetTenantId) {
      payload.tenant_id = Number(targetTenantId);
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Feature Flags & Module Registry</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Granular feature gating, staged rollouts, and enterprise application module catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchFlags()}
            disabled={flagsFetching}
            className="flex items-center gap-1.5 font-mono text-xs cursor-pointer border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className={`size-3.5 ${flagsFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {activeTab === 'flags' && (
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 font-mono text-xs font-bold cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950"
            >
              <Plus className="size-4" />
              <span>New Feature Flag</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab('flags')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'flags'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flag className="size-3.5" />
          <span>Active Feature Flags</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('registry')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'registry'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="size-3.5" />
          <span>Module Registry</span>
        </button>
      </div>

      {activeTab === 'flags' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search flags by key or description..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
              />
            </div>

            <div className="w-52">
              <SelectDropdown
                value={tenantFilter}
                onChange={(val) => setTenantFilter(val)}
                options={[
                  { value: 'all', label: 'All Scopes & Tenants' },
                  ...tenants.map((t) => ({ value: String(t.id), label: t.name })),
                ]}
              />
            </div>
          </div>

          {/* Feature Flags Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            {flagsLoading ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                Loading feature flags...
              </div>
            ) : flags.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Flag Key</th>
                      <th className="px-5 py-3">Scope</th>
                      <th className="px-5 py-3">Rollout %</th>
                      <th className="px-5 py-3">State</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3 text-right">Toggle Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {flags.map((flag) => (
                      <tr key={flag.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-100 block">{flag.key}</span>
                        </td>
                        <td className="px-5 py-3">
                          {!flag.tenant_id ? (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase">
                              Global
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <Building2 className="size-2.5" />
                              <span>{flag.tenant?.name ?? `Tenant #${flag.tenant_id}`}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-200">
                          {flag.rollout_percentage != null ? `${flag.rollout_percentage}%` : '100%'}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              flag.enabled
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {flag.enabled ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
                            <span>{flag.enabled ? 'Enabled' : 'Disabled'}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-400 text-[11px] max-w-xs truncate">
                          {flag.description || '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              toggleMutation.mutate({
                                id: flag.id,
                                enabled: !flag.enabled,
                              })
                            }
                            disabled={toggleMutation.isPending}
                            className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                              flag.enabled
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {flag.enabled ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                No feature flags defined.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'registry' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Core Platform Enterprise Modules
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Self-contained domain engines registered with the DevCenterPoint platform core.
            </p>
          </div>

          {registryLoading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Loading module catalog...
            </div>
          ) : moduleRegistry.length > 0 ? (
            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {moduleRegistry.map((mod) => (
                <div key={mod.key} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-800/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-100 font-sans text-sm">{mod.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                        {mod.key}
                      </span>
                      {mod.is_core ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          CORE SYSTEM
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                          COMMERCIAL ADDON
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs font-sans">{mod.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>Category: <strong className="text-slate-300 uppercase">{mod.category}</strong></span>
                      <span>Version: <strong className="text-slate-300">{mod.version}</strong></span>
                      <span>Permissions: <strong className="text-slate-300">{mod.permissions?.length ?? 0} defined</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center gap-1">
                      <Layers className="size-3 text-amber-400" />
                      <span>Ready</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              No platform modules discovered in registry.
            </div>
          )}
        </div>
      )}

      {/* Create Flag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono text-xs">
            <h2 className="text-lg font-bold text-slate-100 font-sans">New Feature Flag</h2>
            <p className="text-slate-400 mt-1">
              Configure flag identifier, target scope, and phased percentage rollout.
            </p>

            <form onSubmit={handleCreateFlag} className="mt-4 space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Flag Key * (e.g. beta_ai_forecast)</label>
                <input
                  type="text"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                  placeholder="module_key_or_feature"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain feature purpose..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Scope</label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as 'global' | 'tenant')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="global">Global (Platform)</option>
                    <option value="tenant">Tenant Specific</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Rollout % (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={rolloutPercentage}
                    onChange={(e) => setRolloutPercentage(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {scope === 'tenant' && (
                <div>
                  <label className="block text-slate-300 mb-1">Target Tenant *</label>
                  <select
                    value={targetTenantId}
                    onChange={(e) => setTargetTenantId(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="">Select a tenant...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isEnabledCheckbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded-sm border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isEnabledCheckbox" className="text-slate-300 cursor-pointer">
                  Activate flag immediately upon creation
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !key}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformFeatureFlagsWorkspace;
