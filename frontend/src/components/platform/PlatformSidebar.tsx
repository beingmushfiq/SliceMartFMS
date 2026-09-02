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
  ShieldAlert,
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
  {
    to: '/platform/errors',
    label: 'Error Monitoring',
    icon: ShieldAlert,
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
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 ring-2 ring-white dark:ring-[#070a10]" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-default text-sm truncate font-sans">
                Platform SaaS
              </span>
              <span className="inline-flex items-center rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/30 tracking-wider uppercase font-mono">
                Super
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-medium text-muted truncate flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                Root Control Plane
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-(--nav-section-fg) uppercase flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-amber-500/60" />
            <span>Master Governance</span>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                      : 'text-muted hover:text-default hover:bg-(--nav-hover-bg)'
                  }`
                }
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-(--nav-border) text-[10px] text-muted space-y-1 bg-(--nav-bg-deep)">
        <div className="flex items-center gap-1 text-slate-400">
          <Sparkles className="size-3 text-amber-500" />
          <span>Universal Platform Core v2.0</span>
        </div>
      </div>
    </aside>
  );
};
