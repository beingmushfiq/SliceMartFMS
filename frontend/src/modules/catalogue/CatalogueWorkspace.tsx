import { useState } from 'react'
import {
  Boxes,
  FileCode,
  Package,
  Ruler,
  Tag,
  Users,
  Warehouse,
} from 'lucide-react'
import { ProductsSection } from './sections/ProductsSection'
import { UnitsSection } from './sections/UnitsSection'
import { CategoriesSection } from './sections/CategoriesSection'
import { BrandsSection } from './sections/BrandsSection'
import { BillOfMaterialsSection } from './sections/BillOfMaterialsSection'
import { WarehousesSection } from './sections/WarehousesSection'
import { PartiesSection } from './sections/PartiesSection'

export type CatalogueTab =
  | 'products'
  | 'units'
  | 'categories'
  | 'brands'
  | 'bom'
  | 'warehouses'
  | 'parties'

interface TabConfig {
  id: CatalogueTab
  label: string
  icon: typeof Package
  description: string
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
]

export default function CatalogueWorkspace() {
  const [activeTab, setActiveTab] = useState<CatalogueTab>('products')

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0]

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Master Data Registry
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            {currentTab?.label}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {currentTab?.description}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-zinc-800">
        <nav className="flex space-x-2 overflow-x-auto pb-px" aria-label="Catalogue sections">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Active Section Content */}
      <div className="mt-4">
        {activeTab === 'products' && <ProductsSection />}
        {activeTab === 'units' && <UnitsSection />}
        {activeTab === 'categories' && <CategoriesSection />}
        {activeTab === 'brands' && <BrandsSection />}
        {activeTab === 'bom' && <BillOfMaterialsSection />}
        {activeTab === 'warehouses' && <WarehousesSection />}
        {activeTab === 'parties' && <PartiesSection />}
      </div>
    </div>
  )
}
