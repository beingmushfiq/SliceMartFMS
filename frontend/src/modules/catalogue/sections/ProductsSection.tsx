import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Tag } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { Product } from '../../../types/api/catalog';
import type { Unit } from '../../../types/api/unit';

interface CreateProductForm {
  sku: string;
  name: string;
  type: string;
  base_unit_id: string;
  standard_cost: string;
  default_sale_price: string;
}

export function ProductsSection() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateProductForm>({
    sku: '',
    name: '',
    type: 'finished',
    base_unit_id: '',
    standard_cost: '0.0000',
    default_sale_price: '0.0000',
  });

  const queryClient = useQueryClient();

  // Fetch Products
  const productsQuery = useQuery({
    queryKey: ['catalogue', 'products', search, typeFilter],
    queryFn: ({ signal }) =>
      api.get<Product[]>('/products', {
        signal,
        params: {
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
          ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
        },
      }),
  });

  // Fetch Units options for dropdown
  const unitsQuery = useQuery({
    queryKey: ['catalogue', 'units', 'options'],
    queryFn: ({ signal }) => api.get<Unit[]>('/units', { signal }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateProductForm) => api.post<Product>('/products', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'products'] });
      setIsCreateOpen(false);
      setDraft({
        sku: '',
        name: '',
        type: 'finished',
        base_unit_id: '',
        standard_cost: '0.0000',
        default_sale_price: '0.0000',
      });
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.code === 'DUPLICATE') setErrorMsg('SKU is already in use by another product.');
        else setErrorMsg(err.message ?? 'Failed to create product.');
      } else {
        setErrorMsg('Error creating product. Please try again.');
      }
    },
  });

  const products = productsQuery.data?.data ?? [];
  const units = unitsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Controls: Search, Type Filter, Add Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search products by SKU or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 px-3 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="finished">Finished Goods</option>
            <option value="semi_finished">Semi-Finished</option>
            <option value="raw_material">Raw Materials</option>
            <option value="packaging">Packaging</option>
            <option value="consumable">Consumables</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            if (units.length > 0 && !draft.base_unit_id) {
              setDraft((d) => ({ ...d, base_unit_id: units[0]?.id ?? '' }));
            }
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </Button>
      </div>

      {/* Table Data */}
      <QueryBoundary
        status={productsQuery.status}
        error={productsQuery.error}
        data={productsQuery.data}
        isFetching={productsQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Product</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Standard Cost</th>
                <th className="py-3.5 px-3">Sale Price</th>
                <th className="py-3.5 px-3">Stock Tracked</th>
                <th className="py-3.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No products found. Click "New Product" to register one.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="font-medium text-zinc-100">{p.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300 capitalize">
                        <Tag className="h-3 w-3 text-zinc-500" />
                        {p.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono">{p.standard_cost}</td>
                    <td className="py-3.5 px-3 font-mono text-emerald-400">
                      {p.default_sale_price}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${p.is_stock_tracked ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                      />
                      <span className="ml-2 text-xs">{p.is_stock_tracked ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          p.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* Create Product Modal */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Product">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">SKU *</label>
              <input
                required
                type="text"
                placeholder="e.g. COOKER-01"
                value={draft.sku}
                onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Type *</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="finished">Finished Good</option>
                <option value="semi_finished">Semi-Finished</option>
                <option value="raw_material">Raw Material</option>
                <option value="packaging">Packaging</option>
                <option value="consumable">Consumable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Product Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Infrared Cooker IC-200"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Base Unit *</label>
            <select
              required
              value={draft.base_unit_id}
              onChange={(e) => setDraft({ ...draft, base_unit_id: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Standard Cost</label>
              <input
                type="number"
                step="0.0001"
                value={draft.standard_cost}
                onChange={(e) => setDraft({ ...draft, standard_cost: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Default Sale Price
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.default_sale_price}
                onChange={(e) => setDraft({ ...draft, default_sale_price: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
