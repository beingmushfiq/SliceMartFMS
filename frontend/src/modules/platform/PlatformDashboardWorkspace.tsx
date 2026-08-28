import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api/client';
import type { PlatformDashboardData } from '../../types/api/platform';
import {
  Building2,
  Users,
  DollarSign,
  AlertTriangle,
  Server,
  Activity,
  UserPlus,
  CreditCard,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const PlatformDashboardWorkspace: React.FC = () => {
  const [data, setData] = useState<PlatformDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PlatformDashboardData>('/platform/dashboard/kpis');
      setData(response.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch platform metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Platform Engine Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            High-level SaaS tenancy health, MRR metrics, and platform telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/platform/tenants/new"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Tenant</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Tenants */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              Total Tenants
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-100 font-mono">
              {kpis?.total_tenants ?? 0}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-semibold">{kpis?.active_tenants ?? 0} Active</span>
              <span>•</span>
              <span className="text-blue-400">{kpis?.trial_tenants ?? 0} Trial</span>
              <span>•</span>
              <span className="text-rose-400">{kpis?.suspended_tenants ?? 0} Suspended</span>
            </div>
          </div>
        </div>

        {/* Estimated MRR */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              Estimated MRR
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-100 font-mono">
              ${(kpis?.estimated_mrr ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 font-mono">
              Based on active tenant subscription tiers
            </p>
          </div>
        </div>

        {/* Expiring Subscriptions */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              Expiring in 30d
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-100 font-mono">
              {kpis?.expiring_subscriptions_30d ?? 0}
            </div>
            <p className="mt-2 text-[11px] text-orange-400/90 font-mono">
              Tenants requiring renewal or extension
            </p>
          </div>
        </div>

        {/* Total Platform Users */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              Total Platform Users
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-100 font-mono">
              {kpis?.total_users ?? 0}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 font-mono">
              Across all isolated tenant workspaces
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Plan Breakdown & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Breakdown */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                Subscription Plan Distribution
              </h2>
            </div>
            <Link
              to="/platform/plans"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              Configure Plans →
            </Link>
          </div>

          <div className="space-y-4">
            {data?.plans?.map((plan) => {
              const total = kpis?.total_tenants || 1;
              const percentage = Math.round((plan.tenants_count / total) * 100);
              return (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 text-sm">{plan.name}</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {plan.code}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-200 font-mono">
                        {plan.tenants_count} Tenants
                      </span>
                      <span className="text-xs text-slate-400 font-mono ml-2">(${plan.price}/mo)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Health */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Server className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                System Health & Nodes
              </h2>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Database Engine</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {data?.system_health.database}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Distributed Cache</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {data?.system_health.cache}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Queue Processing</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {data?.system_health.queue}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Cluster Status</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>OPERATIONAL</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            Telemetry Heartbeat: {data?.system_health.server_time ? new Date(data.system_health.server_time).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Recent Platform Activity */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Live Platform Audit Stream
            </h2>
          </div>
          <Link
            to="/platform/audit-logs"
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            View Full Audit Trail →
          </Link>
        </div>

        {data?.recent_activity && data.recent_activity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-3 pl-2">Timestamp</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Target Entity</th>
                  <th className="pb-3">Actor</th>
                  <th className="pb-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.recent_activity.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-slate-200">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="py-3 text-slate-300">{log.actor_name}</td>
                    <td className="py-3 text-slate-400 truncate max-w-xs">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-mono">
            No platform audit entries recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
export default PlatformDashboardWorkspace;
