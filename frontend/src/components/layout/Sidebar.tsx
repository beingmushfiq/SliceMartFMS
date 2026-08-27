import { NavLink } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  Microscope,
  Package,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'
import { useAuthStore } from '../../lib/auth/authStore'

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  permission?: string | string[]
  badge?: string
}

const mainNav: NavItem[] = [
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
    label: 'Workforce & HR',
    to: '/workforce',
    icon: Users,
    permission: ['workforce.employee.view'],
  },
  {
    label: 'Reports (RMS)',
    to: '/reports',
    icon: FileSpreadsheet,
    permission: ['reports.standard.view'],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const visibleNav = mainNav.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-500/20">
            <Package className="h-5 w-5 text-zinc-950 font-bold" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-zinc-100">SliceMart FMS</div>
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">Enterprise</div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5" aria-label="Main Navigation">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Operations & Management
          </div>

          {visibleNav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 font-semibold shadow-inner'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-zinc-800/80 p-4">
          <div className="rounded-xl bg-zinc-900/60 p-3 text-center border border-zinc-800">
            <div className="text-xs font-medium text-zinc-300">SliceMart Production</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Dual-token isolated tenant</div>
          </div>
        </div>
      </aside>
    </>
  )
}
