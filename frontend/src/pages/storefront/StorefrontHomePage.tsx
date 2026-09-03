import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Plus,
  Search,
  Sparkles,
  Tag,
  Truck,
  ShieldCheck,
  Award,
  MessageCircle,
  CheckCircle2,
  Star,
  Flame,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import type { StorefrontConfig, StorefrontProduct } from '../../types/api/storefront';

interface OutletContextType {
  config: StorefrontConfig;
  subdomain: string;
}

interface CmsBlock {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  faqs?: { q: string; a: string }[];
  cta_text?: string;
  cta_url?: string;
}

interface CmsPageResponse {
  data?: {
    blocks?: CmsBlock[];
  };
}

export const StorefrontHomePage: React.FC = () => {
  const { config, subdomain } = useOutletContext<OutletContextType>();
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [cmsBlocks, setCmsBlocks] = useState<CmsBlock[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { addItem } = useStorefrontCartStore();

  useEffect(() => {
    const fetchCatalogAndCms = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCategory) params['category_id'] = String(selectedCategory);
        if (search.trim().length >= 2) params['q'] = search.trim();

        const [prodRes, catRes, cmsRes] = await Promise.allSettled([
          api.get<{ data: StorefrontProduct[] }>('/storefront/products', {
            headers: { 'X-Storefront-Subdomain': subdomain },
            params,
          }),
          api.get<{ data: { id: number; name: string }[] }>('/storefront/categories', {
            headers: { 'X-Storefront-Subdomain': subdomain },
          }),
          api.get<CmsPageResponse>('/storefront/pages/about-us', {
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
          const catList = Array.isArray(rawCats)
            ? (rawCats as { id: number; name: string }[])
            : (((rawCats as Record<string, unknown>)?.data as { id: number; name: string }[]) ?? []);
          setCategories(catList);
        }
        if (cmsRes.status === 'fulfilled') {
          const rawCms = cmsRes.value.data as unknown;
          const blocks =
            (rawCms as { blocks?: CmsBlock[] })?.blocks ??
            (rawCms as { data?: { blocks?: CmsBlock[] } })?.data?.blocks ??
            [];
          setCmsBlocks(blocks);
        }
      } catch (err) {
        console.error('Failed to load storefront catalog', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogAndCms();
  }, [subdomain, selectedCategory, search]);

  const currency = config?.currency ?? 'BDT';
  const whatsappNumber = config?.whatsapp_number?.replace(/[^0-9]/g, '') || '8801700000000';
  const heroTitle = config?.theme?.hero_title || 'Freshly Baked. Direct From Our Factory Line.';
  const heroSubtitle =
    config?.theme?.hero_subtitle ||
    'Premium industrial-scale craftsmanship, authentic food-grade ingredients, and direct-to-door delivery.';

  return (
    <div className="space-y-16 py-4">
      {/* 1. Wholesome Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-950/60 via-zinc-900/90 to-zinc-950 p-8 sm:p-14 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md">
            <Sparkles className="size-4 text-emerald-400 animate-pulse" />
            <span className="font-mono tracking-wide uppercase text-[11px]">Factory Direct • Guaranteed Fresh Daily</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
            {heroTitle}
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
            {heroSubtitle}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <ShoppingBag className="size-4" />
              <span>Explore Fresh Catalog</span>
            </a>

            {config?.whatsapp_ordering_enabled !== false && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, I would like to order fresh factory products.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
              >
                <MessageCircle className="size-4 text-emerald-400" />
                <span>Order via WhatsApp</span>
              </a>
            )}
          </div>

          {/* Trust Badges Bar */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-zinc-800/60 text-xs text-zinc-300 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>HACCP Quality Inspected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Cash on Delivery Supported</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Direct Factory Pricing</span>
            </div>
          </div>
        </div>

        {/* Decorative Radial Ambient Lighting */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-10 bottom-0 size-64 rounded-full bg-teal-500/10 blur-2xl" />
      </section>

      {/* 2. Value Proposition Pillars */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all group">
          <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Flame className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Direct from Oven</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Zero warehouse shelf aging. Goods packaged right off the baking line.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all group">
          <div className="size-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
            <Truck className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Express Dispatch</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Fast, temperature-controlled delivery fleet ensuring prime condition.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all group">
          <div className="size-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">100% Quality Assurance</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every batch lab-tested for purity, weight consistency, and taste.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all group">
          <div className="size-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
            <MessageCircle className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">WhatsApp Concierge</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Live order tracking, bulk corporate quotes, and instant support.
          </p>
        </div>
      </section>

      {/* 3. Catalog Search & Category Filter Section */}
      <section id="catalog" className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Live Factory Inventory
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
              Browse Available Products
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select items below to add directly to your cart or order custom batch quantities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link
              to={`/store/${subdomain}/products`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700"
            >
              <span>Full Catalog Page</span>
              <span className="text-emerald-400">→</span>
            </Link>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search products, SKUs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none transition-colors shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Category Pills Tray */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === null
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                : 'border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 p-16 text-center">
            <Tag className="size-10 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-zinc-200">No products match your criteria</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Try adjusting your search query or selecting a different category from above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            {products.map((product) => {
              const price = parseFloat(product.default_sale_price || '0').toFixed(2);
              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-all hover:border-emerald-500/40 hover:bg-zinc-900/80 hover:shadow-xl hover:shadow-emerald-500/5"
                >
                  <div className="space-y-3.5">
                    {/* Header: SKU & Category Tag */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500">
                      <span className="font-mono">{product.sku}</span>
                      {product.category && (
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-emerald-400 font-mono">
                          {product.category.name}
                        </span>
                      )}
                    </div>

                    {/* Product Name & Description */}
                    <div>
                      <Link
                        to={`/store/${subdomain}/products/${product.sku}`}
                        className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description || 'Certified factory direct production standard.'}
                      </p>
                    </div>

                    {/* Stock Quality Highlight */}
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Star className="size-3 text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-zinc-200">5.0</span>
                      <span>• Factory Tested</span>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="mt-6 flex items-center justify-between pt-3.5 border-t border-zinc-800/60">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">
                        Unit Price
                      </span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">
                        {currency} {price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addItem(product.id, 1)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                    >
                      <Plus className="size-3.5 stroke-[2.5]" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Factory Craftsmanship Journey (5 Stages) */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Transparent Manufacturing
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            The {config?.name ?? 'SliceMart'} Quality Journey
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5">
            How we ensure every batch meets stringent commercial food and product standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
            <span className="font-mono text-xs font-bold text-emerald-400">01 / SOURCING</span>
            <h4 className="font-bold text-white text-xs mt-1">Raw Ingredients</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Premium flour, dairy, and natural yeast inspected at gate.</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
            <span className="font-mono text-xs font-bold text-emerald-400">02 / RECIPE</span>
            <h4 className="font-bold text-white text-xs mt-1">Automated BOM Mix</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Precision computer-controlled dough formulation.</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
            <span className="font-mono text-xs font-bold text-emerald-400">03 / BAKING</span>
            <h4 className="font-bold text-white text-xs mt-1">Industrial Ovens</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Temperature-monitored continuous conveyor baking.</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
            <span className="font-mono text-xs font-bold text-emerald-400">04 / QC CHECK</span>
            <h4 className="font-bold text-white text-xs mt-1">Microbiological QA</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Multi-point defect and weight tolerance verification.</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
            <span className="font-mono text-xs font-bold text-emerald-400">05 / DISPATCH</span>
            <h4 className="font-bold text-white text-xs mt-1">Same-Day Direct</h4>
            <p className="text-[11px] text-zinc-400 mt-1">Packaged sterilely and handed directly to delivery fleet.</p>
          </div>
        </div>
      </section>

      {/* 5. Custom Tenant CMS Content Blocks (if configured in Page Builder) */}
      {cmsBlocks.length > 0 && (
        <section className="space-y-6">
          {cmsBlocks.map((block) => (
            <div
              key={block.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-10 space-y-4"
            >
              {block.title && (
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {block.title}
                </h3>
              )}
              {block.subtitle && (
                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">{block.subtitle}</p>
              )}
              {block.content && (
                <div
                  className="text-xs text-zinc-400 leading-relaxed prose prose-invert"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
              {block.cta_text && block.cta_url && (
                <a
                  href={block.cta_url}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-xs"
                >
                  {block.cta_text}
                </a>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 6. Interactive FAQ Accordion */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-12 max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-2">
            Got Questions? We’ve Got Answers.
          </h2>
        </div>

        <div className="space-y-3 pt-2">
          {[
            {
              q: 'How fresh are the products when delivered?',
              a: 'All orders are dispatched directly from our central factory production line within 24 hours of batch output.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept Cash on Delivery (COD), bKash, Nagad, and major credit/debit cards.',
            },
            {
              q: 'Can I order custom or bulk quantities for events/businesses?',
              a: 'Yes! You can contact us directly via WhatsApp or create a wholesale inquiry for volume discounts.',
            },
            {
              q: 'How do I track my delivery status?',
              a: 'Simply visit our "Track My Order" page and enter your order tracking number or mobile phone number.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-zinc-200 hover:text-white cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`size-4 text-zinc-400 transition-transform ${
                    expandedFaq === idx ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>
              {expandedFaq === idx && (
                <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. VIP Club / WhatsApp VIP Call-To-Action */}
      <section className="rounded-3xl border border-emerald-500/30 bg-linear-to-r from-emerald-950/80 via-zinc-900 to-emerald-950/80 p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <Award className="size-10 text-emerald-400 mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Join the {config?.name ?? 'SliceMart'} VIP Club
          </h2>
          <p className="text-xs text-zinc-300">
            Get instant alerts when daily fresh batches come out of the oven, plus exclusive 10% discount codes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Enter your phone or email..."
              className="w-full sm:w-72 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => alert('Thank you for subscribing to our VIP Fresh Batch updates!')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
