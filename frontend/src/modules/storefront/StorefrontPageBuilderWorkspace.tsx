import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Code,
  ChevronLeft,
  Eye,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Layout,
  Plus,
  Save,
  Store,
  Trash2,
  Sparkles,
  ShoppingBag,
  Award,
  ListOrdered,
  Zap,
  Mail,
  RotateCcw,
  Truck,
  ShieldCheck,
  Flame,
  MessageCircle,
  Pencil,
  ExternalLink,
  Power,
  Lock,
  X,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { notify } from '../../components/ui/Toast';
import { StorefrontThemeToggle } from '../../components/storefront/StorefrontThemeToggle';

export type BlockType =
  | 'hero_banner'
  | 'value_props'
  | 'featured_products'
  | 'quality_journey'
  | 'promo_split_banner'
  | 'faq'
  | 'newsletter_vip'
  | 'rich_text'
  | 'custom_html_css';

export interface PageBlock {
  id: string;
  type: BlockType;
  title?: string;
  subtitle?: string;
  badge?: string;
  content?: string;
  html?: string;
  css?: string;
  faqs?: { q: string; a: string }[];
  faqItems?: { q: string; a: string }[];
  cta_text?: string;
  cta_url?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  // Value Props
  items?: { icon?: string; title: string; desc: string }[];
  // Featured Products Catalog
  category_id?: number | null;
  limit?: number;
  show_search?: boolean;
  show_categories?: boolean;
  // Quality Journey
  steps?: { step: string; title: string; desc: string }[];
  // Newsletter
  button_text?: string;
  [key: string]: unknown;
}

export interface CmsPage {
  id: number;
  title: string;
  slug: string;
  page_type: string;
  meta_title?: string;
  meta_description?: string;
  status: 'draft' | 'published';
  blocks: PageBlock[];
}

