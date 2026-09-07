import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Receipt,
  ShoppingCart,
  Truck,
  Undo2,
  Users,
  Kanban,
  Target,
  Award,
  UserCheck,
  TrendingUp,
  ChevronRight,
  Search,
  Store,
  Layers,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { SalesOrdersSection } from './sections/SalesOrdersSection';
import { InvoicesSection } from './sections/InvoicesSection';
import { DeliveriesSection } from './sections/DeliveriesSection';
import { PaymentsSection } from './sections/PaymentsSection';
import { SalesReturnsSection } from './sections/SalesReturnsSection';
import { LeadsSection } from './sections/LeadsSection';
import { CustomersSection } from './sections/CustomersSection';
import { SalesmenProfilesSection } from './sections/SalesmenProfilesSection';
import { SalesmanTargetsSection } from './sections/SalesmanTargetsSection';
import { IncentivesSection } from './sections/IncentivesSection';
import { SalesmanDashboardSection } from './sections/SalesmanDashboardSection';

import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';

export type SalesTab =
  | 'orders'
  | 'invoices'
  | 'deliveries'
  | 'payments'
  | 'returns'
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
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'operations',
    label: 'Order to Cash',
    tagline: 'Orders, Invoicing, Dispatch & Collections',
    icon: Layers,
    tabs: ['orders', 'invoices', 'deliveries', 'payments', 'returns'],
    defaultTab: 'orders',
  },
  {
    id: 'crm',
    label: 'CRM & Accounts',
    tagline: 'Leads Pipeline & Customer Balances',
    icon: Users,
    tabs: ['leads', 'customers'],
    defaultTab: 'leads',
  },
  {
    id: 'performance',
    label: 'Sales Force & Quotas',
    tagline: 'Reps, Quotas, Commissions & Analytics',
    icon: TrendingUp,
    tabs: ['salesmen', 'targets', 'incentives', 'dashboard'],
    defaultTab: 'salesmen',
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
    description: 'Omnichannel order management, dealer contracts, quotation approval & fulfillment',
  },
  {
    id: 'invoices',
    label: 'Invoices & Billing',
    shortLabel: 'Invoices',
    category: 'operations',
    step: 2,
    icon: FileText,
    description: 'Customer VAT tax invoices, billing terms, posting & payment tracking',
  },
  {
    id: 'deliveries',
    label: 'Deliveries & Dispatch',
    shortLabel: 'Deliveries',
    category: 'operations',
    step: 3,
    icon: Truck,
    description: 'Warehouse dispatch, stock issue deduction, delivery notes & COD handling',
  },
  {
    id: 'payments',
    label: 'Payments & Receipts',
    shortLabel: 'Payments',
    category: 'operations',
    step: 4,
    icon: Receipt,
    description: 'Customer payment collections, multi-tender receipts & invoice allocations',
  },
  {
    id: 'returns',
    label: 'Sales Returns (RMA)',
    shortLabel: 'Returns',
    category: 'operations',
    badge: 'Reverse Logistics',
    icon: Undo2,
    description: 'Return merchandise authorization, credit notes & restock movements',
  },
  {
    id: 'leads',
    label: 'Commercial Leads',
    shortLabel: 'Leads Pipeline',
    category: 'crm',
    badge: 'Pipeline',
    icon: Kanban,
    description: 'Opportunity pipeline, stage tracking, quotation follow-up & win/loss analytics',
  },
  {
    id: 'customers',
    label: 'Customer CRM',
    shortLabel: 'Customers',
    category: 'crm',
    badge: 'Accounts',
    icon: Users,
    description: 'Customer accounts directory, statements & balance receivables',
  },
  {
    id: 'salesmen',
    label: 'Salesmen Directory',
    shortLabel: 'Sales Reps',
    category: 'performance',
    badge: 'Profiles',
    icon: UserCheck,
    description: 'Sales representative profiles, quota achievements, lead conversion pipeline & earnings',
  },
  {
    id: 'targets',
    label: 'Sales Targets',
    shortLabel: 'Target Quotas',
    category: 'performance',
    badge: 'Quotas',
    icon: Target,
    description: 'Monthly commercial target quotas, periodic assignment, deficit tracking & audits',
  },
  {
    id: 'incentives',
    label: 'Incentive Engine',
    shortLabel: 'Commissions',
    category: 'performance',
    badge: 'Incentives',
    icon: Award,
    description: 'Tiered commission policies, automated quota evaluation & management approval workflows',
  },
  {
    id: 'dashboard',
    label: 'Salesman Dashboard',
    shortLabel: 'Rep Dashboard',
    category: 'performance',
    badge: 'Live Analytics',
    icon: TrendingUp,
    description: 'Representative personal dashboard with real-time target, leads, conversion & bonus metrics',
  },
];

