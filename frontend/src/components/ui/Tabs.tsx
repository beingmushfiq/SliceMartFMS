// ═══════════════════════════════════════════════════════════════════════════
// TABS                                                     UI_SYSTEM.md §10.2
// ───────────────────────────────────────────────────────────────────────────
// Full WAI-ARIA tabs pattern (§9.2 defect 2):
//   - role="tablist" / role="tab" / role="tabpanel"
//   - aria-selected, aria-controls, aria-labelledby
//   - ArrowLeft / ArrowRight / Home / End keyboard navigation
//   - Single tab stop (roving tabIndex)
//   - Controlled API (§10.3 rule 1 — value in, change out)
//   - Panel crossfade via Framer Motion (§7.3 row 5: fast / entrance)
//
// Legacy defects resolved:
//   - No arrow keys, no roving tabIndex → fixed
//   - Uncontrolled-only → now controlled (value + onValueChange)
//   - Non-compiling bg-blue-100 / bg-slate-100 → semantic tokens
//   - No panel crossfade → AnimatePresence crossfade
//   - Deleted legacy classes: tabs-list, tab-trigger
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useCallback, useContext, useId, useRef } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { cn } from '../../lib/utils';
import { enterFast } from '../../lib/motion/tokens';

// ── Context ────────────────────────────────────────────────────────────────

interface TabsContextValue {
  activeTab: string;
  onValueChange: (tab: string) => void;
  tabsId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>');
  return ctx;
}

// ── Keyboard navigation (roving tabIndex) ──────────────────────────────────
// §9.2 defect 2 — ArrowLeft/Right cycle between tabs, Home/End jump to
// first/last. Only the active tab has tabIndex=0; all others have tabIndex=-1.

function handleTabKeyDown(
  e: React.KeyboardEvent,
  tabs: HTMLElement[],
  currentId: string,
  setActive: (id: string) => void
) {
  const current = tabs.findIndex((t) => t.dataset.tabId === currentId);
  if (current === -1) return;

  let next = current;
  switch (e.key) {
    case 'ArrowRight':
      next = (current + 1) % tabs.length;
      break;
    case 'ArrowLeft':
      next = (current - 1 + tabs.length) % tabs.length;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = tabs.length - 1;
      break;
    default:
      return;
  }

  e.preventDefault();
  const target = tabs[next];
  if (!target) return;
  const id = target.dataset.tabId;
  if (id) {
    setActive(id);
    target.focus();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

// ── Tabs (Root) ────────────────────────────────────────────────────────────
// §10.3 rule 1 — fully controlled. Consumer owns state.

interface TabsProps {
  /** Currently active tab id. */
  value: string;
  /** Called when the user selects a different tab. */
  onValueChange: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
}

function TabsRoot({ value, onValueChange, children, className }: TabsProps) {
  const id = useId();

  return (
    <TabsContext.Provider value={{ activeTab: value, onValueChange, tabsId: id }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// ── TabList ────────────────────────────────────────────────────────────────
// role="tablist" with a single tabIndex stop (the active tab).

interface TabListProps {
  children: React.ReactNode;
  className?: string;
  /** Accessible label for the tab list. */
  label?: string;
}

function TabList({ children, className, label }: TabListProps) {
  const { activeTab, onValueChange, tabsId } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tabs = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []
      );
      handleTabKeyDown(e, tabs, activeTab, onValueChange);
    },
    [activeTab, onValueChange]
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex gap-1 overflow-x-auto',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        // Inject tabsId so TabTrigger can build its IDs without its own useId()
        return React.cloneElement(child as React.ReactElement<{ tabsId?: string }>, {
          tabsId,
        });
      })}
    </div>
  );
}

// ── TabTrigger ─────────────────────────────────────────────────────────────

interface TabTriggerProps {
  /** Unique tab identifier. Must match the corresponding TabPanel id. */
  id: string;
  children: React.ReactNode;
  /** Optional count badge (e.g. item count). */
  count?: number;
  className?: string;
  /** Injected by TabList — do not set manually. */
  tabsId?: string;
}

function TabTrigger({ id, children, count, className, tabsId: ctxTabsId }: TabTriggerProps) {
  const { activeTab, onValueChange, tabsId: fallbackTabsId } = useTabsContext();
  const tabsId = ctxTabsId ?? fallbackTabsId;
  const isActive = activeTab === id;

  // §9.2 defect 2 — roving tabIndex: only the active tab is in the tab order.
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`${tabsId}-panel-${id}`}
      id={`${tabsId}-tab-${id}`}
      tabIndex={isActive ? 0 : -1}
      data-tab-id={id}
      onClick={() => onValueChange(id)}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap',
        'rounded-md px-3 py-1.5',
        'text-sm font-medium',
        'transition-token-colors',
        'focus-visible:ring-focus outline-none',
        isActive
          ? 'bg-surface-sunken text-primary'
          : 'text-muted hover:bg-surface-sunken hover:text-default',
        className
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-2xs font-semibold',
            isActive ? 'bg-primary-subtle text-primary' : 'bg-surface-sunken text-muted'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── TabPanel ───────────────────────────────────────────────────────────────
// Crossfade via Framer Motion (§7.3 row 5: fast / entrance).
// Each panel has a unique key so AnimatePresence can animate the transition.

interface TabPanelProps {
  /** Must match the corresponding TabTrigger id. */
  id: string;
  children: React.ReactNode;
  className?: string;
}

function TabPanelContent({ id, children, className }: TabPanelProps) {
  const { activeTab, tabsId } = useTabsContext();
  const isActive = activeTab === id;

  return (
    <div
      role="tabpanel"
      id={`${tabsId}-panel-${id}`}
      aria-labelledby={`${tabsId}-tab-${id}`}
      tabIndex={0}
      hidden={!isActive}
    >
      <AnimatePresence mode="wait">
        {isActive && (
          <m.div
            key={id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={enterFast}
            className={className}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Exports ────────────────────────────────────────────────────────────────
// Compound component pattern: Tabs.Root, Tabs.List, Tabs.Trigger, Tabs.Panel

export const Tabs = Object.assign(TabsRoot, {
  List: TabList,
  Trigger: TabTrigger,
  Panel: TabPanelContent,
});
