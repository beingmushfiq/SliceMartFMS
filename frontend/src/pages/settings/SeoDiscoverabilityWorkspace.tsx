import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Send,
  Sliders,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Save,
  Radio,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { SerpPreviewCard } from '../../components/seo/SerpPreviewCard';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';

interface SeoSettingsState {
  default_title_template: string;
  default_meta_description: string;
  meta_keywords: string;
  canonical_base_url: string;
  allow_ai_crawlers: boolean;
  business_type: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: string;
  longitude: string;
  telephone: string;
  email: string;
  opening_hours: string;
  robots_txt_custom: string;
  indexnow_api_key: string;
  indexnow_key_location: string;
  sitemap_ping_enabled: boolean;
  last_indexnow_ping_at: string | null;
}

interface RedirectItem {
  id: number;
  source_path: string;
  target_path: string;
  status_code: number;
  is_active: boolean;
  hits_count: number;
  last_hit_at: string | null;
}

interface NotFoundLogItem {
  id: number;
  path: string;
  ip_address: string;
  referrer: string | null;
  hits_count: number;
  resolved: boolean;
  created_at: string;
}

interface AuditCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface SeoAuditResult {
  score: number;
  checks: AuditCheck[];
}

type SeoTab = 'metadata' | 'nap' | 'redirects' | '404s' | 'indexnow' | 'audit';

