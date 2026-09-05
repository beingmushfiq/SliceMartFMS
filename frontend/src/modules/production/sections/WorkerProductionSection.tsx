import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { SelectDropdown } from '../../../components/ui/Dropdown';
import { StatusBadge } from '../../../components/ui/Badge';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type {
  WorkerProductionEntry,
  WorkerOutputSummary,
  Employee,
  ProductionBatch,
} from '../../../types/api/production';
import type { Product } from '../../../types/api/catalog';
import { useCurrency } from '../../../hooks/useCurrency';

interface CreateEntryDraft {
  batch_id: string;
  employee_id: string;
  product_id: string;
  work_date: string;
  shift: 'morning' | 'evening' | 'night' | 'general';
  wage_type: 'piece_rate' | 'hourly';
  good_quantity: string;
  rework_quantity: string;
  rejected_quantity: string;
  hours_worked?: string;
  piece_rate?: string;
  notes?: string;
}

interface EditEntryDraft {
  id: string;
  worker_name?: string | undefined;
  batch_number?: string | undefined;
  product_name?: string | undefined;
  good_quantity: string;
  rework_quantity: string;
  rejected_quantity: string;
  piece_rate: string;
  hours_worked?: string | undefined;
  wage_type: 'piece_rate' | 'hourly';
}