export default function SalesWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<SalesTab>('orders', VALID_TABS);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(null);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
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

  const handleSelectCategory = (categoryId: SalesCategory) => {
    if (categoryId === activeCategory) return;
    const targetTab =
      lastActivePerCategory.current[categoryId] ??
      CATEGORIES.find((cat) => cat.id === categoryId)?.defaultTab ??
      'orders';
    setActiveTab(targetTab);
  };

  const currentCategoryTabs = TABS.filter((t) => t.category === activeCategory);

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

        {/* Quick External Actions & POS Link */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/pos"
            className="flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-sunken text-default text-xs font-semibold rounded-xl border border-default shadow-2xs transition-colors"
          >
            <Store className="size-3.5 text-primary" />
            <span>Open POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* Intuitive Two-Tier Navigation */}
      <div className="space-y-3">
        {/* Tier 1: Workflow Category Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
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
                  <p className="text-[11px] text-muted truncate mt-0.5">
                    {cat.tagline}
                  </p>
                </div>
                {isCatActive && (
                  <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tier 2: Contextual Sub-Navigation Bar with Quick Jump */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-surface rounded-2xl border border-default shadow-2xs">
          {/* Sub-Tab Items for the Active Category */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-none min-w-0">
            {currentCategoryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isWorkflowStep = tab.category === 'operations' && tab.step !== undefined;
              const isReturns = tab.id === 'returns';

              return (
                <div key={tab.id} className="flex items-center gap-1.5 shrink-0">
                  {/* Visual pipeline arrow before step 2, 3, 4 */}
                  {isWorkflowStep && tab.step && tab.step > 1 && (
                    <ChevronRight className="size-3.5 text-muted/40 shrink-0 hidden md:block" />
                  )}

                  {/* Visual separator before Returns (Reverse Logistics) */}
                  {isReturns && (
                    <div className="h-4 w-px bg-default mx-1 hidden sm:block" />
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-primary text-primary-fg font-semibold shadow-xs border border-primary'
                        : 'text-muted hover:text-default hover:bg-surface-sunken border border-transparent'
                    }`}
                  >
                    {isWorkflowStep && tab.step && (
                      <span
                        className={`size-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-primary-fg/20 text-primary-fg'
                            : 'bg-surface-sunken text-muted'
                        }`}
                      >
                        {tab.step}
                      </span>
                    )}
                    <Icon className={`size-3.5 ${isActive ? 'text-primary-fg' : 'text-muted'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && !isActive && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-sunken text-muted font-mono">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                </div>
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
              title="Jump directly to any of the 11 sales tabs"
            >
              <SlidersHorizontal className="size-3.5 text-muted" />
              <span>All Views</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-sunken text-muted border border-default">
                11
              </span>
            </button>

            {/* Quick Jump Floating Menu */}
            {quickJumpOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-surface rounded-2xl border border-default shadow-lg p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all sales views..."
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
                                className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
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
                      No sales views found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content Canvas */}
      <div className="pt-1">
        {activeTab === 'orders' && (
          <SalesOrdersSection onNavigateToTab={(tab) => setActiveTab(tab as SalesTab)} />
        )}
        {activeTab === 'invoices' && <InvoicesSection />}
        {activeTab === 'deliveries' && <DeliveriesSection />}
        {activeTab === 'payments' && <PaymentsSection />}
        {activeTab === 'returns' && <SalesReturnsSection />}
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

