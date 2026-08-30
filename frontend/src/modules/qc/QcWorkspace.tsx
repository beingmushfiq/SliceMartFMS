import { useState } from 'react';
import { AlertOctagon, Microscope, Sliders, RotateCcw } from 'lucide-react';
import { QcInspectionsSection } from './sections/QcInspectionsSection';
import { QcParametersSection } from './sections/QcParametersSection';
import { WastageRecordsSection } from './sections/WastageRecordsSection';
import { ReworkSection } from './sections/ReworkSection';

export type QcTab = 'inspections' | 'parameters' | 'wastage' | 'rework';

interface TabConfig {
  id: QcTab;
  label: string;
  icon: typeof Microscope;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'inspections',
    label: 'QC Inspections & QA',
    icon: Microscope,
    description:
      'Incoming, in-process, and final inspection runs with multi-defect severity logging',
  },
  {
    id: 'rework',
    label: 'Rework & Salvage',
    icon: RotateCcw,
    description:
      'Defect re-routing, secondary workstation corrections, salvage recovery yield & scrap auditing',
  },
  {
    id: 'parameters',
    label: 'Standard Specifications',
    icon: Sliders,
    description: 'Define measurement parameters, tolerance bands and mandatory test criteria',
  },
  {
    id: 'wastage',
    label: 'Wastage & Scrap Ledger',
    icon: AlertOctagon,
    description: 'Process loss logging with reason codes, financial valuation and scrap tracking',
  },
];

export default function QcWorkspace() {
  const [activeTab, setActiveTab] = useState<QcTab>('inspections');

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
              Quality Assurance & Scrap Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default">
            {currentTab?.label}
          </h1>
          <p className="mt-1.5 text-xs text-muted max-w-2xl leading-relaxed">
            {currentTab?.description}
          </p>
        </div>
      </div>

      {/* Segmented Tabs Navigation Tray */}
      <div className="flex overflow-x-auto p-1.5 bg-surface-sunken rounded-2xl border border-default shadow-2xs">
        <div className="flex gap-1.5 min-w-full sm:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-surface text-default font-semibold shadow-xs border border-default/70'
                    : 'text-muted hover:text-default hover:bg-surface/50 border border-transparent'
                }`}
              >
                <Icon className={`size-4 ${isActive ? 'text-primary' : 'text-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="pt-1">
        {activeTab === 'inspections' && <QcInspectionsSection />}
        {activeTab === 'rework' && <ReworkSection />}
        {activeTab === 'parameters' && <QcParametersSection />}
        {activeTab === 'wastage' && <WastageRecordsSection />}
      </div>
    </div>
  );
}