export function WorkerProductionSection() {
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditEntryDraft | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<CreateEntryDraft>({
    batch_id: '',
    employee_id: '',
    product_id: '',
    work_date: new Date().toISOString().slice(0, 10),
    shift: 'morning',
    wage_type: 'piece_rate',
    good_quantity: '50.0000',
    rework_quantity: '0.0000',
    rejected_quantity: '0.0000',
    piece_rate: '2.5000',
  });

  const queryClient = useQueryClient();

  // Queries
  const entriesQuery = useQuery({
    queryKey: ['production', 'worker-entries', search, shiftFilter, statusFilter],
    queryFn: ({ signal }) =>
      api.get<WorkerProductionEntry[]>('/production/worker-entries', {
        signal,
        params: {
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
          ...(shiftFilter !== 'all' ? { shift: shiftFilter } : {}),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        },
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ['production', 'worker-entries', 'summary'],
    queryFn: ({ signal }) =>
      api.get<WorkerOutputSummary>('/production/worker-entries/summary', { signal }),
  });

  const batchesQuery = useQuery({
    queryKey: ['production', 'batches', 'options'],
    queryFn: ({ signal }) => api.get<ProductionBatch[]>('/production/batches', { signal }),
  });

  const productsQuery = useQuery({
    queryKey: ['catalogue', 'products', 'options'],
    queryFn: ({ signal }) => api.get<Product[]>('/products', { signal }),
  });

  const employeesQuery = useQuery({
    queryKey: ['production', 'employees', 'options'],
    queryFn: async ({ signal }) => {
      try {
        return await api.get<Employee[]>('/hr/employees', { signal });
      } catch {
        try {
          return await api.get<Employee[]>('/workforce/employees', { signal });
        } catch {
          return { data: [] };
        }
      }
    },
  });

  const entries = entriesQuery.data?.data ?? [];
  const summary = summaryQuery.data?.data;
  const batches = batchesQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];

  useEffect(() => {
    if (isCreateOpen) {
      setDraft((d) => {
        const selectedBatch = batches.find((b) => b.id === d.batch_id) ?? batches[0];
        return {
          ...d,
          batch_id: d.batch_id || selectedBatch?.id || '',
          employee_id: d.employee_id || employees[0]?.id || '',
          product_id: d.product_id || selectedBatch?.product_id || '',
        };
      });
    }
  }, [isCreateOpen, batches, employees]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateEntryDraft) => {
      const selectedBatch = batches.find((b) => b.id === payload.batch_id);
      const selectedProduct = products.find(
        (p) => p.id === (payload.product_id || selectedBatch?.product_id)
      );
      const mappedPayload = {
        production_batch_id: payload.batch_id,
        batch_id: payload.batch_id,
        employee_id: payload.employee_id,
        product_id: payload.product_id || selectedBatch?.product_id || selectedProduct?.id,
        work_date: payload.work_date,
        shift: payload.shift,
        measure_type: 'piece',
        quantity: payload.good_quantity,
        good_quantity: payload.good_quantity,
        unit_id: selectedBatch?.output_unit_id ?? selectedProduct?.base_unit_id,
        rework_quantity: payload.rework_quantity || '0.0000',
        rejected_quantity: payload.rejected_quantity || '0.0000',
        rate_type: payload.wage_type,
        wage_type: payload.wage_type,
        rate: payload.piece_rate || '2.5000',
        piece_rate: payload.piece_rate || '2.5000',
        hours_worked: payload.hours_worked || (payload.wage_type === 'hourly' ? '8.00' : undefined),
      };
      return api.post<WorkerProductionEntry>('/production/worker-entries', mappedPayload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'worker-entries'] });
      setIsCreateOpen(false);
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        const fieldErrors =
          err.fields && Object.keys(err.fields).length > 0
            ? Object.entries(err.fields)
                .map(([field, msgs]) => `${field.replace(/_/g, ' ')}: ${msgs.join(', ')}`)
                .join('; ')
            : null;
        setErrorMsg(fieldErrors || err.message || 'Failed to log worker output.');
      } else {
        setErrorMsg('Error logging worker output. Please check inputs.');
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<WorkerProductionEntry>(`/production/worker-entries/${id}/verify`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'worker-entries'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (draftPayload: EditEntryDraft) => {
      const payload = {
        quantity: draftPayload.good_quantity,
        rework_quantity: draftPayload.rework_quantity,
        rejected_quantity: draftPayload.rejected_quantity,
        rate: draftPayload.piece_rate,
        rate_type: draftPayload.wage_type,
        ...(draftPayload.hours_worked ? { hours_worked: draftPayload.hours_worked } : {}),
      };
      return api.patch<WorkerProductionEntry>(`/production/worker-entries/${draftPayload.id}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'worker-entries'] });
      setEditDraft(null);
      setEditErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        const fieldErrors = err.fields ? Object.values(err.fields).flat().join(', ') : null;
        setEditErrorMsg(fieldErrors || err.message || 'Failed to update entry.');
      } else {
        setEditErrorMsg('Error updating entry.');
      }
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/production/worker-entries/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'worker-entries'] });
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to delete worker entry.');
    },
  });

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatShiftDisplay = (shiftStr?: string) => {
    if (!shiftStr) return 'General Shift';
    return `${shiftStr.charAt(0).toUpperCase() + shiftStr.slice(1)} Shift`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Summary Bar */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Total Good Output
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {summary.total_good_quantity ?? '0.0000'}
            </div>
          </div>
          <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Rework Quantity
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {summary.total_rework_quantity ?? '0.0000'}
            </div>
          </div>
          <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Rejected Quantity
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {summary.total_rejected_quantity ?? '0.0000'}
            </div>
          </div>
          <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Earned Wages
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(Number(summary.total_earned ?? 0))}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by worker name or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface-sunken py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Shifts' },
              { value: 'morning', label: 'Morning Shift', colorDot: 'bg-amber-400' },
              { value: 'evening', label: 'Evening Shift', colorDot: 'bg-indigo-500' },
              { value: 'night', label: 'Night Shift', colorDot: 'bg-purple-600' },
              { value: 'general', label: 'General Shift', colorDot: 'bg-blue-500' },
            ]}
            value={shiftFilter}
            onChange={(val) => setShiftFilter(val)}
            size="sm"
            aria-label="Filter production by shift"
          />

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft', colorDot: 'bg-slate-400' },
              { value: 'verified', label: 'Verified', colorDot: 'bg-emerald-500' },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            size="sm"
            aria-label="Filter production by status"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            const defaultBatch = batches[0];
            const defaultProduct = defaultBatch
              ? products.find((p) => p.id === defaultBatch.product_id) ?? products[0]
              : products[0];
            setDraft({
              batch_id: defaultBatch?.id ?? '',
              employee_id: employees[0]?.id ?? '',
              product_id: defaultProduct?.id ?? defaultBatch?.product_id ?? '',
              work_date: new Date().toISOString().slice(0, 10),
              shift: 'morning',
              wage_type: 'piece_rate',
              good_quantity: '50.0000',
              rework_quantity: '0.0000',
              rejected_quantity: '0.0000',
              piece_rate: '2.5000',
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 min-h-11"
        >
          <Plus className="h-4 w-4" />
          <span>Log Worker Output</span>
        </Button>
      </div>

      {/* Entries Table */}
      <QueryBoundary
        status={entriesQuery.status}
        error={entriesQuery.error}
        data={entriesQuery.data}
        isFetching={entriesQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Worker</th>
                <th className="py-3.5 px-3">Batch & Product</th>
                <th className="py-3.5 px-3">Shift & Date</th>
                <th className="py-3.5 px-3">Good / Rework / Rej</th>
                <th className="py-3.5 px-3">Earned Wage</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken border border-default mb-2">
                      <Users className="h-5 w-5 text-muted" />
                    </div>
                    <div className="text-sm font-medium text-default">
                      No worker production entries found
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Log daily worker unit output on the shop floor.
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3 pl-4 pr-3">
                      <div className="font-medium text-default flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{entry.employee_name ?? entry.employee_id}</span>
                      </div>
                      {entry.employee_code && (
                        <div className="text-[10px] text-muted">{entry.employee_code}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-default">
                        {entry.batch_number ?? entry.batch_id}
                      </div>
                      <div className="text-[10px] text-muted">
                        {entry.product_name ?? entry.product_id}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted">
                      <div className="font-medium text-default">{formatDateDisplay(entry.work_date)}</div>
                      <div className="text-[10px] uppercase font-semibold text-muted">
                        {formatShiftDisplay(entry.shift)}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{entry.good_quantity}</span>
                      <span className="text-muted"> / </span>
                      <span className="text-amber-600 dark:text-amber-400">{entry.rework_quantity}</span>
                      <span className="text-muted"> / </span>
                      <span className="text-rose-600 dark:text-rose-400">{entry.rejected_quantity}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-default font-semibold">
                      {entry.total_earned
                        ? formatCurrency(Number(entry.total_earned))
                        : formatCurrency(Number(entry.good_quantity || 0) * Number(entry.piece_rate || 2.5))}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {entry.status === 'draft' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => verifyMutation.mutate(entry.id)}
                            disabled={verifyMutation.isPending}
                            className="text-xs text-emerald-600 dark:text-emerald-400 min-h-8 flex items-center gap-1"
                            title="Verify and Lock Entry"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Verify</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditDraft({
                              id: entry.id,
                              worker_name: entry.employee_name,
                              batch_number: entry.batch_number,
                              product_name: entry.product_name,
                              good_quantity: entry.good_quantity,
                              rework_quantity: entry.rework_quantity,
                              rejected_quantity: entry.rejected_quantity,
                              piece_rate: entry.piece_rate || '2.5000',
                              hours_worked: entry.hours_worked || '',
                              wage_type: entry.wage_type || 'piece_rate',
                            });
                            setEditErrorMsg(null);
                          }}
                          className="text-xs min-h-8 text-muted hover:text-default"
                          title="Edit Worker Entry"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>

                        {entry.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Delete this worker production entry?')) {
                                deleteEntryMutation.mutate(entry.id);
                              }
                            }}
                            disabled={deleteEntryMutation.isPending}
                            className="text-xs text-rose-500 hover:text-rose-600 min-h-8"
                            title="Delete Entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {entry.status === 'verified' && (
                          <span className="text-[11px] text-muted flex items-center gap-1 pl-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* Log Output Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Worker Production Output"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Employee / Worker
              </label>
              <select
                value={draft.employee_id}
                onChange={(e) => setDraft((d) => ({ ...d, employee_id: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs text-default focus:border-primary focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_code} - {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Production Batch
              </label>
              <select
                value={draft.batch_id}
                onChange={(e) => {
                  const val = e.target.value;
                  const b = batches.find((item) => item.id === val);
                  setDraft((d) => ({
                    ...d,
                    batch_id: val,
                    product_id: b?.product_id ?? d.product_id,
                  }));
                }}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs text-default focus:border-primary focus:outline-none"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} ({b.product_name ?? 'Product'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Work Date
              </label>
              <input
                type="date"
                value={draft.work_date}
                onChange={(e) => setDraft((d) => ({ ...d, work_date: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Shift
              </label>
              <select
                value={draft.shift}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    shift: e.target.value as 'morning' | 'evening' | 'night' | 'general',
                  }))
                }
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Wage Basis
              </label>
              <select
                value={draft.wage_type}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    wage_type: e.target.value as 'piece_rate' | 'hourly',
                  }))
                }
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="piece_rate">Piece Rate</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Good Qty (Units)
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.good_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, good_quantity: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Rework Qty
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.rework_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, rework_quantity: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-amber-600 dark:text-amber-400 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Rejected Qty
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.rejected_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, rejected_quantity: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-rose-600 dark:text-rose-400 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-default">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate(draft)}
              disabled={createMutation.isPending || !draft.employee_id || !draft.batch_id}
              className="min-h-11"
            >
              {createMutation.isPending ? 'Logging...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Output Modal */}
      {editDraft && (
        <Modal
          open={Boolean(editDraft)}
          onClose={() => setEditDraft(null)}
          title="Edit Worker Production Output"
        >
          <div className="space-y-4">
            {editErrorMsg && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                {editErrorMsg}
              </div>
            )}

            <div className="rounded-xl bg-surface-sunken p-3 border border-default text-xs space-y-1">
              <div className="font-semibold text-default">{editDraft.worker_name}</div>
              <div className="text-muted">
                Batch: <span className="font-mono text-default font-semibold">{editDraft.batch_number}</span> · Product: <span className="text-default">{editDraft.product_name}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Good Output
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editDraft.good_quantity}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, good_quantity: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Rework Qty
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editDraft.rework_quantity}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, rework_quantity: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-amber-600 dark:text-amber-400 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Rejected Qty
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editDraft.rejected_quantity}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, rejected_quantity: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-rose-600 dark:text-rose-400 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Piece Rate
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editDraft.piece_rate}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, piece_rate: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Hours Worked
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editDraft.hours_worked ?? ''}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, hours_worked: e.target.value } : null))}
                  placeholder="e.g. 8.00"
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-default focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-default">
              <Button variant="ghost" onClick={() => setEditDraft(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => editDraft && updateMutation.mutate(editDraft)}
                disabled={updateMutation.isPending || !editDraft.good_quantity}
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Entry'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
