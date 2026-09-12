import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Receipt,
  ShoppingCart,
  Truck,
  Undo2,
  Users,
  Target,
  Award,
  UserCheck,
  TrendingUp,
  Search,
  Store,
  Layers,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Zap,
  Check,
  ArrowLeftRight,
} from 'lucide-react';
import { SalesOrdersSection } from './sections/SalesOrdersSection';
import { InvoicesSection } from './sections/InvoicesSection';
import { DeliveriesSection } from './sections/DeliveriesSection';
import { PaymentsSection } from './sections/PaymentsSection';
import { SalesReturnsSection } from './sections/SalesReturnsSection';
import { ExchangesSection } from './sections/ExchangesSection';
import { LeadsSection } from './sections/LeadsSection';
import { CustomersSection } from './sections/CustomersSection';
import { SalesmenProfilesSection } from './sections/SalesmenProfilesSection';
import { SalesmanTargetsSection } from './sections/SalesmanTargetsSection';
import { IncentivesSection } from './sections/IncentivesSection';
import { SalesmanDashboardSection } from './sections/SalesmanDashboardSection';

import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

export type SalesTab =
  | 'orders'
  | 'invoices'
  | 'deliveries'
  | 'payments'
  | 'returns'
  | 'exchanges'
  | 'customers'
  | 'leads'
  | 'salesmen'
  | 'targets'
  | 'incentives'
  | 'dashboard';

const VALID_TABS: readonly SalesTab[] = [
  'orders',
  'invoices',
  'deliveries',
  'payments',
  'returns',
  'exchanges',
  'customers',
  'leads',
  'salesmen',
  'targets',
  'incentives',
  'dashboard',
];

export type SalesCategory = 'operations' | 'crm' | 'performance';

interface TabConfig {
  id: SalesTab;
  label: string;
  shortLabel: string;
  category: SalesCategory;
  icon: typeof ShoppingCart;
  description: string;
  highlights: string[];
  badge?: string;
  step?: number;
}

interface CategoryConfig {
  id: SalesCategory;
  label: string;
  tagline: string;
  icon: typeof Layers;
  tabs: SalesTab[];
  defaultTab: SalesTab;
  shortcut: string;
  badge: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'operations',
    label: 'Orders & Invoicing',
    tagline: 'Sales Orders, Invoices, Dispatch, Payments & Exchanges',
    icon: Layers,
    tabs: ['orders', 'invoices', 'deliveries', 'payments', 'returns', 'exchanges'],
    defaultTab: 'orders',
    shortcut: '1',
    badge: '6 Capabilities',
  },
  {
    id: 'crm',
    label: 'Customer Leads & CRM',
    tagline: 'Commercial Leads & Customer Accounts',
    icon: Users,
    tabs: ['leads', 'customers'],
    defaultTab: 'leads',
    shortcut: '2',
    badge: '2 Capabilities',
  },
  {
    id: 'performance',
    label: 'Sales Team & Commissions',
    tagline: 'Sales Reps, Monthly Targets & Commission Bonuses',
    icon: TrendingUp,
    tabs: ['salesmen', 'targets', 'incentives', 'dashboard'],
    defaultTab: 'salesmen',
    shortcut: '3',
    badge: '4 Capabilities',
  },
];

