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
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth/authStore';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission?: string | string[];
  badge?: string;
}

const mainNav: NavItem[] = [
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
  {
    label: 'Point of Sale (POS)',
    to: '/pos',
    icon: ShoppingCart,
    permission: ['pos.sales.view'],
    badge: 'Fast',
  },
  {
    label: 'Storefront CMS',
    to: '/storefront',
    icon: Store,
    badge: 'Live',
  },
  {
    label: 'Sales & Invoices',
    to: '/sales',
    icon: ShoppingBag,
    permission: ['sales.order.view'],
  },
  {
    label: 'Procurement',
    to: '/procurement',
    icon: ClipboardList,
    permission: ['procurement.order.view'],
  },
  {
    label: 'Logistics & Courier',
    to: '/logistics',
    icon: Truck,
    permission: ['logistics.delivery.view'],
  },
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
  {
    label: 'Reports (RMS)',
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
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const visibleNav = mainNav.filter((item) => !item.permission || hasPermission(item.permission));

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
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-200 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          backgroundColor: 'var(--nav-bg)',
          borderColor: 'var(--nav-border)',
        }}
      >
        {/* Brand header */}
        <div
          className="flex h-16 items-center gap-3 border-b px-6 shrink-0"
          style={{ borderColor: 'var(--nav-border)' }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 shrink-0">
            <Package className="h-5 w-5 text-white font-bold" />
          </div>
          <div className="min-w-0">
            <div className="font-bold tracking-tight text-white text-sm truncate">SliceMart FMS</div>
            <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">
              Enterprise
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Main Navigation">
          <div
            className="px-3 py-2 text-2xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--nav-section-fg)' }}
          >
            Operations & Management
          </div>

          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center justify-between px-(--nav-item-px) rounded-(--nav-item-radius) text-xs font-medium transition-token-colors focus-visible:ring-focus outline-none',
                    'h-(--nav-item-height)',
                    isActive
                      ? 'font-semibold text-white'
                      : 'hover:text-white'
                  )
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--nav-fg-active)' : 'var(--nav-fg)',
                  backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
                })}
              >
                {({ isActive }) => (
                  <>
                    {/* Active vertical pill indicator */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                        style={{ backgroundColor: 'var(--nav-active-marker)' }}
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-center gap-(--nav-item-gap) min-w-0">
                      <Icon
                        className="size-4 shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          color: isActive ? 'var(--nav-icon-active)' : 'var(--nav-icon)',
                        }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="rounded-full px-2 py-0.5 text-2xs font-bold bg-primary-subtle text-primary shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t p-3 shrink-0" style={{ borderColor: 'var(--nav-border)' }}>
          <div
            className="rounded-(--radius-sm) p-3 text-center border"
            style={{
              backgroundColor: 'var(--nav-bg-deep)',
              borderColor: 'var(--nav-border)',
            }}
          >
            <div className="text-xs font-medium text-slate-200">SliceMart Production</div>
            <div className="text-2xs text-slate-400 mt-0.5">Dual-token isolated tenant</div>
          </div>
        </div>
      </aside>
    </>
  );
}
