import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertOctagon,
  AlertTriangle,
  DollarSign,
  Edit2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { SelectDropdown } from '../../../components/ui/Dropdown';
import { Badge } from '../../../components/ui/Badge';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { WastageRecord } from '../../../types/api/qc';
import type { ProductionBatch } from '../../../types/api/production';
import type { Product, Warehouse } from '../../../types/api/catalog';
import type { Unit } from '../../../types/api/unit';

interface ReasonCodeOption {
  id: string;
  label: string;
  code: string;
  name: string;
  context: string;
}

interface CreateWastageDraft {
  wastage_number: string;
  product_id: string;
  production_batch_id?: string | undefined;
  stage: 'input' | 'in_process' | 'output' | 'qc' | 'storage' | 'transit';
  quantity: string;
  unit_id: string;
  reason_code_id: string;
  estimated_cost: string;
  is_recoverable: boolean;
  recovered_quantity?: string | undefined;
  warehouse_id?: string | undefined;
  notes?: string | undefined;
}

interface EditWastageDraft {
  quantity: string;
  stage: 'input' | 'in_process' | 'output' | 'qc' | 'storage' | 'transit';
  estimated_cost: string;
  warehouse_id?: string | undefined;
  is_recoverable: boolean;
  recovered_quantity?: string | undefined;
  notes?: string | undefined;
}

