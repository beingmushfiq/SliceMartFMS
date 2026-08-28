import { useState } from 'react';
import { ClipboardList, Factory, Users } from 'lucide-react';
import { ProductionPlansSection } from './sections/ProductionPlansSection';
import { ProductionBatchesSection } from './sections/ProductionBatchesSection';
import { WorkerProductionSection } from './sections/WorkerProductionSection';

export type ProductionTab = 'plans' | 'batches' | 'worker-entries';

interface TabConfig {
  id: ProductionTab;
  label: string;
  icon: typeof Factory;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'batches',
    label: 'Production Batches',
    icon: Factory,
    description: 'Shop floor batch execution, material issue, output recording & yield analytics',
  },
  {
    id: 'plans',
    label: 'Production Plans',
    icon: ClipboardList,
    description: 'Master manufacturing schedules and multi-product production planning',
  },
  {
    id: 'worker-entries',
    label: 'Worker Output & Wages',
    icon: Users,
    description:
      'Daily touch entry for worker output, piece-rate tracking & supervisor verification',
  },
];

export default function ProductionWorkspace() {
  const [activeTab, setActiveTab] = useState<ProductionTab>('batches');

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Manufacturing Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            {currentTab?.label}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">{currentTab?.description}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-zinc-800 pb-px scrollbar-none">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400'
                    : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="pt-2">
        {activeTab === 'batches' && <ProductionBatchesSection />}
        {activeTab === 'plans' && <ProductionPlansSection />}
        {activeTab === 'worker-entries' && <WorkerProductionSection />}
      </div>
    </div>
  );
}
