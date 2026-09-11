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
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import type { StorefrontConfig, StorefrontProduct } from '../../types/api/storefront';
import type { PageBlock } from '../../modules/storefront/StorefrontPageBuilderWorkspace';
import { stripHtml } from '../../lib/storefront/htmlUtils';

interface OutletContextType {
  config: StorefrontConfig;
  subdomain: string;
}

interface CmsPageResponse {
  data?: {
    slug?: string;
    title?: string;
    blocks?: PageBlock[];
  };
}

export const StorefrontHomePage: React.FC = () => {
  const { config, subdomain } = useOutletContext<OutletContextType>();
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [cmsBlocks, setCmsBlocks] = useState<PageBlock[]>([]);
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
          api.get<CmsPageResponse>('/storefront/pages/home', {
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
            (rawCms as { blocks?: PageBlock[] })?.blocks ??
            (rawCms as { data?: { blocks?: PageBlock[] } })?.data?.blocks ??
            [];
          if (blocks.length > 0) {
            setCmsBlocks(blocks);
          }
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
  const heroTitle = config?.theme?.hero_title || 'Next-Gen Infrared Cookers & Premium Stoves';
  const heroSubtitle =
    config?.theme?.hero_subtitle ||
    'High-efficiency energy saving, microcrystalline ceramic touch surfaces, and complete temperature control direct from our factory.';

  // Default fallback blocks if no custom CMS blocks are published for 'home'
  const effectiveBlocks: PageBlock[] =
    cmsBlocks.length > 0
      ? cmsBlocks
      : [
          {
            id: 'b_hero',
            type: 'hero_banner',
            badge: 'Factory Direct • Guaranteed Fresh Daily',
            title: heroTitle,
            subtitle: heroSubtitle,
            cta_text: 'Explore Fresh Catalog',
            cta_url: '#catalog',
            secondary_cta_text: 'Order via WhatsApp',
            secondary_cta_url: 'whatsapp',
          },
          {
            id: 'b_props',
            type: 'value_props',
            title: 'Why Buy Direct',
            items: [
              { icon: 'flame', title: 'Factory Direct', desc: 'Built directly in our ISO-compliant assembly plant with zero middleman markups.' },
              { icon: 'truck', title: 'Express Dispatch', desc: 'Fast, temperature-controlled delivery fleet ensuring prime condition.' },
              { icon: 'shield', title: '100% Quality Assurance', desc: 'Every batch lab-tested for purity, weight consistency, and safety.' },
              { icon: 'message', title: 'WhatsApp Concierge', desc: 'Live order tracking, bulk corporate quotes, and instant support.' },
            ],
          },
          {
            id: 'b_products',
            type: 'featured_products',
            title: 'Browse Available Products',
            subtitle: 'Select items below to add directly to your cart or order custom batch quantities.',
            limit: 12,
            show_search: true,
            show_categories: true,
          },
          {
            id: 'b_journey',
            type: 'quality_journey',
            title: `The ${config?.name ? `${config.name} ` : ''}Quality Journey`,
            subtitle: 'How we ensure every batch meets stringent safety and thermal efficiency standards.',
            steps: [
              { step: '01 / SOURCING', title: 'Components & Glass', desc: 'A-grade ceramic panels, pure copper coils, and flame-retardant chassis.' },
              { step: '02 / ASSEMBLY', title: 'Precision Assembly', desc: 'ESD-safe line with computerized torque drivers and automated PCB fitting.' },
              { step: '03 / TESTING', title: 'Hi-Pot & Burn-In', desc: '3750V dielectric insulation and 4-hour continuous thermal load testing.' },
              { step: '04 / QC CHECK', title: 'Sensor & Safety QA', desc: 'Overheat sensor calibration, touch panel responsiveness, and leak tests.' },
              { step: '05 / DISPATCH', title: 'Drop-Tested Packaging', desc: 'Custom molded EPE foam buffer and reinforced carton dispatch.' },
            ],
          },
          {
            id: 'b_promo',
            type: 'promo_split_banner',
            title: 'Precision Engineering & Thermal Innovation',
            subtitle: 'High-efficiency infrared cookers, induction surfaces, and precision gas stoves direct from our ISO-certified factory.',
            cta_text: 'Explore Catalog',
            cta_url: '#catalog',
          },
          {
            id: 'b_faq',
            type: 'faq',
            title: 'Got Questions? We’ve Got Answers.',
            faqs: [
              { q: 'How fresh are the products when delivered?', a: 'All orders are dispatched directly from our central factory production line within 24 hours of batch output.' },
              { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD), bKash, Nagad, and major credit/debit cards.' },
              { q: 'Can I order custom or bulk quantities for events/businesses?', a: 'Yes! You can contact us directly via WhatsApp or create a wholesale inquiry for volume discounts.' },
              { q: 'How do I track my delivery status?', a: 'Simply visit our "Track My Order" page and enter your order tracking number or mobile phone number.' },
            ],
          },
          {
            id: 'b_vip',
            type: 'newsletter_vip',
            title: `Join the ${config?.name ? `${config.name} ` : ''}VIP Club`,
            subtitle: 'Get instant alerts when new products launch, plus exclusive perks and promotions.',
            button_text: 'Subscribe',
          },
        ];

  // Helper to render icon for value proposition
  const renderPillarIcon = (iconName?: string) => {
    switch (iconName) {
      case 'truck':
        return <Truck className="size-5" />;
      case 'shield':
        return <ShieldCheck className="size-5" />;
      case 'message':
        return <MessageCircle className="size-5" />;
      case 'award':
        return <Award className="size-5" />;
      case 'zap':
        return <Zap className="size-5" />;
      default:
        return <Flame className="size-5" />;
    }
  };

  return (
    <div className="space-y-16 py-4">
      {effectiveBlocks.map((block, idx) => {
        // 1. HERO BANNER
        if (block.type === 'hero_banner') {
          return (
            <section
              key={block.id || idx}
              className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-950/80 via-zinc-900/90 to-zinc-950 p-8 sm:p-14 shadow-2xl text-white"
            >
              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md">
                  <Sparkles className="size-4 text-emerald-400 animate-pulse" />
                  <span className="font-mono tracking-wide uppercase text-[11px]">
                    {block.badge || 'Factory Direct • Guaranteed Fresh Daily'}
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
                  {block.title || heroTitle}
                </h1>

                <p className="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
                  {block.subtitle || heroSubtitle}
                </p>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <a
                    href={block.cta_url || block.primaryCtaLink || '#catalog'}
                    style={{
                      backgroundColor: 'var(--store-primary, #10b981)',
                      color: 'var(--store-primary-fg, #ffffff)',
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all cursor-pointer active:scale-95 hover:opacity-90"
                  >
                    <ShoppingBag className="size-4" />
                    <span>{block.cta_text || block.primaryCtaText || 'Explore Fresh Catalog'}</span>
                  </a>

                  {config?.whatsapp_ordering_enabled !== false && (
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, I would like to place an order from your direct factory catalog.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
                    >
                      <MessageCircle
                        style={{ color: 'var(--store-primary, #10b981)' }}
                        className="size-4"
                      />
                      <span>{block.secondary_cta_text || 'Order via WhatsApp'}</span>
                    </a>
                  )}
                </div>

                {/* Trust Badges Bar */}
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-zinc-800/60 text-xs text-zinc-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      style={{ color: 'var(--store-primary, #10b981)' }}
                      className="size-4 shrink-0"
                    />
                    <span>HACCP Quality Inspected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      style={{ color: 'var(--store-primary, #10b981)' }}
                      className="size-4 shrink-0"
                    />
                    <span>Cash on Delivery Supported</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      style={{ color: 'var(--store-primary, #10b981)' }}
                      className="size-4 shrink-0"
                    />
                    <span>Direct Factory Pricing</span>
                  </div>
                </div>
              </div>

              {/* Decorative Ambient Lighting */}
              <div
                style={{ backgroundColor: 'var(--store-primary-subtle, rgba(16,185,129,0.15))' }}
                className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full blur-3xl"
              />
              <div className="pointer-events-none absolute right-10 bottom-0 size-64 rounded-full bg-teal-500/10 blur-2xl" />
            </section>
          );
        }

        // 2. VALUE PROPS PILLARS
        if (block.type === 'value_props') {
          const items =
            block.items && block.items.length > 0
              ? block.items
              : [
                  { icon: 'flame', title: 'Factory Direct', desc: 'Built directly in our ISO-compliant assembly plant with zero middleman markups.' },
                  { icon: 'truck', title: 'Express Dispatch', desc: 'Fast, temperature-controlled delivery fleet ensuring prime condition.' },
                  { icon: 'shield', title: '100% Quality Assurance', desc: 'Every batch lab-tested for purity, weight consistency, and safety.' },
                  { icon: 'message', title: 'WhatsApp Concierge', desc: 'Live order tracking, bulk corporate quotes, and instant support.' },
                ];

          return (
            <section key={block.id || idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {items.map((item, pIdx) => (
                <div
                  key={pIdx}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-900/70 shadow-xs transition-all group"
                >
                  <div
                    style={{
                      backgroundColor: 'var(--store-primary-subtle, rgba(16,185,129,0.12))',
                      borderColor: 'var(--store-primary-border, rgba(16,185,129,0.25))',
                      color: 'var(--store-primary, #10b981)',
                    }}
                    className="size-11 rounded-xl border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  >
                    {renderPillarIcon(item.icon)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </section>
          );
        }

        // 3. FEATURED PRODUCTS CATALOG GRID
        if (block.type === 'featured_products') {
          return (
            <section key={block.id || idx} id="catalog" className="space-y-6 pt-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-5">
                <div>
                  <span
                    style={{
                      backgroundColor: 'var(--store-primary-subtle, rgba(16,185,129,0.1))',
                      borderColor: 'var(--store-primary-border, rgba(16,185,129,0.2))',
                      color: 'var(--store-primary, #10b981)',
                    }}
                    className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                  >
                    Live Factory Inventory
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                    {block.title || 'Browse Available Products'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                    {block.subtitle || 'Select items below to add directly to your cart or order custom batch quantities.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <Link
                    to={`/store/${subdomain}/products`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold transition-colors border border-slate-200 dark:border-zinc-700 shadow-xs"
                  >
                    <span>Full Catalog Page</span>
                    <span
                      style={{ color: 'var(--store-primary, #10b981)' }}
                    >
                      →
                    </span>
                  </Link>

                  {/* Search Input */}
                  {block.show_search !== false && (
                    <div className="relative w-full md:w-64">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search products, SKUs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none transition-colors shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Category Pills Tray */}
              {block.show_categories !== false && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    style={
                      selectedCategory === null
                        ? {
                            backgroundColor: 'var(--store-primary, #10b981)',
                            color: 'var(--store-primary-fg, #ffffff)',
                          }
                        : undefined
                    }
                    className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === null
                        ? 'font-bold shadow-md'
                        : 'border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/50 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    All Products ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={
                        selectedCategory === cat.id
                          ? {
                              backgroundColor: 'var(--store-primary, #10b981)',
                              color: 'var(--store-primary-fg, #ffffff)',
                            }
                          : undefined
                      }
                      className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'font-bold shadow-md'
                          : 'border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/50 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-80 animate-pulse rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-slate-100 dark:bg-zinc-900/40 p-4"
                    />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 p-16 text-center bg-white/50 dark:bg-transparent">
                  <Tag className="size-10 text-slate-400 dark:text-zinc-600 mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">No products match your criteria</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-sm">
                    Try adjusting your search query or selecting a different category from above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                  {products.slice(0, block.limit || 16).map((product) => {
                    const price = parseFloat(product.default_sale_price || '0').toFixed(2);
                    return (
                      <div
                        key={product.id}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 transition-all shadow-xs"
                      >
                        <div className="space-y-3.5">
                          {/* Header: SKU & Category Tag */}
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-zinc-500">
                            <span className="font-mono">{product.sku}</span>
                            {product.category && (
                              <span
                                style={{
                                  backgroundColor: 'var(--store-primary-subtle, rgba(16,185,129,0.1))',
                                  borderColor: 'var(--store-primary-border, rgba(16,185,129,0.2))',
                                  color: 'var(--store-primary, #10b981)',
                                }}
                                className="rounded-md border px-2 py-0.5 font-mono"
                              >
                                {product.category.name}
                              </span>
                            )}
                          </div>

                          {/* Product Name & Description */}
                          <div>
                            <Link
                              to={`/store/${subdomain}/products/${product.sku}`}
                              className="text-sm font-bold text-slate-900 dark:text-white transition-colors line-clamp-1 hover:opacity-80"
                            >
                              {product.name}
                            </Link>
                            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {stripHtml(product.description) || 'Certified factory direct production standard.'}
                            </p>
                          </div>

                          {/* Stock Quality Highlight */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
                            <Star className="size-3 text-amber-500 fill-amber-500" />
                            <span className="font-semibold text-slate-800 dark:text-zinc-200">5.0</span>
                            <span>• Factory Tested</span>
                          </div>
                        </div>

                        {/* Price & Action Row */}
                        <div className="mt-6 flex items-center justify-between pt-3.5 border-t border-slate-200/80 dark:border-zinc-800/60">
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider font-mono block">
                              Unit Price
                            </span>
                            <span
                              style={{ color: 'var(--store-primary, #10b981)' }}
                              className="text-base font-extrabold font-mono"
                            >
                              {currency} {price}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => addItem(product.id, 1)}
                            style={{
                              backgroundColor: 'var(--store-primary, #10b981)',
                              color: 'var(--store-primary-fg, #ffffff)',
                            }}
                            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs hover:opacity-90"
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
          );
        }

        // 4. FACTORY CRAFTSMANSHIP JOURNEY
        if (block.type === 'quality_journey') {
          const steps =
            block.steps && block.steps.length > 0
              ? block.steps
              : [
                  { step: '01 / SOURCING', title: 'Components & Glass', desc: 'A-grade ceramic panels, pure copper coils, and flame-retardant chassis.' },
                  { step: '02 / ASSEMBLY', title: 'Precision Assembly', desc: 'ESD-safe line with computerized torque drivers and automated PCB fitting.' },
                  { step: '03 / TESTING', title: 'Hi-Pot & Burn-In', desc: '3750V dielectric insulation and 4-hour continuous thermal load testing.' },
                  { step: '04 / QC CHECK', title: 'Sensor & Safety QA', desc: 'Overheat sensor calibration, touch panel responsiveness, and leak tests.' },
                  { step: '05 / DISPATCH', title: 'Drop-Tested Packaging', desc: 'Custom molded EPE foam buffer and reinforced carton dispatch.' },
                ];

          return (
            <section
              key={block.id || idx}
              className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/30 p-8 sm:p-12 space-y-8 shadow-xs"
            >
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Transparent Manufacturing
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                  {block.title || `The Quality Journey`}
                </h2>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1.5">
                  {block.subtitle || 'How we ensure every batch meets stringent safety and thermal efficiency standards.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {steps.map((st, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/50 shadow-2xs"
                  >
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{st.step}</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs mt-1">{st.title}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">{st.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 5. PROMO SPLIT BANNER
        if (block.type === 'promo_split_banner') {
          return (
            <section
              key={block.id || idx}
              className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-linear-to-r from-emerald-950/40 via-white dark:via-zinc-900/60 to-emerald-950/20 p-8 sm:p-12 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-2xl">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Featured Innovation
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {block.title || 'Precision Engineering & Thermal Innovation'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {block.subtitle || 'High-efficiency infrared cookers, induction surfaces, and precision gas stoves direct from factory.'}
                </p>
              </div>

              {block.cta_text && (
                <a
                  href={block.cta_url || '#catalog'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap cursor-pointer"
                >
                  <span>{block.cta_text}</span>
                  <span>→</span>
                </a>
              )}
            </section>
          );
        }

        // 6. INTERACTIVE FAQ ACCORDION
        if (block.type === 'faq') {
          const rawFaqs = (block.faqs && block.faqs.length > 0) ? block.faqs : (block.faqItems && block.faqItems.length > 0) ? block.faqItems : null;
          const faqs =
            rawFaqs && rawFaqs.length > 0
              ? rawFaqs
              : [
                  { q: 'How fresh are the products when delivered?', a: 'All orders are dispatched directly from our central factory production line within 24 hours of batch output.' },
                  { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD), bKash, Nagad, and major credit/debit cards.' },
                  { q: 'Can I order custom or bulk quantities for events/businesses?', a: 'Yes! You can contact us directly via WhatsApp or create a wholesale inquiry for volume discounts.' },
                  { q: 'How do I track my delivery status?', a: 'Simply visit our "Track My Order" page and enter your order tracking number or mobile phone number.' },
                ];

          return (
            <section
              key={block.id || idx}
              className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-8 sm:p-12 max-w-4xl mx-auto space-y-6 shadow-xs"
            >
              <div className="text-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Customer Support
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                  {block.title || 'Got Questions? We’ve Got Answers.'}
                </h2>
              </div>

              <div className="space-y-3 pt-2">
                {faqs.map((item: { q?: string; a?: string }, fIdx: number) => (
                  <div
                    key={fIdx}
                    className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(expandedFaq === fIdx ? null : fIdx)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-white cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`size-4 text-slate-400 dark:text-zinc-400 transition-transform ${
                          expandedFaq === fIdx ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === fIdx && (
                      <div className="px-4 pb-4 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-200/80 dark:border-zinc-800/50 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 7. VIP NEWSLETTER CLUB
        if (block.type === 'newsletter_vip') {
          return (
            <section
              key={block.id || idx}
              className="rounded-3xl border border-emerald-500/30 bg-linear-to-r from-emerald-950/90 via-zinc-900 to-emerald-950/90 p-8 sm:p-12 text-center relative overflow-hidden shadow-xl text-white"
            >
              <div className="relative z-10 max-w-xl mx-auto space-y-4">
                <Award className="size-10 text-emerald-400 mx-auto" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {block.title || `Join the ${config?.name ? `${config.name} ` : ''}VIP Club`}
                </h2>
                <p className="text-xs text-zinc-300">
                  {block.subtitle || 'Get instant alerts when new products launch, plus exclusive perks and promotions.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Enter your phone or email..."
                    className="w-full sm:w-72 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => alert(`Thank you for subscribing to ${config?.name ?? 'store'} updates!`)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    {block.button_text || 'Subscribe'}
                  </button>
                </div>
              </div>
            </section>
          );
        }

        // 8. RICH TEXT
        if (block.type === 'rich_text') {
          return (
            <section
              key={block.id || idx}
              className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-8 sm:p-10 space-y-4 shadow-xs"
            >
              {block.title && (
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {block.title}
                </h3>
              )}
              {block.subtitle && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-2xl">{block.subtitle}</p>
              )}
              {block.content && (
                <div
                  className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
            </section>
          );
        }

        // 9. SANDBOXED CUSTOM HTML/CSS
        if (block.type === 'custom_html_css') {
          return (
            <section
              key={block.id || idx}
              className="overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs"
            >
              <iframe
                title="Custom Storefront Block"
                sandbox="allow-scripts"
                srcDoc={`
                  <html>
                    <head><style>${block.css || ''}</style></head>
                    <body style="margin: 0; font-family: sans-serif;">${block.html || ''}</body>
                  </html>
                `}
                className="w-full min-h-48 border-0"
              />
            </section>
          );
        }

        return null;
      })}
    </div>
  );
};
