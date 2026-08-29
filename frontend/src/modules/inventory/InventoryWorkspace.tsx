import { useState } from 'react';
import { ArrowRightLeft, Boxes, ClipboardCheck, Scale } from 'lucide-react';
import { StockLedgerSection } from './sections/StockLedgerSection';
import { StockTransfersSection } from './sections/StockTransfersSection';
import { StockAdjustmentsSection } from './sections/StockAdjustmentsSection';
import { StockCountsSection } from './sections/StockCountsSection';

export type InventoryTab = 'ledger' | 'transfers' | 'adjustments' | 'counts';

interface TabConfig {
  id: InventoryTab;
  label: string;
  icon: typeof Boxes;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'ledger',
    label: 'Stock Ledger & Balances',
    icon: Boxes,
    description:
      'Real-time multi-warehouse inventory levels and append-only stock movement audit ledger',
  },
  {
    id: 'transfers',
    label: 'Stock Transfers',
    icon: ArrowRightLeft,
    description:
      'Inter-warehouse logistics, transit tracking & two-step dispatch/receive verification',
  },
  {
    id: 'adjustments',
    label: 'Stock Adjustments',
    icon: Scale,
    description:
      'Wastage, damage write-offs, gain/loss corrections with mandatory reason codes & approval gate',
  },
  {
    id: 'counts',
    label: 'Physical Stock Counts',
    icon: ClipboardCheck,
    description:
      'Periodic cycle & full physical audits with snapshotting and automated variance reconciliation',
  },
];

export default function InventoryWorkspace() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('ledger');

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
              Inventory & Warehouse
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
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 ${
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

      {/* Tab Content Section */}
      <div className="pt-1">
        {activeTab === 'ledger' && <StockLedgerSection />}
        {activeTab === 'transfers' && <StockTransfersSection />}
        {activeTab === 'adjustments' && <StockAdjustmentsSection />}
        {activeTab === 'counts' && <StockCountsSection />}
      </div>
    </div>
  );
}
