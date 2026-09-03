import React, { useEffect, useState } from 'react';
import {
  Check,
  Eye,
  Globe,
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
import { DomainSettingsTab } from './DomainSettingsTab';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { useCurrency } from '../../hooks/useCurrency';

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

type StorefrontSettingTab = 'branding' | 'products' | 'checkout' | 'domains';

export const StorefrontSettingsWorkspace: React.FC = () => {
  const { currencyCode } = useCurrency();
  const [activeTab, setActiveTab] = useWorkspaceTab<StorefrontSettingTab>(
    'branding',
    ['branding', 'products', 'checkout', 'domains'] as const
  );
  const [products, setProducts] = useState<PublishedProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    currency: currencyCode,
    primary_color: '#10b981',
    accent_color: '#14b8a6',
    hero_title: '',
    hero_subtitle: '',
    meta_title: '',
    meta_description: '',
    guest_checkout_enabled: true,
    cod_enabled: true,
    online_payment_enabled: true,
    whatsapp_number: '+8801700000000',
    whatsapp_ordering_enabled: true,
    min_order_amount: '',
    status: 'live' as 'draft' | 'live' | 'maintenance' | 'suspended',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get<{ data: StorefrontConfig }>('/storefront/settings'),
      api.get<{ data: PublishedProductItem[] }>('/storefront/products'),
    ])
      .then(([settingsRes, prodRes]) => {
        if (!ignore) {
          const settingsPayload = settingsRes.data as unknown as Record<string, unknown>;
          const conf = (settingsPayload.data ?? settingsPayload) as StorefrontConfig;

          const prodPayload = prodRes.data as unknown;
          const prodList = Array.isArray(prodPayload)
            ? (prodPayload as PublishedProductItem[])
            : (((prodPayload as Record<string, unknown>)?.data as PublishedProductItem[]) ?? []);
          setProducts(prodList);

          setForm({
            name: conf.name ?? '',
            subdomain: conf.subdomain ?? '',
            currency: conf.currency ?? currencyCode,
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
            whatsapp_number: conf.whatsapp_number ?? '+8801700000000',
            whatsapp_ordering_enabled: conf.whatsapp_ordering_enabled ?? true,
            min_order_amount: conf.min_order_amount ?? '',
            status: conf.status ?? 'live',
          });
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load storefront settings', err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
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
        whatsapp_number: form.whatsapp_number,
        whatsapp_ordering_enabled: form.whatsapp_ordering_enabled,
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        status: form.status,
      });
      showToast('Storefront configuration saved successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      alert(msg);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update publication status';
      alert(msg);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-default">Storefront CMS & Customizer</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Subdomain: {form.subdomain}.devcenterpoint.com
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Manage your branded online customer storefront, theme styling, and published products.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/storefront/builder"
            className="inline-flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3.5 py-2 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs"
          >
            <Layout className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Page & Block Builder</span>
          </a>

          <a
            href={`/store/${form.subdomain}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3.5 py-2 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Open Live Storefront</span>
          </a>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-default">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'branding'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted hover:text-default'
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
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted hover:text-default'
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
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted hover:text-default'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Checkout & Payment Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('domains')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'domains'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted hover:text-default'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Custom Domains & DNS</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: Customization Form */}
          <div className="rounded-2xl border border-default bg-surface p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-default flex items-center gap-2">
              <Layout className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Theme & Copy Customizer</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                  Storefront Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                  Subdomain Slug
                </label>
                <div className="flex items-center rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs">
                  <input
                    type="text"
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
                    className="flex-1 bg-transparent text-default focus:outline-none"
                  />
                  <span className="text-muted">.devcenterpoint.com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="h-8 w-12 rounded-lg border border-default bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-default">{form.primary_color}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                    Store Currency
                  </label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={form.hero_title}
                  onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                  Hero Subtitle
                </label>
                <textarea
                  rows={2}
                  value={form.hero_subtitle}
                  onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right: Live Mock Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>Live Theme Preview</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Synchronized
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-default bg-surface-sunken p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-default pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs"
                    style={{ backgroundColor: form.primary_color }}
                  >
                    <Store className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-default">{form.name || 'Storefront'}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Cart (0)</span>
                </div>
              </div>

              {/* Mock Banner */}
              <div
                className="rounded-2xl p-6 relative overflow-hidden bg-surface border border-default shadow-xs"
                style={{
                  borderLeftColor: form.primary_color,
                  borderLeftWidth: '4px',
                }}
              >
                <div className="relative z-10 space-y-2">
                  <div
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: `${form.primary_color}22`, color: form.primary_color }}
                  >
                    Factory Direct
                  </div>
                  <h3 className="text-lg font-bold text-default leading-tight">{form.hero_title}</h3>
                  <p className="text-xs text-muted line-clamp-2">{form.hero_subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <div className="rounded-2xl border border-default bg-surface p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-default">Catalog Product Publication</h2>
            <span className="text-xs text-muted">
              Toggle products on or off to make them available to public online shoppers.
            </span>
          </div>

          <div className="divide-y divide-default overflow-hidden rounded-xl border border-default bg-surface">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 hover:bg-surface-sunken/60 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted">{product.sku}</span>
                    <span className="text-xs font-bold text-default">{product.name}</span>
                    {product.category_name && (
                      <span className="rounded-md bg-surface-sunken border border-default px-2 py-0.5 text-[10px] text-muted">
                        {product.category_name}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    {form.currency} {parseFloat(product.default_sale_price || '0').toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleToggleProduct(product)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      product.is_published
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600'
                        : 'bg-surface-sunken border border-default text-muted hover:border-emerald-500 hover:text-emerald-600'
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
        <div className="max-w-2xl rounded-2xl border border-default bg-surface p-6 space-y-6 shadow-xs">
          <h2 className="text-sm font-bold text-default flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Checkout Policies & Gateways</span>
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-default bg-surface-sunken p-4 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-default">Guest Checkout</div>
                <div className="text-[11px] text-muted">Allow shoppers to place orders without registration</div>
              </div>
              <input
                type="checkbox"
                checked={form.guest_checkout_enabled}
                onChange={(e) => setForm({ ...form, guest_checkout_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-default text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-default bg-surface-sunken p-4 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-default">Cash on Delivery (COD)</div>
                <div className="text-[11px] text-muted">Allow customers to pay cash when package is delivered</div>
              </div>
              <input
                type="checkbox"
                checked={form.cod_enabled}
                onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-default text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-default bg-surface-sunken p-4 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-default">Online Payment Gateway</div>
                <div className="text-[11px] text-muted">Enable credit cards and mobile wallets (bKash / Nagad)</div>
              </div>
              <input
                type="checkbox"
                checked={form.online_payment_enabled}
                onChange={(e) => setForm({ ...form, online_payment_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-default text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-default bg-surface-sunken p-4 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-default">WhatsApp Instant Ordering</div>
                <div className="text-[11px] text-muted">Show 1-tap "Order via WhatsApp" button with cart snapshot on storefront</div>
              </div>
              <input
                type="checkbox"
                checked={form.whatsapp_ordering_enabled}
                onChange={(e) => setForm({ ...form, whatsapp_ordering_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-default text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                WhatsApp Business Phone Number
              </label>
              <input
                type="tel"
                placeholder="+8801700000000"
                value={form.whatsapp_number}
                onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Minimum Order Amount ({form.currency})
              </label>
              <input
                type="number"
                placeholder="Optional (e.g. 100)"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="pt-2">
          <DomainSettingsTab />
        </div>
      )}
    </div>
  );
};
