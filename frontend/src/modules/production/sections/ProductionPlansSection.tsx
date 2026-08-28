import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardList, Plus, Search, Calendar, Eye } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
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

export function ProductionPlansSection() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<CreatePlanDraft>({
    plan_number: '',
    title: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    notes: '',
    items: [{ product_id: '', bom_id: '', planned_quantity: '100.0000' }],
  });

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
    mutationFn: (payload: CreatePlanDraft) =>
      api.post<ProductionPlan>('/production/plans', payload),
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
        setErrorMsg(err.message ?? 'Failed to create production plan.');
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

  const plans = plansQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const boms = bomsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search plans by title or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 px-3 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            if (products.length > 0 && boms.length > 0) {
              setDraft((d) => ({
                ...d,
                plan_number: `PLN-${Date.now().toString().slice(-6)}`,
                items: [
                  {
                    product_id: products[0]?.id ?? '',
                    bom_id: boms[0]?.id ?? '',
                    planned_quantity: '100.0000',
                  },
                ],
              }));
            }
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
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Plan Number</th>
                <th className="py-3.5 px-3">Title</th>
                <th className="py-3.5 px-3">Date Range</th>
                <th className="py-3.5 px-3">Items Count</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50 mb-2">
                      <ClipboardList className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="text-sm font-medium text-zinc-400">
                      No production plans found
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {search
                        ? 'Try adjusting search or status filters'
                        : 'Create your first production plan to get started.'}
                    </div>
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-emerald-400">
                      {plan.plan_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-zinc-200">{plan.title}</td>
                    <td className="py-3 px-3 text-zinc-400">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{plan.start_date}</span>
                        <span className="text-zinc-600">→</span>
                        <span>{plan.end_date}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">{plan.items?.length ?? 0} products</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {plan.status === 'draft' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => approveMutation.mutate(plan.id)}
                            disabled={approveMutation.isPending}
                            className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPlan(plan)}
                          className="text-xs flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Button>
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
        title="Create Production Plan"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Plan Number
              </label>
              <input
                type="text"
                value={draft.plan_number}
                onChange={(e) => setDraft((d) => ({ ...d, plan_number: e.target.value }))}
                placeholder="e.g. PLN-2026-001"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Plan Title
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Weekly Production Wave A"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={draft.start_date}
                onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={draft.end_date}
                onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Plan Items Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Planned Products
              </label>
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    items: [
                      ...d.items,
                      {
                        product_id: products[0]?.id ?? '',
                        bom_id: boms[0]?.id ?? '',
                        planned_quantity: '50.0000',
                      },
                    ],
                  }))
                }
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {draft.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 rounded-xl bg-zinc-950 p-2.5 border border-zinc-800"
                >
                  <div className="col-span-5">
                    <label className="text-[10px] text-zinc-500">Product</label>
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((d) => ({
                          ...d,
                          items: d.items.map((it, i) =>
                            i === idx ? { ...it, product_id: val } : it
                          ),
                        }));
                      }}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-xs text-zinc-200"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="text-[10px] text-zinc-500">Bill of Materials</label>
                    <select
                      value={item.bom_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((d) => ({
                          ...d,
                          items: d.items.map((it, i) => (i === idx ? { ...it, bom_id: val } : it)),
                        }));
                      }}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-xs text-zinc-200"
                    >
                      {boms.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} - {b.name} (v{b.version})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] text-zinc-500">Planned Qty</label>
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
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-xs text-zinc-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
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
            <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-3 border border-zinc-800">
              <div>
                <div className="text-sm font-semibold text-zinc-100">{selectedPlan.title}</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {selectedPlan.start_date} to {selectedPlan.end_date}
                </div>
              </div>
              <div>
                <StatusBadge status={selectedPlan.status} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Planned Items ({selectedPlan.items?.length ?? 0})
              </div>
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Planned Qty</th>
                      <th className="p-2.5">Completed Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                    {selectedPlan.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 text-zinc-200">
                          {item.product_name ?? item.product_id}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-400">
                          {item.planned_quantity}
                        </td>
                        <td className="p-2.5 font-mono text-zinc-400">{item.completed_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setSelectedPlan(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
