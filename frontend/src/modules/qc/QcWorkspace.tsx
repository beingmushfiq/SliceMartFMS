import { useState, useRef, useEffect } from 'react';
import {
  AlertOctagon,
  Microscope,
  Sliders,
  RotateCcw,
  Compass,
  Zap,
  SlidersHorizontal,
  Search,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { QcInspectionsSection } from './sections/QcInspectionsSection';
import { QcParametersSection } from './sections/QcParametersSection';
import { WastageRecordsSection } from './sections/WastageRecordsSection';
import { ReworkSection } from './sections/ReworkSection';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

export type QcTab = 'inspections' | 'parameters' | 'wastage' | 'rework';
export type QcCategory = 'verification' | 'disposition';

const VALID_TABS: readonly QcTab[] = ['inspections', 'parameters', 'rework', 'wastage'];

interface CategoryConfig {
  id: QcCategory;
  label: string;
  tagline: string;
  shortcut: string;
  icon: typeof Microscope;
  defaultTab: QcTab;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'verification',
    label: 'Quality Verification & Specs',
    tagline: 'Incoming, floor process & final batch inspection runs with standard parameter tolerance rules',
    shortcut: '1',
    icon: Microscope,
    defaultTab: 'inspections',
  },
  {
    id: 'disposition',
    label: 'Rework & Scrap Governance',
    tagline: 'Defect rework salvage routing, recovery yield tracking & process loss valuation ledger',
    shortcut: '2',
    icon: ShieldCheck,
    defaultTab: 'rework',
  },
];

interface TabConfig {
  id: QcTab;
  label: string;
  shortLabel: string;
  category: QcCategory;
  badge?: string;
  icon: typeof Microscope;
  description: string;
  highlights: string[];
}

const tabs: TabConfig[] = [
  {
    id: 'inspections',
    label: 'QC Inspections & QA',
    shortLabel: 'Inspections',
    category: 'verification',
    badge: 'Runs',
    icon: Microscope,
    description:
      'Incoming raw material, in-process shopfloor, and final batch inspection runs with multi-defect severity logging',
    highlights: ['Incoming, In-Process & Final Runs', 'Multi-Defect Severity Logging', 'Sample Size & AQL Tolerance'],
  },
  {
    id: 'parameters',
    label: 'Standard Specifications',
    shortLabel: 'Standard Specs',
    category: 'verification',
    badge: 'Tolerances',
    icon: Sliders,
    description:
      'Define mandatory physical/chemical test parameters, minimum/maximum tolerance bands and unit criteria',
    highlights: ['Min/Max Tolerance Limits', 'Mandatory Test Criteria', 'SKU-Specific Standard Bands'],
  },
  {
    id: 'rework',
    label: 'Rework & Salvage',
    shortLabel: 'Rework & Salvage',
    category: 'disposition',
    badge: 'Salvage',
    icon: RotateCcw,
    description:
      'Defect re-routing, secondary workstation corrections, salvage recovery yield auditing & re-inspection gate',
    highlights: ['Secondary Workstation Re-routing', 'Salvage Recovery Yield Calculation', 'Defect Correction Validation'],
  },
  {
    id: 'wastage',
    label: 'Wastage & Scrap Ledger',
    shortLabel: 'Scrap Ledger',
    category: 'disposition',
    badge: 'Loss Audit',
    icon: AlertOctagon,
    description:
      'Process loss logging with mandatory reason codes, unit valuation, physical write-off and salvage tracking',
    highlights: ['Process Loss Valuation', 'Mandatory Scrap Reason Codes', 'Financial Ledger Write-off Trail'],
  },
];

export default function QcWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<QcTab>('inspections', VALID_TABS);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const quickJumpRef = useRef<HTMLDivElement>(null);

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
        setActiveTab('inspections');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('rework');
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
              Quality Assurance & Scrap Governance
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

        {/* Header Action Buttons & Guides */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-primary/30 bg-primary-subtle hover:bg-primary/10 text-primary transition-all shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Open Quality & Scrap Architecture Guide"
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
              title="Jump directly to any of the 4 QC views"
            >
              <SlidersHorizontal className="size-3.5 text-primary" />
              <span>All 4 Views</span>
            </button>

            {quickJumpOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-surface rounded-2xl border border-default shadow-lg p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search QC views..."
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
                      No quality views found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary 2 Command Pillars (with Embedded Direct Child Pills) */}
      <div
        role="tablist"
        aria-label="Quality Control Domains"
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
                      {childTabs.length} views
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

      {/* Master Grouped Navigation Ribbon (All 4 Tabs Visible Simultaneously) */}
      <div className="bg-surface-sunken rounded-2xl border border-default p-2 shadow-2xs">
        <div className="flex items-center justify-between px-2 pb-1.5 mb-1 text-[11px] font-semibold text-muted border-b border-default/50">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-primary" />
            <span>Master Quality Control Ribbon (1-Click Reachability)</span>
          </div>
          <span className="text-[10px] font-mono text-muted/70">
            Active: <strong className="text-default">{currentTab?.label}</strong>
          </span>
        </div>

        <nav
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="All 4 Quality Views"
        >
          {/* Cluster 1: Verification & Standards */}
          <div className="flex items-center gap-1.5 bg-surface/60 p-1 rounded-xl border border-default/40">
            <span className="text-[10px] font-mono uppercase font-bold text-muted px-2 py-0.5 select-none">
              Verification:
            </span>
            {tabs.filter((t) => t.category === 'verification').map((tab) => {
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

          {/* Cluster 2: Disposition & Scrap */}
          <div className="flex items-center gap-1.5 bg-surface/60 p-1 rounded-xl border border-default/40">
            <span className="text-[10px] font-mono uppercase font-bold text-muted px-2 py-0.5 select-none">
              Disposition:
            </span>
            {tabs.filter((t) => t.category === 'disposition').map((tab) => {
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

      {/* Active Section Content */}
      <div className="pt-1">
        {activeTab === 'inspections' && <QcInspectionsSection />}
        {activeTab === 'rework' && <ReworkSection />}
        {activeTab === 'parameters' && <QcParametersSection />}
        {activeTab === 'wastage' && <WastageRecordsSection />}
      </div>

      {/* Modal: Explore Quality & Scrap Architecture Guide */}
      <Modal
        open={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Quality Assurance & Scrap Governance Architecture Guide"
        size="xl"
      >
        <div className="space-y-6">
          <div className="rounded-xl bg-primary-subtle/50 border border-primary/20 p-4">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1">
              <Microscope className="size-4" />
              Standardized Quality Controls & Material Disposition
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              SliceMart QC enforces multi-tier quality gates from receiving dock to final packing, standard tolerance
              band parameter rules, rework defect routing with salvage yield auditing, and strict process scrap valuation.
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
              Keyboard shortcut: Press <kbd className="px-1.5 py-0.5 bg-surface rounded border border-default font-mono text-[10px] font-bold">1</kbd> for Verification & Specs, <kbd className="px-1.5 py-0.5 bg-surface rounded border border-default font-mono text-[10px] font-bold">2</kbd> for Rework & Scrap.
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsGuideOpen(false)}>
              Close Guide
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
