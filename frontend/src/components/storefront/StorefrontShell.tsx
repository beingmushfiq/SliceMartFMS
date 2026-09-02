import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { api } from '../../lib/api/client';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { StorefrontCartDrawer } from './StorefrontCartDrawer';
import { SeoHead } from '../seo/SeoHead';
import { JsonLdSchema } from '../seo/JsonLdSchema';
import type { StorefrontConfig } from '../../types/api/storefront';

export const StorefrontShell: React.FC = () => {
  const { subdomain: paramSubdomain } = useParams<{ subdomain?: string }>();
  const subdomain = paramSubdomain || 'slicemart';

  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setSubdomain, fetchCart } = useStorefrontCartStore();

  useEffect(() => {
    setSubdomain(subdomain);

    const loadConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<StorefrontConfig>('/storefront/config', {
          headers: {
            'X-Storefront-Subdomain': subdomain,
          },
        });
        setConfig(response.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Storefront could not be loaded');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
    fetchCart();
  }, [subdomain, setSubdomain, fetchCart]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Loading Storefront...
          </span>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-center">
        <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <h2 className="text-lg font-bold text-zinc-100">Storefront Unavailable</h2>
          <p className="mt-2 text-xs text-zinc-400">
            {error || 'This storefront does not exist or has been temporarily suspended.'}
          </p>
        </div>
      </div>
    );
  }

  const extendedConfig = config as StorefrontConfig & {
    seo?: {
      organization_schema?: Record<string, unknown>;
      website_schema?: Record<string, unknown>;
    };
  };
  const orgSchema = extendedConfig.seo?.organization_schema;
  const websiteSchema = extendedConfig.seo?.website_schema;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      <SeoHead
        title={config.meta_title || config.name}
        description={config.meta_description || 'Direct factory manufacturing and online commercial storefront.'}
        brandName={config.name}
      />
      {orgSchema && <JsonLdSchema id="global-org-schema" schema={orgSchema} />}
      {websiteSchema && <JsonLdSchema id="global-website-schema" schema={websiteSchema} />}

      <div>
        <StorefrontHeader config={config} subdomain={subdomain} />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Outlet context={{ config, subdomain }} />
        </main>
      </div>

      <StorefrontFooter config={config} />
      <StorefrontCartDrawer config={config} subdomain={subdomain} />
    </div>
  );
};

