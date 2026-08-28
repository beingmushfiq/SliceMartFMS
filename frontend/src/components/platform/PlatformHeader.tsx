import React from 'react';
import { usePlatformAuthStore } from '../../lib/auth/platformAuthStore';
import { ShieldCheck, LogOut, Terminal, Server } from 'lucide-react';

export const PlatformHeader: React.FC = () => {
  const { user, logout } = usePlatformAuthStore();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-xs font-mono font-medium">
          <Terminal className="w-3.5 h-3.5" />
          <span>DEVCENTERPOINT :: CONTROL PLANE</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PRODUCTION CLUSTER</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-200">{user?.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">{user?.email}</span>
          </div>
          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono uppercase font-bold tracking-wider">
            Super Admin
          </span>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          title="Open Slice Mart Tenant Portal in new tab"
        >
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span>Tenant App (Slice Mart)</span>
        </a>

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-xs font-medium text-rose-300 transition-colors"
          title="Sign out of Platform Control Plane"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
