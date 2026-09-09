import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Target,
  TrendingUp,
  Award,
  DollarSign,
  Kanban,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../hooks/useCurrency';
import { KPICard } from '../../../components/ui/KPICard';
import type { SalesmanDashboardData, SalesmanSummary } from '../../../types/api/sales';

interface Props {
  initialSalesmanId?: number | null;
}

export function SalesmanDashboardSection({ initialSalesmanId }: Props) {
  const { formatCurrency } = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(
    initialSalesmanId || null
  );

  // Fetch salesmen list for dropdown
  const { data: salesmenResponse } = useQuery<SalesmanSummary[] | { data: SalesmanSummary[] }>({
    queryKey: ['sales', 'salesmen', selectedMonth],
    queryFn: async () => {
      const res = await api.get<SalesmanSummary[] | { data: SalesmanSummary[] }>(
        `/sales/salesmen?period_month=${selectedMonth}`
      );
      return res.data;
    },
  });

  const salesmen: SalesmanSummary[] = useMemo(() => {
    if (Array.isArray(salesmenResponse)) return salesmenResponse;
    if (salesmenResponse && 'data' in salesmenResponse && Array.isArray(salesmenResponse.data)) {
      return salesmenResponse.data;
    }
    return [];
  }, [salesmenResponse]);

  const activeSalesmanId = selectedSalesmanId ?? (salesmen.length > 0 ? (salesmen[0]?.id ?? null) : null);

  // Fetch personal dashboard data
  const {
    data: dashboardData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<SalesmanDashboardData>({
    queryKey: ['sales', 'salesman', activeSalesmanId, 'dashboard', selectedMonth],
    queryFn: async () => {
      if (!activeSalesmanId) throw new Error('No salesman selected');
      const res = await api.get<SalesmanDashboardData>(
        `/sales/salesmen/${activeSalesmanId}/dashboard?period_month=${selectedMonth}`
      );
      return res.data;
    },
    enabled: Boolean(activeSalesmanId),
  });

  const kpis = dashboardData?.kpis;
  const salesman = dashboardData?.salesman;
  const recentOrders = dashboardData?.recent_orders ?? [];
  const recentLeads = dashboardData?.recent_leads ?? [];

  return (
    <div className="space-y-6">
      {/* Salesman & Month Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-default pb-4">
        <div>
          <h2 className="text-lg font-bold text-default">My Sales Performance Dashboard</h2>
          <p className="text-xs text-muted">
            Individual target achievement, lead qualification metrics, profitability, and commission status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-surface-sunken px-3 py-1.5 rounded-xl border border-default">
            <UserCheck className="size-3.5 text-muted" />
            <select
              value={activeSalesmanId || ''}
              onChange={(e) => setSelectedSalesmanId(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-default focus:outline-none cursor-pointer"
            >
              {salesmen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-sunken px-3 py-1.5 rounded-xl border border-default">
            <span className="text-xs font-semibold text-muted">Period:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-default focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-muted hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted">Loading salesman performance metrics...</div>
      ) : !dashboardData || !kpis ? (
        <div className="py-12 text-center text-xs text-muted">
          No performance records available for this representative.
        </div>
      ) : (
        <>
          {/* Main KPI Cards Row 1: Target & Revenue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Monthly Target"
              value={formatCurrency(kpis.target_amount)}
              subValue={`Assigned quota for ${selectedMonth}`}
              icon={<Target className="w-4 h-4 text-primary" />}
            />
            <KPICard
              label="Revenue Achieved"
              value={formatCurrency(kpis.achieved_amount)}
              subValue={`${kpis.achievement_pct.toFixed(1)}% of target`}
              alert={kpis.achievement_pct >= 100 ? 'success' : kpis.achievement_pct >= 80 ? 'warning' : 'danger'}
              icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
            />
            <KPICard
              label="Remaining Target"
              value={formatCurrency(kpis.remaining_target)}
              subValue="Pending to achieve quota"
              icon={<DollarSign className="w-4 h-4 text-warning" />}
            />
            <KPICard
              label="Estimated Incentive"
              value={formatCurrency(kpis.estimated_incentive)}
              subValue="Eligible commission based on rules"
              alert="success"
              icon={<Award className="w-4 h-4 text-info" />}
            />
          </div>

          {/* KPI Cards Row 2: Leads & Profitability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total Assigned Leads"
              value={kpis.total_leads}
              subValue={`${kpis.valid_leads} valid leads`}
              icon={<Kanban className="w-4 h-4 text-primary" />}
            />
            <KPICard
              label="Converted Leads"
              value={kpis.converted_leads}
              subValue={`${kpis.conversion_rate.toFixed(1)}% conversion rate`}
              alert="success"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />
            <KPICard
              label="Fake / Invalid Leads"
              value={kpis.fake_leads}
              subValue="Filtered by audit team"
              {...(kpis.fake_leads > 0 ? { alert: 'danger' as const } : {})}
              icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
            />
            <KPICard
              label="Profit Generated"
              value={formatCurrency(kpis.profit_generated)}
              subValue="Estimated gross commercial margin"
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
            />
          </div>

          {/* Visual Progress Bar Card */}
          <div className="rounded-2xl border border-default bg-surface p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-default">
                  Monthly Target Quota Progress — {salesman?.name}
                </h3>
                <p className="text-xs text-muted">
                  {formatCurrency(kpis.achieved_amount)} achieved of {formatCurrency(kpis.target_amount)} commitment
                </p>
              </div>
              <span
                className={`font-mono font-extrabold text-lg ${
                  kpis.achievement_pct >= 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : kpis.achievement_pct >= 80
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {kpis.achievement_pct.toFixed(1)}%
              </span>
            </div>

            <div className="w-full h-3 bg-surface-sunken rounded-full overflow-hidden border border-default/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  kpis.achievement_pct >= 100
                    ? 'bg-emerald-500'
                    : kpis.achievement_pct >= 80
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(kpis.achievement_pct, 100)}%` }}
              />
            </div>
          </div>

          {/* Two-Column: Recent Orders & Recent Leads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="rounded-2xl border border-default bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-default pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="size-4 text-primary" />
                  <h4 className="text-sm font-bold text-default">Recent Sales Orders</h4>
                </div>
                <span className="text-[11px] font-mono text-muted">{recentOrders.length} orders</span>
              </div>

              {recentOrders.length === 0 ? (
                <p className="text-xs text-muted py-6 text-center">No recent orders for this period.</p>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-sunken/40 border border-default/40 text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-default">{ord.order_number}</div>
                        <div className="text-[11px] text-muted font-mono">{ord.order_date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-default">
                          {formatCurrency(ord.total_amount)}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-primary-subtle text-primary border border-primary capitalize">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Leads */}
            <div className="rounded-2xl border border-default bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-default pb-3">
                <div className="flex items-center gap-2">
                  <Kanban className="size-4 text-info" />
                  <h4 className="text-sm font-bold text-default">Recent Assigned Leads</h4>
                </div>
                <span className="text-[11px] font-mono text-muted">{recentLeads.length} leads</span>
              </div>

              {recentLeads.length === 0 ? (
                <p className="text-xs text-muted py-6 text-center">No assigned leads for this period.</p>
              ) : (
                <div className="space-y-2">
                  {recentLeads.map((ld) => (
                    <div
                      key={ld.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-sunken/40 border border-default/40 text-xs"
                    >
                      <div>
                        <div className="font-bold text-default">{ld.name}</div>
                        <div className="text-[11px] text-muted">{ld.company_name || ld.lead_number}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-default">
                          {formatCurrency(ld.expected_value)}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold border capitalize ${
                            ld.is_fake
                              ? 'bg-danger-subtle text-danger border-danger'
                              : 'bg-surface-sunken text-muted border-default'
                          }`}
                        >
                          {ld.is_fake ? 'Fake Lead' : ld.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