export const SeoDiscoverabilityWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useWorkspaceTab<SeoTab>(
    'metadata',
    ['metadata', 'nap', 'redirects', '404s', 'indexnow', 'audit'] as const,
    'tab'
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<SeoSettingsState>({
    default_title_template: '{title} | {brand}',
    default_meta_description: 'Direct factory commercial storefront with verified quality and instant order fulfillment.',
    meta_keywords: 'factory wholesale, direct manufacturing, online shopping',
    canonical_base_url: '',
    allow_ai_crawlers: true,
    business_type: 'LocalBusiness',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    latitude: '',
    longitude: '',
    telephone: '',
    email: '',
    opening_hours: 'Mo-Sa 09:00-18:00',
    robots_txt_custom: '',
    indexnow_api_key: '',
    indexnow_key_location: '',
    sitemap_ping_enabled: true,
    last_indexnow_ping_at: null,
  });

  // Redirects and 404 Logs
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [notFoundLogs, setNotFoundLogs] = useState<NotFoundLogItem[]>([]);
  const [auditResult, setAuditResult] = useState<SeoAuditResult | null>(null);

  // New Redirect Modal/State
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newStatusCode, setNewStatusCode] = useState(301);
  const [creatingRedirect, setCreatingRedirect] = useState(false);

  // IndexNow Ping state
  const [pingUrls, setPingUrls] = useState('');
  const [pinging, setPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [settingsRes, redirectsRes, notFoundRes, auditRes] = await Promise.allSettled([
        api.get<{ data: SeoSettingsState }>('/tenant/seo/settings'),
        api.get<{ data: RedirectItem[] }>('/tenant/redirects'),
        api.get<{ data: NotFoundLogItem[] }>('/tenant/redirects/not-found-logs'),
        api.get<{ data: SeoAuditResult }>('/tenant/seo/audit'),
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data.data) {
        setSettings(settingsRes.value.data.data);
      }
      if (redirectsRes.status === 'fulfilled') {
        setRedirects(redirectsRes.value.data.data || []);
      }
      if (notFoundRes.status === 'fulfilled') {
        setNotFoundLogs(notFoundRes.value.data.data || []);
      }
      if (auditRes.status === 'fulfilled') {
        setAuditResult(auditRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load SEO data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        void fetchAllData();
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.put('/tenant/seo/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Refresh audit
      const auditRes = await api.get<{ data: SeoAuditResult }>('/tenant/seo/audit');
      setAuditResult(auditRes.data.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource || !newTarget) return;
    setCreatingRedirect(true);
    try {
      const res = await api.post<{ data: RedirectItem }>('/tenant/redirects', {
        source_path: newSource,
        target_path: newTarget,
        status_code: newStatusCode,
        is_active: true,
      });
      setRedirects([res.data.data, ...redirects]);
      setNewSource('');
      setNewTarget('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create redirect');
    } finally {
      setCreatingRedirect(false);
    }
  };

  const handleDeleteRedirect = async (id: number) => {
    if (!confirm('Are you sure you want to delete this redirect?')) return;
    try {
      await api.delete(`/tenant/redirects/${id}`);
      setRedirects(redirects.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete redirect');
    }
  };

  const handleFixNotFound = async (log: NotFoundLogItem) => {
    const target = prompt(`Enter target URL for ${log.path}:`, '/');
    if (!target) return;
    try {
      await api.post(`/tenant/redirects/resolve-not-found/${log.id}`, {
        target_path: target,
        status_code: 301,
      });
      fetchAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to resolve 404 log');
    }
  };

  const handleIndexNowPing = async () => {
    setPinging(true);
    setPingStatus(null);
    try {
      const urlList = pingUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      const res = await api.post<{ message: string; submitted_urls: string[] }>('/tenant/seo/indexnow/ping', {
        urls: urlList.length > 0 ? urlList : undefined,
      });

      setPingStatus(`Successfully submitted ${res.data.submitted_urls.length} URLs to IndexNow search engine nodes.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setPingStatus(`IndexNow ping failed: ${msg}`);
    } finally {
      setPinging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-semibold text-zinc-500">Loading Discoverability Architecture...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-r from-teal-900/40 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
              <Compass className="size-3.5" />
              <span>Multi-Engine Discoverability • SEO / GEO / AEO Platform</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              SEO, AI Search & Discoverability Engine
            </h1>
            <p className="text-xs text-zinc-300 max-w-2xl">
              Enterprise search discoverability control plane. Manage structured data, local entity graphs,
              AI crawler access, 301 redirects, and IndexNow instant publishing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {auditResult && (
              <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-3 px-4 shadow-sm">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Health Score</span>
                  <span className="text-lg font-mono font-extrabold text-emerald-400">{auditResult.score}/100</span>
                </div>
                <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Sparkles className="size-4" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {([
          { id: 'metadata', label: 'Meta & Canonical', icon: Sliders },
          { id: 'nap', label: 'Local Business & Entity (NAP)', icon: Globe },
          { id: 'redirects', label: `URL Redirects (${redirects.length})`, icon: ArrowRight },
          { id: '404s', label: `404 Error Log (${notFoundLogs.length})`, icon: AlertTriangle },
          { id: 'indexnow', label: 'IndexNow & Sitemaps', icon: Radio },
          { id: 'audit', label: 'Discoverability Audit', icon: ShieldCheck },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Meta & Canonical */}
      {activeTab === 'metadata' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <span>Global Metadata & Template Defaults</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Default Title Pattern Template
                  </label>
                  <input
                    type="text"
                    value={settings.default_title_template}
                    onChange={(e) => setSettings({ ...settings, default_title_template: e.target.value })}
                    placeholder="{title} | {brand}"
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-900 dark:text-white"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Supported tags: <code className="text-primary">{'{title}'}</code>, <code className="text-primary">{'{brand}'}</code>.
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Storefront Fallback Meta Description
                  </label>
                  <textarea
                    rows={3}
                    value={settings.default_meta_description}
                    onChange={(e) => setSettings({ ...settings, default_meta_description: e.target.value })}
                    placeholder="Describe your factory and direct catalog value proposition..."
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 text-zinc-900 dark:text-white leading-relaxed"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Optimal length is between 120 and 160 characters. Current: {settings.default_meta_description?.length || 0} chars.
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Canonical Domain Override (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings.canonical_base_url}
                    onChange={(e) => setSettings({ ...settings, canonical_base_url: e.target.value })}
                    placeholder="https://yourcustomdomain.com"
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-900 dark:text-white"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    If configured with a custom domain, leave blank to auto-detect verified primary domain.
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                      AI Search Engines & Crawler Indexing
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      Allow GPTBot, PerplexityBot, ClaudeBot and CCBot to discover and cite your product specifications.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_ai_crawlers}
                    onChange={(e) => setSettings({ ...settings, allow_ai_crawlers: e.target.checked })}
                    className="size-5 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                >
                  <Save className="size-4" />
                  <span>{saving ? 'Saving...' : 'Save Meta Configuration'}</span>
                </button>
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    <span>Settings Saved Successfully</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="space-y-4">
              <SerpPreviewCard
                title={settings.default_title_template.replace('{title}', 'Homepage Direct Factory').replace('{brand}', 'Slice Mart')}
                description={settings.default_meta_description}
                urlPath="/"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: NAP & Entity */}
      {activeTab === 'nap' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <span>Local Business (NAP) & Physical Facility Entity Data</span>
            </h3>
            <p className="text-xs text-zinc-500">
              This entity schema grounds search engines and AI agents with precise corporate and factory location facts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Schema Business Type
                </label>
                <select
                  value={settings.business_type}
                  onChange={(e) => setSettings({ ...settings, business_type: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                >
                  <option value="LocalBusiness">LocalBusiness (General)</option>
                  <option value="WholesaleStore">WholesaleStore</option>
                  <option value="Store">Store</option>
                  <option value="Organization">Organization</option>
                  <option value="Manufacturer">Manufacturer</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={settings.street_address}
                  onChange={(e) => setSettings({ ...settings, street_address: e.target.value })}
                  placeholder="Plot 42, Industrial Zone"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">City / Division</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  placeholder="Dhaka"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">State / Region</label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  placeholder="Dhaka"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Postal Code</label>
                <input
                  type="text"
                  value={settings.postal_code}
                  onChange={(e) => setSettings({ ...settings, postal_code: e.target.value })}
                  placeholder="1212"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Country Code</label>
                <input
                  type="text"
                  value={settings.country}
                  onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                  placeholder="BD"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Official Telephone</label>
                <input
                  type="text"
                  value={settings.telephone}
                  onChange={(e) => setSettings({ ...settings, telephone: e.target.value })}
                  placeholder="+8801700000000"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="support@slicemart.tech"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Opening Hours (ISO format)</label>
                <input
                  type="text"
                  value={settings.opening_hours}
                  onChange={(e) => setSettings({ ...settings, opening_hours: e.target.value })}
                  placeholder="Mo-Sa 09:00-18:00"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
              >
                <Save className="size-4" />
                <span>{saving ? 'Saving...' : 'Save Entity Information'}</span>
              </button>
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  <span>Entity Data Updated</span>
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: URL Redirects */}
      {activeTab === 'redirects' && (
        <div className="space-y-6">
          {/* Create Redirect Card */}
          <form
            onSubmit={handleCreateRedirect}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Plus className="size-4 text-primary" />
              <span>Add Permanent (301) / Temporary (302) URL Redirect</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-4">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Source Path (Old URL)</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="/old-product-slug"
                  required
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-zinc-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Target Path (New URL)</label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="/products/new-canonical-slug"
                  required
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-zinc-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Status Code</label>
                <select
                  value={newStatusCode}
                  onChange={(e) => setNewStatusCode(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-white font-mono"
                >
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex flex-col justify-end">
                <button
                  type="submit"
                  disabled={creatingRedirect}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>{creatingRedirect ? 'Saving...' : 'Add'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Existing Redirects Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Configured URL Redirects ({redirects.length})
              </h3>
            </div>

            {redirects.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No custom URL redirects created yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500">
                    <tr>
                      <th className="py-3 px-4">Source Path</th>
                      <th className="py-3 px-4">Target Path</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Hits Count</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {redirects.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-200">
                          {r.source_path}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                          {r.target_path}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {r.status_code}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{r.hits_count}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteRedirect(r.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete redirect"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: 404 Logs */}
      {activeTab === '404s' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Unresolved 404 Page Not Found Logs ({notFoundLogs.length})
              </h3>
              <p className="text-[11px] text-zinc-500">
                Instantly convert broken links into 301 redirects to preserve link equity and crawler trust.
              </p>
            </div>
          </div>

          {notFoundLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No recent 404 not found errors logged. Storefront links are healthy!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500">
                  <tr>
                    <th className="py-3 px-4">Missing Path</th>
                    <th className="py-3 px-4">Hits Count</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Auto-Fix Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {notFoundLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-500">{log.path}</td>
                      <td className="py-3 px-4 font-mono text-zinc-500">{log.hits_count}</td>
                      <td className="py-3 px-4">
                        {log.resolved ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                            Resolved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                            Broken Link
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!log.resolved && (
                          <button
                            type="button"
                            onClick={() => handleFixNotFound(log)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer"
                          >
                            <ArrowRight className="size-3" />
                            <span>Create 301 Redirect</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: IndexNow & Sitemaps */}
      {activeTab === 'indexnow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IndexNow Ping */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Radio className="size-4 text-primary" />
              <span>IndexNow Instant Search Engine Publishing</span>
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Instantly notify Microsoft Bing, Yandex, Seznam, and participating AI search engines whenever you add new products or update catalog content.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Specific URLs to Broadcast (One per line, optional)
                </label>
                <textarea
                  rows={4}
                  value={pingUrls}
                  onChange={(e) => setPingUrls(e.target.value)}
                  placeholder="https://slicemart.tech/products/new-item-123&#10;https://slicemart.tech/products/new-item-456"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 font-mono text-zinc-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleIndexNowPing}
                disabled={pinging}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>{pinging ? 'Broadcasting to IndexNow...' : 'Broadcast to IndexNow Network'}</span>
              </button>

              {pingStatus && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {pingStatus}
                </div>
              )}
            </div>
          </div>

          {/* Sitemaps Direct Links */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileCode className="size-4 text-primary" />
              <span>Automated XML Sitemaps</span>
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Standard XML sitemaps partitioned for optimal crawl performance with Google Search Console and Bing Webmaster Tools.
            </p>

            <div className="space-y-2.5 text-xs">
              {[
                { title: 'Master Sitemap Index', path: '/sitemap.xml', desc: 'Auto-aggregates all category and product sub-sitemaps' },
                { title: 'Products Sitemap', path: '/sitemap-products.xml', desc: 'Complete catalog of active online SKUs with images' },
                { title: 'Categories Sitemap', path: '/sitemap-categories.xml', desc: 'All public collections and departments' },
                { title: 'CMS Pages Sitemap', path: '/sitemap-pages.xml', desc: 'Custom storefront and legal pages' },
                { title: 'Robots.txt Directive', path: '/robots.txt', desc: 'Dynamic crawler whitelist & sitemap link' },
              ].map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-white block">{s.title}</span>
                    <span className="text-[11px] font-mono text-zinc-400">{s.path}</span>
                  </div>
                  <a
                    href={s.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>View XML</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Audit */}
      {activeTab === 'audit' && auditResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span>Live Discoverability Audit Report</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    Health Score: {auditResult.score}/100
                  </span>
                </div>

                <div className="space-y-3">
                  {auditResult.checks?.map((check: AuditCheck, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3 text-xs"
                    >
                      {check.passed ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white block">{check.name}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{check.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                  Discoverability Best Practices
                </h4>
                <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                  <li>Configure NAP street address and telephone to trigger rich local map packs.</li>
                  <li>Ensure all product images include descriptive alt attributes.</li>
                  <li>Keep title lengths under 60 characters to prevent SERP truncation.</li>
                  <li>Broadcast new products to IndexNow immediately upon publishing.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