const TABS: TabConfig[] = [
  {
    id: 'orders',
    label: 'Sales Orders',
    shortLabel: 'Orders',
    category: 'operations',
    step: 1,
    icon: ShoppingCart,
    description: 'Track and approve customer purchase orders from quote to delivery',
    highlights: ['Multi-channel order capture', 'Order status progression', 'Direct invoice generation'],
  },
  {
    id: 'invoices',
    label: 'Invoices & Billing',
    shortLabel: 'Invoices',
    category: 'operations',
    step: 2,
    icon: FileText,
    description: 'Customer invoices, payment terms, VAT calculation and payment due dates',
    highlights: ['VAT tax invoices', 'Due dates & payment terms', 'Direct ledger posting'],
  },
  {
    id: 'deliveries',
    label: 'Deliveries & Dispatch',
    shortLabel: 'Deliveries',
    category: 'operations',
    step: 3,
    icon: Truck,
    description: 'Warehouse dispatch, stock deduction, packing slips and delivery receipts',
    highlights: ['Stock deduction dispatch', 'Gate pass & packing slips', 'Proof of delivery'],
  },
  {
    id: 'payments',
    label: 'Payments & Receipts',
    shortLabel: 'Payments',
    category: 'operations',
    step: 4,
    icon: Receipt,
    description: 'Record customer payments, cash/bank receipts and reconcile open invoices',
    highlights: ['Multi-tender collection', 'Invoice reconciliation', 'Instant cash/bank receipts'],
  },
  {
    id: 'returns',
    label: 'Customer Returns & Refunds',
    shortLabel: 'Returns',
    category: 'operations',
    badge: 'Returns',
    icon: Undo2,
    description: 'Process returned items, issue credit notes and restock good inventory',
    highlights: ['Condition inspection', 'Credit note refunds', 'Automatic warehouse restock'],
  },
  {
    id: 'exchanges',
    label: 'Product Exchanges',
    shortLabel: 'Exchanges',
    category: 'operations',
    badge: 'Exchange',
    icon: ArrowLeftRight,
    description: 'Swap returned products for replacements in one atomic transaction with auto-calculated difference',
    highlights: ['Return + dispatch in one step', 'Auto difference calculation', 'POS & B2B support'],
  },
  {
    id: 'leads',
    label: 'Customer Leads',
    shortLabel: 'Leads',
    category: 'crm',
    badge: 'Leads',
    icon: UserCheck,
    description: 'Track potential buyers, qualify deals and turn leads into active customers',
    highlights: ['Deal stages pipeline', 'Follow-up scheduling', '1-click customer conversion'],
  },
  {
    id: 'customers',
    label: 'Customer Directory',
    shortLabel: 'Customers',
    category: 'crm',
    badge: 'Accounts',
    icon: Users,
    description: 'Full customer list, contact details, past purchases and unpaid balance statements',
    highlights: ['Statement of accounts', 'Credit limits & balances', 'Contact profiles'],
  },
  {
    id: 'salesmen',
    label: 'Sales Representatives',
    shortLabel: 'Sales Reps',
    category: 'performance',
    badge: 'Profiles',
    icon: UserCheck,
    description: 'Sales team member profiles, assigned regions, contact info and performance',
    highlights: ['Territory assignments', 'Performance index', 'Commission earnings profile'],
  },
  {
    id: 'targets',
    label: 'Monthly Targets',
    shortLabel: 'Sales Targets',
    category: 'performance',
    badge: 'Goals',
    icon: Target,
    description: 'Set monthly sales targets, revenue quotas and track rep achievements',
    highlights: ['Monthly volume & revenue quotas', 'Deficit variance alerts', 'Historical audit'],
  },
  {
    id: 'incentives',
    label: 'Commissions & Bonuses',
    shortLabel: 'Commissions',
    category: 'performance',
    badge: 'Bonuses',
    icon: Award,
    description: 'Commission calculation rules, bonus payouts and manager approvals',
    highlights: ['Tiered commission formulas', 'Automated payout calculation', 'Approval workflow gate'],
  },
  {
    id: 'dashboard',
    label: 'Rep Performance Dashboard',
    shortLabel: 'Rep Dashboard',
    category: 'performance',
    badge: 'Analytics',
    icon: TrendingUp,
    description: 'Personal sales dashboard with live target progress, active deals and earned bonuses',
    highlights: ['Real-time quota gauges', 'Active deal stage tracker', 'Monthly bonus projection'],
  },
];

