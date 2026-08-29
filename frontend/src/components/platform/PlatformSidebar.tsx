import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  CreditCard,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/platform',
    label: 'Overview & KPIs',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/platform/tenants',
    label: 'Tenant Directory',
    icon: Building2,
    end: true,
  },
  {
    to: '/platform/tenants/new',
    label: 'Provision Tenant',
    icon: UserPlus,
    end: true,
  },
  {
    to: '/platform/plans',
    label: 'Subscription Plans',
    icon: CreditCard,
    end: true,
  },
  {
    to: '/platform/audit-logs',
    label: 'Platform Audit Trail',
    icon: History,
    end: true,
  },
];

export const PlatformSidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-(--nav-border) bg-(--nav-bg) text-default flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none shadow-xl dark:shadow-black/80">
      {/* Subtle Ambient Radial Lighting for Dark Mode */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-amber-500/4 via-amber-500/1 to-transparent dark:from-amber-500/10 dark:via-amber-500/3"
        aria-hidden="true"
      />

      <div>
        {/* Brand Header */}
        <div className="relative h-16 px-5 border-b border-(--nav-border) flex items-center gap-3 bg-(--nav-bg)/95 backdrop-blur-md">
          <div className="relative w-9 h-9 rounded-xl bg-linear-to-br from-amber-500 via-amber-600 to-amber-800 p-0.5 shadow-md shadow-amber-500/20 ring-1 ring-black/5 dark:ring-white/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-lg bg-white dark:bg-[#090d16]/90 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4 stroke-[2.5] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-default text-sm tracking-tight truncate">DevCenterPoint</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400/90 uppercase tracking-widest font-semibold">
                Master SaaS Admin
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-(--nav-section-fg) flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-amber-500/60" />
            <span>Platform Core</span>
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-700 dark:text-white border-l-2 border-amber-500 font-semibold shadow-xs'
                      : 'text-muted hover:text-default hover:bg-(--nav-hover-bg) border-l-2 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                        isActive
                          ? 'text-amber-600 dark:text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] scale-110'
                          : 'text-muted'
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Tenant Context Footer info */}
      <div className="p-3 border-t border-(--nav-border) bg-(--nav-bg-deep)">
        <div className="p-3 rounded-xl bg-(--nav-bg) border border-(--nav-border) text-xs shadow-xs">
          <div className="flex items-center gap-2 text-default font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Multi-Tenant Engine</span>
          </div>
          <p className="text-[10px] text-muted leading-relaxed font-mono">
            Hard isolation enforced via BelongsToTenant scope & verified JWT claims.
          </p>
        </div>
      </div>
    </aside>
  );
};
