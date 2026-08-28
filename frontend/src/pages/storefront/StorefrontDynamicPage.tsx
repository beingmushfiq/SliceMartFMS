import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api/client';
import type { StorefrontConfig } from '../../types/api/storefront';
import type { PageBlock } from '../../modules/storefront/StorefrontPageBuilderWorkspace';

interface OutletContextType {
  config: StorefrontConfig;
  subdomain: string;
}

interface PublicCmsPageData {
  title: string;
  slug: string;
  page_type: string;
  meta_title: string;
  meta_description?: string;
  blocks: PageBlock[];
  published_at: string;
}

export const StorefrontDynamicPage: React.FC = () => {
  const { subdomain } = useOutletContext<OutletContextType>();
  const { slug } = useParams<{ slug: string }>();

  const [page, setPage] = useState<PublicCmsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ data: PublicCmsPageData }>(`/storefront/pages/${slug}`, {
          headers: {
            'X-Storefront-Subdomain': subdomain,
          },
        });
        setPage(response.data.data ?? (response.data as any));
      } catch (err: any) {
        setError(err.message ?? 'Page not found or is no longer published.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, subdomain]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Page Not Found</h2>
        <p className="text-xs text-zinc-400">{error || 'This page could not be located.'}</p>
        <Link
          to={`/store/${subdomain}`}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Store Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Back Link */}
      <Link
        to={`/store/${subdomain}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Store</span>
      </Link>

      {/* Page Header */}
      <div className="space-y-2 border-b border-zinc-800/80 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{page.title}</h1>
        {page.meta_description && (
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{page.meta_description}</p>
        )}
      </div>

      {/* Dynamic Blocks Stack */}
      <div className="space-y-8">
        {(page.blocks || []).map((block, idx) => (
          <div key={block.id || idx} className="space-y-4">
            {/* Hero Block */}
            {block.type === 'hero_banner' && (
              <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 p-8 sm:p-12 text-center space-y-4 shadow-2xl">
                <h2 className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
                  {block.title}
                </h2>
                {block.subtitle && (
                  <p className="text-xs text-zinc-300 max-w-xl mx-auto leading-relaxed">
                    {block.subtitle}
                  </p>
                )}
                {block.cta_text && (
                  <Link
                    to={block.cta_url || `/store/${subdomain}`}
                    className="inline-block rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {block.cta_text}
                  </Link>
                )}
              </div>
            )}

            {/* Rich Text Block */}
            {block.type === 'rich_text' && (
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 space-y-3 shadow-xl">
                {block.title && (
                  <h3 className="text-base font-bold text-zinc-100">{block.title}</h3>
                )}
                <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {block.content}
                </div>
              </div>
            )}

            {/* Sandboxed Custom HTML/CSS Block */}
            {block.type === 'custom_html_css' && (
              <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950 shadow-xl">
                <iframe
                  title="Tenant Custom Section"
                  sandbox="allow-scripts"
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <style>
                          body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; background: transparent; }
                          ${block.css || ''}
                        </style>
                      </head>
                      <body>
                        ${block.html || ''}
                      </body>
                    </html>
                  `}
                  className="w-full min-h-[140px] border-0"
                />
              </div>
            )}

            {/* FAQ Accordion Block */}
            {block.type === 'faq' && (
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-zinc-100">
                  {block.title || 'Frequently Asked Questions'}
                </h3>
                <div className="divide-y divide-zinc-800/60">
                  {(block.faqs || []).map((faq, fIdx) => (
                    <div key={fIdx} className="py-3.5 space-y-1">
                      <h4 className="text-xs font-bold text-zinc-200">{faq.q}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
