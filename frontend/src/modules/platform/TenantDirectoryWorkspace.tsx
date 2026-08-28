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
    fetchTenants();
  }, [fetchTenants]);

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
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Active</span>
          </span>
        );
      case 'trial':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Trial</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Suspended</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Tenant Directory</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Provision, monitor, and enforce multi-tenant lifecycle states across DevCenterPoint.
          </p>
        </div>

        <Link
          to="/platform/tenants/new"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Tenant</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name, slug (e.g. slicemart), or domain..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition-colors"
          />
        </form>

        <div className="flex items-center gap-2">
          {['all', 'active', 'trial', 'suspended'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={fetchTenants}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono animate-pulse">
            Loading tenant registry...
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            No tenants matched your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3.5 pl-6">Tenant Name & Subdomain</th>
                  <th className="py-3.5">Plan Tier</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Currency / Locale</th>
                  <th className="py-3.5">Onboarded</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <Link
                            to={`/platform/tenants/${t.id}`}
                            className="font-bold text-slate-100 hover:text-amber-400 transition-colors text-sm font-sans"
                          >
                            {t.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span>{t.slug}.devcenterpoint.com</span>
                            <a
                              href={`https://${t.slug}.devcenterpoint.com`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-slate-300">
                      <div>
                        <span className="font-semibold text-slate-200">{t.plan?.name ?? 'Standard'}</span>
                        <div className="text-[10px] text-slate-400">${t.plan?.price ?? 0}/mo</div>
                      </div>
                    </td>

                    <td className="py-4">{getStatusBadge(t.status)}</td>

                    <td className="py-4 text-slate-400 text-[11px]">
                      <div>{t.currency_code}</div>
                      <div className="text-[10px] text-slate-400">{t.timezone}</div>
                    </td>

                    <td className="py-4 text-slate-400 text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 pr-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/platform/tenants/${t.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          View Details
                        </Link>

                        {t.status === 'active' ? (
                          <button
                            onClick={() => {
                              setSelectedTenant(t);
                              setModalType('status');
                            }}
                            className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs transition-colors"
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
                            className="px-2.5 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 text-xs transition-colors"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              {selectedTenant.status === 'active' ? 'Suspend Tenant Access' : 'Reactivate Tenant'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Target Tenant: <strong className="text-slate-200">{selectedTenant.name}</strong> ({selectedTenant.slug})
            </p>

            {actionError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Reason for state change (Logged in platform audit trail)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Non-payment of subscription fee or SLA terms violation"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                rows={3}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 font-mono">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTenant(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              {selectedTenant.status === 'active' ? (
                <button
                  onClick={() => handleUpdateStatus('suspended')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus('active')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
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
