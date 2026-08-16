// ─────────────────────────────────────────────────────────────
// TABS — Accessible tab navigation component
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  activeTab: '',
  setActiveTab: () => {},
});

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  onChange?: (tab: string) => void;
  className?: string;
}

export function Tabs({ defaultTab, children, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleChange = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      className={cn('tabs-list', className)}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabTriggerProps {
  id: string;
  children: React.ReactNode;
  count?: number;
}

export function TabTrigger({ id, children, count }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      id={`tab-${id}`}
      className={cn('tab-trigger', isActive && 'active')}
      onClick={() => setActiveTab(id)}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          'ml-1.5 px-1.5 py-0.5 rounded-full text-2xs font-600',
          isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={cn('animate-fade-in', className)}
    >
      {children}
    </div>
  );
}