export const StorefrontPageBuilderWorkspace: React.FC = () => {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [pageToDelete, setPageToDelete] = useState<CmsPage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageToEdit, setPageToEdit] = useState<CmsPage | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    slug: string;
    status: 'draft' | 'published';
    meta_title: string;
    meta_description: string;
  }>({
    title: '',
    slug: '',
    status: 'published',
    meta_title: '',
    meta_description: '',
  });

  const handleTogglePageStatus = async (page: CmsPage) => {
    const nextStatus = page.status === 'published' ? 'draft' : 'published';
    setTogglingId(page.id);
    // Optimistic update
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, status: nextStatus } : p)));
    if (selectedPage?.id === page.id) {
      setSelectedPage((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
    try {
      await api.put(`/storefront/cms/pages/${page.id}`, { status: nextStatus });
      notify.success(
        nextStatus === 'published'
          ? `"${page.title}" is now Active (published live)`
          : `"${page.title}" is now Inactive (draft)`
      );
    } catch (err: unknown) {
      // Revert on failure
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, status: page.status } : p)));
      if (selectedPage?.id === page.id) {
        setSelectedPage((prev) => (prev ? { ...prev, status: page.status } : null));
      }
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      notify.error('Failed to change page status', { description: msg });
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenEditPageModal = (page: CmsPage) => {
    setPageToEdit(page);
    setEditForm({
      title: page.title,
      slug: page.slug,
      status: page.status,
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
    });
    setSelectedPage(page);
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageToEdit) return;
    setSavingEdit(true);
    try {
      const res = await api.put<CmsPage>(`/storefront/cms/pages/${pageToEdit.id}`, {
        title: editForm.title,
        slug: editForm.slug,
        status: editForm.status,
        meta_title: editForm.meta_title,
        meta_description: editForm.meta_description,
      });
      const updated = res.data;
      setPages((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      if (selectedPage?.id === updated.id) {
        setSelectedPage((prev) => (prev ? { ...prev, ...updated } : null));
      }
      notify.success(`Page "${updated.title}" updated successfully`);
      setPageToEdit(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update page';
      notify.error('Failed to update page', { description: msg });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDeletePage = async () => {
    if (!pageToDelete) return;
    if (pageToDelete.slug === 'home') {
      notify.error('The storefront homepage cannot be deleted');
      setPageToDelete(null);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/storefront/cms/pages/${pageToDelete.id}`);
      const remaining = pages.filter((p) => p.id !== pageToDelete.id);
      setPages(remaining);
      if (selectedPage?.id === pageToDelete.id) {
        const home = remaining.find((p) => p.slug === 'home') ?? remaining[0] ?? null;
        setSelectedPage(home);
      }
      notify.success(`Page "${pageToDelete.title}" deleted successfully`);
      setPageToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete page';
      notify.error('Failed to delete page', { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  const loadPagesAndCategories = useCallback(async () => {
    setLoading(true);
    try {
      const [pagesRes, catsRes] = await Promise.allSettled([
        api.get<CmsPage[]>('/storefront/cms/pages'),
        api.get<{ data: { id: number; name: string }[] }>('/storefront/categories'),
      ]);

      if (pagesRes.status === 'fulfilled') {
        const list = pagesRes.value.data ?? [];
        setPages(list);
        setSelectedPage((prev) => {
          if (!prev) {
            // Default to homepage if present, or first page
            const home = list.find((p) => p.slug === 'home');
            return home ?? list[0] ?? null;
          }
          return list.find((p) => p.id === prev.id) ?? list[0] ?? null;
        });
      }

      if (catsRes.status === 'fulfilled') {
        const rawCats = catsRes.value.data as unknown;
        const catList = Array.isArray(rawCats)
          ? (rawCats as { id: number; name: string }[])
          : (((rawCats as Record<string, unknown>)?.data as { id: number; name: string }[]) ?? []);
        setCategories(catList);
      }
    } catch (err) {
      console.error('Failed to fetch pages or categories', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        void loadPagesAndCategories();
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loadPagesAndCategories]);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await api.post<CmsPage[]>('/storefront/cms/pages/seed-defaults');
      const list = res.data ?? [];
      setPages(list);
      const home = list.find((p) => p.slug === 'home') ?? list[0] ?? null;
      setSelectedPage(home);
      notify.success('Default storefront pages restored', {
        description: 'Homepage and standard factory landing pages are now seeded.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed default pages';
      notify.error('Failed to reset defaults', { description: msg });
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateNewPage = async (templateType: string) => {
    let title = 'New Custom Page';
    let slug = 'page-' + Math.random().toString(36).substring(2, 7);
    let blocks: PageBlock[] = [];

    if (templateType === 'home') {
      title = 'Storefront Homepage';
      slug = 'home';
      blocks = [
        {
          id: 'b_hero',
          type: 'hero_banner',
          badge: 'Factory Direct • Guaranteed Fresh Daily',
          title: 'Next-Gen Infrared Cookers & Premium Stoves',
          subtitle: 'High-efficiency energy saving, microcrystalline ceramic touch surfaces, and complete temperature control direct from our factory.',
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
          title: 'The SliceMart Quality Journey',
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
          subtitle: 'High-efficiency infrared cookers, induction surfaces, and precision gas stoves.',
          cta_text: 'Explore Catalog',
          cta_url: '#catalog',
        },
        {
          id: 'b_faq',
          type: 'faq',
          title: 'Got Questions? We’ve Got Answers.',
          subtitle: 'Frequently Asked Questions',
          faqs: [
            { q: 'What cookware is compatible with SliceMart Infrared Cookers?', a: 'All cookware materials work seamlessly on infrared cookers, including ceramic, stainless steel, cast iron, glass, and aluminum.' },
            { q: 'What warranty is provided with appliances?', a: 'All SliceMart infrared cookers and gas stoves include a 1-year comprehensive replacement and service warranty.' },
          ],
        },
        {
          id: 'b_vip',
          type: 'newsletter_vip',
          title: 'Join the SliceMart VIP Club',
          subtitle: 'Get instant alerts when new products launch, plus exclusive perks and promotions.',
          button_text: 'Subscribe',
        },
      ];
    } else if (templateType === 'about') {
      title = 'About Our Factory';
      slug = 'about-us';
      blocks = [
        {
          id: 'b1',
          type: 'hero_banner',
          title: 'Precision Engineering & Thermal Innovation',
          subtitle: 'High-efficiency infrared cookers, induction surfaces, and precision gas stoves.',
          cta_text: 'Explore Catalog',
          cta_url: '/store',
        },
        {
          id: 'b2',
          type: 'rich_text',
          title: 'Our Manufacturing Heritage',
          content: 'Engineered for maximum thermal transfer, energy savings, and durable microcrystalline ceramic glass technology.',
        },
      ];
    } else if (templateType === 'faq') {
      title = 'Help & FAQ';
      slug = 'faq';
      blocks = [
        {
          id: 'b1',
          type: 'faq',
          title: 'Frequently Asked Questions',
          faqs: [
            {
              q: 'What cookware is compatible with SliceMart Infrared Cookers?',
              a: 'All cookware materials work seamlessly on infrared cookers, including ceramic, stainless steel, cast iron, glass, and aluminum.',
            },
            {
              q: 'What warranty is provided with appliances?',
              a: 'All SliceMart infrared cookers and gas stoves include a 1-year comprehensive replacement and service warranty.',
            },
          ],
        },
      ];
    } else if (templateType === 'policy') {
      title = 'Privacy & Return Policy';
      slug = 'privacy-policy';
      blocks = [
        {
          id: 'b1',
          type: 'rich_text',
          title: 'Customer Satisfaction Guarantee',
          content: 'If you receive damaged goods, notify us within 24 hours of delivery for an instant replacement or refund.',
        },
      ];
    }

    try {
      const res = await api.post<CmsPage>('/storefront/cms/pages', {
        title,
        slug,
        page_type: templateType,
        status: 'published',
        blocks,
      });

      const newPage = res.data;
      setPages([...pages, newPage]);
      setSelectedPage(newPage);
      notify.success(`Created page "${title}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create page';
      notify.error('Failed to create page', { description: msg });
    }
  };

  const handleSavePage = async (publishStatus?: 'draft' | 'published') => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const statusToSave = publishStatus ?? selectedPage.status;
      const res = await api.put<CmsPage>(`/storefront/cms/pages/${selectedPage.id}`, {
        title: selectedPage.title,
        slug: selectedPage.slug,
        meta_title: selectedPage.meta_title,
        meta_description: selectedPage.meta_description,
        status: statusToSave,
        blocks: selectedPage.blocks,
      });

      const updated = res.data;
      setSelectedPage(updated);
      setPages(pages.map((p) => (p.id === updated.id ? updated : p)));
      notify.success(`Page "${updated.title}" saved`, {
        description: `Status updated to ${statusToSave}. Changes are live on the storefront.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save page';
      notify.error('Failed to save page', { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    if (!selectedPage) return;
    const newBlock: PageBlock = {
      id: 'block_' + Math.random().toString(36).substring(2, 9),
      type,
      title:
        type === 'hero_banner'
          ? 'Next-Gen Infrared Cookers & Premium Stoves'
          : type === 'featured_products'
          ? 'Browse Available Products'
          : type === 'value_props'
          ? 'Why Buy Direct From Factory'
          : type === 'quality_journey'
          ? 'The SliceMart Quality Journey'
          : type === 'promo_split_banner'
          ? 'Special Promotional Feature'
          : type === 'newsletter_vip'
          ? 'Join the SliceMart VIP Club'
          : type === 'faq'
          ? 'Frequently Asked Questions'
          : 'Custom Content Section',
      ...(type === 'hero_banner'
        ? {
            badge: 'Factory Direct • Certified Quality',
            subtitle: 'High efficiency energy saving, precision thermal engineering, and fast dispatch.',
            cta_text: 'Explore Catalog',
            cta_url: '#catalog',
            secondary_cta_text: 'Order via WhatsApp',
            secondary_cta_url: 'whatsapp',
          }
        : {}),
      ...(type === 'value_props'
        ? {
            items: [
              { icon: 'flame', title: 'Factory Direct', desc: 'Direct from assembly floor with zero middleman markup.' },
              { icon: 'truck', title: 'Express Dispatch', desc: 'Fast nationwide dispatch ensuring prime condition.' },
              { icon: 'shield', title: '100% Quality Inspected', desc: 'Every batch lab-tested for thermal safety.' },
              { icon: 'message', title: 'WhatsApp Concierge', desc: 'Instant live order tracking and customer support.' },
            ],
          }
        : {}),
      ...(type === 'featured_products'
        ? {
            subtitle: 'Select items below to add directly to your cart.',
            limit: 8,
            show_search: true,
            show_categories: true,
          }
        : {}),
      ...(type === 'quality_journey'
        ? {
            subtitle: 'Our 5-stage manufacturing and inspection protocol.',
            steps: [
              { step: '01 / SOURCING', title: 'Components & Glass', desc: 'A-grade microcrystalline glass and copper heating cores.' },
              { step: '02 / ASSEMBLY', title: 'Precision Assembly', desc: 'ESD-safe line with automated sensor mounting.' },
              { step: '03 / TESTING', title: 'Dielectric Insulation', desc: '3750V insulation safety and high-temp endurance.' },
              { step: '04 / QC CHECK', title: 'Thermal Testing', desc: '100% thermocouple and safety sensor QA.' },
              { step: '05 / DISPATCH', title: 'Shockproof Packaging', desc: 'Custom molded foam buffer and reinforced carton.' },
            ],
          }
        : {}),
      ...(type === 'promo_split_banner'
        ? {
            subtitle: 'Discover high-efficiency cooking appliances engineered for modern families.',
            cta_text: 'Shop Now',
            cta_url: '#catalog',
          }
        : {}),
      ...(type === 'newsletter_vip'
        ? {
            subtitle: 'Get instant alerts when new products launch, plus exclusive perks and promotions.',
            button_text: 'Subscribe',
          }
        : {}),
      ...(type === 'rich_text' ? { content: 'Enter formatted content here...' } : {}),
      ...(type === 'custom_html_css'
        ? {
            html: '<div class="promo-box"><h3>Special Offer</h3><p>Get 20% off with code SAVE20</p></div>',
            css: '.promo-box { background: #064e3b; color: #6ee7b7; padding: 24px; border-radius: 16px; text-align: center; }',
          }
        : {}),
      ...(type === 'faq' ? { faqs: [{ q: 'Sample Question?', a: 'Sample Answer text.' }] } : {}),
    };

    setSelectedPage({
      ...selectedPage,
      blocks: [...(selectedPage.blocks || []), newBlock],
    });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!selectedPage) return;
    const blocks = [...(selectedPage.blocks || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const current = blocks[index];
    const target = blocks[targetIdx];
    if (!current || !target) return;

    blocks[index] = target;
    blocks[targetIdx] = current;

    setSelectedPage({ ...selectedPage, blocks });
  };

  const handleDeleteBlock = (index: number) => {
    if (!selectedPage) return;
    const blocks = selectedPage.blocks.filter((_, i) => i !== index);
    setSelectedPage({ ...selectedPage, blocks });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const hasHomePage = pages.some((p) => p.slug === 'home');

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a
              href="/storefront"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-default transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back to Storefront CMS</span>
            </a>
          </div>
          <h1 className="text-xl font-bold text-default flex items-center gap-2">
            <Layout className="h-5 w-5 text-emerald-500" />
            <span>Storefront Page & Section Builder</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Visually customize, reorder, and publish your Homepage, catalog displays, hero banners, and marketing sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Light/Dark Mode Theme Toggler */}
          <StorefrontThemeToggle />

          {/* Reset / Seed Defaults button */}
          <button
            type="button"
            disabled={seeding}
            onClick={handleSeedDefaults}
            title="Reset or restore standard factory preset pages"
            className="inline-flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-muted hover:text-default hover:border-emerald-500/50 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-muted ${seeding ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{seeding ? 'Resetting...' : 'Restore Defaults'}</span>
          </button>

          <a
            href="/storefront"
            className="inline-flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs"
          >
            <Store className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Settings</span>
          </a>

          <button
            type="button"
            onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3.5 py-2 text-xs font-semibold text-default hover:text-primary transition-all cursor-pointer shadow-2xs"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-500" />
            <span>{previewMode === 'edit' ? 'Live Preview' : 'Back to Editor'}</span>
          </button>

          <button
            type="button"
            disabled={saving || !selectedPage}
            onClick={() => handleSavePage('published')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar: Pages Directory & New Templates */}
        <div className="space-y-4 rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Pages & Routes</h3>
            <span className="text-[11px] text-muted font-mono">({pages.length})</span>
          </div>

          <div className="space-y-2">
            {pages.map((p) => {
              const isHome = p.slug === 'home';
              const isSelected = selectedPage?.id === p.id;
              const isPublished = p.status === 'published';
              const isToggling = togglingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`group rounded-xl p-2.5 transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                      : 'bg-surface-sunken/40 border-default hover:bg-surface-sunken/80 hover:border-default/80'
                  }`}
                >
                  {/* Top: Title, Icon, Status Pill (Clickable to select) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPage(p);
                      setPreviewMode('edit');
                    }}
                    className="w-full text-left bg-transparent p-0 border-0 flex items-start justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isHome ? (
                          <Store className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <FileText className="size-3.5 text-muted shrink-0" />
                        )}
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-default'
                          }`}
                        >
                          {p.title}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-muted truncate mt-0.5">
                        {isHome ? '/ (Storefront Home)' : `/pages/${p.slug}`}
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shrink-0 transition-colors ${
                        isPublished
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      {isHome
                        ? isPublished
                          ? 'LIVE HOME'
                          : 'DRAFT HOME'
                        : isPublished
                        ? 'PUBLISHED'
                        : 'INACTIVE'}
                    </span>
                  </button>

                  {/* Actions Ribbon */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-default/50">
                    {/* Active / Inactive Toggle Button */}
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleTogglePageStatus(p);
                      }}
                      title={isPublished ? 'Click to set Inactive (Draft)' : 'Click to set Active (Publish Live)'}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                        isPublished
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'
                          : 'text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
                      }`}
                    >
                      <Power className={`size-2.5 ${isToggling ? 'animate-spin' : ''}`} />
                      <span>{isToggling ? 'Updating...' : isPublished ? 'Active' : 'Inactive'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* View Live Storefront Page */}
                      <a
                        href={isHome ? '/store/slicemart' : `/store/slicemart/pages/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="View live storefront page in new tab"
                        className="inline-flex items-center justify-center p-1 rounded-md text-muted hover:text-default hover:bg-surface border border-transparent hover:border-default transition-colors cursor-pointer"
                      >
                        <ExternalLink className="size-3" />
                      </a>

                      {/* Edit Page Settings */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditPageModal(p);
                        }}
                        title="Edit page title, slug, and SEO settings"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-muted hover:text-default hover:bg-surface border border-transparent hover:border-default transition-colors cursor-pointer"
                      >
                        <Pencil className="size-2.5 text-primary" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Page */}
                      {isHome ? (
                        <span
                          title="Storefront homepage is protected and cannot be deleted"
                          className="inline-flex items-center justify-center p-1 text-muted/30 cursor-not-allowed"
                        >
                          <Lock className="size-3" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPageToDelete(p);
                          }}
                          title="Delete this page"
                          className="inline-flex items-center justify-center p-1 rounded-md text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3 text-rose-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Create Templates */}
          <div className="border-t border-default pt-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
              Add Storefront Page
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {!hasHomePage && (
                <button
                  type="button"
                  onClick={() => handleCreateNewPage('home')}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-2 text-left text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Store className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Initialize Homepage</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCreateNewPage('about')}
                className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken px-2.5 py-2 text-left text-[11px] font-medium text-default hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>About Us Page</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreateNewPage('faq')}
                className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken px-2.5 py-2 text-left text-[11px] font-medium text-default hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Help / FAQ Page</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreateNewPage('policy')}
                className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken px-2.5 py-2 text-left text-[11px] font-medium text-default hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Return Policy</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreateNewPage('custom')}
                className="flex items-center gap-2 rounded-xl border border-default bg-surface-sunken px-2.5 py-2 text-left text-[11px] font-medium text-default hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-muted" />
                <span>Blank Custom Page</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Canvas: Block Reordering & Editor */}
        {selectedPage && previewMode === 'edit' && (
          <div className="space-y-6 lg:col-span-3">
            {/* Page Metadata Card & SEO SERP Preview */}
            <div className="rounded-2xl border border-default bg-surface p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-default gap-3">
                <div className="flex items-center gap-2">
                  {selectedPage.slug === 'home' ? (
                    <Store className="size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <div>
                    <h2 className="text-sm font-bold text-default">{selectedPage.title}</h2>
                    <span className="text-[11px] font-mono text-muted">
                      {selectedPage.slug === 'home' ? '/ (Storefront Home)' : `/pages/${selectedPage.slug}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    disabled={togglingId === selectedPage.id}
                    onClick={() => void handleTogglePageStatus(selectedPage)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedPage.status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                    }`}
                  >
                    <Power className={`size-3 ${togglingId === selectedPage.id ? 'animate-spin' : ''}`} />
                    <span>
                      {togglingId === selectedPage.id
                        ? 'Updating...'
                        : selectedPage.status === 'published'
                        ? 'Status: Active'
                        : 'Status: Inactive'}
                    </span>
                  </button>

                  {/* View Live */}
                  <a
                    href={selectedPage.slug === 'home' ? '/store/slicemart' : `/store/slicemart/pages/${selectedPage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-default bg-surface hover:bg-surface-sunken text-xs font-semibold text-default transition-colors"
                  >
                    <ExternalLink className="size-3" />
                    <span className="hidden sm:inline">View Live</span>
                  </a>

                  {/* Delete (non-home only) */}
                  {selectedPage.slug !== 'home' && (
                    <button
                      type="button"
                      onClick={() => setPageToDelete(selectedPage)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={selectedPage.title}
                    onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">
                    URL Slug
                  </label>
                  <div className="flex items-center rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs">
                    <span className="text-muted">{selectedPage.slug === 'home' ? '/' : '/pages/'}</span>
                    <input
                      type="text"
                      value={selectedPage.slug}
                      readOnly={selectedPage.slug === 'home'}
                      onChange={(e) => setSelectedPage({ ...selectedPage, slug: e.target.value })}
                      className="flex-1 bg-transparent text-default focus:outline-none pl-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Meta Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-default">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">
                    SEO Meta Title (Browser & Search Snippet)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Next-Gen Infrared Cookers & Stoves — SliceMart"
                    value={selectedPage.meta_title || ''}
                    onChange={(e) => setSelectedPage({ ...selectedPage, meta_title: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">
                    SEO Meta Description
                  </label>
                  <input
                    type="text"
                    placeholder="Brief 150-160 character summary for search engines..."
                    value={selectedPage.meta_description || ''}
                    onChange={(e) => setSelectedPage({ ...selectedPage, meta_description: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Google Search Live SERP Snippet Preview */}
              <div className="p-4 rounded-xl bg-surface-sunken border border-default space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted">Google Search Snippet Preview</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">Live SERP</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-sans truncate">
                  https://slicemart.com › {selectedPage.slug === 'home' ? '' : `pages › `}<span className="font-mono">{selectedPage.slug === 'home' ? '' : selectedPage.slug || 'untitled'}</span>
                </div>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  {selectedPage.meta_title || selectedPage.title || 'Page Title — SliceMart Appliances'}
                </div>
                <div className="text-xs text-muted line-clamp-2">
                  {selectedPage.meta_description ||
                    'Discover industrial-grade infrared cookers, touch-sensor double burner stoves, and energy-saving kitchen appliances engineered for modern homes.'}
                </div>
              </div>
            </div>

            {/* Block Palette Bar */}
            <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-default flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Add E-Commerce Section Block:</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddBlock('hero_banner')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Hero Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('value_props')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <Award className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Value Props</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('featured_products')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Products Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('quality_journey')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <ListOrdered className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Quality Journey</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('promo_split_banner')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Promo Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('faq')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>FAQ Accordion</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('newsletter_vip')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <span>VIP Newsletter</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('rich_text')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-muted" />
                  <span>Rich Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('custom_html_css')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <Code className="h-3.5 w-3.5 text-muted" />
                  <span>Sandboxed Code</span>
                </button>
              </div>
            </div>

            {/* Block Stack Canvas */}
            <div className="space-y-4">
              {(selectedPage.blocks || []).map((block, idx) => (
                <div
                  key={block.id || idx}
                  className="rounded-2xl border border-default bg-surface p-5 shadow-2xs space-y-4"
                >
                  {/* Block Header & Reorder Controls */}
                  <div className="flex items-center justify-between border-b border-default pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-sunken border border-default font-mono text-[11px] text-muted font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-default capitalize flex items-center gap-1.5">
                        {block.type === 'hero_banner' && <ImageIcon className="size-3.5 text-emerald-500" />}
                        {block.type === 'value_props' && <Award className="size-3.5 text-purple-500" />}
                        {block.type === 'featured_products' && <ShoppingBag className="size-3.5 text-emerald-500" />}
                        {block.type === 'quality_journey' && <ListOrdered className="size-3.5 text-blue-500" />}
                        {block.type === 'promo_split_banner' && <Zap className="size-3.5 text-amber-500" />}
                        {block.type === 'faq' && <HelpCircle className="size-3.5 text-teal-500" />}
                        {block.type === 'newsletter_vip' && <Mail className="size-3.5 text-rose-500" />}
                        {block.type === 'rich_text' && <FileText className="size-3.5 text-muted" />}
                        {block.type === 'custom_html_css' && <Code className="size-3.5 text-muted" />}
                        <span>{block.type.replace(/_/g, ' ')}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveBlock(idx, 'up')}
                        className="rounded-xl border border-default bg-surface-sunken p-1.5 text-muted hover:text-default disabled:opacity-30 cursor-pointer transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === (selectedPage.blocks || []).length - 1}
                        onClick={() => handleMoveBlock(idx, 'down')}
                        className="rounded-xl border border-default bg-surface-sunken p-1.5 text-muted hover:text-default disabled:opacity-30 cursor-pointer transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(idx)}
                        className="rounded-xl border border-default bg-surface-sunken p-1.5 text-muted hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer ml-2 transition-colors"
                        title="Delete Block"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* HERO BANNER EDIT */}
                  {block.type === 'hero_banner' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Badge Tag</label>
                          <input
                            type="text"
                            placeholder="e.g. Factory Direct • Guaranteed Fresh Daily"
                            value={block.badge || ''}
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, badge: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Hero Headline</label>
                          <input
                            type="text"
                            placeholder="Hero Headline..."
                            value={block.title || ''}
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, title: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted block mb-1">Subtitle Description</label>
                        <textarea
                          rows={2}
                          placeholder="Supporting subtitle..."
                          value={block.subtitle || ''}
                          onChange={(e) => {
                            const blocks = [...selectedPage.blocks];
                            blocks[idx] = { ...block, subtitle: e.target.value };
                            setSelectedPage({ ...selectedPage, blocks });
                          }}
                          className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted block">Primary CTA Button</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Label (e.g. Explore Catalog)"
                              value={block.cta_text || ''}
                              onChange={(e) => {
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, cta_text: e.target.value };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="w-1/2 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs text-default"
                            />
                            <input
                              type="text"
                              placeholder="URL (e.g. #catalog)"
                              value={block.cta_url || ''}
                              onChange={(e) => {
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, cta_url: e.target.value };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="w-1/2 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs text-default font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted block">Secondary CTA Button</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Label (e.g. Order via WhatsApp)"
                              value={block.secondary_cta_text || ''}
                              onChange={(e) => {
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, secondary_cta_text: e.target.value };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="w-1/2 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs text-default"
                            />
                            <input
                              type="text"
                              placeholder="URL or 'whatsapp'"
                              value={block.secondary_cta_url || ''}
                              onChange={(e) => {
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, secondary_cta_url: e.target.value };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="w-1/2 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs text-default font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VALUE PROPS EDIT */}
                  {block.type === 'value_props' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-muted">Value Proposition Pillars</label>
                        <button
                          type="button"
                          onClick={() => {
                            const items = [...(block.items || [])];
                            items.push({ icon: 'flame', title: 'New Highlight', desc: 'Detail benefit description...' });
                            const blocks = [...selectedPage.blocks];
                            blocks[idx] = { ...block, items };
                            setSelectedPage({ ...selectedPage, blocks });
                          }}
                          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="size-3" />
                          <span>Add Pillar Card</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(block.items || []).map((item, pIdx) => (
                          <div key={pIdx} className="p-3 rounded-xl border border-default bg-surface-sunken space-y-2 relative">
                            <div className="flex items-center justify-between">
                              <select
                                value={item.icon || 'flame'}
                                onChange={(e) => {
                                  const items = [...(block.items || [])];
                                  items[pIdx] = { ...item, icon: e.target.value };
                                  const blocks = [...selectedPage.blocks];
                                  blocks[idx] = { ...block, items };
                                  setSelectedPage({ ...selectedPage, blocks });
                                }}
                                className="text-[11px] rounded-lg border border-default bg-surface px-2 py-1 text-default font-mono"
                              >
                                <option value="flame">Flame (Factory)</option>
                                <option value="truck">Truck (Delivery)</option>
                                <option value="shield">Shield (Quality)</option>
                                <option value="message">Message (WhatsApp)</option>
                                <option value="award">Award (Certified)</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  const items = (block.items || []).filter((_, i) => i !== pIdx);
                                  const blocks = [...selectedPage.blocks];
                                  blocks[idx] = { ...block, items };
                                  setSelectedPage({ ...selectedPage, blocks });
                                }}
                                className="text-muted hover:text-rose-500 cursor-pointer p-1"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={item.title}
                              placeholder="Title..."
                              onChange={(e) => {
                                const items = [...(block.items || [])];
                                items[pIdx] = { ...item, title: e.target.value };
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, items };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="w-full text-xs font-bold text-default bg-transparent border-b border-default pb-1 focus:outline-none"
                            />
                            <textarea
                              rows={2}
                              value={item.desc}
                              placeholder="Description..."
                              onChange={(e) => {
                                const items = [...(block.items || [])];
                                items[pIdx] = { ...item, desc: e.target.value };
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, items };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="w-full text-[11px] text-muted bg-transparent focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FEATURED PRODUCTS CATALOG EDIT */}
                  {block.type === 'featured_products' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Catalog Section Heading</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            placeholder="e.g. Browse Available Products"
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, title: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Catalog Subtitle</label>
                          <input
                            type="text"
                            value={block.subtitle || ''}
                            placeholder="e.g. Select items below to add directly to your cart."
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, subtitle: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Category Filter</label>
                          <select
                            value={block.category_id || ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, category_id: val };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:outline-none"
                          >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Items To Display</label>
                          <input
                            type="number"
                            min={2}
                            max={48}
                            value={block.limit || 8}
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, limit: parseInt(e.target.value) || 8 };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-4 pt-5">
                          <label className="flex items-center gap-1.5 text-xs text-default cursor-pointer">
                            <input
                              type="checkbox"
                              checked={block.show_search !== false}
                              onChange={(e) => {
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, show_search: e.target.checked };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="rounded accent-emerald-500"
                            />
                            <span>Live Search Bar</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-default cursor-pointer">
                            <input
                              type="checkbox"
                              checked={block.show_categories !== false}
                              onChange={(e) => {
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, show_categories: e.target.checked };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="rounded accent-emerald-500"
                            />
                            <span>Category Pills</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QUALITY JOURNEY EDIT */}
                  {block.type === 'quality_journey' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Section Heading</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, title: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={block.subtitle || ''}
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, subtitle: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold text-muted">Steps List</label>
                          <button
                            type="button"
                            onClick={() => {
                              const steps = [...(block.steps || [])];
                              const num = steps.length + 1;
                              steps.push({
                                step: `0${num} / STEP`,
                                title: 'Inspection Stage',
                                desc: 'Details of this stage...',
                              });
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, steps };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="size-3" />
                            <span>Add Step</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {(block.steps || []).map((st, sIdx) => (
                            <div key={sIdx} className="p-3 rounded-xl border border-default bg-surface-sunken space-y-1.5 relative">
                              <div className="flex items-center justify-between">
                                <input
                                  type="text"
                                  value={st.step}
                                  placeholder="01 / SOURCING"
                                  onChange={(e) => {
                                    const steps = [...(block.steps || [])];
                                    steps[sIdx] = { ...st, step: e.target.value };
                                    const blocks = [...selectedPage.blocks];
                                    blocks[idx] = { ...block, steps };
                                    setSelectedPage({ ...selectedPage, blocks });
                                  }}
                                  className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-transparent focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const steps = (block.steps || []).filter((_, i) => i !== sIdx);
                                    const blocks = [...selectedPage.blocks];
                                    blocks[idx] = { ...block, steps };
                                    setSelectedPage({ ...selectedPage, blocks });
                                  }}
                                  className="text-muted hover:text-rose-500 cursor-pointer"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={st.title}
                                placeholder="Step Title"
                                onChange={(e) => {
                                  const steps = [...(block.steps || [])];
                                  steps[sIdx] = { ...st, title: e.target.value };
                                  const blocks = [...selectedPage.blocks];
                                  blocks[idx] = { ...block, steps };
                                  setSelectedPage({ ...selectedPage, blocks });
                                }}
                                className="w-full text-xs font-bold text-default bg-transparent focus:outline-none"
                              />
                              <textarea
                                rows={2}
                                value={st.desc}
                                placeholder="Description"
                                onChange={(e) => {
                                  const steps = [...(block.steps || [])];
                                  steps[sIdx] = { ...st, desc: e.target.value };
                                  const blocks = [...selectedPage.blocks];
                                  blocks[idx] = { ...block, steps };
                                  setSelectedPage({ ...selectedPage, blocks });
                                }}
                                className="w-full text-[11px] text-muted bg-transparent focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROMO SPLIT BANNER EDIT */}
                  {block.type === 'promo_split_banner' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Headline</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            placeholder="e.g. Precision Engineering & Thermal Innovation"
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, title: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={block.subtitle || ''}
                            placeholder="e.g. High efficiency heating elements direct from factory."
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, subtitle: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Button CTA Text</label>
                          <input
                            type="text"
                            value={block.cta_text || ''}
                            placeholder="e.g. Explore Catalog"
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, cta_text: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs text-default"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Button CTA URL</label>
                          <input
                            type="text"
                            value={block.cta_url || ''}
                            placeholder="e.g. #catalog or /store/products"
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, cta_url: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs text-default font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FAQ EDIT */}
                  {block.type === 'faq' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          placeholder="FAQ Section Title..."
                          value={block.title || ''}
                          onChange={(e) => {
                            const blocks = [...selectedPage.blocks];
                            blocks[idx] = { ...block, title: e.target.value };
                            setSelectedPage({ ...selectedPage, blocks });
                          }}
                          className="w-1/2 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs text-default font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const faqs = [...(block.faqs || [])];
                            faqs.push({ q: 'New Question?', a: 'Answer description...' });
                            const blocks = [...selectedPage.blocks];
                            blocks[idx] = { ...block, faqs };
                            setSelectedPage({ ...selectedPage, blocks });
                          }}
                          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="size-3" />
                          <span>Add FAQ Item</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(block.faqs || []).map((faq, fIdx) => (
                          <div key={fIdx} className="space-y-1.5 rounded-xl border border-default bg-surface-sunken p-3">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                placeholder="Question..."
                                value={faq.q}
                                onChange={(e) => {
                                  const newFaqs = (block.faqs || []).map((f, i) =>
                                    i === fIdx ? { ...f, q: e.target.value } : f
                                  );
                                  const blocks = [...selectedPage.blocks];
                                  blocks[idx] = { ...block, faqs: newFaqs };
                                  setSelectedPage({ ...selectedPage, blocks });
                                }}
                                className="w-full bg-transparent text-xs font-bold text-default focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newFaqs = (block.faqs || []).filter((_, i) => i !== fIdx);
                                  const blocks = [...selectedPage.blocks];
                                  blocks[idx] = { ...block, faqs: newFaqs };
                                  setSelectedPage({ ...selectedPage, blocks });
                                }}
                                className="text-muted hover:text-rose-500 cursor-pointer p-1"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Answer description..."
                              value={faq.a}
                              onChange={(e) => {
                                const newFaqs = (block.faqs || []).map((f, i) =>
                                  i === fIdx ? { ...f, a: e.target.value } : f
                                );
                                const blocks = [...selectedPage.blocks];
                                blocks[idx] = { ...block, faqs: newFaqs };
                                setSelectedPage({ ...selectedPage, blocks });
                              }}
                              className="w-full bg-transparent text-xs text-muted focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VIP NEWSLETTER EDIT */}
                  {block.type === 'newsletter_vip' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Club Title</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            placeholder="e.g. Join the SliceMart VIP Club"
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, title: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Perk Subtitle</label>
                          <input
                            type="text"
                            value={block.subtitle || ''}
                            placeholder="Get alerts and discounts..."
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, subtitle: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted block mb-1">Button Text</label>
                          <input
                            type="text"
                            value={block.button_text || ''}
                            placeholder="Subscribe"
                            onChange={(e) => {
                              const blocks = [...selectedPage.blocks];
                              blocks[idx] = { ...block, button_text: e.target.value };
                              setSelectedPage({ ...selectedPage, blocks });
                            }}
                            className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RICH TEXT EDIT */}
                  {block.type === 'rich_text' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Section Heading..."
                        value={block.title || ''}
                        onChange={(e) => {
                          const blocks = [...selectedPage.blocks];
                          blocks[idx] = { ...block, title: e.target.value };
                          setSelectedPage({ ...selectedPage, blocks });
                        }}
                        className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                      />
                      <textarea
                        rows={4}
                        placeholder="Body content text..."
                        value={block.content || ''}
                        onChange={(e) => {
                          const blocks = [...selectedPage.blocks];
                          blocks[idx] = { ...block, content: e.target.value };
                          setSelectedPage({ ...selectedPage, blocks });
                        }}
                        className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none font-sans"
                      />
                    </div>
                  )}

                  {/* CUSTOM HTML / CSS EDIT */}
                  {block.type === 'custom_html_css' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-mono text-muted block mb-1">
                          Custom HTML (Rendered in Secure Sandbox)
                        </label>
                        <textarea
                          rows={4}
                          value={block.html || ''}
                          onChange={(e) => {
                            const blocks = [...selectedPage.blocks];
                            blocks[idx] = { ...block, html: e.target.value };
                            setSelectedPage({ ...selectedPage, blocks });
                          }}
                          className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-muted block mb-1">
                          Custom CSS Styles
                        </label>
                        <textarea
                          rows={4}
                          value={block.css || ''}
                          onChange={(e) => {
                            const blocks = [...selectedPage.blocks];
                            blocks[idx] = { ...block, css: e.target.value };
                            setSelectedPage({ ...selectedPage, blocks });
                          }}
                          className="w-full rounded-xl border border-default bg-surface-sunken p-2.5 font-mono text-[11px] text-cyan-600 dark:text-cyan-400 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Preview Pane */}
        {selectedPage && previewMode === 'preview' && (
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-3xl border border-default bg-surface p-6 sm:p-10 shadow-2xl space-y-8">
              <div className="border-b border-default pb-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    {selectedPage.slug === 'home' ? '/ (Storefront Homepage)' : `/pages/${selectedPage.slug}`}
                  </span>
                  <h1 className="text-2xl font-bold text-default mt-1">{selectedPage.title}</h1>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  Interactive Preview
                </span>
              </div>

              {(selectedPage.blocks || []).map((block, idx) => (
                <div key={idx} className="space-y-4">
                  {/* Hero Preview */}
                  {block.type === 'hero_banner' && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-linear-to-br from-emerald-950/20 via-surface-sunken to-surface p-8 text-center space-y-3 shadow-md">
                      {block.badge && (
                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                          {block.badge}
                        </span>
                      )}
                      <h2 className="text-xl font-extrabold text-default sm:text-3xl">{block.title}</h2>
                      <p className="text-xs text-muted max-w-xl mx-auto leading-relaxed">{block.subtitle}</p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        {block.cta_text && (
                          <span className="px-5 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs shadow-md">
                            {block.cta_text}
                          </span>
                        )}
                        {block.secondary_cta_text && (
                          <span className="px-4 py-2.5 rounded-xl border border-default bg-surface text-default font-semibold text-xs">
                            {block.secondary_cta_text}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Value Props Preview */}
                  {block.type === 'value_props' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(block.items || []).map((it, i) => (
                        <div key={i} className="p-4 rounded-xl border border-default bg-surface-sunken space-y-1">
                          <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                            {it.icon === 'truck' ? <Truck className="size-4" /> : it.icon === 'shield' ? <ShieldCheck className="size-4" /> : it.icon === 'message' ? <MessageCircle className="size-4" /> : <Flame className="size-4" />}
                          </div>
                          <h4 className="text-xs font-bold text-default">{it.title}</h4>
                          <p className="text-[11px] text-muted">{it.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Featured Products Preview */}
                  {block.type === 'featured_products' && (
                    <div className="rounded-2xl border border-default bg-surface-sunken p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-default pb-3">
                        <div>
                          <h3 className="text-base font-bold text-default">{block.title || 'Browse Products'}</h3>
                          <p className="text-xs text-muted">{block.subtitle || 'Available items in stock'}</p>
                        </div>
                        <span className="text-xs text-emerald-600 font-semibold font-mono">
                          Limit: {block.limit || 8} items
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Array.from({ length: Math.min(4, block.limit || 4) }).map((_, i) => (
                          <div key={i} className="p-3 rounded-xl border border-default bg-surface space-y-2 text-center">
                            <div className="h-20 rounded-lg bg-surface-sunken flex items-center justify-center text-muted">
                              <ShoppingBag className="size-6 text-muted" />
                            </div>
                            <div className="h-3 w-3/4 mx-auto rounded bg-surface-sunken" />
                            <div className="h-2 w-1/2 mx-auto rounded bg-emerald-500/20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quality Journey Preview */}
                  {block.type === 'quality_journey' && (
                    <div className="rounded-2xl border border-default bg-surface-sunken p-6 space-y-4">
                      <div className="text-center">
                        <h3 className="text-base font-bold text-default">{block.title || 'Quality Journey'}</h3>
                        <p className="text-xs text-muted">{block.subtitle}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {(block.steps || []).map((st, i) => (
                          <div key={i} className="p-3 rounded-xl border border-default bg-surface space-y-1">
                            <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{st.step}</span>
                            <h5 className="text-xs font-bold text-default">{st.title}</h5>
                            <p className="text-[10px] text-muted">{st.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Promo Banner Preview */}
                  {block.type === 'promo_split_banner' && (
                    <div className="rounded-2xl border border-default bg-surface-sunken p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-default">{block.title}</h4>
                        <p className="text-xs text-muted max-w-md">{block.subtitle}</p>
                      </div>
                      {block.cta_text && (
                        <span className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold shadow-xs whitespace-nowrap">
                          {block.cta_text}
                        </span>
                      )}
                    </div>
                  )}

                  {/* FAQ Preview */}
                  {block.type === 'faq' && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-default">{block.title || 'FAQ'}</h3>
                      <div className="space-y-2">
                        {(block.faqs || []).map((faq, fIdx) => (
                          <div key={fIdx} className="rounded-xl border border-default bg-surface-sunken p-4">
                            <h4 className="text-xs font-bold text-default">{faq.q}</h4>
                            <p className="text-xs text-muted mt-1">{faq.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VIP Newsletter Preview */}
                  {block.type === 'newsletter_vip' && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-2">
                      <h4 className="text-base font-bold text-default">{block.title || 'VIP Club'}</h4>
                      <p className="text-xs text-muted max-w-sm mx-auto">{block.subtitle}</p>
                      <div className="flex items-center justify-center gap-2 pt-2 max-w-xs mx-auto">
                        <input
                          type="text"
                          disabled
                          placeholder="your email or phone..."
                          className="w-full rounded-xl border border-default bg-surface px-3 py-1.5 text-xs text-muted"
                        />
                        <button type="button" disabled className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold">
                          {block.button_text || 'Join'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rich Text Preview */}
                  {block.type === 'rich_text' && (
                    <div className="prose max-w-none space-y-2">
                      {block.title && <h3 className="text-base font-bold text-default">{block.title}</h3>}
                      <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                        {block.content}
                      </p>
                    </div>
                  )}

                  {/* Sandboxed Code Preview */}
                  {block.type === 'custom_html_css' && (
                    <div className="overflow-hidden rounded-2xl border border-default bg-surface">
                      <iframe
                        title="Sandboxed Block Preview"
                        sandbox="allow-scripts"
                        srcDoc={`
                          <html>
                            <head><style>${block.css || ''}</style></head>
                            <body style="margin: 0; font-family: sans-serif;">${block.html || ''}</body>
                          </html>
                        `}
                        className="w-full h-40 border-0"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State when No Page is Selected */}
        {!selectedPage && (
          <div className="lg:col-span-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-default bg-surface p-12 text-center min-h-110 shadow-2xs">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
              <Layout className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-default">Storefront Dynamic Page Builder</h3>
            <p className="text-xs text-muted max-w-md mt-1 mb-6">
              Create and manage dynamic CMS pages, hero sliders, FAQs, warranty policies, and promotional blocks synced directly with your live customer storefront.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
              <button
                type="button"
                onClick={() => handleCreateNewPage('home')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-center cursor-pointer group"
              >
                <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Storefront Homepage</span>
                <span className="text-[10px] text-muted">Complete e-commerce home</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreateNewPage('about')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-default bg-surface-sunken hover:border-emerald-500/50 hover:bg-surface transition-all text-center cursor-pointer group"
              >
                <Sparkles className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-default">About Us Page</span>
                <span className="text-[10px] text-muted">Factory heritage & story</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreateNewPage('faq')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-default bg-surface-sunken hover:border-emerald-500/50 hover:bg-surface transition-all text-center cursor-pointer group"
              >
                <HelpCircle className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-default">Help & FAQ</span>
                <span className="text-[10px] text-muted">Common customer questions</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-default bg-surface shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="size-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-default">Delete Page</h3>
                <p className="text-xs text-muted">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-sunken border border-default text-xs space-y-1.5">
              <div className="flex justify-between text-muted">
                <span>Page Title:</span>
                <span className="font-semibold text-default">{pageToDelete.title}</span>
              </div>
              <div className="flex justify-between text-muted font-mono">
                <span>Route Slug:</span>
                <span className="text-default">/{pageToDelete.slug}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Blocks:</span>
                <span className="text-default">{(pageToDelete.blocks || []).length} content blocks</span>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to permanently delete this page? The page will immediately be removed from your storefront routing and sitemaps.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPageToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-default bg-surface text-xs font-semibold text-default hover:bg-surface-sunken transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleConfirmDeletePage()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Page Properties Modal */}
      {pageToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-default bg-surface shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-default">
              <div className="flex items-center gap-2">
                <Pencil className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-default">Edit Page Properties</h3>
              </div>
              <button
                type="button"
                onClick={() => setPageToEdit(null)}
                className="p-1 rounded-lg text-muted hover:text-default hover:bg-surface-sunken cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-default block">Page Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-default block">URL Slug</label>
                <div className="flex items-center rounded-xl border border-default bg-surface-sunken px-3 py-2">
                  <span className="text-muted font-mono">{pageToEdit.slug === 'home' ? '/' : '/pages/'}</span>
                  <input
                    type="text"
                    required
                    readOnly={pageToEdit.slug === 'home'}
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="flex-1 bg-transparent text-default focus:outline-none pl-1 font-mono read-only:text-muted"
                  />
                  {pageToEdit.slug === 'home' && (
                    <span className="text-[10px] text-muted font-sans flex items-center gap-1">
                      <Lock className="size-3 text-muted" /> Fixed Home
                    </span>
                  )}
                </div>
              </div>

              {/* Status / Visibility */}
              <div className="space-y-1.5">
                <label className="font-semibold text-default block">Page Visibility / Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: 'published' })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      editForm.status === 'published'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold'
                        : 'bg-surface-sunken border-default text-muted hover:text-default'
                    }`}
                  >
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Active (Published)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: 'draft' })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      editForm.status === 'draft'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-2xs font-bold'
                        : 'bg-surface-sunken border-default text-muted hover:text-default'
                    }`}
                  >
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>Inactive (Draft)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-default block">SEO Meta Title</label>
                <input
                  type="text"
                  placeholder="e.g. Next-Gen Infrared Cookers & Stoves — SliceMart"
                  value={editForm.meta_title}
                  onChange={(e) => setEditForm({ ...editForm, meta_title: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-default block">SEO Meta Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary for search engine snippet..."
                  value={editForm.meta_description}
                  onChange={(e) => setEditForm({ ...editForm, meta_description: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-default">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setPageToEdit(null)}
                  className="px-3.5 py-2 rounded-xl border border-default bg-surface text-xs font-semibold text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Properties'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
