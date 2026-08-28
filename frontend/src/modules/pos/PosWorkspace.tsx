import { useState } from 'react';
import { Clock, HardDrive } from 'lucide-react';
import { PosSessionsSection } from './sections/PosSessionsSection';
import { PosTerminalsSection } from './sections/PosTerminalsSection';
import { POSShell } from './POSShell';
import type { PosSession } from '../../types/api/pos';

export type PosTab = 'sessions' | 'terminals';

interface TabConfig {
  id: PosTab;
  label: string;
  icon: typeof Clock;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'sessions',
    label: 'POS Shift Sessions',
    icon: Clock,
    description:
      'Active cashier shifts, cash floats, live transactions & end-of-day reconciliation',
  },
  {
    id: 'terminals',
    label: 'Terminals & Hardware',
    icon: HardDrive,
    description: 'Cash register registers, receipt printer configurations & branch assignments',
  },
];

export default function PosWorkspace() {
  const [activeTab, setActiveTab] = useState<PosTab>('sessions');
  const [activePOSSession, setActivePOSSession] = useState<PosSession | null>(null);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  if (activePOSSession) {
    return <POSShell session={activePOSSession} onExit={() => setActivePOSSession(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Retail & Counter Checkout
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            {currentTab?.label}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">{currentTab?.description}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-zinc-800 pb-px scrollbar-none">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'sessions' && (
          <PosSessionsSection onLaunchPOS={(s) => setActivePOSSession(s)} />
        )}
        {activeTab === 'terminals' && <PosTerminalsSection />}
      </div>
    </div>
  );
}
