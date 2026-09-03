import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Factory,
  ShieldCheck,
  Award,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Lock,
  FileText,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { SeoHead } from '../../components/seo/SeoHead';
import { BreadcrumbNav } from '../../components/seo/BreadcrumbNav';
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
  const { config, subdomain } = useOutletContext<OutletContextType>();
  const { slug } = useParams<{ slug: string }>();

  const [page, setPage] = useState<PublicCmsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await api.get<{ data: PublicCmsPageData }>(`/storefront/pages/${slug}`, {
          headers: {
            'X-Storefront-Subdomain': subdomain,
          },
        });
        setPage(response.data.data ?? (response.data as unknown as PublicCmsPageData));
      } catch {
        // If not found in backend DB, keep null to trigger default rich fallback templates below
        setPage(null);
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

  // 1. Custom CMS Page from Backend Database
  if (page && page.blocks && page.blocks.length > 0) {
    const breadcrumbs = [
      { name: 'Home', url: `/store/${subdomain}` },
      { name: page.title, url: `/store/${subdomain}/pages/${page.slug}` },
    ];

    return (
      <div className="max-w-4xl mx-auto space-y-8 py-4">
        <SeoHead
          title={page.meta_title || page.title}
          description={page.meta_description || config.meta_description || ''}
          brandName={config.name}
        />

        <BreadcrumbNav items={breadcrumbs} className="py-1" />

        <div className="space-y-2 border-b border-zinc-800/80 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{page.title}</h1>
          {page.meta_description && (
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{page.meta_description}</p>
          )}
        </div>

        <div className="space-y-8">
          {(page.blocks || []).map((block, idx) => (
            <div key={block.id || idx} className="space-y-4">
              {block.type === 'hero_banner' && (
                <div className="rounded-3xl border border-emerald-500/30 bg-linear-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 p-8 sm:p-12 text-center space-y-4 shadow-2xl">
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
                      to={block.cta_url || `/store/${subdomain}/products`}
                      className="inline-block rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {block.cta_text}
                    </Link>
                  )}
                </div>
              )}

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
  }

  // 2. Rich Fallback Template for: "about-us" / "about"
  if (slug === 'about-us' || slug === 'about') {
    const breadcrumbs = [
      { name: 'Home', url: `/store/${subdomain}` },
      { name: 'About Our Factory', url: `/store/${subdomain}/pages/about-us` },
    ];

    return (
      <div className="max-w-4xl mx-auto space-y-10 py-4">
        <SeoHead
          title="About Our Factory & Manufacturing Standards"
          description={`Learn about ${config?.name || 'SliceMart'} manufacturing facility, certified quality controls, automated production batching, and direct wholesale pricing.`}
          brandName={config?.name ?? 'Slice Mart'}
        />

        <BreadcrumbNav items={breadcrumbs} className="py-1" />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 p-8 sm:p-12 shadow-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="size-3.5" />
            <span>Industrial Heritage & Craftsmanship</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Direct from Our Factory Floor to Your Doorstep
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            {config?.name || 'SliceMart'} is an integrated manufacturing facility engineered to produce 
            premium-grade goods with absolute traceability, automated quality control, and zero middleman inflation.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3 shadow-lg">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Factory className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Automated Batching</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Industrial precision weighing and automated production runs ensure consistency across every single unit.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3 shadow-lg">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Strict QC Audits</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every batch undergoes sensory, dimensional, and packaging defect inspection before receiving dispatch clearance.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3 shadow-lg">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Direct Value Pricing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              By removing distribution tiers, retail brokerages, and shelf margins, you receive wholesale factory rates directly.
            </p>
          </div>
        </div>

        {/* Manufacturing Standards */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-6">
          <h2 className="text-xl font-bold text-white">Our Quality & Manufacturing Commitment</h2>
          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <p>
              Founded with the vision to modernize consumer goods manufacturing, our facility combines automated material feeding with 
              skilled artisan craftsmanship. We maintain strict compliance with hygienic handling, safe labor practices, 
              and environmental waste recycling.
            </p>
            <p>
              When you purchase directly from our online storefront, your order is routed directly to our fulfillment line, 
              inspected, safely packaged, and assigned to licensed 3PL courier logistics within hours.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-200">100% Genuine Direct Production</span>
            </div>
            <Link
              to={`/store/${subdomain}/products`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
            >
              <span>Explore Products</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Rich Fallback Template for: "faq" / "help"
  if (slug === 'faq' || slug === 'help') {
    const FAQS = [
      {
        q: 'How do I place an order directly with the factory?',
        a: 'You can browse our product catalog, add items to your shopping cart, and complete checkout using Cash on Delivery (COD) or online payment. You can also click the "Order via WhatsApp" button on any product page for instant concierge assistance.',
      },
      {
        q: 'What are your delivery timelines and courier charges?',
        a: 'Orders placed before 2:00 PM are dispatched on the same business day. Delivery typically arrives in 24–48 hours for metro areas and 2–4 business days nationwide via trusted 3PL couriers (Steadfast, Pathao, or REDX) with rates calculated at checkout.',
      },
      {
        q: 'Can I track my shipment in real time?',
        a: 'Yes. Once your order is confirmed, you will receive an SMS and email with your Order Reference Number (e.g. SO-ONL-2026...). You can enter this number on our "Track My Order" page anytime to view live production and dispatch status.',
      },
      {
        q: 'What is your return and replacement policy?',
        a: 'We offer a 7-day hassle-free replacement warranty for any defective, damaged, or incorrect items. Simply notify our customer support team or message us on WhatsApp with a photo of the parcel.',
      },
      {
        q: 'Do you offer bulk wholesale or custom manufacturing batches?',
        a: 'Yes. We cater to institutional distributors, retail chains, and corporate gifting. Please reach out via WhatsApp or email to connect with our B2B commercial sales desk.',
      },
    ];

    const breadcrumbs = [
      { name: 'Home', url: `/store/${subdomain}` },
      { name: 'Frequently Asked Questions', url: `/store/${subdomain}/pages/faq` },
    ];

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    };

    return (
      <div className="max-w-3xl mx-auto space-y-8 py-4">
        <SeoHead
          title="Frequently Asked Questions & Customer Support"
          description="Find answers to common questions about ordering direct from the factory, courier delivery charges, WhatsApp orders, and warranty replacements."
          brandName={config?.name ?? 'Slice Mart'}
          schema={faqSchema}
        />

        <BreadcrumbNav items={breadcrumbs} className="py-1" />

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <HelpCircle className="size-3.5" />
            <span>Customer Support & FAQs</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Everything you need to know about factory direct ordering, delivery, and payment options.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 space-y-3 shadow-xl">
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-zinc-100 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`size-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Us Box */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-6 text-center space-y-3">
          <h3 className="text-sm font-bold text-white">Still have questions?</h3>
          <p className="text-xs text-zinc-400">Our customer support team is on standby to assist you with your orders.</p>
          <div className="pt-2">
            <a
              href={`https://wa.me/${config?.whatsapp_number?.replace(/[^0-9]/g, '') || '8801700000000'}?text=${encodeURIComponent('Hello, I have a question regarding my order.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
            >
              <span>Chat with Support on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. Rich Fallback Template for: "privacy-policy" / "privacy" / "terms"
  if (slug === 'privacy-policy' || slug === 'privacy' || slug === 'terms') {
    const breadcrumbs = [
      { name: 'Home', url: `/store/${subdomain}` },
      { name: 'Privacy Policy & Terms', url: `/store/${subdomain}/pages/privacy-policy` },
    ];

    return (
      <div className="max-w-4xl mx-auto space-y-8 py-4">
        <SeoHead
          title="Privacy Policy, Order Terms & Data Protection"
          description="Read our official data protection rules, secure payment handling, 7-day replacement warranty, and shipping guidelines."
          brandName={config?.name ?? 'Slice Mart'}
        />

        <BreadcrumbNav items={breadcrumbs} className="py-1" />

        <div className="space-y-2 border-b border-zinc-800/80 pb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-0.5 text-[11px] font-semibold text-zinc-300">
            <Lock className="size-3 text-emerald-400" />
            <span>Legal Notice & Privacy Standard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Privacy Policy & Terms of Service
          </h1>
          <p className="text-xs text-zinc-400">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8 text-xs text-zinc-300 leading-relaxed">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="size-4 text-emerald-400" />
              <span>1. Information Collection & Usage</span>
            </h2>
            <p>
              When you place an order on our storefront, we collect necessary customer details including your name, 
              delivery address, contact phone number, and email. This data is utilized solely for order batching, delivery dispatch 
              with 3PL couriers, and transactional SMS/email status notifications.
            </p>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>2. Payment Security & Data Protection</span>
            </h2>
            <p>
              We do not store full credit card numbers or banking PINs on our servers. All digital transactions are processed through 
              encrypted, PCI-compliant payment gateways. For Cash on Delivery (COD), payment is collected directly upon physical receipt.
            </p>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="size-4 text-emerald-400" />
              <span>3. Shipping, Returns & Cancellation</span>
            </h2>
            <p>
              Orders can be cancelled before line dispatch by contacting customer support. If an item is received damaged or defective, 
              we provide full replacement within 7 business days of delivery.
            </p>
          </section>
        </div>
      </div>
    );
  }

  // 5. General Fallback for other custom slugs
  return (
    <div className="max-w-2xl mx-auto py-16 text-center space-y-5">
      <SeoHead
        title="Custom Page"
        description="Official custom page"
        brandName={config?.name ?? 'Slice Mart'}
      />
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <FileText className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-bold text-white">Custom Storefront Page</h2>
      <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
        This custom page is currently being updated in the Storefront Page Builder CMS.
      </p>
      <Link
        to={`/store/${subdomain}/products`}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Product Catalog</span>
      </Link>
    </div>
  );
};
