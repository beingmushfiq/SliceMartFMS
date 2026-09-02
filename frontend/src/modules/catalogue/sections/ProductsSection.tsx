import { useState, useRef, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Tag,
  QrCode,
  Eye,
  Edit2,
  Trash2,
  Upload,
  X,
  Boxes,
  Ruler,
  Layers,
  DollarSign,
  Barcode as BarcodeIcon,
  Package,
  ShieldCheck,
  Scale,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import { notify } from '../../../components/ui/Toast';
import { BarcodeGeneratorModal } from '../../../components/print/labels/BarcodeGeneratorModal';
import { DynamicCustomFields } from '../../../components/forms/DynamicCustomFields';
import {
  ProductDescriptionEditor,
  RenderHtmlContent,
} from '../components/ProductDescriptionEditor';
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
  barcode?: string | null;
  image_url?: string | null;
  reorder_level?: string | null;
  reorder_quantity?: string | null;
  weight?: string | null;
  shelf_life_days?: number | null;
  tracking_mode?: string;
  custom_attributes?: Record<string, unknown> | null;
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
  const [activeFormTab, setActiveFormTab] = useState<'general' | 'pricing' | 'media' | 'custom'>('general');

  // Quick-Add Sub-Modal States
  const [isQuickUnitOpen, setIsQuickUnitOpen] = useState(false);
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);
  const [isQuickBrandOpen, setIsQuickBrandOpen] = useState(false);

  const [quickUnitDraft, setQuickUnitDraft] = useState({
    code: '',
    name: '',
    type: 'piece',
    precision: 2,
    is_base: true,
    is_active: true,
  });

  const [quickCategoryDraft, setQuickCategoryDraft] = useState({
    code: '',
    name: '',
    parent_id: null as string | null,
    is_active: true,
  });

  const [quickBrandDraft, setQuickBrandDraft] = useState({
    code: '',
    name: '',
    logo_path: null as string | null,
    is_active: true,
  });

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
    barcode: '',
    image_url: '',
    reorder_level: '10',
    reorder_quantity: '50',
    weight: '1',
    shelf_life_days: 7,
    tracking_mode: 'batch',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // ── Quick Add Mutations ──────────────────────────────────────────────────
  const quickAddUnitMutation = useMutation({
    mutationFn: (payload: typeof quickUnitDraft) => api.post<Unit>('/units', payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'units'] });
      const newUnit = response.data;
      if (newUnit?.id) {
        setDraft((prev) => ({ ...prev, base_unit_id: String(newUnit.id) }));
      }
      setIsQuickUnitOpen(false);
      setQuickUnitDraft({ code: '', name: '', type: 'piece', precision: 2, is_base: true, is_active: true });
      notify.success(`Unit "${quickUnitDraft.name}" created and selected!`);
    },
    onError: (err) => {
      const msg = isApiError(err) ? err.message : 'Failed to create unit.';
      notify.error(msg);
    },
  });

  const quickAddCategoryMutation = useMutation({
    mutationFn: (payload: typeof quickCategoryDraft) => api.post<Category>('/categories', payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'categories'] });
      const newCat = response.data;
      if (newCat?.id) {
        setDraft((prev) => ({ ...prev, category_id: String(newCat.id) }));
      }
      setIsQuickCategoryOpen(false);
      setQuickCategoryDraft({ code: '', name: '', parent_id: null, is_active: true });
      notify.success(`Category "${quickCategoryDraft.name}" created and selected!`);
    },
    onError: (err) => {
      const msg = isApiError(err) ? err.message : 'Failed to create category.';
      notify.error(msg);
    },
  });

  const quickAddBrandMutation = useMutation({
    mutationFn: (payload: typeof quickBrandDraft) => api.post<Brand>('/brands', payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'brands'] });
      const newBrand = response.data;
      if (newBrand?.id) {
        setDraft((prev) => ({ ...prev, brand_id: String(newBrand.id) }));
      }
      setIsQuickBrandOpen(false);
      setQuickBrandDraft({ code: '', name: '', logo_path: null, is_active: true });
      notify.success(`Brand "${quickBrandDraft.name}" created and selected!`);
    },
    onError: (err) => {
      const msg = isApiError(err) ? err.message : 'Failed to create brand.';
      notify.error(msg);
    },
  });

  // ── Product CRUD Mutations ──────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: ProductFormDraft) => {
      const finalPayload = {
        ...payload,
        online_meta: payload.image_url ? { image_url: payload.image_url } : null,
      };
      return api.post<Product>('/products', finalPayload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'products'] });
      setIsCreateOpen(false);
      resetDraft();
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
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductFormDraft> }) => {
      const finalPayload = {
        ...payload,
        online_meta: payload.image_url ? { image_url: payload.image_url } : null,
      };
      return api.patch<Product>(`/products/${id}`, finalPayload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'products'] });
      setEditingProduct(null);
      setErrorMsg(null);
      notify.success('Product specifications updated successfully.');
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

  const resetDraft = () => {
    setDraft({
      sku: '',
      name: '',
      type: 'finished',
      base_unit_id: unitsQuery.data?.data?.[0]?.id ? String(unitsQuery.data.data[0].id) : '',
      category_id: null,
      brand_id: null,
      standard_cost: '0.0000',
      default_sale_price: '0.0000',
      is_stock_tracked: true,
      is_online: true,
      status: 'active',
      description: '',
      barcode: '',
      image_url: '',
      reorder_level: '10',
      reorder_quantity: '50',
      weight: '1',
      shelf_life_days: 7,
      tracking_mode: 'batch',
    });
    setActiveFormTab('general');
  };

  const handleOpenEdit = (p: Product) => {
    setErrorMsg(null);
    setActiveFormTab('general');
    const onlineMeta = p.online_meta as { image_url?: string } | null;
    setDraft({
      sku: p.sku,
      name: p.name,
      type: p.type,
      base_unit_id: String(p.base_unit_id),
      category_id: p.category_id ? String(p.category_id) : null,
      brand_id: p.brand_id ? String(p.brand_id) : null,
      standard_cost: p.standard_cost,
      default_sale_price: p.default_sale_price,
      is_stock_tracked: p.is_stock_tracked,
      is_online: p.is_online,
      status: p.status,
      description: p.description || '',
      barcode: p.barcode || '',
      image_url: onlineMeta?.image_url || '',
      reorder_level: p.reorder_level || '10',
      reorder_quantity: p.reorder_quantity || '50',
      weight: p.weight || '1',
      shelf_life_days: p.shelf_life_days || 7,
      tracking_mode: p.tracking_mode || 'batch',
    });
    setEditingProduct(p);
  };

  // Image File Upload Handler
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notify.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraft((prev) => ({ ...prev, image_url: reader.result as string }));
        notify.success('Image loaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const products = productsQuery.data?.data ?? [];
  const units = unitsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const brands = brandsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by SKU, Name or Barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-xs"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter products by type"
              className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-3 pr-8 text-xs text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-xs font-medium cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="finished">Finished Goods</option>
              <option value="semi_finished">Semi-Finished</option>
              <option value="raw_material">Raw Materials</option>
              <option value="packaging">Packaging</option>
              <option value="consumable">Consumables</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (products.length > 0) {
                setSelectedLabelProduct(products[0] ?? null);
              } else {
                setSelectedLabelProduct({
                  id: 'sample',
                  sku: 'FG-BRD-001',
                  name: 'Artisan Sourdough Bread (500g)',
                  type: 'finished',
                  base_unit_id: '1',
                  category_id: null,
                  brand_id: null,
                  standard_cost: '45.00',
                  default_sale_price: '85.00',
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
                  weight: '0.5',
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

          <Button
            variant="primary"
            onClick={() => {
              setErrorMsg(null);
              resetDraft();
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Product</span>
          </Button>
        </div>
      </div>

      {/* Table Data */}
      <QueryBoundary
        status={productsQuery.status}
        error={productsQuery.error}
        data={productsQuery.data}
        isFetching={productsQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="size-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-700 dark:text-slate-300">No products found</p>
                      <p className="text-xs text-slate-400">Click "New Product" above to create your first catalogue item.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const pMeta = p.online_meta as { image_url?: string } | null;
                  const thumb = pMeta?.image_url;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={p.name}
                              className="size-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="size-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-primary font-mono">{p.sku}</span>
                              {p.barcode && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                  {p.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400 capitalize">
                          <Tag className="h-3 w-3 text-slate-400" />
                          {p.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 font-medium">৳ {p.standard_cost}</td>
                      <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ৳ {p.default_sale_price}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block size-2 rounded-full ${
                              p.is_stock_tracked ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-400'
                            }`}
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {p.is_stock_tracked ? 'Tracked' : 'Non-stock'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 pr-4 pl-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingProduct(p)}
                            className="inline-flex items-center justify-center size-7.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-2xs"
                            title="View Specs & Details"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="inline-flex items-center justify-center size-7.5 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all cursor-pointer border border-transparent shadow-2xs"
                            title="Edit Product & Specs"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLabelProduct(p)}
                            className="inline-flex items-center justify-center size-7.5 rounded-xl text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all cursor-pointer border border-transparent shadow-2xs"
                            title="Thermal Barcode Label"
                          >
                            <QrCode className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(p)}
                            className="inline-flex items-center justify-center size-7.5 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer border border-transparent shadow-2xs"
                            title="Delete Product"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE PRODUCT MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Product"
        subtitle="Register catalog items with units, pricing, media, specs and custom HTML notes"
        icon={<Package className="size-4.5" />}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(draft);
          }}
          className="space-y-5"
        >
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-rose-500" />
              {errorMsg}
            </div>
          )}

          {/* Form Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveFormTab('general')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFormTab === 'general'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Package className="size-3.5" />
              <span>General & Units</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('pricing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFormTab === 'pricing'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <DollarSign className="size-3.5" />
              <span>Pricing & Inventory</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('media')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFormTab === 'media'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileCode className="size-3.5" />
              <span>Media & HTML Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFormTab === 'custom'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="size-3.5" />
              <span>Custom Attributes</span>
            </button>
          </div>

          {/* TAB 1: General & Units */}
          {activeFormTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code <span className="text-primary">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. FG-BRD-001"
                    value={draft.sku}
                    onChange={(e) => setDraft({ ...draft, sku: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none uppercase font-mono shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Type <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={draft.type}
                      onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                      aria-label="Product Type"
                      className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                    >
                      <option value="finished">Finished Goods</option>
                      <option value="semi_finished">Semi-Finished / WIP</option>
                      <option value="raw_material">Raw Material</option>
                      <option value="packaging">Packaging Material</option>
                      <option value="consumable">Consumable</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name <span className="text-primary">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Artisan Sourdough Bread (500g)"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Base Unit, Category, Brand with Quick-Add Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Base Unit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Base Unit <span className="text-primary">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickUnitOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      title="Quick Add Unit"
                    >
                      <Plus className="size-3" /> Quick Add
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      required
                      value={draft.base_unit_id}
                      onChange={(e) => setDraft({ ...draft, base_unit_id: e.target.value })}
                      aria-label="Base Unit"
                      className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                    >
                      <option value="">Select Unit</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.code})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCategoryOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      title="Quick Add Category"
                    >
                      <Plus className="size-3" /> Quick Add
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={draft.category_id ?? ''}
                      onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
                      aria-label="Category"
                      className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                    >
                      <option value="">None (General)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Brand</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickBrandOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      title="Quick Add Brand"
                    >
                      <Plus className="size-3" /> Quick Add
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={draft.brand_id ?? ''}
                      onChange={(e) => setDraft({ ...draft, brand_id: e.target.value || null })}
                      aria-label="Brand"
                      className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                    >
                      <option value="">None (Unbranded)</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Tracking Mode */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lifecycle Status</label>
                  <div className="relative">
                    <select
                      value={draft.status ?? 'active'}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                      aria-label="Lifecycle Status"
                      className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                    >
                      <option value="active">Active (Production & Sales)</option>
                      <option value="draft">Draft / Planned</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tracking Mode</label>
                  <div className="relative">
                    <select
                      value={draft.tracking_mode ?? 'batch'}
                      onChange={(e) => setDraft({ ...draft, tracking_mode: e.target.value })}
                      aria-label="Tracking Mode"
                      className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                    >
                      <option value="none">Standard Quantity (No Lot)</option>
                      <option value="batch">Batch / Lot Tracking</option>
                      <option value="serial">Unique Serial Numbers</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Pricing & Inventory */}
          {activeFormTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Cost (৳ BDT)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                      ৳
                    </span>
                    <input
                      type="text"
                      value={draft.standard_cost}
                      onChange={(e) => setDraft({ ...draft, standard_cost: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">BOM standard valuation cost</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Sale Price (৳ BDT)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ৳
                    </span>
                    <input
                      type="text"
                      value={draft.default_sale_price}
                      onChange={(e) => setDraft({ ...draft, default_sale_price: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-8 pr-3 py-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Base retail & POS selling price</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reorder Level (Min)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10"
                    value={draft.reorder_level ?? ''}
                    onChange={(e) => setDraft({ ...draft, reorder_level: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">Safety stock trigger threshold</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reorder Quantity</label>
                  <input
                    type="text"
                    placeholder="e.g. 50"
                    value={draft.reorder_quantity ?? ''}
                    onChange={(e) => setDraft({ ...draft, reorder_quantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">Economic order lot size</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shelf Life (Days)</label>
                  <input
                    type="number"
                    placeholder="e.g. 7"
                    value={draft.shelf_life_days ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, shelf_life_days: e.target.value ? Number(e.target.value) : null })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">For FEFO batch expiry</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={draft.is_stock_tracked ?? true}
                    onChange={(e) => setDraft({ ...draft, is_stock_tracked: e.target.checked })}
                    className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">Inventory Stock Tracking</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Keep warehouse ledger & balance audits</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={draft.is_online ?? true}
                    onChange={(e) => setDraft({ ...draft, is_online: e.target.checked })}
                    className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">Publish to Storefront</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Expose on customer online portal & POS</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Media & HTML Notes */}
          {activeFormTab === 'media' && (
            <div className="space-y-4">
              {/* Product Image Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Product Image & Media
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  {/* Upload / Preview Box */}
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      {draft.image_url ? (
                        <>
                          <img
                            src={draft.image_url}
                            alt="Product Preview"
                            className="size-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                          />
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDraft({ ...draft, image_url: '' });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                setDraft({ ...draft, image_url: '' });
                              }
                            }}
                            className="absolute top-2 right-2 size-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                            title="Remove Photo"
                          >
                            <X className="size-4" />
                          </span>
                        </>
                      ) : (
                        <div className="p-4 text-center">
                          <Upload className="size-8 text-primary/70 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                            Click to Upload Image
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">PNG, JPG, WebP up to 2MB</span>
                        </div>
                      )}
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Image URL Input & Info */}
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Or Enter Direct Image URL
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/product-image.jpg"
                          value={draft.image_url ?? ''}
                          onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs shrink-0 py-2 shadow-xs"
                        >
                          <Upload className="size-3.5" /> Browse
                        </Button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      💡 <strong>Image Sync:</strong> Product photos are automatically displayed on POS checkout registers and customer e-commerce catalogs.
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode & Physical Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Barcode / EAN-13 / GTIN
                  </label>
                  <div className="relative">
                    <BarcodeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 890123456789"
                      value={draft.barcode ?? ''}
                      onChange={(e) => setDraft({ ...draft, barcode: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Weight (Kg)</label>
                  <div className="relative">
                    <Scale className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 0.500"
                      value={draft.weight ?? ''}
                      onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Product Description & Production Notes with Custom HTML & CSS Support */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="size-3.5 text-primary" /> Product Description & Production Notes (Custom HTML & CSS)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">HTML5 / CSS3 / Inline Styles</span>
                </label>
                <ProductDescriptionEditor
                  value={draft.description ?? ''}
                  onChange={(val) => setDraft({ ...draft, description: val })}
                  placeholder="<h2>Product Overview</h2><p>Ingredients, allergen notices, packaging specs, custom styled tables...</p>"
                  rows={5}
                />
              </div>
            </div>
          )}

          {/* TAB 4: Custom Attributes */}
          {activeFormTab === 'custom' && (
            <div className="py-2">
              <DynamicCustomFields
                module="catalogue"
                entity="product"
                values={draft.custom_attributes}
                onChange={(k, v) =>
                  setDraft((prev) => ({
                    ...prev,
                    custom_attributes: {
                      ...(prev.custom_attributes || {}),
                      [k]: v,
                    },
                  }))
                }
              />
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeFormTab === 'general' && 'Step 1 of 4 · Core Info'}
              {activeFormTab === 'pricing' && 'Step 2 of 4 · Cost & Stock'}
              {activeFormTab === 'media' && 'Step 3 of 4 · Visuals & HTML Notes'}
              {activeFormTab === 'custom' && 'Step 4 of 4 · Custom Attributes'}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={createMutation.isPending}
                className="shadow-md shadow-primary/20"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Product'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT PRODUCT MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {editingProduct && (
        <Modal
          open={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          title={`Edit Product: ${editingProduct.sku}`}
          subtitle={`Modify specifications for ${editingProduct.name}`}
          icon={<Edit2 className="size-4.5" />}
          size="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingProduct.id,
                payload: draft,
              });
            }}
            className="space-y-5"
          >
            {errorMsg && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                {errorMsg}
              </div>
            )}

            {/* Form Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveFormTab('general')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFormTab === 'general'
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Package className="size-3.5" />
                <span>General & Units</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('pricing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFormTab === 'pricing'
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <DollarSign className="size-3.5" />
                <span>Pricing & Inventory</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('media')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFormTab === 'media'
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileCode className="size-3.5" />
                <span>Media & HTML Notes</span>
              </button>
            </div>

            {/* TAB 1: General & Units */}
            {activeFormTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SKU Code <span className="text-primary">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={draft.sku}
                      onChange={(e) => setDraft({ ...draft, sku: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none uppercase font-mono shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Product Type <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={draft.type}
                        onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                        aria-label="Product Type"
                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                      >
                        <option value="finished">Finished Goods</option>
                        <option value="semi_finished">Semi-Finished / WIP</option>
                        <option value="raw_material">Raw Material</option>
                        <option value="packaging">Packaging Material</option>
                        <option value="consumable">Consumable</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Name <span className="text-primary">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                  />
                </div>

                {/* Base Unit, Category, Brand with Quick-Add */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Base Unit */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Base Unit <span className="text-primary">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsQuickUnitOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        <Plus className="size-3" /> Quick Add
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        required
                        value={draft.base_unit_id}
                        onChange={(e) => setDraft({ ...draft, base_unit_id: e.target.value })}
                        aria-label="Base Unit"
                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                      >
                        <option value="">Select Unit</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.code})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                      <button
                        type="button"
                        onClick={() => setIsQuickCategoryOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        <Plus className="size-3" /> Quick Add
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        value={draft.category_id ?? ''}
                        onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
                        aria-label="Category"
                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                      >
                        <option value="">None (General)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Brand</label>
                      <button
                        type="button"
                        onClick={() => setIsQuickBrandOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        <Plus className="size-3" /> Quick Add
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        value={draft.brand_id ?? ''}
                        onChange={(e) => setDraft({ ...draft, brand_id: e.target.value || null })}
                        aria-label="Brand"
                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                      >
                        <option value="">None (Unbranded)</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Tracking Mode */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lifecycle Status</label>
                    <div className="relative">
                      <select
                        value={draft.status ?? 'active'}
                        onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                        aria-label="Lifecycle Status"
                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                      >
                        <option value="active">Active (Production & Sales)</option>
                        <option value="draft">Draft / Planned</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tracking Mode</label>
                    <div className="relative">
                      <select
                        value={draft.tracking_mode ?? 'batch'}
                        onChange={(e) => setDraft({ ...draft, tracking_mode: e.target.value })}
                        aria-label="Tracking Mode"
                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                      >
                        <option value="none">Standard Quantity (No Lot)</option>
                        <option value="batch">Batch / Lot Tracking</option>
                        <option value="serial">Unique Serial Numbers</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Pricing & Inventory */}
            {activeFormTab === 'pricing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard Cost (৳ BDT)</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                        ৳
                      </span>
                      <input
                        type="text"
                        value={draft.standard_cost}
                        onChange={(e) => setDraft({ ...draft, standard_cost: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Sale Price (৳ BDT)</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ৳
                      </span>
                      <input
                        type="text"
                        value={draft.default_sale_price}
                        onChange={(e) => setDraft({ ...draft, default_sale_price: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-8 pr-3 py-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reorder Level (Min)</label>
                    <input
                      type="text"
                      value={draft.reorder_level ?? ''}
                      onChange={(e) => setDraft({ ...draft, reorder_level: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reorder Quantity</label>
                    <input
                      type="text"
                      value={draft.reorder_quantity ?? ''}
                      onChange={(e) => setDraft({ ...draft, reorder_quantity: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shelf Life (Days)</label>
                    <input
                      type="number"
                      value={draft.shelf_life_days ?? ''}
                      onChange={(e) =>
                        setDraft({ ...draft, shelf_life_days: e.target.value ? Number(e.target.value) : null })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={draft.is_stock_tracked ?? true}
                      onChange={(e) => setDraft({ ...draft, is_stock_tracked: e.target.checked })}
                      className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">Inventory Stock Tracking</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Keep warehouse ledger & balance audits</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={draft.is_online ?? true}
                      onChange={(e) => setDraft({ ...draft, is_online: e.target.checked })}
                      className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">Publish to Storefront</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Expose on customer online portal & POS</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: Media & HTML Notes */}
            {activeFormTab === 'media' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Product Image & Media
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    <div className="sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        {draft.image_url ? (
                          <>
                            <img
                              src={draft.image_url}
                              alt="Product Preview"
                              className="size-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                            />
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDraft({ ...draft, image_url: '' });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                setDraft({ ...draft, image_url: '' });
                              }
                            }}
                            className="absolute top-2 right-2 size-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                            title="Remove Photo"
                          >
                            <X className="size-4" />
                          </span>
                        </>
                      ) : (
                        <div className="p-4 text-center">
                          <Upload className="size-8 text-primary/70 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                            Click to Upload Image
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">PNG, JPG, WebP up to 2MB</span>
                        </div>
                      )}
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Or Enter Direct Image URL
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/product-image.jpg"
                          value={draft.image_url ?? ''}
                          onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs shrink-0 py-2 shadow-xs"
                        >
                          <Upload className="size-3.5" /> Browse
                        </Button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      💡 <strong>Image Sync:</strong> Product photos are automatically displayed on POS checkout registers and customer e-commerce catalogs.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Barcode / EAN-13 / GTIN
                  </label>
                  <div className="relative">
                    <BarcodeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 890123456789"
                      value={draft.barcode ?? ''}
                      onChange={(e) => setDraft({ ...draft, barcode: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Weight (Kg)</label>
                  <div className="relative">
                    <Scale className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 0.500"
                      value={draft.weight ?? ''}
                      onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Product Description & Production Notes with Custom HTML & CSS Support */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="size-3.5 text-primary" /> Product Description & Production Notes (Custom HTML & CSS)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">HTML5 / CSS3 / Inline Styles</span>
                </label>
                <ProductDescriptionEditor
                  value={draft.description ?? ''}
                  onChange={(val) => setDraft({ ...draft, description: val })}
                  placeholder="<h2>Product Overview</h2><p>Ingredients, allergen notices, packaging specs, custom styled tables...</p>"
                  rows={5}
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeFormTab === 'general' && 'Step 1 of 3 · Core Info'}
              {activeFormTab === 'pricing' && 'Step 2 of 3 · Cost & Stock'}
              {activeFormTab === 'media' && 'Step 3 of 3 · Visuals & HTML Notes'}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={updateMutation.isPending}
                className="shadow-md shadow-primary/20"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          QUICK ADD BASE UNIT MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={isQuickUnitOpen}
        onClose={() => setIsQuickUnitOpen(false)}
        title="Quick Add Unit of Measure"
        subtitle="Create a new unit and auto-select it for this product"
        icon={<Ruler className="size-4.5" />}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            quickAddUnitMutation.mutate(quickUnitDraft);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unit Code <span className="text-primary">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. KG, LTR, BOX, PCS, PACK"
              value={quickUnitDraft.code}
              onChange={(e) => setQuickUnitDraft({ ...quickUnitDraft, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white uppercase font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unit Name <span className="text-primary">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Kilogram, Litre, Carton Box"
              value={quickUnitDraft.name}
              onChange={(e) => setQuickUnitDraft({ ...quickUnitDraft, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dimension Type</label>
              <div className="relative">
                <select
                  value={quickUnitDraft.type}
                  onChange={(e) => setQuickUnitDraft({ ...quickUnitDraft, type: e.target.value })}
                  aria-label="Dimension Type"
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                >
                  <option value="piece">Piece / Discrete</option>
                  <option value="weight">Mass / Weight</option>
                  <option value="volume">Liquid / Volume</option>
                  <option value="length">Length / Linear</option>
                  <option value="area">Area / Surface</option>
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Decimal Precision</label>
              <div className="relative">
                <select
                  value={quickUnitDraft.precision}
                  onChange={(e) => setQuickUnitDraft({ ...quickUnitDraft, precision: Number(e.target.value) })}
                  aria-label="Decimal Precision"
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
                >
                  <option value={0}>0 (Integers, e.g. 1, 2)</option>
                  <option value={2}>2 (e.g. 1.25)</option>
                  <option value={3}>3 (e.g. 0.375)</option>
                  <option value={4}>4 (Precision: 0.0001)</option>
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsQuickUnitOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={quickAddUnitMutation.isPending}
              className="shadow-sm shadow-primary/20"
            >
              {quickAddUnitMutation.isPending ? 'Adding...' : 'Add Unit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          QUICK ADD CATEGORY MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={isQuickCategoryOpen}
        onClose={() => setIsQuickCategoryOpen(false)}
        title="Quick Add Category"
        subtitle="Create a new classification category and auto-select it"
        icon={<Layers className="size-4.5" />}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            quickAddCategoryMutation.mutate(quickCategoryDraft);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Code <span className="text-primary">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. CAT-BRD, CAT-RAW"
              value={quickCategoryDraft.code}
              onChange={(e) => setQuickCategoryDraft({ ...quickCategoryDraft, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white uppercase font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name <span className="text-primary">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Artisan Breads, Dairy & Butter, Sweet Pastry"
              value={quickCategoryDraft.name}
              onChange={(e) => setQuickCategoryDraft({ ...quickCategoryDraft, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent Category (Optional)</label>
            <div className="relative">
              <select
                value={quickCategoryDraft.parent_id ?? ''}
                onChange={(e) => setQuickCategoryDraft({ ...quickCategoryDraft, parent_id: e.target.value || null })}
                aria-label="Parent Category (Optional)"
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs cursor-pointer font-medium"
              >
                <option value="">Top-Level Category (None)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsQuickCategoryOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={quickAddCategoryMutation.isPending}
              className="shadow-sm shadow-primary/20"
            >
              {quickAddCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          QUICK ADD BRAND MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={isQuickBrandOpen}
        onClose={() => setIsQuickBrandOpen(false)}
        title="Quick Add Brand"
        subtitle="Register a new commercial or supplier brand and auto-select it"
        icon={<Boxes className="size-4.5" />}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            quickAddBrandMutation.mutate(quickBrandDraft);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand Code <span className="text-primary">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. BRD-SLM, BRD-GLD"
              value={quickBrandDraft.code}
              onChange={(e) => setQuickBrandDraft({ ...quickBrandDraft, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white uppercase font-mono focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand Name <span className="text-primary">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. SliceMart Originals, Baker's Choice"
              value={quickBrandDraft.name}
              onChange={(e) => setQuickBrandDraft({ ...quickBrandDraft, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsQuickBrandOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={quickAddBrandMutation.isPending}
              className="shadow-sm shadow-primary/20"
            >
              {quickAddBrandMutation.isPending ? 'Adding...' : 'Add Brand'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          VIEW PRODUCT SPECIFICATIONS MODAL (With Rich Custom HTML/CSS Rendering)
          ═══════════════════════════════════════════════════════════════════════ */}
      {viewingProduct && (
        <Modal
          open={Boolean(viewingProduct)}
          onClose={() => setViewingProduct(null)}
          title={viewingProduct.name}
          subtitle={`SKU: ${viewingProduct.sku} · Complete Technical Specification`}
          icon={<Package className="size-4.5" />}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Hero Card */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {(() => {
                const meta = viewingProduct.online_meta as { image_url?: string } | null;
                const photo = meta?.image_url;
                return photo ? (
                  <img
                    src={photo}
                    alt={viewingProduct.name}
                    className="size-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-md shrink-0"
                  />
                ) : (
                  <div className="size-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Package className="size-10 text-slate-300 dark:text-slate-600" />
                  </div>
                );
              })()}

              <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{viewingProduct.sku}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
                    {viewingProduct.type.replace('_', ' ')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                      viewingProduct.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {viewingProduct.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingProduct.name}</h3>
              </div>
            </div>

            {/* Financials & Stock Ledger Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Standard Cost</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white text-sm mt-0.5 block">
                  ৳ {viewingProduct.standard_cost}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Sale Price</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                  ৳ {viewingProduct.default_sale_price}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Gross Margin</span>
                <span className="font-mono font-bold text-primary text-sm mt-0.5 block">
                  {(() => {
                    const cost = Number(viewingProduct.standard_cost) || 0;
                    const price = Number(viewingProduct.default_sale_price) || 0;
                    if (price <= 0) return '0.0%';
                    const margin = ((price - cost) / price) * 100;
                    return `${margin.toFixed(1)}%`;
                  })()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tracking Mode</span>
                <span className="font-medium text-slate-900 dark:text-white text-xs mt-1 block capitalize">
                  {viewingProduct.tracking_mode || 'Batch'}
                </span>
              </div>
            </div>

            {/* Technical Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Barcode / EAN</span>
                <span className="font-mono text-slate-900 dark:text-white font-medium mt-0.5 block">
                  {viewingProduct.barcode || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Reorder Buffer / Lot</span>
                <span className="font-medium text-slate-900 dark:text-white mt-0.5 block">
                  Min: {viewingProduct.reorder_level || '10'} · Lot: {viewingProduct.reorder_quantity || '50'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Shelf Life / Weight</span>
                <span className="font-medium text-slate-900 dark:text-white mt-0.5 block">
                  {viewingProduct.shelf_life_days ? `${viewingProduct.shelf_life_days} Days` : 'N/A'} · {viewingProduct.weight ? `${viewingProduct.weight} kg` : '—'}
                </span>
              </div>
            </div>

            {/* Rendered HTML & CSS Description */}
            {viewingProduct.description && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="size-3.5 text-primary" /> Product Specifications & Notes
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 max-h-75 overflow-y-auto">
                  <RenderHtmlContent html={viewingProduct.description} />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Validated against central ERP catalog schema
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setViewingProduct(null);
                    handleOpenEdit(viewingProduct);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Edit2 className="size-3.5" /> Edit Specs
                </Button>
                <Button variant="primary" onClick={() => setViewingProduct(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DELETE PRODUCT CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {deletingProduct && (
        <Modal
          open={Boolean(deletingProduct)}
          onClose={() => setDeletingProduct(null)}
          title="Delete Product"
          subtitle="Confirm removal from active production & sales catalog"
          icon={<Trash2 className="size-4.5 text-rose-500" />}
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
              Are you sure you want to delete product{' '}
              <strong className="text-primary font-mono">{deletingProduct.sku}</strong> ({deletingProduct.name})?
            </p>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed">
              ⚠️ Deleting this product is protected: any historical inventory transactions or production batches will retain ledger integrity.
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
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

      {/* Barcode / Thermal Label Generator Modal */}
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