export function WastageRecordsSection() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WastageRecord | null>(null);
  const [editForm, setEditForm] = useState<EditWastageDraft>({
    quantity: '1.0000',
    stage: 'in_process',
    estimated_cost: '0.0000',
    warehouse_id: '',
    is_recoverable: false,
    recovered_quantity: '0.0000',
    notes: '',
  });
  const [deletingRecord, setDeletingRecord] = useState<WastageRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<CreateWastageDraft>({
    wastage_number: '',
    product_id: '',
    stage: 'in_process',
    quantity: '5.0000',
    unit_id: '',
    reason_code_id: '',
    estimated_cost: '25.0000',
    is_recoverable: false,
  });

  const queryClient = useQueryClient();

  // Queries
  const wastageQuery = useQuery({
    queryKey: ['qc', 'wastage-records', search, stageFilter],
    queryFn: ({ signal }) =>
      api.get<WastageRecord[]>('/qc/wastage-records', {
        signal,
        params: {
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
          ...(stageFilter !== 'all' ? { stage: stageFilter } : {}),
        },
      }),
  });

  const productsQuery = useQuery({
    queryKey: ['catalogue', 'products', 'options'],
    queryFn: ({ signal }) => api.get<Product[]>('/products', { signal }),
  });

  const unitsQuery = useQuery({
    queryKey: ['catalogue', 'units', 'options'],
    queryFn: ({ signal }) => api.get<Unit[]>('/units', { signal }),
  });

  const batchesQuery = useQuery({
    queryKey: ['production', 'batches', 'options'],
    queryFn: ({ signal }) => api.get<ProductionBatch[]>('/production/batches', { signal }),
  });

  const warehousesQuery = useQuery({
    queryKey: ['catalogue', 'warehouses', 'options'],
    queryFn: ({ signal }) => api.get<Warehouse[]>('/warehouses', { signal }),
  });

  const reasonCodesQuery = useQuery({
    queryKey: ['catalogue', 'reason-codes', 'options'],
    queryFn: ({ signal }) => api.get<ReasonCodeOption[]>('/reason-codes/options', { signal }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateWastageDraft) =>
      api.post<WastageRecord>('/qc/wastage-records', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['qc', 'wastage-records'] });
      setIsCreateOpen(false);
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to log wastage record.');
      else setErrorMsg('Error logging wastage record.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditWastageDraft }) =>
      api.put<WastageRecord>(`/qc/wastage-records/${id}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['qc', 'wastage-records'] });
      setEditingRecord(null);
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to update wastage record.');
      else setErrorMsg('Error updating wastage record.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/qc/wastage-records/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['qc', 'wastage-records'] });
      setDeletingRecord(null);
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to delete wastage record.');
      else setErrorMsg('Error deleting wastage record.');
    },
  });

  const openEditModal = (rec: WastageRecord) => {
    setErrorMsg(null);
    setEditingRecord(rec);
    setEditForm({
      quantity: rec.quantity ?? '1.0000',
      stage: ((rec as { stage?: string }).stage ?? 'in_process') as EditWastageDraft['stage'],
      estimated_cost: (rec as { estimated_cost?: string }).estimated_cost ?? rec.total_cost ?? '0.0000',
      warehouse_id: rec.warehouse_id ?? '',
      is_recoverable: Boolean((rec as { is_recoverable?: boolean }).is_recoverable),
      recovered_quantity: (rec as { recovered_quantity?: string }).recovered_quantity ?? '0.0000',
      notes: rec.notes ?? '',
    });
  };

  const records = wastageQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const units = unitsQuery.data?.data ?? [];
  const batches = batchesQuery.data?.data ?? [];
  const warehouses = warehousesQuery.data?.data ?? [];
  const reasonCodes = reasonCodesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by wastage number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface-sunken py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Stages' },
              { value: 'input', label: 'Material Input', colorDot: 'bg-blue-500' },
              { value: 'in_process', label: 'In-Process', colorDot: 'bg-amber-500' },
              { value: 'output', label: 'Output Sorting', colorDot: 'bg-emerald-500' },
              { value: 'qc', label: 'QC Rejection', colorDot: 'bg-rose-500' },
              { value: 'storage', label: 'Storage Shrinkage', colorDot: 'bg-purple-500' },
              { value: 'transit', label: 'Transit Loss', colorDot: 'bg-slate-500' },
            ]}
            value={stageFilter}
            onChange={(val) => setStageFilter(val)}
            size="sm"
            aria-label="Filter wastage by stage"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            setDraft({
              wastage_number: `WST-${Date.now().toString().slice(-6)}`,
              product_id: products[0]?.id ?? '',
              production_batch_id: batches[0]?.id,
              stage: 'in_process',
              quantity: '1.0000',
              unit_id: units[0]?.id ?? '',
              reason_code_id: reasonCodes[0]?.id ?? '',
              estimated_cost: '10.0000',
              is_recoverable: false,
              warehouse_id: warehouses[0]?.id,
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Log Material Wastage</span>
        </Button>
      </div>

      {/* Table */}
      <QueryBoundary
        status={wastageQuery.status}
        error={wastageQuery.error}
        data={wastageQuery.data}
        isFetching={wastageQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Record Number</th>
                <th className="py-3.5 px-3">Product / Batch</th>
                <th className="py-3.5 px-3">Process Stage</th>
                <th className="py-3.5 px-3">Reason Code</th>
                <th className="py-3.5 px-3">Quantity</th>
                <th className="py-3.5 px-3">Cost Impact</th>
                <th className="py-3.5 px-3">Recovery Status</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken border border-default mb-2">
                      <Trash2 className="h-5 w-5 text-muted" />
                    </div>
                    <div className="text-sm font-medium text-default">
                      No wastage records found
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Track process scrap, damaged materials and manufacturing shrinkage.
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {rec.record_number ?? rec.wastage_number}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-default font-medium">
                        {rec.product_name ?? rec.product_id}
                      </div>
                      {rec.batch_number && (
                        <div className="text-[10px] font-mono text-muted">
                          Batch: {rec.batch_number}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 capitalize text-default">
                      <span className="rounded-md bg-surface-sunken border border-default px-2 py-0.5 text-[10px] font-medium text-muted">
                        {((rec as { stage?: string }).stage ?? 'in_process').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-default flex items-center gap-1">
                        <AlertOctagon className="h-3.5 w-3.5 text-amber-500" />
                        <span>
                          {typeof rec.reason_code === 'object' && rec.reason_code !== null
                            ? ((rec.reason_code as { name?: string; code?: string }).name ??
                               (rec.reason_code as { name?: string; code?: string }).code ??
                               'Defect')
                            : (rec.reason_name ?? (typeof rec.reason_code === 'string' ? rec.reason_code : 'Defect'))}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {rec.quantity}
                    </td>
                    <td className="py-3 px-3 font-mono text-default flex items-center gap-0.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted" />
                      <span>{rec.total_cost ?? (rec as { estimated_cost?: string }).estimated_cost ?? '0.0000'}</span>
                    </td>
                    <td className="py-3 px-3">
                      {(rec as { is_recoverable?: boolean }).is_recoverable ? (
                        <Badge tone="success-subtle">
                          Recoverable ({(rec as { recovered_quantity?: string }).recovered_quantity ?? '0.00'})
                        </Badge>
                      ) : (
                        <Badge tone="surface-sunken">Scrapped</Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(rec)}
                          className="text-xs text-muted hover:text-default"
                          title="Edit wastage record"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingRecord(rec)}
                          className="text-xs text-muted hover:text-rose-600 dark:hover:text-rose-400"
                          title="Delete wastage record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create Wastage Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Scrap / Material Wastage"
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
                Wastage Number
              </label>
              <input
                type="text"
                value={draft.wastage_number}
                onChange={(e) => setDraft((d) => ({ ...d, wastage_number: e.target.value }))}
                placeholder="e.g. WST-2026-001"
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Process Stage
              </label>
              <select
                value={draft.stage}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    stage: e.target.value as CreateWastageDraft['stage'],
                  }))
                }
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="input">Material Input</option>
                <option value="in_process">In-Process</option>
                <option value="output">Output Sorting</option>
                <option value="qc">QC Rejection</option>
                <option value="storage">Storage Shrinkage</option>
                <option value="transit">Transit Damage</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Product Item
              </label>
              <select
                value={draft.product_id}
                onChange={(e) => setDraft((d) => ({ ...d, product_id: e.target.value }))}
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
                Batch Run (Optional)
              </label>
              <select
                value={draft.production_batch_id ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    production_batch_id: e.target.value || undefined,
                  }))
                }
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="">None (Independent Shrinkage)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Scrap Quantity
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.quantity}
                onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Unit of Measure
              </label>
              <select
                value={draft.unit_id}
                onChange={(e) => setDraft((d) => ({ ...d, unit_id: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Cost Impact
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.estimated_cost}
                onChange={(e) => setDraft((d) => ({ ...d, estimated_cost: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Reason Code
              </label>
              <select
                value={draft.reason_code_id}
                onChange={(e) => setDraft((d) => ({ ...d, reason_code_id: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                {reasonCodes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Target Warehouse
              </label>
              <select
                value={draft.warehouse_id ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, warehouse_id: e.target.value || undefined }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="">None / Floor Scrap</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_recoverable"
                checked={draft.is_recoverable}
                onChange={(e) => setDraft((d) => ({ ...d, is_recoverable: e.target.checked }))}
                className="rounded border-default text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="is_recoverable" className="text-xs text-default font-medium">
                Partially recoverable material (Can be recycled or melted back into production)
              </label>
            </div>

            {draft.is_recoverable && (
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Expected Recovery Quantity
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={draft.recovered_quantity ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, recovered_quantity: e.target.value }))}
                  placeholder="e.g. 2.0000"
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
              Remarks & Root Cause
            </label>
            <textarea
              value={draft.notes ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              rows={2}
              placeholder="Root cause notes, defective batch run details, operator observations..."
              className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-default">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate(draft)}
              disabled={
                createMutation.isPending ||
                !draft.product_id ||
                !draft.reason_code_id ||
                !draft.wastage_number
              }
            >
              {createMutation.isPending ? 'Logging...' : 'Confirm Wastage Entry'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Wastage Modal */}
      {editingRecord && (
        <Modal
          open={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          title={`Edit Wastage Record: ${editingRecord.record_number ?? editingRecord.wastage_number}`}
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
                  Process Stage
                </label>
                <select
                  value={editForm.stage}
                  onChange={(e) =>
                    setEditForm((d) => ({
                      ...d,
                      stage: e.target.value as EditWastageDraft['stage'],
                    }))
                  }
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                >
                  <option value="input">Material Input</option>
                  <option value="in_process">In-Process</option>
                  <option value="output">Output Sorting</option>
                  <option value="qc">QC Rejection</option>
                  <option value="storage">Storage Shrinkage</option>
                  <option value="transit">Transit Damage</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Warehouse
                </label>
                <select
                  value={editForm.warehouse_id ?? ''}
                  onChange={(e) =>
                    setEditForm((d) => ({
                      ...d,
                      warehouse_id: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                >
                  <option value="">None / Floor Scrap</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm((d) => ({ ...d, quantity: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Cost Impact
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editForm.estimated_cost}
                  onChange={(e) => setEditForm((d) => ({ ...d, estimated_cost: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_recoverable"
                  checked={editForm.is_recoverable}
                  onChange={(e) => setEditForm((d) => ({ ...d, is_recoverable: e.target.checked }))}
                  className="rounded border-default text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="edit_is_recoverable" className="text-xs text-default font-medium">
                  Partially recoverable material
                </label>
              </div>

              {editForm.is_recoverable && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Recovered / Salvaged Quantity
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editForm.recovered_quantity ?? ''}
                    onChange={(e) =>
                      setEditForm((d) => ({ ...d, recovered_quantity: e.target.value }))
                    }
                    className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Remarks
              </label>
              <textarea
                value={editForm.notes ?? ''}
                onChange={(e) => setEditForm((d) => ({ ...d, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-default">
              <Button variant="ghost" onClick={() => setEditingRecord(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  updateMutation.mutate({
                    id: editingRecord.id,
                    payload: editForm,
                  })
                }
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Update Record'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <Modal
          open={Boolean(deletingRecord)}
          onClose={() => setDeletingRecord(null)}
          title="Delete Wastage Record"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Confirm Wastage Record Deletion</p>
                <p className="mt-1 text-muted">
                  Are you sure you want to delete wastage record{' '}
                  <strong className="text-default font-mono">
                    {deletingRecord.record_number ?? deletingRecord.wastage_number}
                  </strong>
                  ? This will remove the scrap log and financial impact.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-default">
              <Button variant="ghost" onClick={() => setDeletingRecord(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deletingRecord.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Record'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
