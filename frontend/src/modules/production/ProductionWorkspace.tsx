import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Factory,
  Users,
  ArrowRight,
  Monitor,
  Compass,
  Zap,
  SlidersHorizontal,
  Workflow,
} from 'lucide-react';
import { ProductionPlansSection } from './sections/ProductionPlansSection';
import { ProductionBatchesSection } from './sections/ProductionBatchesSection';
import { WorkerProductionSection } from './sections/WorkerProductionSection';
import { ProductionFloorKioskView } from './components/ProductionFloorKioskView';

import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

export type ProductionTab = 'plans' | 'batches' | 'worker-entries';

interface TabConfig {
  id: ProductionTab;
  step: number;
  label: string;
  badge?: string;
  icon: typeof Factory;
  description: string;
  pillar: 1 | 2;
}

const tabs: TabConfig[] = [
  {
    id: 'plans',
    step: 1,
    label: 'Production Plans',
    badge: 'Step 1',
    icon: ClipboardList,
    description: 'Master manufacturing schedules, BOM requirements and multi-product production planning',
    pillar: 1,
  },
  {
    id: 'batches',
    step: 2,
    label: 'Production Batches',
    badge: 'Step 2',
    icon: Factory,
    description: 'Shop floor batch execution, raw material issue, output recording & yield analytics',
    pillar: 1,
  },
  {
    id: 'worker-entries',
    step: 3,
    label: 'Worker Output & Wages',
    badge: 'Step 3',
    icon: Users,
    description: 'Daily touch entry for worker output, piece-rate tracking & supervisor verification',
    pillar: 2,
  },
];

const VALID_TABS: readonly ProductionTab[] = ['plans', 'batches', 'worker-entries'];

