import { Boxes, FileCode, Package, Ruler, Tag, Users, Warehouse } from 'lucide-react';
import { ProductsSection } from './sections/ProductsSection';
import { UnitsSection } from './sections/UnitsSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { BrandsSection } from './sections/BrandsSection';
import { BillOfMaterialsSection } from './sections/BillOfMaterialsSection';
import { WarehousesSection } from './sections/WarehousesSection';
import { PartiesSection } from './sections/PartiesSection';

import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';

export type CatalogueTab =
  'products' | 'units' | 'categories' | 'brands' | 'bom' | 'warehouses' | 'parties';

const VALID_TABS: readonly CatalogueTab[] = [
  'products',
  'units',
  'categories',
  'brands',
  'bom',
  'warehouses',
  'parties',
];

interface TabConfig {
  id: CatalogueTab;
  label: string;
  icon: typeof Package;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    description: 'Finished goods, raw materials, parts and catalog items',
  },
  {
    id: 'units',
    label: 'Units of Measure',
    icon: Ruler,
    description: 'Measurement standards and conversion ratios',
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: Tag,
    description: 'Taxonomy hierarchy for catalog organization',
  },
  {
    id: 'brands',
    label: 'Brands',
    icon: Boxes,
    description: 'Product brand lines and trademarks',
  },
  {
    id: 'bom',
    label: 'Bill of Materials',
    icon: FileCode,
    description: 'Manufacturing recipes and component assembly structures',
  },
  {
    id: 'warehouses',
    label: 'Warehouses',
    icon: Warehouse,
    description: 'Storage facilities, depots and location bin management',
  },
  {
    id: 'parties',
    label: 'Parties & CRM',
    icon: Users,
    description: 'Customers, suppliers, distributors, dealers and agents',
  },
];

export default function CatalogueWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<CatalogueTab>('products', VALID_TABS);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
              Master Data Registry
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

      {/* Segmented Navigation Tabs Tray */}
      <div className="flex overflow-x-auto p-1.5 bg-surface-sunken rounded-2xl border border-default shadow-2xs">
        <nav className="flex gap-1.5 min-w-full sm:min-w-0" aria-label="Catalogue sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
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
        </nav>
      </div>

      {/* Tab Section Content */}
      <div className="pt-1">
        {activeTab === 'products' && <ProductsSection />}
        {activeTab === 'units' && <UnitsSection />}
        {activeTab === 'categories' && <CategoriesSection />}
        {activeTab === 'brands' && <BrandsSection />}
        {activeTab === 'bom' && <BillOfMaterialsSection />}
        {activeTab === 'warehouses' && <WarehousesSection />}
        {activeTab === 'parties' && <PartiesSection />}
      </div>
    </div>
  );
}
