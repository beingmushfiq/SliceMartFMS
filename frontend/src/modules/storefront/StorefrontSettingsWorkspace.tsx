import React, { useEffect, useState } from 'react';
import {
  Check,
  Eye,
  Layout,
  Palette,
  Save,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  ToggleLeft,
  ToggleRight,
  Truck,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import type { StorefrontConfig } from '../../types/api/storefront';

interface PublishedProductItem {
  id: number;
  sku: string;
  name: string;
  category_name?: string;
  brand_name?: string;
  default_sale_price: string;
  is_published: boolean;
  is_featured: boolean;
  price_override?: string | null;
  display_order: number;
}

export const StorefrontSettingsWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'branding' | 'products' | 'checkout'>('branding');
  const [products, setProducts] = useState<PublishedProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    currency: 'BDT',
    primary_color: '#10b981',
    accent_color: '#14b8a6',
    hero_title: '',
    hero_subtitle: '',
    meta_title: '',
    meta_description: '',
    guest_checkout_enabled: true,
    cod_enabled: true,
    online_payment_enabled: true,
    min_order_amount: '',
    status: 'live' as 'draft' | 'live' | 'maintenance' | 'suspended',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, prodRes] = await Promise.all([
        api.get<{ data: StorefrontConfig }>('/storefront/settings'),
        api.get<{ data: PublishedProductItem[] }>('/storefront/products'),
      ]);

      const conf = settingsRes.data.data ?? (settingsRes.data as any);
      setConfig(conf);
      setProducts(prodRes.data.data ?? (prodRes.data as any) ?? []);

      setForm({
        name: conf.name ?? '',
        subdomain: conf.subdomain ?? '',
        currency: conf.currency ?? 'BDT',
        primary_color: conf.theme?.primary_color ?? '#10b981',
        accent_color: conf.theme?.accent_color ?? '#14b8a6',
        hero_title: conf.theme?.hero_title ?? 'Factory Fresh Goods',
        hero_subtitle:
          conf.theme?.hero_subtitle ?? 'Industrial quality delivered straight to your door.',
        meta_title: conf.meta_title ?? '',
        meta_description: conf.meta_description ?? '',
        guest_checkout_enabled: conf.guest_checkout_enabled ?? true,
        cod_enabled: conf.cod_enabled ?? true,
        online_payment_enabled: conf.online_payment_enabled ?? true,
        min_order_amount: conf.min_order_amount ?? '',
        status: conf.status ?? 'live',
      });
    } catch (err) {
      console.error('Failed to load storefront settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/storefront/settings', {
        name: form.name,
        subdomain: form.subdomain,
        currency: form.currency,
        theme: {
          primary_color: form.primary_color,
          accent_color: form.accent_color,
          hero_title: form.hero_title,
          hero_subtitle: form.hero_subtitle,
        },
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        guest_checkout_enabled: form.guest_checkout_enabled,
        cod_enabled: form.cod_enabled,
        online_payment_enabled: form.online_payment_enabled,
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        status: form.status,
      });
      showToast('Storefront configuration saved successfully!');
    } catch (err: any) {
      alert(err.message ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProduct = async (product: PublishedProductItem) => {
    const newStatus = !product.is_published;
    try {
      await api.post('/storefront/products/toggle-publish', {
        product_id: product.id,
        is_published: newStatus,
        is_featured: product.is_featured,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_published: newStatus } : p))
      );
      showToast(
        newStatus
          ? `Published "${product.name}" to storefront.`
          : `Unpublished "${product.name}".`
      );
    } catch (err: any) {
      alert(err.message ?? 'Failed to update publication status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Links */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-100">Storefront CMS & Customizer</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              Subdomain: {form.subdomain}.devcenterpoint.com
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your branded online customer storefront, theme styling, and published products.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/store/${form.subdomain}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-emerald-500 hover:text-white transition-all shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>Open Live Storefront</span>
          </a>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'branding'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Branding & Hero Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Product Catalogue Visibility ({products.filter((p) => p.is_published).length}/{products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checkout')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'checkout'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Checkout & Payment Rules</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: Customization Form */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Layout className="h-4 w-4 text-emerald-400" />
              <span>Theme & Copy Customizer</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Storefront Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Subdomain Slug
                </label>
                <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs">
                  <input
                    type="text"
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
                    className="flex-1 bg-transparent text-zinc-100 focus:outline-none"
                  />
                  <span className="text-zinc-500">.devcenterpoint.com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="h-8 w-12 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-zinc-300">{form.primary_color}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Store Currency
                  </label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={form.hero_title}
                  onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Hero Subtitle
                </label>
                <textarea
                  rows={2}
                  value={form.hero_subtitle}
                  onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right: Live Mock Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Live Theme Preview</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                Synchronized
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs"
                    style={{ backgroundColor: form.primary_color }}
                  >
                    <Store className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-zinc-100">{form.name || 'Storefront'}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Cart (0)</span>
                </div>
              </div>

              {/* Mock Banner */}
              <div
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${form.primary_color}22, #09090b)`,
                  borderColor: `${form.primary_color}44`,
                  borderWidth: '1px',
                }}
              >
                <div className="relative z-10 space-y-2">
                  <div
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: `${form.primary_color}33`, color: form.primary_color }}
                  >
                    Factory Direct
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{form.hero_title}</h3>
                  <p className="text-xs text-zinc-300 line-clamp-2">{form.hero_subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100">Catalog Product Publication</h2>
            <span className="text-xs text-zinc-400">
              Toggle products on or off to make them available to public online shoppers.
            </span>
          </div>

          <div className="divide-y divide-zinc-800/60 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-zinc-500">{product.sku}</span>
                    <span className="text-xs font-bold text-zinc-200">{product.name}</span>
                    {product.category_name && (
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                        {product.category_name}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    {form.currency} {parseFloat(product.default_sale_price || '0').toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleToggleProduct(product)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      product.is_published
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-emerald-500 hover:text-emerald-400'
                    }`}
                  >
                    {product.is_published ? (
                      <>
                        <ToggleRight className="h-4 w-4" />
                        <span>Live on Store</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        <span>Unpublished</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Checkout Rules */}
      {activeTab === 'checkout' && (
        <div className="max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6 shadow-xl">
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Checkout Policies & Gateways</span>
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-zinc-200">Guest Checkout</div>
                <div className="text-[11px] text-zinc-500">Allow shoppers to place orders without registration</div>
              </div>
              <input
                type="checkbox"
                checked={form.guest_checkout_enabled}
                onChange={(e) => setForm({ ...form, guest_checkout_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-zinc-200">Cash on Delivery (COD)</div>
                <div className="text-[11px] text-zinc-500">Allow customers to pay cash when package is delivered</div>
              </div>
              <input
                type="checkbox"
                checked={form.cod_enabled}
                onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-zinc-200">Online Payment Gateway</div>
                <div className="text-[11px] text-zinc-500">Enable credit cards and mobile wallets (bKash / Nagad)</div>
              </div>
              <input
                type="checkbox"
                checked={form.online_payment_enabled}
                onChange={(e) => setForm({ ...form, online_payment_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Minimum Order Amount ({form.currency})
              </label>
              <input
                type="number"
                placeholder="Optional (e.g. 100)"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
