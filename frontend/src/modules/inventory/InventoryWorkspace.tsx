import { useState } from 'react'
import {
  ArrowRightLeft,
  Boxes,
  ClipboardCheck,
  Scale,
} from 'lucide-react'
import { StockLedgerSection } from './sections/StockLedgerSection'
import { StockTransfersSection } from './sections/StockTransfersSection'
import { StockAdjustmentsSection } from './sections/StockAdjustmentsSection'
import { StockCountsSection } from './sections/StockCountsSection'

export type InventoryTab = 'ledger' | 'transfers' | 'adjustments' | 'counts'

interface TabConfig {
  id: InventoryTab
  label: string
  icon: typeof Boxes
  description: string
}

const tabs: TabConfig[] = [
  {
    id: 'ledger',
    label: 'Stock Ledger & Balances',
    icon: Boxes,
    description: 'Real-time multi-warehouse inventory levels and append-only stock movement audit ledger',
  },
  {
    id: 'transfers',
    label: 'Stock Transfers',
    icon: ArrowRightLeft,
    description: 'Inter-warehouse logistics, transit tracking & two-step dispatch/receive verification',
  },
  {
    id: 'adjustments',
    label: 'Stock Adjustments',
    icon: Scale,
    description: 'Wastage, damage write-offs, gain/loss corrections with mandatory reason codes & approval gate',
  },
  {
    id: 'counts',
    label: 'Physical Stock Counts',
    icon: ClipboardCheck,
    description: 'Periodic cycle & full physical audits with snapshotting and automated variance reconciliation',
  },
]

export default function InventoryWorkspace() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('ledger')

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0]

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Inventory & Warehouse Operations
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
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'ledger' && <StockLedgerSection />}
        {activeTab === 'transfers' && <StockTransfersSection />}
        {activeTab === 'adjustments' && <StockAdjustmentsSection />}
        {activeTab === 'counts' && <StockCountsSection />}
      </div>
    </div>
  )
}
