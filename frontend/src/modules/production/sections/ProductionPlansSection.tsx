import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Search, Trash2, Rocket } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { SelectDropdown } from '../../../components/ui/Dropdown';
import { StatusBadge } from '../../../components/ui/Badge';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { ProductionPlan } from '../../../types/api/production';
import type { Product } from '../../../types/api/catalog';
import type { BillOfMaterial } from '../../../types/api/bom';

interface CreatePlanItemDraft {
  product_id: string;
  bom_id: string;
  planned_quantity: string;
  notes?: string;
}

interface CreatePlanDraft {
  plan_number: string;
  title: string;
  start_date: string;
  end_date: string;
  notes?: string;
  items: CreatePlanItemDraft[];
}

interface LaunchBatchDraft {
  plan_id: string;
  plan_number: string;
  product_id: string;
  bom_id: string;
  batch_number: string;
  target_quantity: string;
  scheduled_start: string;
  scheduled_end: string;
}

export function ProductionPlansSection() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [launchBatchDraft, setLaunchBatchDraft] = useState<LaunchBatchDraft | null>(null);
  const [launchErrorMsg, setLaunchErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<CreatePlanDraft>(() => ({
    plan_number: '',
    title: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    notes: '',
    items: [{ product_id: '', bom_id: '', planned_quantity: '100.0000' }],
  }));

  const queryClient = useQueryClient();

  // Queries
  const plansQuery = useQuery({
    queryKey: ['production', 'plans', search, statusFilter],
    queryFn: ({ signal }) =>
      api.get<ProductionPlan[]>('/production/plans', {
        signal,
        params: {
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        },
      }),
  });

  const productsQuery = useQuery({
    queryKey: ['catalogue', 'products', 'options'],
    queryFn: ({ signal }) => api.get<Product[]>('/products', { signal }),
  });

  const bomsQuery = useQuery({
    queryKey: ['catalogue', 'boms', 'options'],
    queryFn: ({ signal }) => api.get<BillOfMaterial[]>('/bill-of-materials', { signal }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreatePlanDraft) => {
      const mappedPayload = {
        plan_number: payload.plan_number,
        title: payload.title,
        notes: payload.notes || payload.title,
        plan_date: payload.start_date,
        period_start: payload.start_date,
        period_end: payload.end_date,
        source: 'manual',
        items: payload.items.map((it, idx) => {
          const matchingBom = boms.find((b) => b.id === it.bom_id);
          const matchingProduct = products.find((p) => p.id === it.product_id);
          return {
            product_id: it.product_id,
            bill_of_material_id: it.bom_id,
            bom_id: it.bom_id,
            planned_quantity: it.planned_quantity,
            unit_id: matchingBom?.output_unit_id ?? matchingProduct?.base_unit_id ?? undefined,
            sort_order: idx,
          };
        }),
      };
      return api.post<ProductionPlan>('/production/plans', mappedPayload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'plans'] });
      setIsCreateOpen(false);
      setDraft({
        plan_number: '',
        title: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        notes: '',
        items: [{ product_id: '', bom_id: '', planned_quantity: '100.0000' }],
      });
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        const fieldErrors = err.fields ? Object.values(err.fields).flat().join(', ') : null;
        setErrorMsg(fieldErrors || err.message || 'Failed to create production plan.');
      } else {
        setErrorMsg('Error creating production plan. Please check inputs.');
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: (planId: string) => api.post<ProductionPlan>(`/production/plans/${planId}/approve`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'plans'] });
      if (selectedPlan) {
        setSelectedPlan((p) => (p ? { ...p, status: 'approved' } : null));
      }
    },
  });

  const updatePlanStatusMutation = useMutation({
    mutationFn: ({ planId, status }: { planId: string; status: string }) =>
      api.patch<ProductionPlan>(`/production/plans/${planId}`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'plans'] });
      if (selectedPlan) {
        setSelectedPlan((p) => (p ? { ...p, status: status as ProductionPlan['status'] } : null));
      }
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to update plan status.');
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => api.delete(`/production/plans/${planId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'plans'] });
      setSelectedPlan(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to delete plan.');
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: (draftPayload: LaunchBatchDraft) => {
      const payload = {
        batch_number: draftPayload.batch_number,
        plan_id: draftPayload.plan_id,
        product_id: draftPayload.product_id,
        bom_id: draftPayload.bom_id,
        target_quantity: draftPayload.target_quantity,
        scheduled_start: draftPayload.scheduled_start,
        scheduled_end: draftPayload.scheduled_end,
      };
      return api.post('/production/batches', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
      await queryClient.invalidateQueries({ queryKey: ['production', 'plans'] });
      setLaunchBatchDraft(null);
      setLaunchErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        const fieldErrors = err.fields ? Object.values(err.fields).flat().join(', ') : null;
        setLaunchErrorMsg(fieldErrors || err.message || 'Failed to launch batch.');
      } else {
        setLaunchErrorMsg('Error launching batch.');
      }
    },
  });

  const plans = plansQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const boms = bomsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search plans by title or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface-sunken py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft', colorDot: 'bg-slate-400' },
              { value: 'approved', label: 'Approved', colorDot: 'bg-emerald-500' },
              { value: 'in_progress', label: 'In Progress', colorDot: 'bg-blue-500' },
              { value: 'completed', label: 'Completed', colorDot: 'bg-purple-500' },
              { value: 'cancelled', label: 'Cancelled', colorDot: 'bg-rose-500' },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            size="sm"
            aria-label="Filter plans by status"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            const defaultProduct = products.find((p) => p.type === 'finished_good') ?? products[0];
            const matchingBom = defaultProduct
              ? boms.find((b) => b.product_id === defaultProduct.id) ?? boms[0]
              : boms[0];
            setDraft({
              plan_number: `PLN-${Date.now().toString().slice(-6)}`,
              title: '',
              start_date: new Date().toISOString().slice(0, 10),
              end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
              notes: '',
              items: [
                {
                  product_id: defaultProduct?.id ?? '',
                  bom_id: matchingBom?.id ?? '',
                  planned_quantity: '100.0000',
                },
              ],
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Production Plan</span>
        </Button>
      </div>

      {/* Data Table */}
      <QueryBoundary
        status={plansQuery.status}
        error={plansQuery.error}
        data={plansQuery.data}
        isFetching={plansQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Plan Number</th>
                <th className="py-3.5 px-3">Title</th>
                <th className="py-3.5 px-3">Date Range</th>
                <th className="py-3.5 px-3">Items Count</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken border border-default mb-2">
                      <ClipboardList className="h-5 w-5 text-muted" />
                    </div>
                    <div className="text-sm font-medium text-default">
                      No production plans found
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {search
                        ? 'Try adjusting search or status filters'
                        : 'Create your first production plan to get started.'}
                    </div>
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-primary">
                      {plan.plan_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-default">{plan.title}</td>
                    <td className="py-3 px-3 text-muted">
                      {plan.start_date} to {plan.end_date}
                    </td>
                    <td className="py-3 px-3 font-mono text-default">
                      {plan.items?.length ?? 0} items
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Quick Launch Batch Action */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const firstItem = plan.items?.[0];
                            const prodId = firstItem?.product_id ?? products[0]?.id ?? '';
                            const matchingBom = firstItem?.bom_id ?? boms.find((b) => b.product_id === prodId)?.id ?? boms[0]?.id ?? '';
                            setLaunchBatchDraft({
                              plan_id: plan.id,
                              plan_number: plan.plan_number,
                              product_id: prodId,
                              bom_id: matchingBom,
                              batch_number: `BAT-${plan.plan_number.replace(/^PLN-/, '')}-${Date.now().toString().slice(-4)}`,
                              target_quantity: firstItem?.planned_quantity ?? '100.0000',
                              scheduled_start: plan.start_date,
                              scheduled_end: plan.end_date,
                            });
                            setLaunchErrorMsg(null);
                          }}
                          className="text-xs text-emerald-600 dark:text-emerald-400 min-h-8 flex items-center gap-1"
                          title="Launch Shop Floor Batch from Plan"
                        >
                          <Rocket className="h-3.5 w-3.5" />
                          <span>Launch Batch</span>
                        </Button>

                        {/* Status Transition dropdown */}
                        <select
                          value={plan.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (newStatus === 'approved' && plan.status === 'draft') {
                              approveMutation.mutate(plan.id);
                            } else {
                              updatePlanStatusMutation.mutate({ planId: plan.id, status: newStatus });
                            }
                          }}
                          className="h-8 rounded-lg border border-default bg-surface-sunken px-2 text-[11px] font-medium text-default focus:border-primary focus:outline-none cursor-pointer"
                          title="Change Plan Status"
                        >
                          <option value="draft">Draft</option>
                          <option value="approved">Approved</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPlan(plan)}
                          className="text-xs min-h-8"
                          title="View Plan Details"
                        >
                          View
                        </Button>

                        {(plan.status === 'draft' || plan.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Delete plan ${plan.plan_number}?`)) {
                                deletePlanMutation.mutate(plan.id);
                              }
                            }}
                            className="text-xs text-rose-500 hover:text-rose-600 min-h-8"
                            title="Delete Plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Create Plan Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Master Production Plan"
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
                Plan Number
              </label>
              <input
                type="text"
                value={draft.plan_number}
                onChange={(e) => setDraft((d) => ({ ...d, plan_number: e.target.value }))}
                placeholder="e.g. PLN-2026-001"
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Plan Title
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Weekly Production Wave A"
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={draft.start_date}
                onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={draft.end_date}
                onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Plan Items Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Planned Products
              </label>
              <button
                type="button"
                onClick={() => {
                  const defaultProduct = products.find((p) => p.type === 'finished_good') ?? products[0];
                  const matchingBom = defaultProduct
                    ? boms.find((b) => b.product_id === defaultProduct.id) ?? boms[0]
                    : boms[0];
                  setDraft((d) => ({
                    ...d,
                    items: [
                      ...d.items,
                      {
                        product_id: defaultProduct?.id ?? '',
                        bom_id: matchingBom?.id ?? '',
                        planned_quantity: '50.0000',
                      },
                    ],
                  }));
                }}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {draft.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 rounded-xl bg-surface-sunken p-2.5 border border-default items-center"
                >
                  <div className={draft.items.length > 1 ? 'col-span-5' : 'col-span-5'}>
                    <label className="text-[10px] text-muted">Product</label>
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matchingBom = boms.find((b) => b.product_id === val);
                        setDraft((d) => ({
                          ...d,
                          items: d.items.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  product_id: val,
                                  bom_id: matchingBom?.id ?? it.bom_id,
                                }
                              : it
                          ),
                        }));
                      }}
                      className="w-full rounded-lg border border-default bg-surface p-1.5 text-xs text-default focus:border-primary focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="text-[10px] text-muted">Bill of Materials</label>
                    <select
                      value={item.bom_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((d) => ({
                          ...d,
                          items: d.items.map((it, i) => (i === idx ? { ...it, bom_id: val } : it)),
                        }));
                      }}
                      className="w-full rounded-lg border border-default bg-surface p-1.5 text-xs text-default focus:border-primary focus:outline-none"
                    >
                      {boms.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code ? `${b.code} - ` : ''}{b.name} (v{b.version})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={draft.items.length > 1 ? 'col-span-2' : 'col-span-3'}>
                    <label className="text-[10px] text-muted">Planned Qty</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={item.planned_quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((d) => ({
                          ...d,
                          items: d.items.map((it, i) =>
                            i === idx ? { ...it, planned_quantity: val } : it
                          ),
                        }));
                      }}
                      className="w-full rounded-lg border border-default bg-surface p-1.5 text-xs text-default focus:border-primary focus:outline-none font-mono"
                    />
                  </div>

                  {draft.items.length > 1 && (
                    <div className="col-span-1 pt-3.5 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            items: d.items.filter((_, i) => i !== idx),
                          }))
                        }
                        className="p-1 text-muted hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-default">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate(draft)}
              disabled={createMutation.isPending || !draft.title || !draft.plan_number}
            >
              {createMutation.isPending ? 'Saving...' : 'Create Plan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Plan Details Modal */}
      {selectedPlan && (
        <Modal
          open={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
          title={`Plan Details: ${selectedPlan.plan_number}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-surface-sunken p-3 border border-default">
              <div>
                <div className="text-sm font-semibold text-default">{selectedPlan.title}</div>
                <div className="text-xs text-muted mt-0.5">
                  {selectedPlan.start_date} to {selectedPlan.end_date}
                </div>
              </div>
              <div>
                <StatusBadge status={selectedPlan.status} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted uppercase tracking-wider">
                Planned Items ({selectedPlan.items?.length ?? 0})
              </div>
              <div className="rounded-xl border border-default overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken text-muted">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Planned Qty</th>
                      <th className="p-2.5">Completed Qty</th>
                      <th className="p-2.5 text-right">Floor Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default bg-surface">
                    {selectedPlan.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-sunken/40">
                        <td className="p-2.5 text-default font-medium">
                          {item.product_name ?? item.product_id}
                          {item.bom_name && (
                            <div className="text-[10px] text-muted font-normal">BOM: {item.bom_name}</div>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {item.planned_quantity}
                        </td>
                        <td className="p-2.5 font-mono text-muted">
                          {item.completed_quantity}
                        </td>
                        <td className="p-2.5 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const matchingBom = item.bom_id || boms.find((b) => b.product_id === item.product_id)?.id || boms[0]?.id || '';
                              setLaunchBatchDraft({
                                plan_id: selectedPlan.id,
                                plan_number: selectedPlan.plan_number,
                                product_id: item.product_id,
                                bom_id: matchingBom,
                                batch_number: `BAT-${selectedPlan.plan_number.replace(/^PLN-/, '')}-${Date.now().toString().slice(-4)}`,
                                target_quantity: (Math.max(0, Number(item.planned_quantity) - Number(item.completed_quantity || 0))).toFixed(4),
                                scheduled_start: selectedPlan.start_date,
                                scheduled_end: selectedPlan.end_date,
                              });
                              setLaunchErrorMsg(null);
                            }}
                            className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 ml-auto"
                            title="Create and launch production batch for this item"
                          >
                            <Rocket className="size-3" />
                            <span>Create Batch</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-default">
              <div className="flex items-center gap-2">
                {selectedPlan.status === 'draft' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => approveMutation.mutate(selectedPlan.id)}
                    disabled={approveMutation.isPending}
                    className="text-xs"
                  >
                    Approve Plan
                  </Button>
                )}
                {selectedPlan.status === 'approved' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updatePlanStatusMutation.mutate({ planId: selectedPlan.id, status: 'in_progress' })}
                    disabled={updatePlanStatusMutation.isPending}
                    className="text-xs text-blue-600 dark:text-blue-400"
                  >
                    Start In Progress
                  </Button>
                )}
                {selectedPlan.status === 'in_progress' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updatePlanStatusMutation.mutate({ planId: selectedPlan.id, status: 'completed' })}
                    disabled={updatePlanStatusMutation.isPending}
                    className="text-xs text-emerald-600 dark:text-emerald-400"
                  >
                    Mark Completed
                  </Button>
                )}
              </div>
              <Button variant="secondary" onClick={() => setSelectedPlan(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Launch Batch from Plan Modal */}
      {launchBatchDraft && (
        <Modal
          open={Boolean(launchBatchDraft)}
          onClose={() => setLaunchBatchDraft(null)}
          title={`Launch Production Batch (${launchBatchDraft.plan_number})`}
        >
          <div className="space-y-4">
            {launchErrorMsg && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                {launchErrorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={launchBatchDraft.batch_number}
                  onChange={(e) => setLaunchBatchDraft((d) => (d ? { ...d, batch_number: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Target Quantity
                </label>
                <input
                  type="text"
                  value={launchBatchDraft.target_quantity}
                  onChange={(e) => setLaunchBatchDraft((d) => (d ? { ...d, target_quantity: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs font-mono text-default focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Product
                </label>
                <select
                  value={launchBatchDraft.product_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const matchingBom = boms.find((b) => b.product_id === pid)?.id ?? boms[0]?.id ?? '';
                    setLaunchBatchDraft((d) => (d ? { ...d, product_id: pid, bom_id: matchingBom } : null));
                  }}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs text-default focus:border-primary focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Bill of Materials (BOM)
                </label>
                <select
                  value={launchBatchDraft.bom_id}
                  onChange={(e) => setLaunchBatchDraft((d) => (d ? { ...d, bom_id: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs text-default focus:border-primary focus:outline-none"
                >
                  {boms
                    .filter((b) => !launchBatchDraft.product_id || b.product_id === launchBatchDraft.product_id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Scheduled Start
                </label>
                <input
                  type="date"
                  value={launchBatchDraft.scheduled_start}
                  onChange={(e) => setLaunchBatchDraft((d) => (d ? { ...d, scheduled_start: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Scheduled End
                </label>
                <input
                  type="date"
                  value={launchBatchDraft.scheduled_end}
                  onChange={(e) => setLaunchBatchDraft((d) => (d ? { ...d, scheduled_end: e.target.value } : null))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-default">
              <Button variant="ghost" onClick={() => setLaunchBatchDraft(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => launchBatchDraft && createBatchMutation.mutate(launchBatchDraft)}
                disabled={createBatchMutation.isPending || !launchBatchDraft.batch_number}
                className="flex items-center gap-1.5"
              >
                <Rocket className="size-4" />
                <span>{createBatchMutation.isPending ? 'Launching...' : 'Launch Batch to Floor'}</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
