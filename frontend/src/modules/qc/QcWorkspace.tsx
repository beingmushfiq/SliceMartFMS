import { useState } from 'react'
import { AlertOctagon, Microscope, Sliders } from 'lucide-react'
import { QcInspectionsSection } from './sections/QcInspectionsSection'
import { QcParametersSection } from './sections/QcParametersSection'
import { WastageRecordsSection } from './sections/WastageRecordsSection'

export type QcTab = 'inspections' | 'parameters' | 'wastage'

interface TabConfig {
  id: QcTab
  label: string
  icon: typeof Microscope
  description: string
}

const tabs: TabConfig[] = [
  {
    id: 'inspections',
    label: 'QC Inspections & QA',
    icon: Microscope,
    description: 'Incoming, in-process, and final inspection runs with multi-defect severity logging',
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
]

export default function QcWorkspace() {
  const [activeTab, setActiveTab] = useState<QcTab>('inspections')

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0]

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Quality Assurance & Scrap Governance
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            {currentTab?.label}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {currentTab?.description}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-zinc-800 pb-px scrollbar-none">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
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
            )
          })}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="pt-2">
        {activeTab === 'inspections' && <QcInspectionsSection />}
        {activeTab === 'parameters' && <QcParametersSection />}
        {activeTab === 'wastage' && <WastageRecordsSection />}
      </div>
    </div>
  )
}
