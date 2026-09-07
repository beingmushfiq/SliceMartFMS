import { ClipboardList, Factory, Users, ArrowRight } from 'lucide-react';
import { ProductionPlansSection } from './sections/ProductionPlansSection';
import { ProductionBatchesSection } from './sections/ProductionBatchesSection';
import { WorkerProductionSection } from './sections/WorkerProductionSection';

import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { cn } from '../../lib/utils';

export type ProductionTab = 'plans' | 'batches' | 'worker-entries';

interface TabConfig {
  id: ProductionTab;
  step: number;
  label: string;
  badge?: string;
  icon: typeof Factory;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'plans',
    step: 1,
    label: 'Production Plans',
    badge: 'Step 1',
    icon: ClipboardList,
    description: 'Master manufacturing schedules, BOM requirements and multi-product production planning',
  },
  {
    id: 'batches',
    step: 2,
    label: 'Production Batches',
    badge: 'Step 2',
    icon: Factory,
    description: 'Shop floor batch execution, raw material issue, output recording & yield analytics',
  },
  {
    id: 'worker-entries',
    step: 3,
    label: 'Worker Output & Wages',
    badge: 'Step 3',
    icon: Users,
    description: 'Daily touch entry for worker output, piece-rate tracking & supervisor verification',
  },
];

const VALID_TABS: readonly ProductionTab[] = ['plans', 'batches', 'worker-entries'];

export default function ProductionWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<ProductionTab>('batches', VALID_TABS);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[1]!;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
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
      </div>

      {/* Sequential Manufacturing Pipeline Tabs Tray */}
      <div className="flex overflow-x-auto p-1.5 bg-surface-sunken rounded-2xl border border-default shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-full sm:min-w-0" aria-label="Manufacturing Stages">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-fg font-semibold shadow-xs border border-primary'
                      : 'text-muted hover:text-default hover:bg-surface/50 border border-transparent'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center size-5 rounded-full text-[10px] font-mono font-bold',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-surface text-muted border border-default'
                    )}
                  >
                    {tab.step}
                  </span>
                  <Icon className={cn('size-4', isActive ? 'text-primary-fg' : 'text-muted')} />
                  <span>{tab.label}</span>
                </button>
                {idx < tabs.length - 1 && (
                  <ArrowRight className="size-3.5 text-muted/40 shrink-0 hidden sm:inline-block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="pt-1">
        {activeTab === 'plans' && <ProductionPlansSection />}
        {activeTab === 'batches' && <ProductionBatchesSection />}
        {activeTab === 'worker-entries' && <WorkerProductionSection />}
      </div>
    </div>
  );
}
