import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Code,
  Eye,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Layout,
  Plus,
  Save,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api/client';

export interface PageBlock {
  id: string;
  type: 'hero_banner' | 'rich_text' | 'faq' | 'custom_html_css' | 'features';
  title?: string;
  subtitle?: string;
  content?: string;
  html?: string;
  css?: string;
  faqs?: { q: string; a: string }[];
  cta_text?: string;
  cta_url?: string;
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
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: CmsPage[] }>('/storefront/cms/pages');
      const list = res.data.data ?? (res.data as unknown as CmsPage[]) ?? [];
      setPages(list);
      setSelectedPage((prev) => (prev ? prev : (list[0] ?? null)));
    } catch (err) {
      console.error('Failed to fetch pages', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleCreateNewPage = async (templateType: string) => {
    let title = 'New Custom Page';
    let slug = 'page-' + Math.random().toString(36).substring(2, 7);
    let blocks: PageBlock[] = [];

    if (templateType === 'about') {
      title = 'About Our Factory';
      slug = 'about-us';
      blocks = [
        {
          id: 'b1',
          type: 'hero_banner',
          title: 'Decades of Manufacturing Excellence',
          subtitle: 'Pure ingredients, certified hygiene, and industrial-scale baking.',
          cta_text: 'Explore Catalog',
          cta_url: '/store',
        },
        {
          id: 'b2',
          type: 'rich_text',
          title: 'Our Production Heritage',
          content:
            'Founded with a mission to deliver wholesome bread and confectionery daily across the nation.',
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
              q: 'When are daily bakery items dispatched?',
              a: 'All items are baked fresh at 4:00 AM and dispatched for morning courier delivery.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept Cash on Delivery (COD) and all major mobile wallets.',
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
          content:
            'If you receive damaged goods, notify us within 24 hours of delivery for an instant replacement or refund.',
        },
      ];
    }

    try {
      const res = await api.post<{ data: CmsPage }>('/storefront/cms/pages', {
        title,
        slug,
        page_type: templateType,
        status: 'published',
        blocks,
      });

      const newPage = res.data.data ?? (res.data as any);
      setPages([...pages, newPage]);
      setSelectedPage(newPage);
      showToast(`Created page "${title}"`);
    } catch (err: any) {
      alert(err.message ?? 'Failed to create page');
    }
  };

  const handleSavePage = async (publishStatus?: 'draft' | 'published') => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      const statusToSave = publishStatus ?? selectedPage.status;
      const res = await api.put<{ data: CmsPage }>(`/storefront/cms/pages/${selectedPage.id}`, {
        title: selectedPage.title,
        slug: selectedPage.slug,
        meta_title: selectedPage.meta_title,
        meta_description: selectedPage.meta_description,
        status: statusToSave,
        blocks: selectedPage.blocks,
      });

      const updated = res.data.data ?? (res.data as any);
      setSelectedPage(updated);
      setPages(pages.map((p) => (p.id === updated.id ? updated : p)));
      showToast(`Page "${updated.title}" saved as ${statusToSave}!`);
    } catch (err: any) {
      alert(err.message ?? 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (type: PageBlock['type']) => {
    if (!selectedPage) return;
    const newBlock: PageBlock = {
      id: 'block_' + Math.random().toString(36).substring(2, 9),
      type,
      title: type === 'hero_banner' ? 'Hero Headline' : type === 'faq' ? 'FAQ Section' : 'Content Block',
      ...(type === 'hero_banner' ? { subtitle: 'Supporting subtitle description' } : {}),
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Layout className="h-5 w-5 text-emerald-400" />
            <span>Storefront Page & Section Builder</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build and arrange dynamic CMS pages, hero sliders, FAQs, policies, and sandboxed promo blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>{previewMode === 'edit' ? 'Live Preview' : 'Back to Editor'}</span>
          </button>

          <button
            type="button"
            disabled={saving || !selectedPage}
            onClick={() => handleSavePage('published')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Pages</h3>
            <span className="text-[11px] text-muted font-mono">({pages.length})</span>
          </div>

          <div className="space-y-1">
            {pages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPage(p);
                  setPreviewMode('edit');
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedPage?.id === p.id
                    ? 'bg-primary/15 border border-primary/30 text-primary'
                    : 'text-muted hover:bg-surface-sunken hover:text-default'
                }`}
              >
                <div className="truncate">
                  <div className="truncate text-default font-medium">{p.title}</div>
                  <div className="font-mono text-[10px] text-muted">/{p.slug}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                    p.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-surface-sunken text-muted border border-default'
                  }`}
                >
                  {p.status}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Create Templates */}
          <div className="border-t border-default pt-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
              Add Preset Page
            </span>
            <div className="grid grid-cols-1 gap-1.5">
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
                    <span className="text-muted">/pages/</span>
                    <input
                      type="text"
                      value={selectedPage.slug}
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
                    placeholder="e.g. Premium Bread & Confectionery — Slice Mart"
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
                  https://slicemart.com › pages › <span className="font-mono">{selectedPage.slug || 'untitled'}</span>
                </div>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  {selectedPage.meta_title || selectedPage.title || 'Page Title — Slice Mart FMS'}
                </div>
                <div className="text-xs text-muted line-clamp-2">
                  {selectedPage.meta_description ||
                    'Discover industrial manufacturing quality, certified baking ingredients, and fresh wholesale confectionery delivered daily across Bangladesh.'}
                </div>
              </div>
            </div>

            {/* Block Palette Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-default bg-surface p-4 shadow-2xs">
              <span className="text-xs font-bold text-default flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Add Section Block:</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddBlock('hero_banner')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-primary hover:text-primary transition-all cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Hero Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('rich_text')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-primary hover:text-primary transition-all cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Rich Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('faq')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-primary hover:text-primary transition-all cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>FAQ Accordion</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('custom_html_css')}
                  className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-default hover:border-primary hover:text-primary transition-all cursor-pointer"
                >
                  <Code className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Sandboxed HTML/CSS</span>
                </button>
              </div>
            </div>

            {/* Block Stack Canvas */}
            <div className="space-y-4">
              {(selectedPage.blocks || []).map((block, idx) => (
                <div
                  key={block.id || idx}
                  className="rounded-2xl border border-default bg-surface p-5 shadow-2xs space-y-3"
                >
                  {/* Block Header & Reorder Controls */}
                  <div className="flex items-center justify-between border-b border-default pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-sunken border border-default font-mono text-[11px] text-muted">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-default capitalize">
                        {block.type.replace('_', ' ')} Block
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveBlock(idx, 'up')}
                        className="rounded-xl border border-default bg-surface-sunken p-1.5 text-muted hover:text-default disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === (selectedPage.blocks || []).length - 1}
                        onClick={() => handleMoveBlock(idx, 'down')}
                        className="rounded-xl border border-default bg-surface-sunken p-1.5 text-muted hover:text-default disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(idx)}
                        className="rounded-xl border border-default bg-surface-sunken p-1.5 text-muted hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer ml-2 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Block Field Inputs */}
                  {block.type === 'hero_banner' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Hero Title..."
                        value={block.title || ''}
                        onChange={(e) => {
                          const blocks = [...selectedPage.blocks];
                          blocks[idx] = { ...block, title: e.target.value };
                          setSelectedPage({ ...selectedPage, blocks });
                        }}
                        className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        placeholder="Subtitle description..."
                        value={block.subtitle || ''}
                        onChange={(e) => {
                          const blocks = [...selectedPage.blocks];
                          blocks[idx] = { ...block, subtitle: e.target.value };
                          setSelectedPage({ ...selectedPage, blocks });
                        }}
                        className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}

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

                  {block.type === 'faq' && (
                    <div className="space-y-2">
                      {(block.faqs || []).map((faq, fIdx) => (
                        <div key={fIdx} className="space-y-1.5 rounded-xl border border-default bg-surface-sunken p-3">
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
              <div className="border-b border-default pb-4">
                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">/pages/{selectedPage.slug}</span>
                <h1 className="text-2xl font-bold text-default mt-1">{selectedPage.title}</h1>
              </div>

              {(selectedPage.blocks || []).map((block, idx) => (
                <div key={idx} className="space-y-4">
                  {block.type === 'hero_banner' && (
                    <div className="rounded-2xl border border-primary/20 bg-surface-sunken p-8 text-center space-y-3">
                      <h2 className="text-xl font-bold text-default sm:text-2xl">{block.title}</h2>
                      <p className="text-xs text-muted max-w-xl mx-auto">{block.subtitle}</p>
                    </div>
                  )}

                  {block.type === 'rich_text' && (
                    <div className="prose max-w-none space-y-2">
                      {block.title && <h3 className="text-base font-bold text-default">{block.title}</h3>}
                      <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                        {block.content}
                      </p>
                    </div>
                  )}

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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
