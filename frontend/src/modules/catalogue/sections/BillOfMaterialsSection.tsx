import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileCode, Plus, Search, Calculator, Sparkles } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { BillOfMaterial } from '../../../types/api/bom';
import type { Product } from '../../../types/api/catalog';
import type { Unit } from '../../../types/api/unit';

interface CreateBOMForm {
  product_id: string;
  code: string;
  name: string;
  version: number;
  output_quantity: string;
  output_unit_id: string;
  is_default: boolean;
}

export function BillOfMaterialsSection() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBOMForRollup, setSelectedBOMForRollup] = useState<BillOfMaterial | null>(null);
  const [materialCostInflation, setMaterialCostInflation] = useState<number>(0); // 0% default
  const [draft, setDraft] = useState<CreateBOMForm>({
    product_id: '',
    code: '',
    name: '',
    version: 1,
    output_quantity: '1.0000',
    output_unit_id: '',
    is_default: true,
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
    mutationFn: (payload: CreateBOMForm) => api.post<BillOfMaterial>('/boms', payload),
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
      });
      setErrorMsg(null);
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

  const boms = bomsQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const units = unitsQuery.data?.data ?? [];

  // Sample standard component items for cost rollup simulation
  const sampleComponents = [
    { name: 'Pure Cotton Oxford Fabric 60s', qty: 2.2, unit: 'Meters', baseCost: 110.0 },
    { name: 'Resin Buttons 18L (Pack)', qty: 8, unit: 'Pcs', baseCost: 2.5 },
    { name: 'Spun Polyester Thread 40/2', qty: 85, unit: 'Meters', baseCost: 0.12 },
    { name: 'Woven Neck & Care Label Set', qty: 1, unit: 'Set', baseCost: 4.5 },
    { name: 'Polybag & Stiffener Packaging', qty: 1, unit: 'Pc', baseCost: 12.0 },
    { name: 'Direct Labor & Machine Overhead', qty: 1, unit: 'Lot', baseCost: 45.0 },
  ];

  const totalSimulatedCost = sampleComponents.reduce((sum, item) => {
    const adjustedCost = item.baseCost * (1 + materialCostInflation / 100);
    return sum + item.qty * adjustedCost;
  }, 0);

  const estimatedSellingPrice = 650.0;
  const estimatedGrossMargin = estimatedSellingPrice - totalSimulatedCost;
  const marginPercentage = (estimatedGrossMargin / estimatedSellingPrice) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search BOM recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-default bg-surface-sunken py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            if (products.length > 0 && !draft.product_id) {
              setDraft((d) => ({
                ...d,
                product_id: products[0]?.id ?? '',
                output_unit_id: units[0]?.id ?? '',
              }));
            }
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
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
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">BOM Code</th>
                <th className="py-3.5 px-3">Recipe Name</th>
                <th className="py-3.5 px-3">Version</th>
                <th className="py-3.5 px-3">Output Qty</th>
                <th className="py-3.5 px-3">Default</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-right">Cost Rollup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {boms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No BOM recipes configured. Click "New Bill of Material" to create one.
                  </td>
                </tr>
              ) : (
                boms.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {b.code}
                    </td>
                    <td className="py-3.5 px-3 text-default font-medium flex items-center gap-2">
                      <FileCode className="h-3.5 w-3.5 text-muted" />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-muted">v{b.version}</td>
                    <td className="py-3.5 px-3 font-mono text-default">{b.output_quantity}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
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
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          b.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-surface-sunken text-muted border border-default'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedBOMForRollup(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-sunken hover:bg-surface text-default text-[11px] font-semibold border border-default transition-colors cursor-pointer"
                      >
                        <Calculator className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Simulate</span>
                      </button>
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
          title={`Recipe Cost Rollup & Gross Margin Simulator — ${selectedBOMForRollup.name}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-surface-sunken p-3 rounded-xl border border-default">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <span className="text-xs font-bold text-default">Raw Material Inflation Simulation:</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="5"
                  value={materialCostInflation}
                  onChange={(e) => setMaterialCostInflation(Number(e.target.value))}
                  className="w-32 accent-emerald-500 cursor-pointer"
                />
                <span className={`font-mono font-bold text-xs ${materialCostInflation > 0 ? 'text-rose-600 dark:text-rose-400' : materialCostInflation < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
                  {materialCostInflation > 0 ? `+${materialCostInflation}%` : `${materialCostInflation}%`}
                </span>
              </div>
            </div>

            {/* Components Breakdown Table */}
            <div className="overflow-hidden rounded-xl border border-default bg-surface shadow-2xs">
              <table className="w-full text-left text-xs text-default">
                <thead className="border-b border-default bg-surface-sunken text-[10px] uppercase font-semibold text-muted">
                  <tr>
                    <th className="py-2.5 px-3">Component Material</th>
                    <th className="py-2.5 px-3">Req Qty</th>
                    <th className="py-2.5 px-3">Base Rate</th>
                    <th className="py-2.5 px-3 text-right">Simulated Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default font-mono">
                  {sampleComponents.map((item, i) => {
                    const adjustedRate = item.baseCost * (1 + materialCostInflation / 100);
                    const lineTotal = item.qty * adjustedRate;
                    return (
                      <tr key={i} className="hover:bg-surface-sunken/60">
                        <td className="py-2 px-3 font-sans text-default font-medium">{item.name}</td>
                        <td className="py-2 px-3 text-muted">{item.qty} {item.unit}</td>
                        <td className="py-2 px-3 text-muted">৳ {item.baseCost.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">৳ {lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-surface-sunken rounded-xl border border-default text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-muted font-semibold">Total Unit Cost</span>
                <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">৳ {totalSimulatedCost.toFixed(2)}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-muted font-semibold">Sale Price</span>
                <div className="font-mono font-bold text-sm text-default">৳ {estimatedSellingPrice.toFixed(2)}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-muted font-semibold">Gross Profit Margin</span>
                <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">৳ {estimatedGrossMargin.toFixed(2)} ({marginPercentage.toFixed(1)}%)</div>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setSelectedBOMForRollup(null)}
            >
              Close Simulator
            </Button>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Bill of Material (Recipe)"
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

          <div>
            <label className="block text-xs font-medium text-default mb-1">
              Finished Product *
            </label>
            <select
              required
              value={draft.product_id}
              onChange={(e) => setDraft({ ...draft, product_id: e.target.value })}
              className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
            >
              <option value="">Select Finished Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-default mb-1">BOM Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. BOM-COOKER-01"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-default mb-1">Recipe Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Standard Assembly Recipe"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-default mb-1">
                Output Quantity *
              </label>
              <input
                required
                type="number"
                step="0.0001"
                min="0.0001"
                value={draft.output_quantity}
                onChange={(e) => setDraft({ ...draft, output_quantity: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-default mb-1">Output Unit *</label>
              <select
                required
                value={draft.output_unit_id}
                onChange={(e) => setDraft({ ...draft, output_unit_id: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="">Select Output Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-default">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save BOM'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
