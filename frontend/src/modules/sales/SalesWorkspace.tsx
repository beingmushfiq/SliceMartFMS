import { useState } from 'react';
import { FileText, Receipt, ShoppingCart, Truck, Undo2 } from 'lucide-react';
import { SalesOrdersSection } from './sections/SalesOrdersSection';
import { InvoicesSection } from './sections/InvoicesSection';
import { DeliveriesSection } from './sections/DeliveriesSection';
import { PaymentsSection } from './sections/PaymentsSection';
import { SalesReturnsSection } from './sections/SalesReturnsSection';

export type SalesTab = 'orders' | 'invoices' | 'deliveries' | 'payments' | 'returns';

interface TabConfig {
  id: SalesTab;
  label: string;
  icon: typeof ShoppingCart;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'orders',
    label: 'Sales Orders',
    icon: ShoppingCart,
    description: 'Omnichannel order management, dealer contracts, quotation approval & fulfillment',
  },
  {
    id: 'invoices',
    label: 'Invoices & Billing',
    icon: FileText,
    description: 'Customer VAT tax invoices, billing terms, posting & payment tracking',
  },
  {
    id: 'deliveries',
    label: 'Deliveries & Dispatch',
    icon: Truck,
    description: 'Warehouse dispatch, stock issue deduction, delivery notes & COD handling',
  },
  {
    id: 'payments',
    label: 'Payments & Receipts',
    icon: Receipt,
    description: 'Customer payment collections, multi-tender receipts & invoice allocations',
  },
  {
    id: 'returns',
    label: 'Sales Returns (RMA)',
    icon: Undo2,
    description: 'Return merchandise authorization, credit notes & restock movements',
  },
];

export default function SalesWorkspace() {
  const [activeTab, setActiveTab] = useState<SalesTab>('orders');

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Revenue & Commercial Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            {currentTab?.label}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">{currentTab?.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/fraud-verification"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Fraud Check & Verification Queue</span>
          </a>
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
        {activeTab === 'orders' && <SalesOrdersSection />}
        {activeTab === 'invoices' && <InvoicesSection />}
        {activeTab === 'deliveries' && <DeliveriesSection />}
        {activeTab === 'payments' && <PaymentsSection />}
        {activeTab === 'returns' && <SalesReturnsSection />}
      </div>
    </div>
  );
}
