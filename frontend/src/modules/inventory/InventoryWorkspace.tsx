import { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  ClipboardCheck,
  Scale,
  Search,
  SlidersHorizontal,
  X,
  Warehouse,
  Compass,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { StockLedgerSection } from './sections/StockLedgerSection';
import { StockTransfersSection } from './sections/StockTransfersSection';
import { StockAdjustmentsSection } from './sections/StockAdjustmentsSection';
import { StockCountsSection } from './sections/StockCountsSection';
import { StockThresholdsSection } from './sections/StockThresholdsSection';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { StockTransferModal } from './modals/StockTransferModal';
import { StockAdjustmentModal } from './modals/StockAdjustmentModal';

export type InventoryTab = 'ledger' | 'transfers' | 'adjustments' | 'counts' | 'thresholds';
export type InventoryCategory = 'visibility' | 'operations';

const VALID_TABS: readonly InventoryTab[] = ['ledger', 'transfers', 'adjustments', 'counts', 'thresholds'];

interface CategoryConfig {
  id: InventoryCategory;
  label: string;
  tagline: string;
  shortcut: string;
  icon: typeof Boxes;
  defaultTab: InventoryTab;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'visibility',
    label: 'Stock Levels & Low Stock Alerts',
    tagline: 'Live quantities across warehouses, batch tracking & replenishment alerts',
    shortcut: '1',
    icon: Boxes,
    defaultTab: 'ledger',
  },
  {
    id: 'operations',
    label: 'Transfers, Adjustments & Counts',
    tagline: 'Move stock between locations, report damaged items & do physical counts',
    shortcut: '2',
    icon: Warehouse,
    defaultTab: 'transfers',
  },
];

interface TabConfig {
  id: InventoryTab;
  label: string;
  shortLabel: string;
  category: InventoryCategory;
  badge?: string;
  icon: typeof Boxes;
  description: string;
  highlights: string[];
}

const tabs: TabConfig[] = [
  {
    id: 'ledger',
    label: 'Live Stock Balances',
    shortLabel: 'Current Stock',
    category: 'visibility',
    badge: 'Live Stock',
    icon: Boxes,
    description:
      'Check current available quantities in every warehouse, view item locations, and trace past movements',
    highlights: ['Multi-Warehouse Balances', 'Lot & Expiry Tracking', 'Complete Movement History'],
  },
  {
    id: 'thresholds',
    label: 'Low Stock Alerts & Reorders',
    shortLabel: 'Reorder Alerts',
    category: 'visibility',
    badge: 'Safety Stock',
    icon: AlertTriangle,
    description:
      'Set minimum stock warning levels so you get notified before items run out of stock',
    highlights: ['Minimum Level Alerts', 'Low Stock Warnings', 'Suggested Reorder Amounts'],
  },
  {
    id: 'transfers',
    label: 'Warehouse Transfers',
    shortLabel: 'Transfers',
    category: 'operations',
    badge: 'Transit',
    icon: ArrowRightLeft,
    description:
      'Move items from one warehouse to another with dispatch confirmation and receiving checks',
    highlights: ['Warehouse-to-Warehouse', 'Track In-Transit Goods', 'Arrival Verification'],
  },
  {
    id: 'adjustments',
    label: 'Damaged & Lost Items',
    shortLabel: 'Damage / Loss',
    category: 'operations',
    badge: 'Adjustments',
    icon: Scale,
    description:
      'Record broken, expired, or lost goods and adjust stock counts with manager approval',
    highlights: ['Broken / Expired Items', 'Audit Reason Records', 'Manager Approval Gate'],
  },
  {
    id: 'counts',
    label: 'Physical Stock Counts',
    shortLabel: 'Cycle Counts',
    category: 'operations',
    badge: 'Audit & Rec',
    icon: ClipboardCheck,
    description:
      'Periodic cycle and full physical audits with snapshotting, blind counts and automated variance reconciliation',
    highlights: ['Freeze Snapshot Audits', 'Blind Counting Sheets', 'Automated Variance Reconciliation'],
  },
];

