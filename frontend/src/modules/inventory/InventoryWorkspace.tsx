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
} from 'lucide-react';
import { StockLedgerSection } from './sections/StockLedgerSection';
import { StockTransfersSection } from './sections/StockTransfersSection';
import { StockAdjustmentsSection } from './sections/StockAdjustmentsSection';
import { StockCountsSection } from './sections/StockCountsSection';
import { StockThresholdsSection } from './sections/StockThresholdsSection';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';

export type InventoryTab = 'ledger' | 'transfers' | 'adjustments' | 'counts' | 'thresholds';

const VALID_TABS: readonly InventoryTab[] = ['ledger', 'transfers', 'adjustments', 'counts', 'thresholds'];

export type InventoryCategory = 'visibility' | 'operations';

interface CategoryConfig {
  id: InventoryCategory;
  label: string;
  tagline: string;
  icon: typeof Boxes;
  tabs: InventoryTab[];
  defaultTab: InventoryTab;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'visibility',
    label: 'Stock Visibility & Controls',
    tagline: 'Ledger balances, lot audit trails & replenishment thresholds',
    icon: Boxes,
    tabs: ['ledger', 'thresholds'],
    defaultTab: 'ledger',
  },
  {
    id: 'operations',
    label: 'Warehouse Movements & Audits',
    tagline: 'Inter-warehouse transfers, waste adjustments & cycle counts',
    icon: Warehouse,
    tabs: ['transfers', 'adjustments', 'counts'],
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
}

const tabs: TabConfig[] = [
  {
    id: 'ledger',
    label: 'Stock Ledger & Balances',
    shortLabel: 'Stock Ledger',
    category: 'visibility',
    badge: 'Live Stock',
    icon: Boxes,
    description:
      'Real-time multi-warehouse inventory levels and append-only stock movement audit ledger',
  },
  {
    id: 'thresholds',
    label: 'Minimum Stock & Alerts',
    shortLabel: 'Reorder Alerts',
    category: 'visibility',
    badge: 'Safety Stock',
    icon: AlertTriangle,
    description:
      'Warehouse reorder thresholds, safety stock buffers and real-time replenishment alerts',
  },
  {
    id: 'transfers',
    label: 'Stock Transfers',
    shortLabel: 'Transfers',
    category: 'operations',
    badge: 'Transit',
    icon: ArrowRightLeft,
    description:
      'Inter-warehouse logistics, transit tracking & two-step dispatch/receive verification',
  },
  {
    id: 'adjustments',
    label: 'Stock Adjustments',
    shortLabel: 'Adjustments',
    category: 'operations',
    badge: 'Discrepancy',
    icon: Scale,
    description:
      'Wastage, damage write-offs, gain/loss corrections with mandatory reason codes & approval gate',
  },
  {
    id: 'counts',
    label: 'Physical Stock Counts',
    shortLabel: 'Cycle Counts',
    category: 'operations',
    badge: 'Audit & Rec',
    icon: ClipboardCheck,
    description:
      'Periodic cycle & full physical audits with snapshotting and automated variance reconciliation',
  },
];

export default function InventoryWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<InventoryTab>('ledger', VALID_TABS);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const quickJumpRef = useRef<HTMLDivElement>(null);

  const activeCategory = CATEGORIES.find((cat) => cat.tabs.includes(activeTab))?.id ?? 'visibility';
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0]!;

  const lastActivePerCategory = useRef<Record<InventoryCategory, InventoryTab>>({
    visibility: 'ledger',
    operations: 'transfers',
  });

  useEffect(() => {
    const cat = CATEGORIES.find((c) => c.tabs.includes(activeTab))?.id;
    if (cat) {
      lastActivePerCategory.current[cat] = activeTab;
    }
  }, [activeTab]);

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

  const handleSelectCategory = (categoryId: InventoryCategory) => {
    if (categoryId === activeCategory) return;
    const targetTab =
      lastActivePerCategory.current[categoryId] ??
      CATEGORIES.find((cat) => cat.id === categoryId)?.defaultTab ??
      'ledger';
    setActiveTab(targetTab);
  };

  const currentCategoryTabs = tabs.filter((t) => t.category === activeCategory);

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
              Inventory & Warehouse
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
      </div>

      {/* Two-Tier Inventory Navigation */}
      <div className="space-y-3">
        {/* Tier 1: Category Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`relative flex items-start gap-3.5 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isCatActive
                    ? 'bg-surface border-primary/40 shadow-sm ring-1 ring-primary/20'
                    : 'bg-surface-sunken/40 border-default hover:bg-surface hover:border-default/80 text-muted'
                }`}
              >
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isCatActive
                      ? 'bg-primary text-primary-fg shadow-2xs'
                      : 'bg-surface border border-default text-muted group-hover:text-default'
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-bold tracking-tight truncate ${
                        isCatActive ? 'text-default' : 'text-default/80'
                      }`}
                    >
                      {cat.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isCatActive
                          ? 'bg-primary-subtle text-primary border-primary/20 font-bold'
                          : 'bg-surface text-muted border-default'
                      }`}
                    >
                      {cat.tabs.length} views
                    </span>
                  </div>
                  <p className="text-[11px] text-muted truncate mt-0.5">{cat.tagline}</p>
                </div>
                {isCatActive && (
                  <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tier 2: Contextual Sub-Navigation Bar & Quick Jump Popover */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-surface rounded-2xl border border-default shadow-2xs">
          {/* Sub-Tabs for Active Category */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-none min-w-0">
            {currentCategoryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-fg font-semibold shadow-xs border border-primary'
                      : 'text-muted hover:text-default hover:bg-surface-sunken border border-transparent'
                  }`}
                >
                  <Icon className={`size-3.5 ${isActive ? 'text-primary-fg' : 'text-muted'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
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

          {/* Quick Jump Dropdown Popover */}
          <div className="relative shrink-0 sm:border-l sm:border-default sm:pl-3" ref={quickJumpRef}>
            <button
              type="button"
              onClick={() => {
                setQuickJumpOpen(!quickJumpOpen);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer w-full sm:w-auto justify-between sm:justify-start ${
                quickJumpOpen
                  ? 'bg-surface-sunken text-default border border-default'
                  : 'text-muted hover:text-default hover:bg-surface-sunken/60 border border-transparent'
              }`}
              title="Jump directly to any of the 5 inventory views"
            >
              <SlidersHorizontal className="size-3.5 text-muted" />
              <span>All Views</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-sunken text-muted border border-default">
                5
              </span>
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

      {/* Tab Content Section */}
      <div className="pt-1">
        {activeTab === 'ledger' && <StockLedgerSection />}
        {activeTab === 'thresholds' && <StockThresholdsSection />}
        {activeTab === 'transfers' && <StockTransfersSection />}
        {activeTab === 'adjustments' && <StockAdjustmentsSection />}
        {activeTab === 'counts' && <StockCountsSection />}
      </div>
    </div>
  );
}

