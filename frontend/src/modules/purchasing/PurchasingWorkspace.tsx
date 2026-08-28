import { useState } from 'react';
import { FileSpreadsheet, PackageCheck, Receipt, ShoppingCart, Undo2 } from 'lucide-react';
import { PurchaseOrdersSection } from './sections/PurchaseOrdersSection';
import { GoodsReceiptsSection } from './sections/GoodsReceiptsSection';
import { PurchaseRequisitionsSection } from './sections/PurchaseRequisitionsSection';
import { PurchaseBillsSection } from './sections/PurchaseBillsSection';
import { PurchaseReturnsSection } from './sections/PurchaseReturnsSection';

export type PurchasingTab = 'orders' | 'receipts' | 'requisitions' | 'bills' | 'returns';

interface TabConfig {
  id: PurchasingTab;
  label: string;
  icon: typeof ShoppingCart;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'orders',
    label: 'Purchase Orders',
    icon: ShoppingCart,
    description: 'Supplier contract commitments, multi-currency purchasing & status tracking',
  },
  {
    id: 'receipts',
    label: 'Goods Receipts (GRN)',
    icon: PackageCheck,
    description:
      'Warehouse gate receiving, 3-way match, lot assignment & instant inventory posting',
  },
  {
    id: 'requisitions',
    label: 'Purchase Requisitions',
    icon: FileSpreadsheet,
    description: 'Internal shopfloor & departmental supply requests with approval workflows',
  },
  {
    id: 'bills',
    label: 'Purchase Bills (AP)',
    icon: Receipt,
    description:
      'Supplier invoice verification, payment due tracking & accounts payable settlement',
  },
  {
    id: 'returns',
    label: 'Purchase Returns',
    icon: Undo2,
    description:
      'Debit notes and rejected goods return to supplier with automatic inventory deduction',
  },
];

export default function PurchasingWorkspace() {
  const [activeTab, setActiveTab] = useState<PurchasingTab>('orders');

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Procurement & Vendor Operations
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
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'orders' && <PurchaseOrdersSection />}
        {activeTab === 'receipts' && <GoodsReceiptsSection />}
        {activeTab === 'requisitions' && <PurchaseRequisitionsSection />}
        {activeTab === 'bills' && <PurchaseBillsSection />}
        {activeTab === 'returns' && <PurchaseReturnsSection />}
      </div>
    </div>
  );
}
