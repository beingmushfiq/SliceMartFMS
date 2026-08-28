import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileCode, Plus, Search } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search BOM recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
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
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">BOM Code</th>
                <th className="py-3.5 px-3">Recipe Name</th>
                <th className="py-3.5 px-3">Version</th>
                <th className="py-3.5 px-3">Output Qty</th>
                <th className="py-3.5 px-3">Default</th>
                <th className="py-3.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {boms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No BOM recipes configured. Click "New Bill of Material" to create one.
                  </td>
                </tr>
              ) : (
                boms.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 font-mono font-medium text-emerald-400">
                      {b.code}
                    </td>
                    <td className="py-3.5 px-3 text-zinc-100 font-medium flex items-center gap-2">
                      <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono">v{b.version}</td>
                    <td className="py-3.5 px-3 font-mono">{b.output_quantity}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          b.is_default
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {b.is_default ? 'Primary' : 'Alternative'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          b.is_active
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

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
            <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Finished Product *
            </label>
            <select
              required
              value={draft.product_id}
              onChange={(e) => setDraft({ ...draft, product_id: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
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
              <label className="block text-xs font-medium text-zinc-300 mb-1">BOM Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. BOM-COOKER-01"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Recipe Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Standard Assembly Recipe"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Output Quantity *
              </label>
              <input
                required
                type="number"
                step="0.0001"
                min="0.0001"
                value={draft.output_quantity}
                onChange={(e) => setDraft({ ...draft, output_quantity: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Output Unit *</label>
              <select
                required
                value={draft.output_unit_id}
                onChange={(e) => setDraft({ ...draft, output_unit_id: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
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
