import { useState } from 'react';
import {
  FileText,
  Receipt,
  ShoppingCart,
  Truck,
  Undo2,
  Users,
  Kanban,
  Target,
  Award,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { SalesOrdersSection } from './sections/SalesOrdersSection';
import { InvoicesSection } from './sections/InvoicesSection';
import { DeliveriesSection } from './sections/DeliveriesSection';
import { PaymentsSection } from './sections/PaymentsSection';
import { SalesReturnsSection } from './sections/SalesReturnsSection';
import { LeadsSection } from './sections/LeadsSection';
import { CustomersSection } from './sections/CustomersSection';
import { SalesmenProfilesSection } from './sections/SalesmenProfilesSection';
import { SalesmanTargetsSection } from './sections/SalesmanTargetsSection';
import { IncentivesSection } from './sections/IncentivesSection';
import { SalesmanDashboardSection } from './sections/SalesmanDashboardSection';

import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';

export type SalesTab =
  | 'orders'
  | 'invoices'
  | 'deliveries'
  | 'payments'
  | 'returns'
  | 'customers'
  | 'leads'
  | 'salesmen'
  | 'targets'
  | 'incentives'
  | 'dashboard';

const VALID_TABS: readonly SalesTab[] = [
  'orders',
  'invoices',
  'deliveries',
  'payments',
  'returns',
  'customers',
  'leads',
  'salesmen',
  'targets',
  'incentives',
  'dashboard',
];

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
  {
    id: 'customers',
    label: 'Customer CRM',
    icon: Users,
    description: 'Customer accounts directory, statements & balance receivables',
  },
  {
    id: 'leads',
    label: 'Commercial Leads',
    icon: Kanban,
    description: 'Opportunity pipeline, stage tracking, quotation follow-up & win/loss analytics',
  },
  {
    id: 'salesmen',
    label: 'Salesmen Directory',
    icon: UserCheck,
    description: 'Sales representative profiles, quota achievements, lead conversion pipeline & earnings',
  },
  {
    id: 'targets',
    label: 'Sales Targets',
    icon: Target,
    description: 'Monthly commercial target quotas, periodic assignment, deficit tracking & audits',
  },
  {
    id: 'incentives',
    label: 'Incentive Engine',
    icon: Award,
    description: 'Tiered commission policies, automated quota evaluation & management approval workflows',
  },
  {
    id: 'dashboard',
    label: 'Salesman Dashboard',
    icon: TrendingUp,
    description: 'Representative personal dashboard with real-time target, leads, conversion & bonus metrics',
  },
];

export default function SalesWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<SalesTab>('orders', VALID_TABS);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<number | null>(null);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
              Revenue & Commercial Operations
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
                    ? 'bg-primary text-primary-fg font-semibold shadow-xs border border-primary'
                    : 'text-muted hover:text-default hover:bg-surface/50 border border-transparent'
                }`}
              >
                <Icon className={`size-4 ${isActive ? 'text-primary-fg' : 'text-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-1">
        {activeTab === 'orders' && <SalesOrdersSection onNavigateToTab={(tab) => setActiveTab(tab as SalesTab)} />}
        {activeTab === 'invoices' && <InvoicesSection />}
        {activeTab === 'deliveries' && <DeliveriesSection />}
        {activeTab === 'payments' && <PaymentsSection />}
        {activeTab === 'returns' && <SalesReturnsSection />}
        {activeTab === 'customers' && <CustomersSection />}
        {activeTab === 'leads' && <LeadsSection />}
        {activeTab === 'salesmen' && (
          <SalesmenProfilesSection
            onSelectSalesmanForDashboard={(empId) => {
              setSelectedSalesmanId(empId);
              setActiveTab('dashboard');
            }}
          />
        )}
        {activeTab === 'targets' && <SalesmanTargetsSection />}
        {activeTab === 'incentives' && <IncentivesSection />}
        {activeTab === 'dashboard' && (
          <SalesmanDashboardSection initialSalesmanId={selectedSalesmanId} />
        )}
      </div>
    </div>
  );
}
