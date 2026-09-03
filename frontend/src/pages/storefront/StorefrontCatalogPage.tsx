import React, { useEffect, useState, useMemo } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import {
  Search,
  Grid3X3,
  LayoutList,
  Package,
  ShoppingBag,
  Sparkles,
  Tag,
  MessageCircle,
  X,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import { SeoHead } from '../../components/seo/SeoHead';
import { BreadcrumbNav } from '../../components/seo/BreadcrumbNav';
import { SelectDropdown } from '../../components/ui/Dropdown';
import type { StorefrontConfig, StorefrontProduct } from '../../types/api/storefront';

interface OutletContextType {
  config: StorefrontConfig;
  subdomain: string;
}

interface CategoryItem {
  id: number;
  name: string;
  code?: string;
}

export const StorefrontCatalogPage: React.FC = () => {
  const { config, subdomain } = useOutletContext<OutletContextType>();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort State
  const initialCategory = searchParams.get('category')
    ? Number(searchParams.get('category'))
    : null;
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>(
    (searchParams.get('sort') as 'featured' | 'price-asc' | 'price-desc' | 'name') || 'featured'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addingId, setAddingId] = useState<number | null>(null);

  const { addItem, openDrawer } = useStorefrontCartStore();

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          api.get<{ data: StorefrontProduct[] }>('/storefront/products', {
            headers: { 'X-Storefront-Subdomain': subdomain },
            params: {
              ...(selectedCategory ? { category_id: String(selectedCategory) } : {}),
              ...(searchQuery.trim().length >= 2 ? { q: searchQuery.trim() } : {}),
            },
          }),
          api.get<{ data: CategoryItem[] }>('/storefront/categories', {
            headers: { 'X-Storefront-Subdomain': subdomain },
          }),
        ]);

        if (prodRes.status === 'fulfilled') {
          const rawProds = prodRes.value.data as unknown;
          const prodList = Array.isArray(rawProds)
            ? (rawProds as StorefrontProduct[])
            : (((rawProds as Record<string, unknown>)?.data as StorefrontProduct[]) ?? []);
          setProducts(prodList);
        }
        if (catRes.status === 'fulfilled') {
          const rawCats = catRes.value.data as unknown;
          const cats = Array.isArray(rawCats)
            ? (rawCats as CategoryItem[])
            : (((rawCats as Record<string, unknown>)?.data as CategoryItem[]) ?? []);
          setCategories(cats);
          if (categorySlug && !selectedCategory) {
            const matched = cats.find(
              (c) =>
                c.code?.toLowerCase() === categorySlug.toLowerCase() ||
                c.name.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase()
            );
            if (matched) setSelectedCategory(matched.id);
          }
        }
      } catch (err) {
        console.error('Failed to load catalog products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [subdomain, selectedCategory, searchQuery, categorySlug]);

  // Sort products in-memory
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'price-asc') {
      return list.sort(
        (a, b) => parseFloat(a.default_sale_price || '0') - parseFloat(b.default_sale_price || '0')
      );
    }
    if (sortBy === 'price-desc') {
      return list.sort(
        (a, b) => parseFloat(b.default_sale_price || '0') - parseFloat(a.default_sale_price || '0')
      );
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, sortBy]);

  const handleCategorySelect = (catId: number | null) => {
    setSelectedCategory(catId);
    if (catId) {
      searchParams.set('category', String(catId));
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  const handleAddToCart = async (product: StorefrontProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingId(product.id);
    try {
      await addItem(product.id, 1);
      openDrawer();
    } finally {
      setTimeout(() => setAddingId(null), 400);
    }
  };

  const currency = config?.currency ?? 'BDT';
  const whatsappNumber = config?.whatsapp_number?.replace(/[^0-9]/g, '') || '8801700000000';

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const pageTitle = activeCategoryObj
    ? `Buy ${activeCategoryObj.name} Online`
    : searchQuery
    ? `Search: "${searchQuery}"`
    : 'All Products & Collections';

  const breadcrumbs = [
    { name: 'Home', url: `/store/${subdomain}` },
    { name: 'All Products', url: `/store/${subdomain}/products` },
    ...(activeCategoryObj ? [{ name: activeCategoryObj.name, url: `/store/${subdomain}/collections/${activeCategoryObj.code || activeCategoryObj.name.toLowerCase()}` }] : []),
  ];

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageTitle,
    itemListElement: sortedProducts.slice(0, 30).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: p.name,
      url: `${window.location.origin}/store/${subdomain}/products/${(p as StorefrontProduct & { online_slug?: string }).online_slug || p.sku}`,
    })),
  };

  return (
    <div className="space-y-6 py-2">
      <SeoHead
        title={pageTitle}
        description={`Explore genuine factory catalog for ${activeCategoryObj ? activeCategoryObj.name : 'wholesale and retail products'}. Fast direct delivery, instant WhatsApp ordering.`}
        brandName={config?.name ?? 'Slice Mart'}
        schema={itemListSchema}
      />

      <BreadcrumbNav items={breadcrumbs} className="py-1" />

      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 p-6 sm:p-10 shadow-xl">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="size-3.5" />
            <span>Industrial Direct Outlet • Factory Fresh Sync</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            All Products & Collections
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Browse our complete manufactured product catalog. Direct from automated production lines 
            with zero middleman markup.
          </p>
        </div>
      </div>

      {/* Category Pills & Filter Bar */}
      <div className="space-y-4">
        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategorySelect(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === null
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <Tag className="size-3.5" />
            <span>All Categories ({products.length})</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products by title, SKU..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) searchParams.set('q', e.target.value);
                else searchParams.delete('q');
                setSearchParams(searchParams);
              }}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchParams.delete('q');
                  setSearchParams(searchParams);
                }}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Right: Sort & View Toggle */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 hidden md:inline">Sort:</span>
              <SelectDropdown
                options={[
                  { value: 'featured', label: 'Featured / Standard' },
                  { value: 'price-asc', label: 'Price: Low to High' },
                  { value: 'price-desc', label: 'Price: High to Low' },
                  { value: 'name', label: 'Product Name (A-Z)' },
                ]}
                value={sortBy}
                onChange={(val) => {
                  setSortBy(val as 'featured' | 'price-asc' | 'price-desc' | 'name');
                  searchParams.set('sort', val);
                  setSearchParams(searchParams);
                }}
                size="sm"
                aria-label="Sort catalog products"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl bg-zinc-950 border border-zinc-800 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
                title="List view"
              >
                <LayoutList className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-4">
          <Package className="mx-auto size-12 text-zinc-600" />
          <h3 className="text-base font-bold text-white">No products found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            We couldn't find any products matching your active filters. Try searching for another term or reset categories.
          </p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery('');
              setSearchParams({});
            }}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {sortedProducts.map((product) => {
            const isAdding = addingId === product.id;
            const price = parseFloat(product.default_sale_price || '0').toFixed(2);

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5"
              >
                {/* Visual Thumbnail */}
                <Link to={`/store/${subdomain}/products/${product.sku}`} className="block">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-950/80 border border-zinc-800/60 flex items-center justify-center p-6 group-hover:bg-zinc-950 transition-colors">
                    <Package className="size-20 text-zinc-700 group-hover:text-emerald-500/60 transition-colors" />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-300">
                      {product.sku}
                    </span>
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Factory Direct
                    </span>
                  </div>
                </Link>

                {/* Details */}
                <div className="space-y-3 pt-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                      {product.category && <span>{product.category.name}</span>}
                      {product.brand && <span>• {product.brand.name}</span>}
                    </div>
                    <Link
                      to={`/store/${subdomain}/products/${product.sku}`}
                      className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 block"
                    >
                      {product.name}
                    </Link>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-zinc-400">Direct Price</div>
                      <div className="text-sm font-extrabold text-emerald-400 font-mono">
                        {currency} {price}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {config?.whatsapp_ordering_enabled !== false && (
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                            `Hi, I want to order ${product.name} (SKU: ${product.sku}, Price: ${currency} ${price})`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 transition-colors"
                          title="Instant WhatsApp Order"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={isAdding}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                      >
                        <ShoppingBag className="size-3.5" />
                        <span>{isAdding ? 'Adding...' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {sortedProducts.map((product) => {
            const isAdding = addingId === product.id;
            const price = parseFloat(product.default_sale_price || '0').toFixed(2);

            return (
              <div
                key={product.id}
                className="group flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                  <div className="size-16 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Package className="size-8 text-zinc-600 group-hover:text-emerald-500" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                      <span className="text-zinc-500">{product.sku}</span>
                      {product.category && <span>• {product.category.name}</span>}
                    </div>
                    <Link
                      to={`/store/${subdomain}/products/${product.sku}`}
                      className="text-sm font-bold text-white hover:text-emerald-400 transition-colors block truncate"
                    >
                      {product.name}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-6 justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400">Direct Price</div>
                    <div className="text-sm font-extrabold text-emerald-400 font-mono">
                      {currency} {price}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/store/${subdomain}/products/${product.sku}`}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                    >
                      Details
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={isAdding}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <ShoppingBag className="size-3.5" />
                      <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
