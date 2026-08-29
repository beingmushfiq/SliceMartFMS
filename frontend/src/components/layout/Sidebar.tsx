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
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Warehouse,
  Sparkles,
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
    title: 'OPERATIONS',
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
    title: 'COMMERCE & SUPPLY',
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
        label: 'Logistics & Courier',
        to: '/logistics',
        icon: Truck,
        permission: ['logistics.delivery.view'],
      },
    ],
  },
  {
    title: 'FINANCE & WORKFORCE',
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
    title: 'GOVERNANCE & SYSTEM',
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

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-(--z-overlay) bg-overlay backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-200 lg:translate-x-0 select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          backgroundColor: 'var(--nav-bg)',
          borderColor: 'var(--nav-border)',
        }}
      >
        {/* Brand Header */}
        <div
          className="flex h-16 items-center justify-between border-b px-5 shrink-0"
          style={{ borderColor: 'var(--nav-border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-700 shadow-md shadow-blue-500/25 shrink-0 text-white">
              <Package className="h-5 w-5 font-bold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-sm truncate">
                  SliceMart
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-400 border border-blue-400/30 uppercase">
                  FMS
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-slate-400 truncate">
                  {tenant?.name || 'Production Cloud'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav
          className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800"
          aria-label="Main Navigation"
        >
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div
                  className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400/80 uppercase"
                  style={{ letterSpacing: '0.08em' }}
                >
                  {section.title}
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
                          'group relative flex items-center justify-between px-3 rounded-lg text-xs font-medium transition-all focus-visible:ring-focus outline-none h-9',
                          isActive
                            ? 'font-semibold text-white bg-blue-600/20 border border-blue-500/25 shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active vertical pill indicator */}
                          {isActive && (
                            <span
                              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 shadow-sm shadow-blue-500"
                              aria-hidden="true"
                            />
                          )}

                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                'size-4 shrink-0 transition-transform group-hover:scale-105',
                                isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                              )}
                              aria-hidden="true"
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0',
                                item.badgeTone === 'success'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
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

        {/* Footer info */}
        <div className="border-t p-3 shrink-0" style={{ borderColor: 'var(--nav-border)' }}>
          <div
            className="rounded-lg p-2.5 border text-left flex items-center justify-between"
            style={{
              backgroundColor: 'var(--nav-bg-deep)',
              borderColor: 'var(--nav-border)',
            }}
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="size-3 text-amber-400" />
                <span>Enterprise v2.6.4</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Tenant: {tenant?.name || 'SLICEMART'}</div>
            </div>
            <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" title="System Healthy" />
          </div>
        </div>
      </aside>
    </>
  );
}

