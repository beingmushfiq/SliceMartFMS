import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileCode, Plus, Search, Calculator, Sparkles, Eye, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import { notify } from '../../../components/ui/Toast';
import type { BillOfMaterial } from '../../../types/api/bom';
import type { Product } from '../../../types/api/catalog';
import type { Unit } from '../../../types/api/unit';
import { useCurrency } from '../../../hooks/useCurrency';

interface BOMFormDraft {
  product_id: string;
  code: string;
  name: string;
  version: number;
  output_quantity: string;
  output_unit_id: string;
  is_default: boolean;
  is_active?: boolean;
}

export function BillOfMaterialsSection() {
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BillOfMaterial | null>(null);
  const [viewingBOM, setViewingBOM] = useState<BillOfMaterial | null>(null);
  const [deletingBOM, setDeletingBOM] = useState<BillOfMaterial | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBOMForRollup, setSelectedBOMForRollup] = useState<BillOfMaterial | null>(null);
  const [materialCostInflation, setMaterialCostInflation] = useState<number>(0);

  const [draft, setDraft] = useState<BOMFormDraft>({
    product_id: '',
    code: '',
    name: '',
    version: 1,
    output_quantity: '1.0000',
    output_unit_id: '',
    is_default: true,
    is_active: true,
  });

  const queryClient = useQueryClient();

  const bomsQuery = useQuery({
    queryKey: ['catalogue', 'boms', search],
    queryFn: ({ signal }) =>
      api.get<BillOfMaterial[]>('/boms', {
        signal,
        params: search.trim().length >= 2 ? { q: search.trim() } : {},
      }),
  });

  const productsQuery = useQuery({
    queryKey: ['catalogue', 'products', 'finished-options'],
    queryFn: ({ signal }) =>
      api.get<Product[]>('/products', { signal, params: { type: 'finished' } }),
  });

  const unitsQuery = useQuery({
    queryKey: ['catalogue', 'units', 'options'],
    queryFn: ({ signal }) => api.get<Unit[]>('/units', { signal }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: BOMFormDraft) => api.post<BillOfMaterial>('/boms', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'boms'] });
      setIsCreateOpen(false);
      setDraft({
        product_id: '',
        code: '',
        name: '',
        version: 1,
        output_quantity: '1.0000',
        output_unit_id: '',
        is_default: true,
        is_active: true,
      });
      setErrorMsg(null);
      notify.success('Bill of Materials created successfully.');
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.code === 'DUPLICATE') setErrorMsg('BOM code already exists.');
        else setErrorMsg(err.message ?? 'Failed to create BOM.');
      } else {
        setErrorMsg('Error creating BOM.');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BOMFormDraft> }) =>
      api.patch<BillOfMaterial>(`/boms/${id}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'boms'] });
      setEditingBOM(null);
      setErrorMsg(null);
      notify.success('Bill of Materials updated successfully.');
    },
    onError: (err) => {
      if (isApiError(err)) {
        setErrorMsg(err.message ?? 'Failed to update BOM.');
      } else {
        setErrorMsg('Error updating BOM.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/boms/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'boms'] });
      setDeletingBOM(null);
      notify.success('Bill of Materials deleted successfully.');
    },
    onError: (err) => {
      const msg = isApiError(err) ? err.message : 'Failed to delete BOM.';
      notify.error(msg);
    },
  });

  const handleOpenEdit = (b: BillOfMaterial) => {
    setErrorMsg(null);
    setDraft({
      product_id: b.product_id,
      code: b.code,
      name: b.name,
      version: b.version,
      output_quantity: b.output_quantity,
      output_unit_id: b.output_unit_id,
      is_default: b.is_default,
      is_active: b.is_active,
    });
    setEditingBOM(b);
  };

  const boms = bomsQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const units = unitsQuery.data?.data ?? [];

  const sampleComponents = [
    { name: 'Microcrystalline Ceramic Glass Panel (280x360mm)', qty: 1.0, unit: 'PC', baseCost: 450.0 },
    { name: '2200W Infrared Heating Coil', qty: 1.0, unit: 'PC', baseCost: 380.0 },
    { name: 'Digital Touch Mainboard PCB', qty: 1.0, unit: 'PC', baseCost: 320.0 },
    { name: 'Brushless DC Cooling Fan 12V', qty: 1.0, unit: 'PC', baseCost: 120.0 },
    { name: 'Stainless Steel Chassis Bottom Case', qty: 1.0, unit: 'PC', baseCost: 260.0 },
    { name: 'Infrared Cooker Shockproof EPE Foam Set', qty: 1.0, unit: 'SET', baseCost: 85.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Search and New BOM Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search BOM by structure name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-default bg-surface py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors shadow-2xs"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            setDraft({
              product_id: products[0]?.id ?? '',
              code: '',
              name: '',
              version: 1,
              output_quantity: '1.0000',
              output_unit_id: units[0]?.id ?? '',
              is_default: true,
              is_active: true,
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Bill of Material</span>
        </Button>
      </div>

      <QueryBoundary
        status={bomsQuery.status}
        error={bomsQuery.error}
        data={bomsQuery.data}
        isFetching={bomsQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default border-collapse">
            <thead className="border-b border-default bg-surface-sunken/70 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">BOM Code</th>
                <th className="py-3.5 px-3">BOM / Structure Name</th>
                <th className="py-3.5 px-3">Version</th>
                <th className="py-3.5 px-3">Output Qty</th>
                <th className="py-3.5 px-3">Default</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {boms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted">
                    No Bills of Material configured. Click "New Bill of Material" to create one.
                  </td>
                </tr>
              ) : (
                boms.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-sunken/50 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 font-mono font-semibold text-primary">
                      {b.code}
                    </td>
                    <td className="py-3.5 px-3 text-default font-medium flex items-center gap-2">
                      <FileCode className="size-3.5 text-muted" />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-muted">v{b.version}</td>
                    <td className="py-3.5 px-3 font-mono text-default">{b.output_quantity}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          b.is_default
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-surface-sunken text-muted border border-default'
                        }`}
                      >
                        {b.is_default ? 'Primary' : 'Alternative'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          b.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 pl-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingBOM(b)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="View BOM Structure"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(b)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="Edit BOM"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBOMForRollup(b)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="Simulate Cost Rollup"
                        >
                          <Calculator className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBOM(b)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="Delete BOM"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* Cost Rollup Simulator Modal */}
      {selectedBOMForRollup && (
        <Modal
          open={Boolean(selectedBOMForRollup)}
          onClose={() => setSelectedBOMForRollup(null)}
          title={`Cost Rollup Simulation: ${selectedBOMForRollup.name}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3.5 bg-primary/10 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  Interactive Material Inflation & Yield Stress-Testing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-default">
                  +{materialCostInflation}% Cost Fluctuation
                </span>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="5"
                  value={materialCostInflation}
                  onChange={(e) => setMaterialCostInflation(Number(e.target.value))}
                  className="w-28 accent-indigo-600"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-default">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-sunken/80 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-default">
                  <tr>
                    <th className="py-2.5 px-3">Ingredient / Assembly Component</th>
                    <th className="py-2.5 px-3">Base Requirement</th>
                    <th className="py-2.5 px-3">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default">
                  {sampleComponents.map((c, i) => {
                    const effectiveCost = c.baseCost * (1 + materialCostInflation / 100);
                    const subtotal = effectiveCost * c.qty;
                    return (
                      <tr key={i} className="hover:bg-surface-sunken/30">
                        <td className="py-2 px-3 font-medium text-default">{c.name}</td>
                        <td className="py-2 px-3 font-mono text-muted">
                          {c.qty} {c.unit}
                        </td>
                        <td className="py-2 px-3 font-mono text-muted">
                          {formatCurrency(effectiveCost)}
                        </td>
                        <td className="py-2 px-3 font-mono text-right font-semibold text-default">
                          {formatCurrency(subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-default">
              <div className="text-xs">
                <span className="text-muted">Total Simulated Batch Cost: </span>
                <span className="font-bold text-primary text-sm font-mono ml-1">
                  {formatCurrency(
                    sampleComponents.reduce(
                      (sum, c) => sum + c.baseCost * (1 + materialCostInflation / 100) * c.qty,
                      0
                    )
                  )}
                </span>
              </div>
              <Button variant="secondary" onClick={() => setSelectedBOMForRollup(null)}>
                Close Simulation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create BOM Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Bill of Materials"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(draft);
          }}
          className="space-y-4"
        >
          {errorMsg && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">BOM Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. BOM-BRD-001"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Parent Finished Product *</label>
              <select
                required
                value={draft.product_id}
                onChange={(e) => setDraft({ ...draft, product_id: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="">Select Finished Item</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-default mb-1">BOM / Assembly Structure Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. 2200W Infrared Cooker Assembly BOM"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Output Quantity</label>
              <input
                type="text"
                value={draft.output_quantity}
                onChange={(e) => setDraft({ ...draft, output_quantity: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Output Unit *</label>
              <select
                required
                value={draft.output_unit_id}
                onChange={(e) => setDraft({ ...draft, output_unit_id: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="">Select Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Version Number</label>
              <input
                type="number"
                min="1"
                value={draft.version}
                onChange={(e) => setDraft({ ...draft, version: parseInt(e.target.value, 10) || 1 })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="create_is_default_bom"
              checked={draft.is_default}
              onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })}
              className="size-4 rounded border-default text-primary focus:ring-primary/20"
            />
            <label htmlFor="create_is_default_bom" className="text-xs font-medium text-default">
              Set as Primary Production BOM for this Finished SKU
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save BOM'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit BOM Modal */}
      {editingBOM && (
        <Modal
          open={Boolean(editingBOM)}
          onClose={() => setEditingBOM(null)}
          title={`Edit BOM: ${editingBOM.name}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingBOM.id,
                payload: draft,
              });
            }}
            className="space-y-4"
          >
            {errorMsg && (
              <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-default mb-1">BOM Code *</label>
                <input
                  required
                  type="text"
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-default mb-1">Version</label>
                <input
                  type="number"
                  min="1"
                  value={draft.version}
                  onChange={(e) =>
                    setDraft({ ...draft, version: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-default mb-1">BOM / Structure Name *</label>
              <input
                required
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_default_bom"
                  checked={draft.is_default}
                  onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })}
                  className="size-4 rounded border-default text-primary focus:ring-primary/20"
                />
                <label htmlFor="edit_is_default_bom" className="text-xs font-medium text-default">
                  Default BOM
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_active_bom"
                  checked={draft.is_active ?? true}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                  className="size-4 rounded border-default text-primary focus:ring-primary/20"
                />
                <label htmlFor="edit_is_active_bom" className="text-xs font-medium text-default">
                  Active BOM
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
              <Button variant="secondary" type="button" onClick={() => setEditingBOM(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update BOM'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* View BOM Modal */}
      {viewingBOM && (
        <Modal
          open={Boolean(viewingBOM)}
          onClose={() => setViewingBOM(null)}
          title={`BOM Specifications: ${viewingBOM.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-sunken/60 border border-default">
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">BOM Code</span>
                <span className="font-mono font-bold text-primary text-sm">{viewingBOM.code}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Revision Version</span>
                <span className="font-mono text-default">v{viewingBOM.version}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Batch Output Qty</span>
                <span className="font-mono text-default">{viewingBOM.output_quantity}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">BOM Status</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {viewingBOM.is_active ? 'Production Ready' : 'Draft / Inactive'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingBOM(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete BOM Modal */}
      {deletingBOM && (
        <Modal
          open={Boolean(deletingBOM)}
          onClose={() => setDeletingBOM(null)}
          title="Delete Bill of Materials"
        >
          <div className="space-y-4 text-xs">
            <p className="text-default">
              Are you sure you want to delete BOM{' '}
              <strong className="text-primary font-mono">{deletingBOM.name}</strong> (
              {deletingBOM.code})?
            </p>
            <p className="text-muted text-[11px]">
              This action cannot be undone if work orders are actively executing with this BOM.
            </p>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
              <Button variant="secondary" onClick={() => setDeletingBOM(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deletingBOM.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
