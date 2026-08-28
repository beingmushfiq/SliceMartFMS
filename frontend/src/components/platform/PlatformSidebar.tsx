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
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Layers className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 text-sm tracking-tight">DevCenterPoint</span>
            <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider font-semibold">
              Master Admin
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
            Platform Engine
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border-l-2 border-amber-500 font-semibold shadow-sm shadow-amber-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Tenant Context Footer info */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Tenant Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Tenancy isolation enforced at database and API boundary.
          </p>
        </div>
      </div>
    </aside>
  );
};