export default function ProductionWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<ProductionTab>('batches', VALID_TABS);
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Global hotkeys (1, 2) to quickly jump between primary manufacturing pillars
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === '1') {
        setActiveTab('batches');
      } else if (e.key === '2') {
        setActiveTab('worker-entries');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[1]!;

  if (isKioskOpen) {
    return <ProductionFloorKioskView onExit={() => setIsKioskOpen(false)} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Workspace Header with Transparent Navigation Deck */}
      <div className="flex flex-col gap-4 border-b border-default pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                <Factory className="size-3 text-primary" />
                Manufacturing Operations Lifecycle
              </span>
              <span className="text-[10px] font-mono font-bold text-muted bg-surface-sunken px-2 py-0.5 rounded-md border border-default">
                Stage {currentTab.step} of 3
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default">
              {currentTab.label}
            </h1>
            <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
              {currentTab.description}
            </p>
          </div>

          {/* Quick Action Utilities */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-default"
            >
              <Compass className="size-3.5 text-primary" />
              <span>Explore Capabilities</span>
            </Button>

            {/* Kiosk Mode Launcher */}
            <button
              type="button"
              onClick={() => setIsKioskOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-raised hover:bg-surface text-default border border-default shadow-2xs hover:border-primary/50 transition-all cursor-pointer"
              title="Launch full-screen high-contrast display for wall-mounted TVs on the shop floor"
            >
              <Monitor className="size-4 text-primary" />
              <span>Floor Kiosk Mode</span>
            </button>
          </div>
        </div>

        {/* 2 Transparent Command Pillars with Embedded Direct Child Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Pillar 1: Production Scheduling & Execution */}
          <div
            className={cn(
              'rounded-2xl p-3 border transition-all duration-200 bg-surface',
              currentTab.pillar === 1
                ? 'border-primary/40 shadow-xs ring-1 ring-primary/20'
                : 'border-default/70 hover:border-default shadow-2xs'
            )}
          >
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-default/50">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-lg border',
                    currentTab.pillar === 1
                      ? 'bg-primary-subtle text-primary border-primary/30'
                      : 'bg-surface-sunken text-muted border-default'
                  )}
                >
                  <Workflow className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-default">
                      Scheduling & Batch Execution
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-sunken text-muted border border-default">
                      [1]
                    </span>
                  </div>
                  <span className="text-[10px] text-muted">
                    BOM schedules, material issuance & shopfloor batches
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Embedded Child Pills */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('plans')}
                className={cn(
                  'flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left',
                  activeTab === 'plans'
                    ? 'bg-primary text-primary-fg font-semibold shadow-2xs'
                    : 'bg-surface-sunken text-muted hover:text-default hover:bg-surface border border-default/50'
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <ClipboardList className="size-3.5 shrink-0" />
                  <span className="truncate">Production Plans</span>
                </div>
                <span className={cn(
                  'text-[9px] font-mono px-1 py-0.2 rounded shrink-0',
                  activeTab === 'plans' ? 'bg-white/20 text-white' : 'bg-surface text-muted'
                )}>
                  Step 1
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('batches')}
                className={cn(
                  'flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left',
                  activeTab === 'batches'
                    ? 'bg-primary text-primary-fg font-semibold shadow-2xs'
                    : 'bg-surface-sunken text-muted hover:text-default hover:bg-surface border border-default/50'
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Factory className="size-3.5 shrink-0" />
                  <span className="truncate">Shopfloor Batches</span>
                </div>
                <span className={cn(
                  'text-[9px] font-mono px-1 py-0.2 rounded shrink-0',
                  activeTab === 'batches' ? 'bg-white/20 text-white' : 'bg-surface text-muted'
                )}>
                  Step 2
                </span>
              </button>
            </div>
          </div>

          {/* Pillar 2: Floor Operations & Labor Wages */}
          <div
            className={cn(
              'rounded-2xl p-3 border transition-all duration-200 bg-surface',
              currentTab.pillar === 2
                ? 'border-primary/40 shadow-xs ring-1 ring-primary/20'
                : 'border-default/70 hover:border-default shadow-2xs'
            )}
          >
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-default/50">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-lg border',
                    currentTab.pillar === 2
                      ? 'bg-primary-subtle text-primary border-primary/30'
                      : 'bg-surface-sunken text-muted border-default'
                  )}
                >
                  <Users className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-default">
                      Labor Tracking & Piece Wages
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-sunken text-muted border border-default">
                      [2]
                    </span>
                  </div>
                  <span className="text-[10px] text-muted">
                    Touch entry for worker output, approvals & wage calculation
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Embedded Child Pills */}
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('worker-entries')}
                className={cn(
                  'flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left',
                  activeTab === 'worker-entries'
                    ? 'bg-primary text-primary-fg font-semibold shadow-2xs'
                    : 'bg-surface-sunken text-muted hover:text-default hover:bg-surface border border-default/50'
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Users className="size-3.5 shrink-0" />
                  <span className="truncate">Worker Output & Daily Wages</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted hidden sm:inline">Touch Terminal</span>
                  <span className={cn(
                    'text-[9px] font-mono px-1 py-0.2 rounded shrink-0',
                    activeTab === 'worker-entries' ? 'bg-white/20 text-white' : 'bg-surface text-muted'
                  )}>
                    Step 3
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Master Grouped Navigation Ribbon: All 3 Stages Fully Visible */}
        <div className="rounded-xl border border-default/80 bg-surface-sunken/60 p-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2 px-1 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
              <SlidersHorizontal className="size-3 text-primary" />
              <span>Manufacturing Stages Execution Ribbon</span>
            </div>
            <span className="text-[10px] text-muted font-mono">
              3 Stages Available • Instant Access
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer',
                    isActive
                      ? 'bg-surface text-default font-semibold shadow-xs border border-primary/50 ring-1 ring-primary/20'
                      : 'bg-surface/60 text-muted hover:text-default hover:bg-surface border border-default/40'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center size-5 rounded-full text-[10px] font-mono font-bold shrink-0',
                        isActive
                          ? 'bg-primary text-primary-fg'
                          : 'bg-surface-sunken text-muted border border-default'
                      )}
                    >
                      {tab.step}
                    </span>
                    <Icon className={cn('size-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted')} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {idx < tabs.length - 1 && (
                    <ArrowRight className="size-3 text-muted/40 shrink-0 hidden sm:inline-block" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Section Content */}
      <div className="pt-1">
        {activeTab === 'plans' && <ProductionPlansSection />}
        {activeTab === 'batches' && <ProductionBatchesSection />}
        {activeTab === 'worker-entries' && <WorkerProductionSection />}
      </div>

      {/* Explore Capabilities Modal Guide */}
      <Modal
        open={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Manufacturing & Production Operations Architecture"
      >
        <div className="space-y-4 text-xs text-default py-1">
          <p className="text-muted leading-relaxed">
            SliceMart ERP manufacturing engine seamlessly bridges high-level BOM schedules with real-time shop floor execution, raw material consumption tracking, finished goods receipt, and piece-rate worker payroll.
          </p>

          <div className="space-y-3 pt-2">
            {/* Step 1 */}
            <div className="p-3 rounded-xl border border-default bg-surface-sunken space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-default">
                  <ClipboardList className="size-4 text-primary" />
                  <span>Step 1: Production Plans & BOM Scheduling</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-default text-muted">
                  Tab: plans
                </span>
              </div>
              <p className="text-muted">
                Create master production plans linked to customer orders or inventory forecast. Generates total component demand across multiple Bill-of-Materials before releasing batches to the floor.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-xl border border-default bg-surface-sunken space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-default">
                  <Factory className="size-4 text-primary" />
                  <span>Step 2: Shop Floor Batches & Material Issuance</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-default text-muted">
                  Tab: batches [1]
                </span>
              </div>
              <p className="text-muted">
                Live execution of batches. Issues raw materials from specific warehouse bins, logs finished good outputs, records defect rejects, and triggers automated yield analysis to detect material variances.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-xl border border-default bg-surface-sunken space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-default">
                  <Users className="size-4 text-primary" />
                  <span>Step 3: Worker Output & Daily Piece Wages</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-default text-muted">
                  Tab: worker-entries [2]
                </span>
              </div>
              <p className="text-muted">
                Supervisor touch interface for logging operator output per operation (cutting, stitching, assembly). Auto-calculates piece-rate wages and connects directly to general ledger payroll expenses.
              </p>
            </div>

            {/* Kiosk Mode */}
            <div className="p-3 rounded-xl border border-primary/30 bg-primary-subtle/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Monitor className="size-4 text-primary" />
                  <span>Shop Floor Kiosk Mode</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-primary/20 text-primary">
                  Wall TV Display
                </span>
              </div>
              <p className="text-muted">
                Full-screen, high-contrast dashboard designed for touch tablets and wall displays on the factory floor. Displays active batch metrics, target progress gauges, and real-time operator entry prompts.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-default">
            <div className="flex items-center gap-1 text-[11px] text-muted">
              <Zap className="size-3.5 text-primary" />
              <span>Hotkeys: Press <kbd className="font-mono bg-surface px-1.5 py-0.5 rounded border border-default">1</kbd> for Batches, <kbd className="font-mono bg-surface px-1.5 py-0.5 rounded border border-default">2</kbd> for Worker Output</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsGuideOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
