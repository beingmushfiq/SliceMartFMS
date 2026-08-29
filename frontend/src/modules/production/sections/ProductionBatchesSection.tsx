import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  Factory,
  Layers,
  Play,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge, StatusBadge } from '../../../components/ui/Badge';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { ProductionBatch } from '../../../types/api/production';
import type { Product, Warehouse } from '../../../types/api/catalog';
import type { BillOfMaterial } from '../../../types/api/bom';

interface CreateBatchDraft {
  batch_number: string;
  plan_id?: string;
  product_id: string;
  bom_id: string;
  target_quantity: string;
  scheduled_start?: string;
  scheduled_end?: string;
}

interface RecordInputDraft {
  product_id: string;
  warehouse_id: string;
  warehouse_location_id?: string;
  planned_quantity: string;
  actual_quantity: string;
  unit_cost: string;
}

interface RecordOutputDraft {
  product_id: string;
  warehouse_id: string;
  warehouse_location_id?: string;
  output_type: 'finished_good' | 'byproduct' | 'co_product';
  good_quantity: string;
  rejected_quantity: string;
  unit_cost: string;
}

export function ProductionBatchesSection() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeBatchModal, setActiveBatchModal] = useState<{
    batch: ProductionBatch;
    type: 'input' | 'output' | 'details';
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createDraft, setCreateDraft] = useState<CreateBatchDraft>({
    batch_number: '',
    product_id: '',
    bom_id: '',
    target_quantity: '100.0000',
    scheduled_start: new Date().toISOString().slice(0, 10),
    scheduled_end: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
  });

  const [inputDraft, setInputDraft] = useState<RecordInputDraft>({
    product_id: '',
    warehouse_id: '',
    planned_quantity: '50.0000',
    actual_quantity: '50.0000',
    unit_cost: '10.0000',
  });

  const [outputDraft, setOutputDraft] = useState<RecordOutputDraft>({
    product_id: '',
    warehouse_id: '',
    output_type: 'finished_good',
    good_quantity: '98.0000',
    rejected_quantity: '2.0000',
    unit_cost: '15.0000',
  });

  const queryClient = useQueryClient();

  // Queries
  const batchesQuery = useQuery({
    queryKey: ['production', 'batches', search, statusFilter],
    queryFn: ({ signal }) =>
      api.get<ProductionBatch[]>('/production/batches', {
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

  const warehousesQuery = useQuery({
    queryKey: ['catalogue', 'warehouses', 'options'],
    queryFn: ({ signal }) => api.get<Warehouse[]>('/warehouses', { signal }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateBatchDraft) =>
      api.post<ProductionBatch>('/production/batches', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
      setIsCreateOpen(false);
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to create batch.');
      else setErrorMsg('Error creating batch.');
    },
  });

  const startMutation = useMutation({
    mutationFn: (batchId: string) =>
      api.post<ProductionBatch>(`/production/batches/${batchId}/start`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
    },
  });

  const recordInputMutation = useMutation({
    mutationFn: ({ batchId, payload }: { batchId: string; payload: RecordInputDraft }) =>
      api.post(`/production/batches/${batchId}/inputs`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
      setActiveBatchModal(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to record material input.');
    },
  });

  const recordOutputMutation = useMutation({
    mutationFn: ({ batchId, payload }: { batchId: string; payload: RecordOutputDraft }) =>
      api.post(`/production/batches/${batchId}/outputs`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
      setActiveBatchModal(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to record output.');
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (batchId: string) =>
      api.post<ProductionBatch>(`/production/batches/${batchId}/analyze`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (batchId: string) =>
      api.post<ProductionBatch>(`/production/batches/${batchId}/complete`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
    },
  });

  const batches = batchesQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const boms = bomsQuery.data?.data ?? [];
  const warehouses = warehousesQuery.data?.data ?? [];

  const getCompletenessBadge = (state: ProductionBatch['context_completeness']) => {
    switch (state) {
      case 'context_complete':
      case 'analysed':
        return <Badge tone="success-subtle">Complete</Badge>;
      case 'collecting':
        return <Badge tone="warning-subtle">Collecting</Badge>;
      case 'closed':
        return <Badge tone="surface-sunken">Closed</Badge>;
      default:
        return <Badge tone="surface-sunken">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              placeholder="Search batches by batch number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface-sunken py-2 pl-9 pr-3.5 text-xs text-default placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-default bg-surface-sunken py-2 px-3 text-xs text-default focus:border-primary focus:outline-none transition-all shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            if (products.length > 0 && boms.length > 0) {
              setCreateDraft({
                batch_number: `BAT-${Date.now().toString().slice(-6)}`,
                product_id: products[0]?.id ?? '',
                bom_id: boms[0]?.id ?? '',
                target_quantity: '100.0000',
                scheduled_start: new Date().toISOString().slice(0, 10),
                scheduled_end: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
              });
            }
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="size-4" />
          <span>New Production Batch</span>
        </Button>
      </div>

      {/* Batches Table with Subtle 1px Outline */}
      <QueryBoundary
        status={batchesQuery.status}
        error={batchesQuery.error}
        data={batchesQuery.data}
        isFetching={batchesQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken/70 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Batch Number</th>
                <th className="py-3.5 px-3">Product</th>
                <th className="py-3.5 px-3">Target / Actual</th>
                <th className="py-3.5 px-3">Yield Analytics</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Context</th>
                <th className="py-3.5 pr-4 text-right">Floor Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-surface-sunken mb-2 border border-default">
                      <Factory className="size-5 text-muted" />
                    </div>
                    <div className="text-sm font-medium text-default">
                      No production batches found
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Create your first batch to start tracking shop floor execution.
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-surface-sunken/40 transition-colors">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {batch.batch_number}
                      </div>
                      {batch.bom_name && (
                        <div className="text-[10px] text-muted">BOM: {batch.bom_name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-default">
                        {batch.product_name ?? batch.product_id}
                      </div>
                      {batch.product_sku && (
                        <div className="text-[10px] text-muted font-mono">{batch.product_sku}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-mono text-default font-semibold">
                        {batch.actual_quantity} /{' '}
                        <span className="text-muted font-normal">{batch.target_quantity}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      {batch.actual_yield_pct !== null ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          <TrendingUp className="size-3.5" />
                          <span>{batch.actual_yield_pct}%</span>
                          {batch.yield_variance_pct && (
                            <span className="text-[10px] text-muted font-normal">
                              ({batch.yield_variance_pct}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted italic">Pending context</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="py-3.5 px-3">
                      {getCompletenessBadge(batch.context_completeness)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(batch.status === 'draft' || batch.status === 'scheduled') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => startMutation.mutate(batch.id)}
                            disabled={startMutation.isPending}
                            className="text-xs flex items-center gap-1 text-emerald-400"
                          >
                            <Play className="h-3 w-3" />
                            <span>Start</span>
                          </Button>
                        )}

                        {batch.status === 'in_progress' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setErrorMsg(null);
                                setInputDraft({
                                  product_id: batch.product_id,
                                  warehouse_id: warehouses[0]?.id ?? '',
                                  planned_quantity: '50.0000',
                                  actual_quantity: '50.0000',
                                  unit_cost: '10.0000',
                                });
                                setActiveBatchModal({ batch, type: 'input' });
                              }}
                              className="text-xs text-blue-400"
                            >
                              + Material
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setErrorMsg(null);
                                setOutputDraft({
                                  product_id: batch.product_id,
                                  warehouse_id: warehouses[0]?.id ?? '',
                                  output_type: 'finished_good',
                                  good_quantity: batch.target_quantity,
                                  rejected_quantity: '0.0000',
                                  unit_cost: '15.0000',
                                });
                                setActiveBatchModal({ batch, type: 'output' });
                              }}
                              className="text-xs text-emerald-400"
                            >
                              + Output
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => analyzeMutation.mutate(batch.id)}
                              className="text-xs text-purple-400"
                              title="Analyze Yield"
                            >
                              <Sparkles className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => completeMutation.mutate(batch.id)}
                              className="text-xs text-zinc-300"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveBatchModal({ batch, type: 'details' })}
                          className="text-xs text-zinc-400"
                        >
                          <Layers className="h-3 w-3" />
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

      {/* Create Batch Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Launch Production Batch"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
              Batch Number
            </label>
            <input
              type="text"
              value={createDraft.batch_number}
              onChange={(e) => setCreateDraft((d) => ({ ...d, batch_number: e.target.value }))}
              placeholder="e.g. BAT-2026-001"
              className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Product to Produce
              </label>
              <select
                value={createDraft.product_id}
                onChange={(e) => setCreateDraft((d) => ({ ...d, product_id: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                BOM Recipe
              </label>
              <select
                value={createDraft.bom_id}
                onChange={(e) => setCreateDraft((d) => ({ ...d, bom_id: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                {boms.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name} (v{b.version})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
              Target Quantity
            </label>
            <input
              type="number"
              step="0.0001"
              value={createDraft.target_quantity}
              onChange={(e) => setCreateDraft((d) => ({ ...d, target_quantity: e.target.value }))}
              className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-default">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate(createDraft)}
              disabled={createMutation.isPending || !createDraft.batch_number}
            >
              {createMutation.isPending ? 'Launching...' : 'Launch Batch'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Input Modal */}
      {activeBatchModal?.type === 'input' && (
        <Modal
          open={Boolean(activeBatchModal)}
          onClose={() => setActiveBatchModal(null)}
          title={`Record Material Input: ${activeBatchModal.batch.batch_number}`}
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
                  Raw Material / Component
                </label>
                <select
                  value={inputDraft.product_id}
                  onChange={(e) => setInputDraft((d) => ({ ...d, product_id: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Source Warehouse
                </label>
                <select
                  value={inputDraft.warehouse_id}
                  onChange={(e) => setInputDraft((d) => ({ ...d, warehouse_id: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Actual Issued Qty
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={inputDraft.actual_quantity}
                  onChange={(e) =>
                    setInputDraft((d) => ({ ...d, actual_quantity: e.target.value }))
                  }
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Unit Cost (Standard)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={inputDraft.unit_cost}
                  onChange={(e) => setInputDraft((d) => ({ ...d, unit_cost: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-default">
              <Button variant="ghost" onClick={() => setActiveBatchModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  recordInputMutation.mutate({
                    batchId: activeBatchModal.batch.id,
                    payload: inputDraft,
                  })
                }
                disabled={recordInputMutation.isPending}
              >
                {recordInputMutation.isPending ? 'Recording...' : 'Record Issue'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Output Modal */}
      {activeBatchModal?.type === 'output' && (
        <Modal
          open={Boolean(activeBatchModal)}
          onClose={() => setActiveBatchModal(null)}
          title={`Record Batch Output: ${activeBatchModal.batch.batch_number}`}
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
                  Destination Warehouse
                </label>
                <select
                  value={outputDraft.warehouse_id}
                  onChange={(e) => setOutputDraft((d) => ({ ...d, warehouse_id: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Output Type
                </label>
                <select
                  value={outputDraft.output_type}
                  onChange={(e) =>
                    setOutputDraft((d) => ({
                      ...d,
                      output_type: e.target.value as 'finished_good' | 'byproduct' | 'co_product',
                    }))
                  }
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                >
                  <option value="finished_good">Finished Good</option>
                  <option value="byproduct">Byproduct</option>
                  <option value="co_product">Co-Product</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Good Quantity
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={outputDraft.good_quantity}
                  onChange={(e) => setOutputDraft((d) => ({ ...d, good_quantity: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Rejected / Scrap Qty
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={outputDraft.rejected_quantity}
                  onChange={(e) =>
                    setOutputDraft((d) => ({ ...d, rejected_quantity: e.target.value }))
                  }
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-default">
              <Button variant="ghost" onClick={() => setActiveBatchModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  recordOutputMutation.mutate({
                    batchId: activeBatchModal.batch.id,
                    payload: outputDraft,
                  })
                }
                disabled={recordOutputMutation.isPending}
              >
                {recordOutputMutation.isPending ? 'Recording...' : 'Record Output'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Batch Full Details Modal */}
      {activeBatchModal?.type === 'details' && (
        <Modal
          open={Boolean(activeBatchModal)}
          onClose={() => setActiveBatchModal(null)}
          title={`Batch Overview: ${activeBatchModal.batch.batch_number}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Total Input
                </div>
                <div className="text-base font-bold font-mono text-zinc-100 mt-1">
                  {activeBatchModal.batch.total_input_quantity}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Total Output
                </div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                  {activeBatchModal.batch.total_output_quantity}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Process Loss
                </div>
                <div className="text-base font-bold font-mono text-amber-400 mt-1">
                  {activeBatchModal.batch.process_loss_quantity}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800 space-y-2">
              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Yield & Process Performance</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500">Expected:</span>{' '}
                  <span className="font-mono text-zinc-300">
                    {activeBatchModal.batch.expected_yield_pct ?? 'N/A'}%
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Actual:</span>{' '}
                  <span className="font-mono text-emerald-400 font-bold">
                    {activeBatchModal.batch.actual_yield_pct ?? 'N/A'}%
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Variance:</span>{' '}
                  <span className="font-mono text-zinc-300">
                    {activeBatchModal.batch.yield_variance_pct ?? 'N/A'}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setActiveBatchModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