export default function SalesWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<SalesTab>('orders', VALID_TABS);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(null);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const quickJumpRef = useRef<HTMLDivElement>(null);

  // Derive active category from current active tab
  const activeCategory = CATEGORIES.find((cat) => cat.tabs.includes(activeTab))?.id ?? 'operations';
  const activeCategoryConfig: CategoryConfig =
    CATEGORIES.find((cat) => cat.id === activeCategory) ?? CATEGORIES[0]!;
  const currentTab: TabConfig = TABS.find((t) => t.id === activeTab) ?? TABS[0]!;
  const CategoryIcon = activeCategoryConfig.icon;

  // Remember last visited tab per category for seamless back-and-forth switching
  const lastActivePerCategory = useRef<Record<SalesCategory, SalesTab>>({
    operations: 'orders',
    crm: 'leads',
    performance: 'salesmen',
  });

  useEffect(() => {
    const cat = CATEGORIES.find((c) => c.tabs.includes(activeTab))?.id;
    if (cat) {
      lastActivePerCategory.current[cat] = activeTab;
    }
  }, [activeTab]);

  // Close Quick Jump popover on click outside
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

  const handleSelectCategory = useCallback((categoryId: SalesCategory) => {
    if (categoryId === activeCategory) return;
    const targetTab =
      lastActivePerCategory.current[categoryId] ??
      CATEGORIES.find((cat) => cat.id === categoryId)?.defaultTab ??
      'orders';
    setActiveTab(targetTab);
  }, [activeCategory, setActiveTab]);

  // Global hotkeys (1, 2, 3) to switch category pillars when outside form inputs
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        handleSelectCategory('operations');
      } else if (e.key === '2') {
        e.preventDefault();
        handleSelectCategory('crm');
      } else if (e.key === '3') {
        e.preventDefault();
        handleSelectCategory('performance');
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleSelectCategory]);

  const filteredTabs = searchQuery.trim()
    ? TABS.filter(
        (t) =>
          t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shortLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : TABS;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Workspace Header & Action Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
              Commercial & Sales Hub
            </span>
            <span className="text-[10px] text-muted font-medium bg-surface-sunken px-2 py-0.5 rounded-full border border-default">
              11 Sub-Modules Available
            </span>
            <span className="text-muted/50 text-xs">/</span>
            <span className="text-[11px] font-medium text-muted flex items-center gap-1">
              <CategoryIcon className="size-3 text-muted" />
              {activeCategoryConfig.label}
            </span>
            <span className="text-muted/50 text-xs">/</span>
            <span className="text-[11px] font-semibold text-default">
              {currentTab?.label}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default flex items-center gap-3">
            <span>{currentTab?.label}</span>
            {currentTab?.badge && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-sunken text-muted border border-default">
                {currentTab.badge}
              </span>
            )}
          </h1>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            {currentTab?.description}
          </p>
        </div>

        {/* Quick External Actions & Guides */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-primary/30 bg-primary-subtle hover:bg-primary/10 text-primary transition-all shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Open Sales Capabilities and Commercial Guide"
          >
            <Compass className="size-3.5 text-primary" />
            <span>Explore Capabilities</span>
          </button>

          <Link
            to="/pos"
            className="flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-sunken text-default text-xs font-semibold rounded-xl border border-default shadow-2xs transition-colors"
          >
            <Store className="size-3.5 text-primary" />
            <span>Open POS Terminal</span>
          </Link>

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
              title="Jump directly to any of the 11 sales tabs"
            >
              <SlidersHorizontal className="size-3.5 text-primary" />
              <span>All 11 Views</span>
            </button>

            {quickJumpOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-surface border border-default shadow-2xl z-50 p-2 text-default animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="relative mb-2 px-1">
                  <Search className="absolute left-3.5 top-2.5 size-3.5 text-muted" />
                  <input
                    type="text"
                    placeholder="Jump to sales view..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-sunken border border-default rounded-xl outline-hidden focus:border-primary text-default placeholder:text-muted"
                  />
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1">
                  {CATEGORIES.map((cat) => {
                    const catTabs = filteredTabs.filter((t) => t.category === cat.id);
                    if (catTabs.length === 0) return null;
                    return (
                      <div key={cat.id} className="pt-1">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                          {cat.label}
                        </div>
                        {catTabs.map((t) => {
                          const Icon = t.icon;
                          const isCurrent = activeTab === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(t.id);
                                setQuickJumpOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left',
                                isCurrent
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'text-default hover:bg-surface-sunken'
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className="size-3.5 shrink-0 text-muted" />
                                <span className="truncate">{t.label}</span>
                              </div>
                              {isCurrent && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Universal Commercial Sales Quick-Action Ribbon */}
      <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-surface to-surface-raised p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-default">
              <Zap className="size-3.5 text-amber-500 fill-amber-500" />
              <span>Quick Actions • Sales & Revenue Flow</span>
            </div>
            <p className="text-[11px] text-muted">
              Book customer orders, issue invoices, collect outstanding dues, or dispatch shipments with 1 click.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <ShoppingCart className="size-3.5" />
              <span>New Customer Order</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <FileText className="size-3.5" />
              <span>Invoices & Billing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-sunken text-default border border-default shadow-2xs transition-all cursor-pointer"
            >
              <Receipt className="size-3.5 text-emerald-600" />
              <span>Collect Payment</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deliveries')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-sunken text-default border border-default shadow-2xs transition-all cursor-pointer"
            >
              <Truck className="size-3.5 text-cyan-600" />
              <span>Dispatch Delivery</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary 3 Command Pillars (with Embedded Direct Child Pills) */}
      <div
        role="tablist"
        aria-label="Sales Commercial Subsystems"
        className="grid grid-cols-1 lg:grid-cols-3 gap-3"
      >
        {CATEGORIES.map((cat) => {
          const isCatActive = activeCategory === cat.id;
          const Icon = cat.icon;
          const childTabs = TABS.filter((t) => t.category === cat.id);

          return (
            <div
              key={cat.id}
              role="tab"
              aria-selected={isCatActive}
              tabIndex={isCatActive ? 0 : -1}
              onClick={() => handleSelectCategory(cat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectCategory(cat.id);
                }
              }}
              className={cn(
                'group relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-2xs',
                isCatActive
                  ? 'bg-surface border-primary shadow-md ring-2 ring-primary/10'
                  : 'bg-surface hover:bg-surface-sunken border-default hover:border-default/80'
              )}
            >
              {/* Pillar Top Header */}
              <div className="flex items-start gap-3 w-full">
                <div
                  className={cn(
                    'size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs',
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
                          'text-xs font-bold transition-colors truncate',
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
                      {cat.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted line-clamp-1">{cat.tagline}</p>
                </div>
              </div>

              {/* Embedded Direct Child Pills (100% Visible at All Times) */}
              <div className="mt-3.5 pt-2.5 border-t border-default/60 flex flex-wrap gap-1.5 w-full">
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
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
                        isCurrent
                          ? 'bg-primary text-primary-fg font-semibold shadow-xs ring-1 ring-primary/30'
                          : 'bg-surface-sunken hover:bg-surface text-muted hover:text-default border border-default/60'
                      )}
                      title={subTab.description}
                    >
                      <SubIcon className={cn('size-3', isCurrent ? 'text-primary-fg' : 'text-muted')} />
                      <span>{subTab.shortLabel}</span>
                      {isCurrent && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Indicator Bar */}
              {isCatActive && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Master Navigation Ribbon (All 11 Sub-Modules Visible Simultaneously) */}
      <div className="bg-surface-sunken rounded-2xl border border-default p-2 shadow-2xs">
        <div className="flex items-center justify-between px-2 pb-1.5 mb-1 text-[11px] font-semibold text-muted border-b border-default/50">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-primary" />
            <span>Sales Master Navigation Ribbon</span>
          </div>
          <span className="text-[10px] font-mono text-muted/70">
            Active: <strong className="text-default">{currentTab?.label}</strong>
          </span>
        </div>

        <nav
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="All 11 Sales Sub-Modules"
        >
          {/* Cluster 1: Order to Cash */}
          <div className="flex items-center gap-1.5 bg-surface/60 p-1 rounded-xl border border-default/40">
            <span className="text-[10px] font-mono uppercase font-bold text-muted px-2 py-0.5 select-none">
              Order to Cash:
            </span>
            {TABS.filter((t) => t.category === 'operations').map((tab) => {
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
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-default hidden sm:block" />

          {/* Cluster 2: CRM & Accounts */}
          <div className="flex items-center gap-1.5 bg-surface/60 p-1 rounded-xl border border-default/40">
            <span className="text-[10px] font-mono uppercase font-bold text-muted px-2 py-0.5 select-none">
              CRM:
            </span>
            {TABS.filter((t) => t.category === 'crm').map((tab) => {
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
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-default hidden sm:block" />

          {/* Cluster 3: Sales Force & Quotas */}
          <div className="flex items-center gap-1.5 bg-surface/60 p-1 rounded-xl border border-default/40">
            <span className="text-[10px] font-mono uppercase font-bold text-muted px-2 py-0.5 select-none">
              Sales Force:
            </span>
            {TABS.filter((t) => t.category === 'performance').map((tab) => {
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
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Capabilities & Commercial Guide Modal */}
      <Modal
        open={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Sales & Commercial Operations Guide"
        size="xl"
      >
        <div className="space-y-5 p-1 text-default">
          <p className="text-xs text-muted leading-relaxed">
            The Commercial & Sales Hub governs the full revenue lifecycle—from top-of-funnel lead qualification to omnichannel order capture, VAT tax invoicing, warehouse dispatch, cash collection, and sales quota commissions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isCurrent = activeTab === tab.id;
              return (
                <div
                  key={tab.id}
                  className={cn(
                    'p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between',
                    isCurrent
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-default bg-surface hover:bg-surface-sunken'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-surface-sunken border border-default flex items-center justify-center text-primary">
                          <Icon className="size-4" />
                        </div>
                        <h4 className="text-xs font-bold text-default">{tab.label}</h4>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary-subtle px-2 py-0.5 rounded-full border border-primary/20">
                          Current Tab
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed mb-2.5">
                      {tab.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tab.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-surface-sunken text-muted border border-default/50"
                        >
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant={isCurrent ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-full flex items-center justify-center gap-1.5"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsGuideOpen(false);
                    }}
                  >
                    <span>{isCurrent ? 'Viewing Now' : `Open ${tab.label}`}</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-default bg-surface-sunken p-3.5 space-y-1.5 text-xs">
            <h5 className="font-bold text-default flex items-center gap-1.5">
              <Zap className="size-3.5 text-primary" />
              Keyboard Shortcuts & Quick Navigation
            </h5>
            <ul className="text-[11px] text-muted space-y-1 list-disc list-inside">
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-default font-mono font-bold text-default">1</kbd> to jump to Order to Cash (Orders, Invoices, Deliveries)</li>
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-default font-mono font-bold text-default">2</kbd> to jump to CRM & Accounts (Leads & Customer CRM)</li>
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-default font-mono font-bold text-default">3</kbd> to jump to Sales Force & Quotas (Salesmen, Targets, Incentives)</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Tab Content Canvas */}
      <div className="pt-1">
        {activeTab === 'orders' && (
          <SalesOrdersSection onNavigateToTab={(tab) => setActiveTab(tab as SalesTab)} />
        )}
        {activeTab === 'invoices' && (
          <InvoicesSection onNavigateToTab={(tab) => setActiveTab(tab as SalesTab)} />
        )}
        {activeTab === 'deliveries' && <DeliveriesSection />}
        {activeTab === 'payments' && <PaymentsSection />}
        {activeTab === 'returns' && <SalesReturnsSection />}
        {activeTab === 'exchanges' && <ExchangesSection />}
        {activeTab === 'customers' && <CustomersSection />}
        {activeTab === 'leads' && <LeadsSection />}
        {activeTab === 'salesmen' && (
          <SalesmenProfilesSection
            onSelectSalesmanForDashboard={(empId) => {
              setSelectedSalesmanId(empId);
              setActiveTab('dashboard');
            }}
          />
        )}
        {activeTab === 'targets' && <SalesmanTargetsSection />}
        {activeTab === 'incentives' && <IncentivesSection />}
        {activeTab === 'dashboard' && (
          <SalesmanDashboardSection initialSalesmanId={selectedSalesmanId} />
        )}
      </div>
    </div>
  );
}

