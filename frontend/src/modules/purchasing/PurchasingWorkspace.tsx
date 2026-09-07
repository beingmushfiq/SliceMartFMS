import { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  PackageCheck,
  Receipt,
  ShoppingCart,
  Undo2,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { PurchaseOrdersSection } from './sections/PurchaseOrdersSection';
import { GoodsReceiptsSection } from './sections/GoodsReceiptsSection';
import { PurchaseRequisitionsSection } from './sections/PurchaseRequisitionsSection';
import { PurchaseBillsSection } from './sections/PurchaseBillsSection';
import { PurchaseReturnsSection } from './sections/PurchaseReturnsSection';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';

export type PurchasingTab = 'requisitions' | 'orders' | 'receipts' | 'bills' | 'returns';

const VALID_TABS: readonly PurchasingTab[] = ['requisitions', 'orders', 'receipts', 'bills', 'returns'];

interface TabConfig {
  id: PurchasingTab;
  label: string;
  shortLabel: string;
  step?: number;
  badge?: string;
  icon: typeof ShoppingCart;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'requisitions',
    label: 'Purchase Requisitions',
    shortLabel: 'Requisitions',
    step: 1,
    icon: FileSpreadsheet,
    description: 'Internal shopfloor & departmental supply requests with approval workflows',
  },
  {
    id: 'orders',
    label: 'Purchase Orders',
    shortLabel: 'Orders',
    step: 2,
    icon: ShoppingCart,
    description: 'Supplier contract commitments, multi-currency purchasing & status tracking',
  },
  {
    id: 'receipts',
    label: 'Goods Receipts (GRN)',
    shortLabel: 'Goods Receipts',
    step: 3,
    icon: PackageCheck,
    description:
      'Warehouse gate receiving, 3-way match, lot assignment & instant inventory posting',
  },
  {
    id: 'bills',
    label: 'Purchase Bills (AP)',
    shortLabel: 'Bills & Invoices',
    step: 4,
    icon: Receipt,
    description:
      'Supplier invoice verification, payment due tracking & accounts payable settlement',
  },
  {
    id: 'returns',
    label: 'Purchase Returns',
    shortLabel: 'Returns',
    badge: 'Debit Notes',
    icon: Undo2,
    description:
      'Debit notes and rejected goods return to supplier with automatic inventory deduction',
  },
];

export default function PurchasingWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<PurchasingTab>('orders', VALID_TABS);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const quickJumpRef = useRef<HTMLDivElement>(null);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[1]!;

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
              Procurement & Vendor Operations
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

      {/* Procure-to-Pay (P2P) Sequential Workflow Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-surface rounded-2xl border border-default shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-none min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isWorkflowStep = tab.step !== undefined;
            const isReturns = tab.id === 'returns';

            return (
              <div key={tab.id} className="flex items-center gap-1.5 shrink-0">
                {/* Pipeline Arrow between Steps */}
                {isWorkflowStep && tab.step && tab.step > 1 && (
                  <ChevronRight className="size-3.5 text-muted/40 shrink-0 hidden md:block" />
                )}

                {/* Separator before Returns */}
                {isReturns && <div className="h-4 w-px bg-default mx-1 hidden sm:block" />}

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
                        isActive ? 'bg-primary-fg/20 text-primary-fg' : 'bg-surface-sunken text-muted'
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

        {/* Quick Jump Dropdown */}
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
            title="Jump directly to any of the 5 purchasing views"
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
                  placeholder="Search purchasing views..."
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

              <div className="max-h-72 overflow-y-auto space-y-0.5 pr-1">
                {filteredTabs.map((tab) => {
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
                      {tab.step && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                            isTabActive
                              ? 'bg-primary-fg/20 text-primary-fg'
                              : 'bg-surface-sunken text-muted'
                          }`}
                        >
                          Step {tab.step}
                        </span>
                      )}
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

                {filteredTabs.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted">
                    No purchasing views found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-1">
        {activeTab === 'requisitions' && <PurchaseRequisitionsSection />}
        {activeTab === 'orders' && <PurchaseOrdersSection />}
        {activeTab === 'receipts' && <GoodsReceiptsSection />}
        {activeTab === 'bills' && <PurchaseBillsSection />}
        {activeTab === 'returns' && <PurchaseReturnsSection />}
      </div>
    </div>
  );
}

