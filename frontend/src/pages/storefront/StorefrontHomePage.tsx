import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Plus, Search, Sparkles, Tag } from 'lucide-react';
import { api } from '../../lib/api/client';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import type { StorefrontConfig, StorefrontProduct } from '../../types/api/storefront';

interface OutletContextType {
  config: StorefrontConfig;
  subdomain: string;
}

export const StorefrontHomePage: React.FC = () => {
  const { config, subdomain } = useOutletContext<OutletContextType>();
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { addItem } = useStorefrontCartStore();

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCategory) params['category_id'] = String(selectedCategory);
        if (search.trim().length >= 2) params['q'] = search.trim();

        const [prodRes, catRes] = await Promise.all([
          api.get<{ data: StorefrontProduct[] }>('/storefront/products', {
            headers: { 'X-Storefront-Subdomain': subdomain },
            params,
          }),
          api.get<{ data: { id: number; name: string }[] }>('/storefront/categories', {
            headers: { 'X-Storefront-Subdomain': subdomain },
          }),
        ]);

        setProducts(prodRes.data.data ?? (prodRes.data as any) ?? []);
        setCategories(catRes.data.data ?? (catRes.data as any) ?? []);
      } catch (err) {
        console.error('Failed to load catalog', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [subdomain, selectedCategory, search]);

  const currency = config.currency ?? 'BDT';

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-zinc-950 p-8 sm:p-14 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{config.theme?.hero_title ?? 'Factory Direct Goods'}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {config.theme?.hero_title ?? 'Freshly Baked. Made to Perfection.'}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {config.theme?.hero_subtitle ??
              'Industrial-scale craftsmanship delivered fresh to your door.'}
          </p>
        </div>

        {/* Decorative Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </section>

      {/* Catalog Search & Category Filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search catalog products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === null
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 p-12 text-center">
            <Tag className="h-10 w-10 text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-200">No products found</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            {products.map((product) => {
              const price = parseFloat(product.default_sale_price || '0').toFixed(2);
              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-all hover:border-emerald-500/40 hover:bg-zinc-900/70 hover:shadow-xl hover:shadow-emerald-500/5"
                >
                  <div className="space-y-3">
                    {/* Header: SKU & Category Tag */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500">
                      <span className="font-mono">{product.sku}</span>
                      {product.category && (
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">
                          {product.category.name}
                        </span>
                      )}
                    </div>

                    {/* Product Name & Description */}
                    <div>
                      <Link
                        to={`/store/${subdomain}/products/${product.sku}`}
                        className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description || 'Premium factory production standard.'}
                      </p>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-zinc-800/50">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                        Price
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {currency} {price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addItem(product.id, 1)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
