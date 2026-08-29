import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  Building2,
  ClipboardList,
  Coins,
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  Microscope,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Warehouse,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth/authStore';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission?: string | string[];
  badge?: string;
  badgeTone?: 'primary' | 'success' | 'amber' | 'neutral';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Operations & Execution',
    items: [
      {
        label: 'Operations Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Catalogue & Master',
        to: '/catalogue',
        icon: Boxes,
        permission: [
          'catalog.product.view',
          'catalog.unit.view',
          'catalog.category.view',
          'catalog.brand.view',
          'catalog.bom.view',
          'catalog.party.view',
          'inventory.warehouse.view',
        ],
      },
      {
        label: 'Production Chain',
        to: '/production',
        icon: Factory,
        permission: ['production.batch.view', 'production.plan.view'],
      },
      {
        label: 'Quality Control (QC)',
        to: '/qc',
        icon: Microscope,
        permission: ['qc.inspection.view', 'qc.parameter.view', 'qc.wastage.view'],
      },
      {
        label: 'Stock & Inventory',
        to: '/inventory',
        icon: Warehouse,
        permission: ['inventory.stock.view'],
      },
    ],
  },
  {
    title: 'Commerce & Supply Hub',
    items: [
      {
        label: 'Point of Sale (POS)',
        to: '/pos',
        icon: ShoppingCart,
        permission: ['pos.sales.view'],
        badge: 'Fast',
        badgeTone: 'primary',
      },
      {
        label: 'Storefront CMS',
        to: '/storefront',
        icon: Store,
        badge: 'Live',
        badgeTone: 'success',
      },
      {
        label: 'Sales & Invoices',
        to: '/sales',
        icon: ShoppingBag,
        permission: ['sales.order.view'],
      },
      {
        label: 'Procurement (PO)',
        to: '/purchasing',
        icon: ClipboardList,
        permission: ['procurement.order.view'],
      },
      {
        label: 'Logistics & 3PL Courier',
        to: '/logistics',
        icon: Truck,
        permission: ['logistics.delivery.view'],
      },
    ],
  },
  {
    title: 'Finance & Workforce',
    items: [
      {
        label: 'Finance & Accounts',
        to: '/finance',
        icon: Coins,
        permission: ['finance.gl.view'],
      },
      {
        label: 'Fixed Assets',
        to: '/assets',
        icon: Building2,
        permission: ['assets.register.view'],
      },
      {
        label: 'Workforce & HR',
        to: '/hr',
        icon: Users,
        permission: ['workforce.employee.view'],
      },
    ],
  },
  {
    title: 'Intelligence & System',
    items: [
      {
        label: 'Reports & BI (RMS)',
        to: '/reports',
        icon: FileSpreadsheet,
        permission: ['reports.standard.view'],
      },
      {
        label: 'Audit Trail',
        to: '/audit-logs',
        icon: ShieldCheck,
        permission: ['audit.logs.view'],
      },
      {
        label: 'Settings Center',
        to: '/settings',
        icon: Settings,
      },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenant = useAuthStore((state) => state.tenant);
  const activeBranch = useAuthStore((state) => state.activeBranch);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      {/* Mobile backdrop with frosted blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-(--z-overlay) bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Adaptive Luxury Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-(--nav-border) bg-(--nav-bg) text-default transition-all duration-300 ease-in-out lg:translate-x-0 select-none shadow-xl dark:shadow-black/80',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Subtle Ambient Radial Lighting for Dark Mode */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-indigo-500/5 via-emerald-500/2 to-transparent dark:from-indigo-500/10 dark:via-emerald-500/4"
          aria-hidden="true"
        />

        {/* Brand Monogram & Identity Header */}
        <div className="relative flex h-16 items-center justify-between border-b border-(--nav-border) px-4 shrink-0 bg-(--nav-bg)/95 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            {/* Custom Multi-Stop Geometric Emblem */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 p-0.5 shadow-md shadow-indigo-500/20 ring-1 ring-black/5 dark:ring-white/20 shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-white dark:bg-[#090d16]/90 backdrop-blur-xs">
                <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-[#070a10]" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-default text-sm truncate font-sans">
                  SliceMart
                </span>
                <span className="inline-flex items-center rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 tracking-wider uppercase font-mono">
                  FMS
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-medium text-muted truncate flex items-center gap-1">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                  {tenant?.name || 'Production Cloud'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Command & Workspace Search */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="relative flex items-center w-full rounded-lg bg-(--nav-bg-deep) border border-(--nav-border) px-2.5 py-1.5 text-xs text-muted hover:border-primary/40 transition-colors group">
            <Search className="size-3.5 text-muted group-hover:text-primary transition-colors mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-default placeholder:text-muted outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-muted bg-surface rounded border border-(--nav-border) ml-auto shrink-0">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin scrollbar-thumb-default scrollbar-track-transparent"
          aria-label="Main Navigation"
        >
          {navSections.map((section) => {
            const visibleItems = section.items
              .filter((item) => !item.permission || hasPermission(item.permission))
              .filter((item) =>
                searchQuery
                  ? item.label.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-0.5">
                <div className="px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-(--nav-section-fg) uppercase flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary/60" />
                  <span>{section.title}</span>
                </div>

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center justify-between px-3 rounded-lg text-xs font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary outline-none h-9.5',
                          isActive
                            ? 'font-semibold text-primary dark:text-white bg-(--nav-active-bg) border-l-2 border-(--nav-active-marker) shadow-xs'
                            : 'text-muted hover:text-default hover:bg-(--nav-hover-bg) border-l-2 border-transparent'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                'size-4 shrink-0 transition-transform duration-150 group-hover:scale-110',
                                isActive
                                  ? 'text-primary dark:text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                                  : 'text-muted group-hover:text-default'
                              )}
                              aria-hidden="true"
                            />
                            <span className="truncate tracking-normal">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 shadow-xs',
                                item.badgeTone === 'success'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer Operator Telemetry Hub */}
        <div className="border-t border-(--nav-border) p-3 shrink-0 bg-(--nav-bg-deep)">
          <div className="rounded-xl p-2.5 border border-(--nav-border) bg-(--nav-bg) text-left hover:border-primary/40 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                  <Activity className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-default truncate">
                    {activeBranch?.name || 'Dhaka Central Plant'}
                  </div>
                  <div className="text-[9px] text-muted truncate flex items-center gap-1 font-mono">
                    <span className="size-1 rounded-full bg-emerald-500" />
                    <span>Shift A · Active</span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center justify-center size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>

            <div className="mt-2 pt-2 border-t border-(--nav-border) flex items-center justify-between text-[10px] text-muted font-mono">
              <span>SaaS Core v2.6.4</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">99.99% Uptime</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

