import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Boxes,
  FileCode,
  Package,
  Ruler,
  Tag,
  Users,
  Warehouse,
  ChevronDown,
  Search,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProductsSection } from './sections/ProductsSection';
import { UnitsSection } from './sections/UnitsSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { BrandsSection } from './sections/BrandsSection';
import { BillOfMaterialsSection } from './sections/BillOfMaterialsSection';
import { WarehousesSection } from './sections/WarehousesSection';
import { PartiesSection } from './sections/PartiesSection';

import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { cn } from '../../lib/utils';

export type CatalogueTab =
  | 'products'
  | 'units'
  | 'categories'
  | 'brands'
  | 'bom'
  | 'warehouses'
  | 'parties';

export type CatalogueCategory = 'products' | 'engineering' | 'directories';

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
  category: CatalogueCategory;
  icon: typeof Package;
  badge?: string;
  description: string;
}

interface CategoryConfig {
  id: CatalogueCategory;
  label: string;
  subtitle: string;
  defaultTab: CatalogueTab;
  badge: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'products',
    label: 'Product & SKU Catalog',
    subtitle: 'Items, Categories, Brands & Units',
    defaultTab: 'products',
    badge: '4 Views',
  },
  {
    id: 'engineering',
    label: 'Engineering & Recipes',
    subtitle: 'BOM & Assembly Structures',
    defaultTab: 'bom',
    badge: '1 View',
  },
  {
    id: 'directories',
    label: 'Facilities & Directory',
    subtitle: 'Warehouses & Stakeholder Directory',
    defaultTab: 'warehouses',
    badge: '2 Views',
  },
];

const TABS: TabConfig[] = [
  // Products & Taxonomy
  {
    id: 'products',
    label: 'Products & SKUs',
    category: 'products',
    icon: Package,
    description: 'Finished goods, raw materials, parts and catalog items with variants',
  },
  {
    id: 'categories',
    label: 'Categories',
    category: 'products',
    icon: Tag,
    description: 'Taxonomy hierarchy for product catalog classification',
  },
  {
    id: 'brands',
    label: 'Brands',
    category: 'products',
    icon: Boxes,
    description: 'Product brand lines, manufacturers and trademark portfolios',
  },
  {
    id: 'units',
    label: 'Units of Measure',
    category: 'products',
    icon: Ruler,
    description: 'Measurement standards, base units and precision conversion ratios',
  },

  // Engineering
  {
    id: 'bom',
    label: 'Bill of Materials',
    category: 'engineering',
    icon: FileCode,
    badge: 'Formulas',
    description: 'Manufacturing recipes, multi-level BOMs and assembly specifications',
  },

  // Facilities & Directories
  {
    id: 'warehouses',
    label: 'Warehouses & Depots',
    category: 'directories',
    icon: Warehouse,
    description: 'Storage facilities, distribution centers and location bin maps',
  },
  {
    id: 'parties',
    label: 'Parties & Stakeholders',
    category: 'directories',
    icon: Users,
    badge: 'CRM',
    description: 'Customers, suppliers, distributors, dealers and logistics partners',
  },
];

export default function CatalogueWorkspace() {
  const [activeTab, setActiveTab] = useWorkspaceTab<CatalogueTab>('products', VALID_TABS);
  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive active category from current active tab
  const currentTabConfig = TABS.find((t) => t.id === activeTab) ?? TABS[0]!;
  const activeCategory = currentTabConfig.category;

  // Active Category tabs
  const categoryTabs = useMemo(
    () => TABS.filter((t) => t.category === activeCategory),
    [activeCategory]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsQuickJumpOpen(false);
      }
    }
    if (isQuickJumpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuickJumpOpen]);

  const handleCategorySelect = (catId: CatalogueCategory) => {
    const targetCat = CATEGORIES.find((c) => c.id === catId);
    if (targetCat) {
      const existingInCat = TABS.find((t) => t.category === catId);
      if (existingInCat) {
        setActiveTab(existingInCat.id);
      }
    }
  };

  const filteredTabs = useMemo(() => {
    if (!searchFilter.trim()) return TABS;
    const q = searchFilter.toLowerCase();
    return TABS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [searchFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Workspace Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <Layers className="size-3 text-primary" />
              Master Data & Catalog Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default flex items-center gap-2.5">
            {currentTabConfig.label}
          </h1>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            {currentTabConfig.description}
          </p>
        </div>

        {/* All Views Quick Jump Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsQuickJumpOpen((prev) => !prev);
              setSearchFilter('');
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-default bg-surface hover:bg-surface-sunken text-default transition-all shadow-2xs hover:border-primary/40 cursor-pointer"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>All Catalog Views (7)</span>
            <ChevronDown className={cn('size-3.5 text-muted transition-transform', isQuickJumpOpen && 'rotate-180')} />
          </button>

          {isQuickJumpOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-surface border border-default shadow-2xl z-50 p-2 text-default animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="relative mb-2 px-1">
                <Search className="absolute left-3.5 top-2.5 size-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Jump to catalog view..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-sunken border border-default rounded-xl outline-hidden focus:border-primary text-default placeholder:text-muted"
                />
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1">
                {CATEGORIES.map((cat) => {
                  const catTabs = filteredTabs.filter((t) => t.category === cat.id);
                  if (catTabs.length === 0) return null;
                  return (
                    <div key={cat.id} className="pt-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                        {cat.label}
                      </div>
                      {catTabs.map((t) => {
                        const Icon = t.icon;
                        const isCurrent = activeTab === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(t.id);
                              setIsQuickJumpOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left',
                              isCurrent
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-default hover:bg-surface-sunken'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className="size-3.5 shrink-0 text-muted" />
                              <span className="truncate">{t.label}</span>
                            </div>
                            {isCurrent && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Category Switcher (3 Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={cn(
                'group relative flex flex-col p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-2xs',
                isSelected
                  ? 'bg-primary/5 border-primary shadow-sm dark:bg-primary/10'
                  : 'bg-surface hover:bg-surface-sunken border-default hover:border-default/80'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={cn(
                    'text-xs font-bold transition-colors',
                    isSelected ? 'text-primary' : 'text-default group-hover:text-default'
                  )}
                >
                  {cat.label}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border',
                    isSelected
                      ? 'bg-primary text-primary-fg border-primary'
                      : 'bg-surface-sunken text-muted border-default'
                  )}
                >
                  {cat.badge}
                </span>
              </div>
              <p className="text-[11px] text-muted line-clamp-1">{cat.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Secondary Contextual View Pills */}
      <div className="flex overflow-x-auto p-1.5 bg-surface-sunken rounded-2xl border border-default shadow-2xs">
        <nav className="flex gap-1.5 min-w-full sm:min-w-0" aria-label="Catalogue Views">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-fg font-semibold shadow-xs border border-primary'
                    : 'text-muted hover:text-default hover:bg-surface/60 border border-transparent'
                )}
              >
                <Icon className={cn('size-3.5', isActive ? 'text-primary-fg' : 'text-muted')} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-mono px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider',
                      isActive ? 'bg-white/20 text-white' : 'bg-surface text-muted border border-default'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
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
