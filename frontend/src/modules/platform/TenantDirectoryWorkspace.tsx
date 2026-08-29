import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api/client';
import type { PlatformTenant } from '../../types/api/platform';
import {
  Building2,
  Search,
  UserPlus,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const TenantDirectoryWorkspace: React.FC = () => {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Action Modals State
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [modalType, setModalType] = useState<'status' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchTenants = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params['search'] = search;
      if (statusFilter !== 'all') params['status'] = statusFilter;

      const response = await api.get<PlatformTenant[]>('/platform/tenants', { params });
      setTenants(response.data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    let ignore = false;
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    if (statusFilter !== 'all') params['status'] = statusFilter;

    api.get<PlatformTenant[]>('/platform/tenants', { params })
      .then((res) => {
        if (!ignore) setTenants(res.data);
      })
      .catch(() => {
        // error handling
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [search, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTenants();
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'suspended') => {
    if (!selectedTenant) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/platform/tenants/${selectedTenant.id}/status`, {
        status: newStatus,
        reason: actionReason || (newStatus === 'suspended' ? 'Administrative suspension' : 'Reactivation approved'),
      });
      setModalType(null);
      setSelectedTenant(null);
      setActionReason('');
      fetchTenants();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 w-fit">
            <CheckCircle className="size-3" />
            <span>Active</span>
          </span>
        );
      case 'trial':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 w-fit">
            <Clock className="size-3" />
            <span>Trial</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 w-fit">
            <XCircle className="size-3" />
            <span>Suspended</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-sunken text-muted border border-default text-[10px] font-mono font-bold uppercase w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Tenant Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default">Tenant Directory</h1>
          <p className="mt-1.5 text-xs text-muted max-w-2xl leading-relaxed">
            Provision, monitor, configure subscription tiers, and enforce multi-tenant lifecycle states across DevCenterPoint.
          </p>
        </div>

        <Link
          to="/platform/tenants/new"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="size-4" />
          <span>Provision Tenant</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-default shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="size-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name, slug (e.g. slicemart), or domain..."
            className="w-full bg-surface-sunken border border-default rounded-xl pl-10 pr-4 py-2 text-xs text-default placeholder:text-muted focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-2xs"
          />
        </form>

        <div className="flex items-center gap-2">
          {['all', 'active', 'trial', 'suspended'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-surface-sunken text-muted hover:text-default hover:bg-surface border border-default'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={fetchTenants}
            className="p-2 rounded-xl bg-surface-sunken hover:bg-surface text-muted hover:text-default border border-default transition-colors cursor-pointer shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl bg-surface border border-default shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted text-xs font-mono animate-pulse">
            Loading tenant registry...
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-muted text-xs font-mono">
            No tenants matched your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-default">
              <thead className="bg-surface-sunken/70 border-b border-default text-muted uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3.5 pl-6">Tenant Name & Subdomain</th>
                  <th className="py-3.5 px-4">Plan Tier</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Currency / Locale</th>
                  <th className="py-3.5 px-4">Onboarded</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default font-mono">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-sunken/40 transition-colors">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-surface-sunken border border-default flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                          <Building2 className="size-4" />
                        </div>
                        <div>
                          <Link
                            to={`/platform/tenants/${t.id}`}
                            className="font-bold text-default hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm font-sans"
                          >
                            {t.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                            <span>{t.slug}.devcenterpoint.com</span>
                            <a
                              href={`https://${t.slug}.devcenterpoint.com`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted hover:text-default"
                            >
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-default">
                      <div>
                        <span className="font-semibold text-default">{t.plan?.name ?? 'Standard'}</span>
                        <div className="text-[10px] text-muted font-mono">${t.plan?.price ?? 0}/mo</div>
                      </div>
                    </td>

                    <td className="py-4 px-4">{getStatusBadge(t.status)}</td>

                    <td className="py-4 px-4 text-muted text-[11px]">
                      <div className="font-bold text-default">{t.currency_code}</div>
                      <div className="text-[10px] text-muted">{t.timezone}</div>
                    </td>

                    <td className="py-4 px-4 text-muted text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 pr-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/platform/tenants/${t.id}`}
                          className="px-3 py-1.5 rounded-xl bg-surface-sunken hover:bg-surface text-default border border-default text-xs font-sans font-semibold transition-all shadow-2xs"
                        >
                          View Details
                        </Link>

                        {t.status === 'active' ? (
                          <button
                            onClick={() => {
                              setSelectedTenant(t);
                              setModalType('status');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-sans font-semibold transition-all shadow-2xs cursor-pointer"
                            title="Suspend Tenant Access"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedTenant(t);
                              setModalType('status');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-sans font-semibold transition-all shadow-2xs cursor-pointer"
                            title="Reactivate Tenant"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {modalType === 'status' && selectedTenant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-default rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-bold text-default font-sans">
              {selectedTenant.status === 'active' ? 'Suspend Tenant Access' : 'Reactivate Tenant'}
            </h2>
            <p className="text-xs text-muted mt-1 font-mono">
              Target Tenant: <strong className="text-default">{selectedTenant.name}</strong> ({selectedTenant.slug})
            </p>

            {actionError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-mono text-muted mb-1">
                Reason for state change (Logged in platform audit trail)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Non-payment of subscription fee or SLA terms violation"
                className="w-full bg-surface-sunken border border-default rounded-xl p-3 text-xs text-default placeholder:text-muted focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                rows={3}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 font-mono">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTenant(null);
                }}
                className="px-4 py-2 rounded-xl bg-surface-sunken hover:bg-surface text-default border border-default text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {selectedTenant.status === 'active' ? (
                <button
                  onClick={() => handleUpdateStatus('suspended')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus('active')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
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
export default TenantDirectoryWorkspace;