export default function InventoryWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<InventoryTab>('ledger', VALID_TABS);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const quickJumpRef = useRef<HTMLDivElement>(null);

  // Quick Action Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0]!;
  const activeCategory = currentTab.category;

  // Global Keyboard Shortcuts (1, 2 to switch domain pillars)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('ledger');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('transfers');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickJumpRef.current && !quickJumpRef.current.contains(event.target as Node)) {
        setQuickJumpOpen(false);
      }
    }
    if (quickJumpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [quickJumpOpen]);

  const filteredTabs = searchQuery.trim()
    ? tabs.filter(
        (t) =>
          t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shortLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tabs;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
              Inventory & Warehouse Management
            </span>
            <span className="text-muted/50 text-xs">/</span>
            <span className="text-[11px] font-semibold text-default">{currentTab.label}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default flex items-center gap-3">
            <span>{currentTab.label}</span>
            {currentTab.badge && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-sunken text-muted border border-default">
                {currentTab.badge}
              </span>
            )}
          </h1>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            {currentTab.description}
          </p>
        </div>

        {/* Quick External Actions & Guides */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-primary/30 bg-primary-subtle hover:bg-primary/10 text-primary transition-all shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Open Inventory Architecture & Operations Guide"
          >
            <Compass className="size-3.5 text-primary" />
            <span>Explore Capabilities</span>
          </button>

          {/* Quick Jump Dropdown Popover */}
          <div className="relative shrink-0" ref={quickJumpRef}>
            <button
              type="button"
              onClick={() => {
                setQuickJumpOpen(!quickJumpOpen);
                setSearchQuery('');
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-default bg-surface hover:bg-surface-sunken text-default transition-all shadow-2xs cursor-pointer',
                quickJumpOpen && 'border-primary/40 bg-surface-sunken'
              )}
              title="Jump directly to any of the 5 inventory views"
            >
              <SlidersHorizontal className="size-3.5 text-primary" />
              <span>All 5 Views</span>
            </button>

            {quickJumpOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-surface rounded-2xl border border-default shadow-lg p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search inventory views..."
                    autoFocus
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface-sunken rounded-lg border border-default focus:border-primary focus:outline-none text-default"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-default"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {CATEGORIES.map((cat) => {
                    const catTabs = filteredTabs.filter((t) => t.category === cat.id);
                    if (catTabs.length === 0) return null;

                    return (
                      <div key={cat.id} className="pt-1.5 first:pt-0">
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted flex items-center justify-between">
                          <span>{cat.label}</span>
                          <span className="font-mono text-[9px]">{catTabs.length}</span>
                        </div>
                        <div className="space-y-0.5">
                          {catTabs.map((tab) => {
                            const TabIcon = tab.icon;
                            const isTabActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  setQuickJumpOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
                                  isTabActive
                                    ? 'bg-primary text-primary-fg font-semibold'
                                    : 'hover:bg-surface-sunken text-default'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <TabIcon
                                    className={`size-3.5 shrink-0 ${
                                      isTabActive ? 'text-primary-fg' : 'text-muted'
                                    }`}
                                  />
                                  <span className="truncate">{tab.label}</span>
                                </div>
                                {tab.badge && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                      isTabActive
                                        ? 'bg-primary-fg/20 text-primary-fg'
                                        : 'bg-surface-sunken text-muted'
                                    }`}
                                  >
                                    {tab.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {filteredTabs.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted">
                      No inventory views found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Universal Quick-Action Ribbon */}
      <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-surface border border-default shadow-xs flex-wrap">
        <button
          type="button"
          onClick={() => {
            setActiveTab('ledger');
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-fg shadow-xs transition cursor-pointer"
        >
          <Search className="size-4" />
          <span>🔍 Quick Stock Check</span>
        </button>
        <button
          type="button"
          onClick={() => setShowTransferModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
        >
          <ArrowRightLeft className="size-4" />
          <span>🔄 Move Stock (Transfer)</span>
        </button>
        <button
          type="button"
          onClick={() => setShowAdjustmentModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
        >
          <AlertTriangle className="size-4" />
          <span>📝 Report Damaged / Lost Items</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('counts')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-sunken hover:bg-surface border border-default text-default transition cursor-pointer"
        >
          <ClipboardCheck className="size-4 text-emerald-500" />
          <span>📋 Start Physical Stock Count</span>
        </button>
      </div>

      {/* Primary 2 Command Pillars (with Embedded Direct Child Pills) */}
      <div
        role="tablist"
        aria-label="Inventory Operational Domains"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {CATEGORIES.map((cat) => {
          const isCatActive = activeCategory === cat.id;
          const Icon = cat.icon;
          const childTabs = tabs.filter((t) => t.category === cat.id);

          return (
            <div
              key={cat.id}
              role="tab"
              aria-selected={isCatActive}
              tabIndex={isCatActive ? 0 : -1}
              onClick={() => setActiveTab(cat.defaultTab)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(cat.defaultTab);
                }
              }}
              className={cn(
                'group relative flex flex-col justify-between p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-2xs',
                isCatActive
                  ? 'bg-surface border-primary shadow-md ring-2 ring-primary/10'
                  : 'bg-surface hover:bg-surface-sunken border-default hover:border-default/80'
              )}
            >
              {/* Pillar Top Header */}
              <div className="flex items-start gap-3.5 w-full">
                <div
                  className={cn(
                    'size-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs',
                    isCatActive
                      ? 'bg-primary text-primary-fg shadow-sm'
                      : 'bg-surface-sunken border border-default text-muted group-hover:text-default'
                  )}
                >
                  <Icon className={cn('size-5 shrink-0', isCatActive ? 'text-primary-fg' : 'text-muted group-hover:text-default')} />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={cn(
                          'text-sm font-bold transition-colors truncate',
                          isCatActive ? 'text-default' : 'text-default/90 group-hover:text-default'
                        )}
                      >
                        {cat.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted/70 font-semibold px-1 py-0.2 rounded bg-surface-sunken border border-default/50 select-none">
                        [{cat.shortcut}]
                      </span>
                    </div>

                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shrink-0',
                        isCatActive
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-surface-sunken text-muted border-default'
                      )}
                    >
                      {childTabs.length} {childTabs.length === 1 ? 'view' : 'views'}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                    {cat.tagline}
                  </p>
                </div>
              </div>

              {/* In-Pillar Quick Navigation Pills (100% Zero Concealed Views) */}
              <div className="mt-4 pt-3 border-t border-default/60 flex flex-wrap items-center gap-1.5">
                {childTabs.map((subTab) => {
                  const isCurrent = activeTab === subTab.id;
                  const SubIcon = subTab.icon;
                  return (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(subTab.id);
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
                        isCurrent
                          ? 'bg-primary text-primary-fg font-semibold shadow-xs ring-1 ring-primary'
                          : 'bg-surface-sunken text-muted hover:text-default hover:bg-surface border border-default/70'
                      )}
                      title={`Open ${subTab.label}`}
                    >
                      <SubIcon className={cn('size-3.5', isCurrent ? 'text-primary-fg' : 'text-muted')} />
                      <span>{subTab.shortLabel}</span>
                      {subTab.badge && !isCurrent && (
                        <span className="text-[9px] font-mono text-muted/80 bg-surface px-1.5 py-0.2 rounded border border-default/60">
                          {subTab.badge}
                        </span>
                      )}
                      {isCurrent && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Indicator Bar */}
              {isCatActive && (
                <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary rounded-t-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Master Grouped Navigation Ribbon (All 5 Tabs Visible Simultaneously) */}
      <div className="bg-surface-sunken rounded-2xl border border-default p-2 shadow-2xs">
        <div className="flex items-center justify-between px-2 pb-1.5 mb-1 text-[11px] font-semibold text-muted border-b border-default/50">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-primary" />
            <span>Master Inventory Ribbon (1-Click Reachability)</span>
          </div>
          <span className="text-[10px] font-mono text-muted/70">
            Active: <strong className="text-default">{currentTab?.label}</strong>
          </span>
        </div>

        <nav
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="All 5 Inventory Views"
        >
          {/* Cluster 1: Stock Visibility & Controls */}
          <div className="flex items-center gap-1.5 bg-surface/60 p-1 rounded-xl border border-default/40">
            <span className="text-[10px] font-mono uppercase font-bold text-muted px-2 py-0.5 select-none">
              Controls:
            </span>
            {tabs.filter((t) => t.category === 'visibility').map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-fg shadow-xs'
                      : 'text-muted hover:text-default hover:bg-surface border border-transparent'
                  )}
                >
                  <Icon className={cn('size-3.5', isActive ? 'text-primary-fg' : 'text-muted')} />
                  <span>{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.2 rounded font-mono',
                        isActive ? 'bg-primary-fg/20 text-primary-fg' : 'bg-surface-sunken text-muted'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-default/60 hidden sm:block" />

          {/* Cluster 2: Warehouse Movements & Audits */}
          <div className="flex items-center gap-1.5 bg-surface/60 p-1 rounded-xl border border-default/40 flex-wrap">
            <span className="text-[10px] font-mono uppercase font-bold text-muted px-2 py-0.5 select-none">
              Movements:
            </span>
            {tabs.filter((t) => t.category === 'operations').map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-fg shadow-xs'
                      : 'text-muted hover:text-default hover:bg-surface border border-transparent'
                  )}
                >
                  <Icon className={cn('size-3.5', isActive ? 'text-primary-fg' : 'text-muted')} />
                  <span>{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.2 rounded font-mono',
                        isActive ? 'bg-primary-fg/20 text-primary-fg' : 'bg-surface-sunken text-muted'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Tab Content Section */}
      <div className="pt-1">
        {activeTab === 'ledger' && <StockLedgerSection />}
        {activeTab === 'thresholds' && <StockThresholdsSection />}
        {activeTab === 'transfers' && <StockTransfersSection />}
        {activeTab === 'adjustments' && <StockAdjustmentsSection />}
        {activeTab === 'counts' && <StockCountsSection />}
      </div>

      {/* Modal: Explore Capabilities & Architecture Guide */}
      <Modal
        open={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Inventory & Warehouse Operations Architecture Guide"
        size="xl"
      >
        <div className="space-y-6">
          <div className="rounded-xl bg-primary-subtle/50 border border-primary/20 p-4">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1">
              <Boxes className="size-4" />
              Unified Multi-Facility Warehouse Management
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              SliceMart Inventory provides double-entry physical stock integrity, append-only lot traceability,
              two-step inter-warehouse transit logistics, and strict scrap and discrepancy reconciliation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <div
                  key={tab.id}
                  className="rounded-xl border border-default bg-surface p-4 flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <TabIcon className="size-4" />
                        </div>
                        <h5 className="text-xs font-bold text-default">{tab.label}</h5>
                      </div>
                      {tab.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-sunken text-muted border border-default">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted leading-relaxed mb-3">{tab.description}</p>
                    <div className="space-y-1 mb-4">
                      {tab.highlights.map((h, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-default/80">
                          <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={activeTab === tab.id ? 'primary' : 'secondary'}
                    className="w-full text-xs justify-between cursor-pointer"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsGuideOpen(false);
                    }}
                  >
                    <span>{activeTab === tab.id ? 'Current View' : `Switch to ${tab.shortLabel}`}</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-surface-sunken p-4 border border-default flex items-center justify-between">
            <div className="text-xs text-muted">
              Keyboard shortcut: Press <kbd className="px-1.5 py-0.5 bg-surface rounded border border-default font-mono text-[10px] font-bold">1</kbd> for Stock Controls, <kbd className="px-1.5 py-0.5 bg-surface rounded border border-default font-mono text-[10px] font-bold">2</kbd> for Movements.
            </div>
          </div>
        </div>
      </Modal>

      {/* Action Modals */}
      <StockTransferModal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          setActiveTab('transfers');
        }}
      />

      <StockAdjustmentModal
        open={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onSuccess={() => {
          setActiveTab('adjustments');
        }}
      />
    </div>
  );
}
