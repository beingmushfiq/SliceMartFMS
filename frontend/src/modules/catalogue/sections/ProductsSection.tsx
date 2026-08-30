import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Tag, QrCode, Printer, Eye, Edit2, Trash2, Globe } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import { notify } from '../../../components/ui/Toast';
import { BarcodeGeneratorModal } from '../../../components/print/labels/BarcodeGeneratorModal';
import type { Product, Category, Brand } from '../../../types/api/catalog';
import type { Unit } from '../../../types/api/unit';

interface ProductFormDraft {
  sku: string;
  name: string;
  type: string;
  base_unit_id: string;
  category_id?: string | null;
  brand_id?: string | null;
  standard_cost: string;
  default_sale_price: string;
  is_stock_tracked?: boolean;
  is_online?: boolean;
  status?: string;
  description?: string | null;
}

export function ProductsSection() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [selectedLabelProduct, setSelectedLabelProduct] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<ProductFormDraft>({
    sku: '',
    name: '',
    type: 'finished',
    base_unit_id: '',
    category_id: null,
    brand_id: null,
    standard_cost: '0.0000',
    default_sale_price: '0.0000',
    is_stock_tracked: true,
    is_online: true,
    status: 'active',
    description: '',
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

  // Fetch Units options
  const unitsQuery = useQuery({
    queryKey: ['catalogue', 'units', 'options'],
    queryFn: ({ signal }) => api.get<Unit[]>('/units', { signal }),
  });

  // Fetch Categories options
  const categoriesQuery = useQuery({
    queryKey: ['catalogue', 'categories', 'options'],
    queryFn: ({ signal }) => api.get<Category[]>('/categories', { signal }),
  });

  // Fetch Brands options
  const brandsQuery = useQuery({
    queryKey: ['catalogue', 'brands', 'options'],
    queryFn: ({ signal }) => api.get<Brand[]>('/brands', { signal }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ProductFormDraft) => api.post<Product>('/products', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'products'] });
      setIsCreateOpen(false);
      setDraft({
        sku: '',
        name: '',
        type: 'finished',
        base_unit_id: unitsQuery.data?.data?.[0]?.id ?? '',
        category_id: null,
        brand_id: null,
        standard_cost: '0.0000',
        default_sale_price: '0.0000',
        is_stock_tracked: true,
        is_online: true,
        status: 'active',
        description: '',
      });
      setErrorMsg(null);
      notify.success('Product created successfully.');
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

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductFormDraft> }) =>
      api.patch<Product>(`/products/${id}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'products'] });
      setEditingProduct(null);
      setErrorMsg(null);
      notify.success('Product updated successfully.');
    },
    onError: (err) => {
      if (isApiError(err)) {
        setErrorMsg(err.message ?? 'Failed to update product.');
      } else {
        setErrorMsg('Error updating product.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'products'] });
      setDeletingProduct(null);
      notify.success('Product deleted successfully.');
    },
    onError: (err) => {
      const msg = isApiError(err) ? err.message : 'Failed to delete product.';
      notify.error(msg);
    },
  });

  const handleOpenEdit = (p: Product) => {
    setErrorMsg(null);
    setDraft({
      sku: p.sku,
      name: p.name,
      type: p.type,
      base_unit_id: p.base_unit_id,
      category_id: p.category_id,
      brand_id: p.brand_id,
      standard_cost: p.standard_cost,
      default_sale_price: p.default_sale_price,
      is_stock_tracked: p.is_stock_tracked,
      is_online: p.is_online,
      status: p.status,
      description: p.description || '',
    });
    setEditingProduct(p);
  };

  const products = productsQuery.data?.data ?? [];
  const units = unitsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const brands = brandsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Controls: Search, Type Filter, Add Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search products by SKU or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors shadow-2xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-default bg-surface py-2 px-3 text-xs text-default focus:border-primary focus:outline-none shadow-2xs"
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
            setDraft({
              sku: '',
              name: '',
              type: 'finished',
              base_unit_id: units[0]?.id ?? '',
              category_id: null,
              brand_id: null,
              standard_cost: '0.0000',
              default_sale_price: '0.0000',
              is_stock_tracked: true,
              is_online: true,
              status: 'active',
              description: '',
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (products.length > 0) {
              setSelectedLabelProduct(products[0] ?? null);
            } else {
              setSelectedLabelProduct({
                id: 'sample',
                sku: 'SAMPLE-SKU',
                name: 'Sample Product Label',
                type: 'finished',
                base_unit_id: '1',
                category_id: null,
                brand_id: null,
                standard_cost: '100.00',
                default_sale_price: '150.00',
                is_stock_tracked: true,
                is_online: true,
                status: 'active',
                description: null,
                barcode: '890123456789',
                created_at: null,
                updated_at: null,
                purchase_unit_id: null,
                sales_unit_id: null,
                is_produced: true,
                is_purchased: false,
                is_sold: true,
                has_variants: false,
                tracking_mode: 'batch',
                shelf_life_days: 7,
                reorder_level: '10',
                reorder_quantity: '50',
                tax_profile_id: null,
                weight: '1',
                dimensions: null,
                online_slug: null,
                online_meta: null,
              });
            }
          }}
          className="flex items-center gap-1.5 shadow-xs"
        >
          <QrCode className="h-4 w-4 text-primary" />
          <span>Print Barcodes</span>
        </Button>
      </div>

      {/* Table Data */}
      <QueryBoundary
        status={productsQuery.status}
        error={productsQuery.error}
        data={productsQuery.data}
        isFetching={productsQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default border-collapse">
            <thead className="border-b border-default bg-surface-sunken/70 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Product SKU & Name</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Standard Cost</th>
                <th className="py-3.5 px-3">Sale Price</th>
                <th className="py-3.5 px-3">Stock Tracked</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted">
                    No products found. Click "New Product" to register one.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-sunken/50 transition-colors">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="font-semibold text-default">{p.name}</div>
                      <div className="text-[11px] text-primary font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-sunken border border-default px-2 py-0.5 text-[10px] font-medium text-muted capitalize">
                        <Tag className="h-3 w-3 text-muted" />
                        {p.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-default">{p.standard_cost}</td>
                    <td className="py-3.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {p.default_sale_price}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${p.is_stock_tracked ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                      <span className="ml-2 text-xs text-muted">{p.is_stock_tracked ? 'Tracked' : 'Non-stock'}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          p.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 pl-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingProduct(p)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="View Product Specs"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLabelProduct(p)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="Barcode & Thermal Label"
                        >
                          <QrCode className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(p)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="Delete Product"
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

      {/* Barcode / Thermal Label Generator Modal */}
      {selectedLabelProduct && (
        <Modal
          open={Boolean(selectedLabelProduct)}
          onClose={() => setSelectedLabelProduct(null)}
          title={`Thermal Label (50x30mm) — ${selectedLabelProduct.sku}`}
        >
          <div className="space-y-4">
            <div className="flex justify-center p-6 bg-surface-sunken rounded-xl border border-default">
              <div className="w-[320px] bg-white text-zinc-950 p-4 rounded-lg shadow-lg flex flex-col items-center justify-between space-y-2 border border-zinc-300 font-sans">
                <div className="w-full text-center border-b border-zinc-300 pb-1">
                  <div className="text-[11px] font-black uppercase tracking-wider">SLICE MART FACTORY</div>
                  <div className="text-xs font-bold truncate max-w-70">{selectedLabelProduct.name}</div>
                </div>

                {/* Barcode Graphic */}
                <div className="flex flex-col items-center my-1">
                  <div className="flex items-center gap-0.5 h-12">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2, 1, 3].map((w, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <div className="font-mono font-bold text-xs tracking-widest mt-1">
                    {selectedLabelProduct.sku}
                  </div>
                </div>

                <div className="w-full flex items-center justify-between border-t border-zinc-300 pt-1 text-xs">
                  <span className="font-mono text-[10px] text-zinc-600 uppercase">
                    TYPE: {selectedLabelProduct.type}
                  </span>
                  <span className="font-bold text-sm">
                    {selectedLabelProduct.default_sale_price} BDT
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-muted">Ready for ESC/POS Zebra direct thermal print</span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setSelectedLabelProduct(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Label</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Product Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Product"
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
              <label className="block text-xs font-semibold text-default mb-1">SKU *</label>
              <input
                required
                type="text"
                placeholder="e.g. FG-BRD-001"
                value={draft.sku}
                onChange={(e) => setDraft({ ...draft, sku: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Product Type *</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="finished">Finished Goods</option>
                <option value="semi_finished">Semi-Finished / WIP</option>
                <option value="raw_material">Raw Material</option>
                <option value="packaging">Packaging Material</option>
                <option value="consumable">Consumable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-default mb-1">Product Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. White Sandwich Bread (500g)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Base Unit *</label>
              <select
                required
                value={draft.base_unit_id}
                onChange={(e) => setDraft({ ...draft, base_unit_id: e.target.value })}
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
              <label className="block text-xs font-semibold text-default mb-1">Category</label>
              <select
                value={draft.category_id ?? ''}
                onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Brand</label>
              <select
                value={draft.brand_id ?? ''}
                onChange={(e) => setDraft({ ...draft, brand_id: e.target.value || null })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Standard Cost</label>
              <input
                type="text"
                value={draft.standard_cost}
                onChange={(e) => setDraft({ ...draft, standard_cost: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">
                Default Sale Price
              </label>
              <input
                type="text"
                value={draft.default_sale_price}
                onChange={(e) => setDraft({ ...draft, default_sale_price: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create_stock_tracked"
                checked={draft.is_stock_tracked ?? true}
                onChange={(e) => setDraft({ ...draft, is_stock_tracked: e.target.checked })}
                className="size-4 rounded border-default text-primary focus:ring-primary/20"
              />
              <label htmlFor="create_stock_tracked" className="text-xs font-medium text-default">
                Stock Tracked
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create_is_online"
                checked={draft.is_online ?? true}
                onChange={(e) => setDraft({ ...draft, is_online: e.target.checked })}
                className="size-4 rounded border-default text-primary focus:ring-primary/20"
              />
              <label htmlFor="create_is_online" className="text-xs font-medium text-default">
                Publish to Storefront
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal
          open={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          title={`Edit Product: ${editingProduct.sku}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingProduct.id,
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
                <label className="block text-xs font-semibold text-default mb-1">SKU *</label>
                <input
                  required
                  type="text"
                  value={draft.sku}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-default mb-1">Product Type *</label>
                <select
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                >
                  <option value="finished">Finished Goods</option>
                  <option value="semi_finished">Semi-Finished / WIP</option>
                  <option value="raw_material">Raw Material</option>
                  <option value="packaging">Packaging Material</option>
                  <option value="consumable">Consumable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-default mb-1">Product Name *</label>
              <input
                required
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-default mb-1">Standard Cost</label>
                <input
                  type="text"
                  value={draft.standard_cost}
                  onChange={(e) => setDraft({ ...draft, standard_cost: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-default mb-1">
                  Default Sale Price
                </label>
                <input
                  type="text"
                  value={draft.default_sale_price}
                  onChange={(e) => setDraft({ ...draft, default_sale_price: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_stock_tracked"
                  checked={draft.is_stock_tracked ?? true}
                  onChange={(e) => setDraft({ ...draft, is_stock_tracked: e.target.checked })}
                  className="size-4 rounded border-default text-primary focus:ring-primary/20"
                />
                <label htmlFor="edit_stock_tracked" className="text-xs font-medium text-default">
                  Stock Tracked
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_online"
                  checked={draft.is_online ?? true}
                  onChange={(e) => setDraft({ ...draft, is_online: e.target.checked })}
                  className="size-4 rounded border-default text-primary focus:ring-primary/20"
                />
                <label htmlFor="edit_is_online" className="text-xs font-medium text-default">
                  Storefront Sync
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
              <Button variant="secondary" type="button" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Product Modal */}
      {viewingProduct && (
        <Modal
          open={Boolean(viewingProduct)}
          onClose={() => setViewingProduct(null)}
          title={`Product Specifications: ${viewingProduct.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-sunken/60 border border-default">
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">SKU</span>
                <span className="font-mono font-bold text-primary text-sm">{viewingProduct.sku}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Type</span>
                <span className="font-medium text-default capitalize">{viewingProduct.type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Standard Cost</span>
                <span className="font-mono text-default">{viewingProduct.standard_cost} BDT</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Sale Price</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {viewingProduct.default_sale_price} BDT
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Inventory Tracking</span>
                <span className="font-medium text-default">{viewingProduct.is_stock_tracked ? 'Physical Stock Tracked' : 'Service / Non-inventory'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Storefront Sync</span>
                <span className="font-medium text-default flex items-center gap-1">
                  <Globe className="size-3 text-primary" />
                  {viewingProduct.is_online ? 'Published Online' : 'Internal Only'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingProduct(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Product Modal */}
      {deletingProduct && (
        <Modal
          open={Boolean(deletingProduct)}
          onClose={() => setDeletingProduct(null)}
          title="Delete Product"
        >
          <div className="space-y-4 text-xs">
            <p className="text-default">
              Are you sure you want to delete product{' '}
              <strong className="text-primary font-mono">{deletingProduct.sku}</strong> (
              {deletingProduct.name})?
            </p>
            <p className="text-muted text-[11px]">
              Deleting a product with historical inventory ledger entries or sales transactions is protected by data integrity rules.
            </p>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
              <Button variant="secondary" onClick={() => setDeletingProduct(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deletingProduct.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Barcode & Label Generator Modal */}
      {selectedLabelProduct && (
        <BarcodeGeneratorModal
          isOpen={Boolean(selectedLabelProduct)}
          onClose={() => setSelectedLabelProduct(null)}
          initialProducts={[
            {
              id: selectedLabelProduct.id,
              name: selectedLabelProduct.name,
              sku: selectedLabelProduct.sku,
              barcode: selectedLabelProduct.barcode || selectedLabelProduct.sku,
              sale_price: selectedLabelProduct.default_sale_price || '0.00',
              currency: '৳',
              unit_code: 'PCS',
              batch_code: 'BAT-2026',
              quantity: 4,
            },
          ]}
        />
      )}
    </div>
  );
}
