// ─────────────────────────────────────────────────────────────
// BOTTOM NAVIGATION BAR — Mobile Navigation Bar (< 768px)
// ─────────────────────────────────────────────────────────────

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Factory, Package, BarChart3, Menu,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

export function BottomNav() {
  const location = useLocation();
  const toggleMobileSidebar = useAppStore(s => s.toggleMobileSidebar);

  const items = [
    { label: 'Dashboard', to: '/',                  icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Production', to: '/production/orders', icon: <Factory className="w-5 h-5" /> },
    { label: 'Inventory',  to: '/inventory',         icon: <Package className="w-5 h-5" /> },
    { label: 'Sales',      to: '/sales',             icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-950/95 backdrop-blur-md
                 border-t border-white/10 px-2 py-1 flex items-center justify-around"
      aria-label="Mobile bottom navigation"
    >
      {items.map((item) => {
        const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-2xs transition-colors',
              isActive ? 'text-blue-400 font-600' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <span className="mb-0.5">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <button
        onClick={toggleMobileSidebar}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-2xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        aria-label="Open full menu"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
