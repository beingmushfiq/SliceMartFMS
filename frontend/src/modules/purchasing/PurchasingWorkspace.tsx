import { FileSpreadsheet, PackageCheck, Receipt, ShoppingCart, Undo2 } from 'lucide-react';
import { PurchaseOrdersSection } from './sections/PurchaseOrdersSection';
import { GoodsReceiptsSection } from './sections/GoodsReceiptsSection';
import { PurchaseRequisitionsSection } from './sections/PurchaseRequisitionsSection';
import { PurchaseBillsSection } from './sections/PurchaseBillsSection';
import { PurchaseReturnsSection } from './sections/PurchaseReturnsSection';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';

export type PurchasingTab = 'orders' | 'receipts' | 'requisitions' | 'bills' | 'returns';

const VALID_TABS: readonly PurchasingTab[] = ['orders', 'receipts', 'requisitions', 'bills', 'returns'];

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
  const [activeTab, setActiveTab] = useWorkspaceTab<PurchasingTab>('orders', VALID_TABS);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
              Procurement & Vendor Operations
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

      {/* Tab Content */}
      <div className="pt-1">
        {activeTab === 'orders' && <PurchaseOrdersSection />}
        {activeTab === 'receipts' && <GoodsReceiptsSection />}
        {activeTab === 'requisitions' && <PurchaseRequisitionsSection />}
        {activeTab === 'bills' && <PurchaseBillsSection />}
        {activeTab === 'returns' && <PurchaseReturnsSection />}
      </div>
    </div>
  );
}
