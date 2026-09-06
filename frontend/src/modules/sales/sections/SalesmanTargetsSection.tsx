import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Target,
  Plus,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../hooks/useCurrency';
import { KPICard } from '../../../components/ui/KPICard';
import type { SalesmanTarget } from '../../../types/api/sales';
import type { Employee } from '../../../types/api/hr';

export function SalesmanTargetsSection() {
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [targetName, setTargetName] = useState<string>('');
  const [targetNotes, setTargetNotes] = useState<string>('');

  // Fetch Targets for selected month
  const { data: targetsResponse, isLoading, isFetching, refetch } = useQuery<{
    data: SalesmanTarget[];
  }>({
    queryKey: ['sales', 'targets', selectedMonth],
    queryFn: async () => {
      const res = await api.get<{ data: SalesmanTarget[] }>(
        `/sales/targets?period_month=${selectedMonth}`
      );
      return res.data;
    },
  });

  const targets = targetsResponse?.data ?? [];

  // Fetch employees list for target assignment dropdown
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['hr', 'employees', 'options'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data?: Employee[] } | Employee[]>('/hr/employees');
        const rawData = res.data;
        return Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
      } catch {
        return [];
      }
    },
  });

  // Create Target Mutation
  const createTargetMutation = useMutation({
    mutationFn: async (payload: {
      employee_id: number;
      period_month: string;
      target_amount: number;
      target_name?: string;
      notes?: string;
    }) => {
      return api.post('/sales/targets', payload);
    },
    onSuccess: () => {
      toast.success('Sales target assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['sales', 'targets'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'salesmen'] });
      setCreateModalOpen(false);
      setSelectedEmployeeId('');
      setTargetAmount('');
      setTargetName('');
      setTargetNotes('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to assign target');
    },
  });

  // Recalculate target
  const recalculateMutation = useMutation({
    mutationFn: async (targetId: number) => {
      return api.post(`/sales/targets/${targetId}/recalculate`);
    },
    onSuccess: () => {
      toast.success('Target metrics updated with real-time sales and leads');
      queryClient.invalidateQueries({ queryKey: ['sales', 'targets'] });
    },
  });

  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    const amt = parseFloat(targetAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    createTargetMutation.mutate({
      employee_id: parseInt(selectedEmployeeId, 10),
      period_month: selectedMonth,
      target_amount: amt,
      target_name: targetName || `Monthly Target - ${selectedMonth}`,
      notes: targetNotes,
    });
  };

  const totalTargetAmt = targets.reduce((sum, t) => sum + parseFloat(String(t.target_amount || '0')), 0);
  const totalAchievedAmt = targets.reduce((sum, t) => sum + parseFloat(String(t.achieved_amount || '0')), 0);
  const overallPct = totalTargetAmt > 0 ? (totalAchievedAmt / totalTargetAmt) * 100 : 0;
  const pendingAmt = Math.max(0, totalTargetAmt - totalAchievedAmt);

  return (
    <div className="space-y-6">
      {/* Header & Month Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-default">Monthly Sales Targets Management</h2>
          <p className="text-xs text-muted">
            Configure, track, and audit revenue quotas across commercial sales representatives.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-surface-sunken px-3 py-1.5 rounded-xl border border-default">
            <span className="text-xs font-semibold text-muted">Month:</span>
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
            title="Refresh Targets"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Assign Target</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Monthly Quota"
          value={formatCurrency(totalTargetAmt)}
          subValue={`Target commitment for ${selectedMonth}`}
          icon={<Target className="w-4 h-4 text-primary" />}
        />
        <KPICard
          label="Total Revenue Achieved"
          value={formatCurrency(totalAchievedAmt)}
          subValue={`${overallPct.toFixed(1)}% of team target`}
          alert={overallPct >= 100 ? 'success' : overallPct >= 80 ? 'warning' : 'danger'}
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        />
        <KPICard
          label="Remaining Deficit"
          value={formatCurrency(pendingAmt)}
          subValue="Revenue pending to achieve"
          icon={<DollarSign className="w-4 h-4 text-warning" />}
        />
        <KPICard
          label="Active Target Count"
          value={targets.length}
          subValue="Sales personnel assigned"
          icon={<Users className="w-4 h-4 text-info" />}
        />
      </div>

      {/* Targets Table */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Salesman</th>
                <th className="px-4 py-3.5">Period Month</th>
                <th className="px-4 py-3.5">Target (৳)</th>
                <th className="px-4 py-3.5">Achieved (৳)</th>
                <th className="px-4 py-3.5">Achievement %</th>
                <th className="px-4 py-3.5">Leads & Converted</th>
                <th className="px-4 py-3.5">Profit Generated</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted">
                    Loading sales targets...
                  </td>
                </tr>
              ) : targets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted">
                    No targets assigned for {selectedMonth}. Click "Assign Target" to create one.
                  </td>
                </tr>
              ) : (
                targets.map((t) => {
                  const pct = parseFloat(String(t.achievement_percentage || '0'));
                  const isHigh = pct >= 100;
                  const isModerate = pct >= 80;

                  return (
                    <tr key={t.id} className="hover:bg-surface-sunken/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-default">{t.employee_name || 'Sales Representative'}</div>
                        <div className="text-[11px] font-mono text-muted mt-0.5">{t.employee_code}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-muted">
                        {t.period_month}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-semibold text-default">
                        {formatCurrency(t.target_amount)}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-default">
                        {formatCurrency(t.achieved_amount)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isHigh
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isModerate
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-20 h-1.5 bg-surface-sunken rounded-full overflow-hidden mt-1 border border-default/40">
                          <div
                            className={`h-full rounded-full ${
                              isHigh ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs text-default">
                          {t.total_leads} leads ({t.converted_leads} won)
                        </div>
                        <div className="text-[10px] text-muted">
                          {t.valid_leads} valid · {t.fake_leads} fake
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-default">
                        {formatCurrency(t.profit_generated)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.status === 'completed'
                              ? 'bg-success-subtle text-success border-success'
                              : t.status === 'active'
                              ? 'bg-primary-subtle text-primary border-primary'
                              : 'bg-surface-sunken text-muted border-default'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => recalculateMutation.mutate(t.id)}
                          disabled={recalculateMutation.isPending}
                          className="p-1.5 rounded-lg text-muted hover:text-default hover:bg-surface-sunken border border-default/50 transition-colors"
                          title="Recalculate Real-time Progress"
                        >
                          <RefreshCw className={`size-3.5 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Target Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-base font-bold text-default">Assign Monthly Sales Target</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-muted hover:text-default cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTarget} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Sales Representative *
                </label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.display_name || `${emp.first_name} ${emp.last_name}`} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Target Period Month *
                  </label>
                  <input
                    type="month"
                    required
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 font-mono text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Target Quota (৳) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1000000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 font-mono text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Target Label / Campaign
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Packaging Sales Drive"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Strategy & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key deliverables, retail vs wholesale mix..."
                  value={targetNotes}
                  onChange={(e) => setTargetNotes(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-default">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-default text-xs font-medium text-muted hover:text-default"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTargetMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-primary text-xs font-medium text-white shadow-xs hover:bg-primary-hover disabled:opacity-50"
                >
                  {createTargetMutation.isPending ? 'Assigning...' : 'Assign Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
