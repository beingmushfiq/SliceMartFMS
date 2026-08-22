// ─────────────────────────────────────────────────────────────
// SIDEBAR — Enterprise navigation (Desktop + Responsive Mobile Drawer)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Factory, Package, ShoppingCart,
  TruckIcon, ShieldCheck, Users, Wallet, BarChart3, Bell,
  Camera, Settings, ChevronDown,
  ClipboardList, BookOpen, Layers, ArrowLeftRight, UserCheck,
  Calendar, Activity, Coins, Receipt, CreditCard, FileText,
  Building2, PackageOpen, PackageCheck, AlertTriangle,
  RotateCcw, UserCog, KeyRound, ScrollText, Wrench, X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

interface NavItemDef {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface NavGroupDef {
  section: string;
  items: NavItemDef[];
}

const NAV: NavGroupDef[] = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', to: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Production',
    items: [
      { label: 'Overview',          to: '/production',         icon: <Activity className="w-4 h-4" /> },
      { label: 'Production Orders', to: '/production/orders',  icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'Production Entry',  to: '/production/entry',   icon: <Factory className="w-4 h-4" /> },
      { label: 'BOM / Materials',   to: '/production/bom',     icon: <BookOpen className="w-4 h-4" /> },
      { label: 'History',           to: '/production/history', icon: <ScrollText className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { label: 'Overview',         to: '/inventory',              icon: <Layers className="w-4 h-4" /> },
      { label: 'Raw Materials',    to: '/inventory/materials',    icon: <Package className="w-4 h-4" /> },
      { label: 'Finished Goods',   to: '/inventory/products',     icon: <PackageCheck className="w-4 h-4" /> },
      { label: 'Stock Movement',   to: '/inventory/movements',    icon: <ArrowLeftRight className="w-4 h-4" /> },
      { label: 'Adjustments',      to: '/inventory/adjustments',  icon: <Wrench className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Warehouse',
    items: [
      { label: 'Warehouse A',   to: '/warehouse/a',         icon: <Building2 className="w-4 h-4" /> },
      { label: 'Warehouse B',   to: '/warehouse/b',         icon: <Building2 className="w-4 h-4" /> },
      { label: 'Transfers',     to: '/warehouse/transfers', icon: <ArrowLeftRight className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Procurement',
    items: [
      { label: 'Suppliers',        to: '/procurement/suppliers', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Purchase Orders',  to: '/procurement/orders',    icon: <ShoppingCart className="w-4 h-4" /> },
      { label: 'Receive Items',    to: '/procurement/receive',   icon: <PackageOpen className="w-4 h-4" /> },
      { label: 'History',          to: '/procurement/history',   icon: <ScrollText className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Sales',
    items: [
      { label: 'Overview',          to: '/sales',               icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'New Sale',          to: '/sales/new',           icon: <Receipt className="w-4 h-4" /> },
      { label: 'B2B Sales',         to: '/sales/b2b',           icon: <Building2 className="w-4 h-4" /> },
      { label: 'B2C Sales',         to: '/sales/b2c',           icon: <Users className="w-4 h-4" /> },
      { label: 'Raw Mat. Sales',    to: '/sales/raw-material',  icon: <Package className="w-4 h-4" /> },
      { label: 'Customers',         to: '/sales/customers',     icon: <UserCheck className="w-4 h-4" /> },
      { label: 'Returns',           to: '/sales/returns',       icon: <RotateCcw className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Delivery',
    items: [
      { label: 'All Deliveries', to: '/delivery',           icon: <TruckIcon className="w-4 h-4" /> },
      { label: 'Pending',        to: '/delivery/pending',   icon: <AlertTriangle className="w-4 h-4" /> },
      { label: 'In Transit',     to: '/delivery/transit',   icon: <TruckIcon className="w-4 h-4" /> },
      { label: 'Delivered',      to: '/delivery/delivered', icon: <PackageCheck className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Quality Control',
    items: [
      { label: 'QC Queue',    to: '/qc',          icon: <ShieldCheck className="w-4 h-4" /> },
      { label: 'QC History',  to: '/qc/history',  icon: <ScrollText className="w-4 h-4" /> },
      { label: 'Rework',      to: '/qc/rework',   icon: <RotateCcw className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Workforce',
    items: [
      { label: 'Employees',    to: '/workforce/employees',    icon: <Users className="w-4 h-4" /> },
      { label: 'Attendance',   to: '/workforce/attendance',   icon: <UserCheck className="w-4 h-4" /> },
      { label: 'Shifts',       to: '/workforce/shifts',       icon: <Calendar className="w-4 h-4" /> },
      { label: 'Performance',  to: '/workforce/performance',  icon: <Activity className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'Accounts',      to: '/finance/accounts',      icon: <Wallet className="w-4 h-4" /> },
      { label: 'Transactions',  to: '/finance/transactions',  icon: <ArrowLeftRight className="w-4 h-4" /> },
      { label: 'Expenses',      to: '/finance/expenses',      icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Receivables',   to: '/finance/receivables',   icon: <Coins className="w-4 h-4" /> },
      { label: 'Payables',      to: '/finance/payables',      icon: <Coins className="w-4 h-4" /> },
      { label: 'Profit & Loss', to: '/finance/pnl',           icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Reports',
    items: [
      { label: 'Production',  to: '/reports/production',  icon: <FileText className="w-4 h-4" /> },
      { label: 'Inventory',   to: '/reports/inventory',   icon: <FileText className="w-4 h-4" /> },
      { label: 'Sales',       to: '/reports/sales',       icon: <FileText className="w-4 h-4" /> },
      { label: 'Finance',     to: '/reports/finance',     icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Monitoring',
    items: [
      { label: 'Notifications', to: '/notifications', icon: <Bell className="w-4 h-4" /> },
      { label: 'CCTV',          to: '/cctv',          icon: <Camera className="w-4 h-4" /> },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'Users',             to: '/admin/users',     icon: <UserCog className="w-4 h-4" /> },
      { label: 'Roles & Perms',     to: '/admin/roles',     icon: <KeyRound className="w-4 h-4" /> },
      { label: 'System Settings',   to: '/admin/settings',  icon: <Settings className="w-4 h-4" /> },
      { label: 'Audit Log',         to: '/admin/audit',     icon: <ScrollText className="w-4 h-4" /> },
    ],
  },
];

const DEFAULT_COLLAPSED = new Set<string>(['Reports', 'Administration', 'Monitoring']);

export function Sidebar() {
  const collapsed = useAppStore(s => s.sidebarCollapsed);
  const mobileOpen = useAppStore(s => s.mobileSidebarOpen);
  const setMobileOpen = useAppStore(s => s.setMobileSidebarOpen);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(DEFAULT_COLLAPSED);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  };

  const navContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-navy-900 select-none overflow-hidden">
      {/* Brand Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0 transition-all duration-200',
        !isMobile && collapsed && 'justify-center px-2'
      )}>
        <Link
          to="/"
          onClick={() => isMobile && setMobileOpen(false)}
          className="flex items-center gap-3 min-w-0 cursor-pointer group"
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
          >
            <Factory className="w-4 h-4 text-white" aria-hidden="true" />
          </motion.div>
          <div
            className={cn(
              'min-w-0 transition-all duration-200 ease-out overflow-hidden',
              !isMobile && collapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-40'
            )}
          >
            <div className="text-white font-700 text-sm leading-tight truncate whitespace-nowrap group-hover:text-blue-200 transition-colors">Slice Mart</div>
            <div className="text-slate-400 text-2xs leading-tight whitespace-nowrap">Factory Management</div>
          </div>
        </Link>

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {NAV.map((group, groupIdx) => {
          const isSectionCollapsed = collapsedSections.has(group.section);
          const hasActiveChild = group.items.some(item =>
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
          );

          return (
            <div key={group.section} className="mb-1">
              {/* Section title */}
              <div
                className={cn(
                  'transition-all duration-200 ease-out overflow-hidden',
                  !isMobile && collapsed ? 'opacity-0 max-h-0 m-0' : 'opacity-100 max-h-8'
                )}
              >
                <button
                  onClick={() => toggleSection(group.section)}
                  className={cn(
                    'nav-section-title w-full flex items-center justify-between pr-3',
                    'hover:text-slate-300 transition-colors duration-150 cursor-pointer',
                    hasActiveChild && 'text-slate-300'
                  )}
                >
                  <span className="whitespace-nowrap">{group.section}</span>
                  <motion.span
                    animate={{ rotate: isSectionCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-2.5 h-2.5" aria-hidden="true" />
                  </motion.span>
                </button>
              </div>

              {/* Collapsed Divider */}
              {!isMobile && collapsed && groupIdx > 0 && (
                <div className="my-1 mx-3 h-px bg-white/10" aria-hidden="true" />
              )}

              {/* Items */}
              <AnimatePresence initial={false}>
                {(!isSectionCollapsed || (!isMobile && collapsed)) && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {group.items.map((item, itemIdx) => (
                      <motion.li
                        key={item.to}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: groupIdx * 0.01 + itemIdx * 0.01, duration: 0.15 }}
                      >
                        <NavLink
                          to={item.to}
                          end={item.to === '/'}
                          onClick={() => isMobile && setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'nav-item transition-all duration-200',
                              !isMobile && collapsed && 'justify-center px-0 mx-2',
                              isActive && 'active'
                            )
                          }
                          title={!isMobile && collapsed ? item.label : undefined}
                        >
                          <span className="nav-item-icon shrink-0" aria-hidden="true">{item.icon}</span>
                          <span
                            className={cn(
                              'nav-item-text transition-all duration-200 ease-out overflow-hidden whitespace-nowrap',
                              !isMobile && collapsed ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none' : 'opacity-100 max-w-40 translate-x-0'
                            )}
                          >
                            {item.label}
                          </span>
                        </NavLink>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'px-4 py-3 border-t border-white/10 shrink-0 bg-navy-950/60 transition-all duration-200 overflow-hidden',
          !isMobile && collapsed && 'px-2 flex justify-center'
        )}
      >
        {!isMobile && collapsed ? (
          <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" title="System Online · Slice Mart v1.0" />
        ) : (
          <div className="flex items-center justify-between whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" aria-hidden="true" />
              <span className="text-2xs text-slate-400">DevCenterPoint · v1.0</span>
            </div>
            <span className="text-2xs text-slate-500 font-mono">SliceMart</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Fixed Sidebar (md screens and up) ── */}
      <aside
        className={cn(
          'sidebar hidden md:flex',
          collapsed && 'collapsed'
        )}
        aria-label="Main navigation"
      >
        {navContent(false)}
      </aside>

      {/* ── Mobile Slide-out Drawer & Overlay (< md screens) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            {/* Slide-out Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-navy-900 md:hidden shadow-2xl overflow-hidden"
              aria-label="Mobile navigation drawer"
            >
              {navContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
