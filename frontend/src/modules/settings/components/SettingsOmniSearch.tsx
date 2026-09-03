import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Settings,
  ArrowRight,
  X,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/Badge';
import type { SettingsSchemaDictionary } from '../../../types/api/settings';

export interface SearchResultItem {
  id: string;
  type: 'setting' | 'group' | 'external';
  title: string;
  subtitle?: string;
  groupKey: string;
  groupTitle: string;
  categoryTitle: string;
  settingKey?: string;
  isSensitive?: boolean;
  valuePreview?: string;
  route?: string;
}

interface SettingsOmniSearchProps {
  isOpen: boolean;
  onClose: () => void;
  schema: SettingsSchemaDictionary;
  formValues: Record<string, unknown>;
  onSelectResult: (groupKey: string, settingKey?: string, route?: string) => void;
}

const STATIC_TOOLS: SearchResultItem[] = [
  {
    id: 'tool-roles',
    type: 'external',
    title: 'Staff Roles & Permission Matrix',
    subtitle: 'Manage RBAC permissions, role templates, access grants, and resource capabilities.',
    groupKey: 'roles',
    groupTitle: 'Roles & Permissions',
    categoryTitle: 'Company & Governance',
    route: '/settings/roles',
  },
  {
    id: 'tool-audit',
    type: 'external',
    title: 'Security Audit Trail & Compliance',
    subtitle: 'Immutable event stream, actor correlation IDs, IP logs, and state delta diffs.',
    groupKey: 'audit_logs',
    groupTitle: 'Audit Logs',
    categoryTitle: 'Company & Governance',
    route: '/settings/audit-logs',
  },
  {
    id: 'tool-profile',
    type: 'external',
    title: 'User Profile & Workstation Defaults',
    subtitle: 'Regional timezones, avatar, password credentials, and active branch context.',
    groupKey: 'profile',
    groupTitle: 'Workstation Profile',
    categoryTitle: 'Company & Governance',
    route: '/settings/profile',
  },
  {
    id: 'tool-seo',
    type: 'external',
    title: 'SEO & Search Engine Discoverability',
    subtitle: 'Structured schema, canonical URLs, IndexNow pinging, XML sitemaps, and robots.txt.',
    groupKey: 'seo',
    groupTitle: 'SEO & Discoverability',
    categoryTitle: 'Storefront & Channels',
    route: '/settings/seo',
  },
  {
    id: 'tool-domains',
    type: 'group',
    title: 'Custom Storefront Domains & SSL',
    subtitle: 'Domain name mapping, DNS verification challenges, and automated SSL termination.',
    groupKey: 'custom_domains',
    groupTitle: 'Custom Domains',
    categoryTitle: 'Storefront & Channels',
  },
  {
    id: 'tool-modules',
    type: 'group',
    title: 'Active ERP Modules & Ecosystem',
    subtitle: 'Toggle core manufacturing, POS, procurement, delivery, and accounting modules.',
    groupKey: 'modules',
    groupTitle: 'Modules Ecosystem',
    categoryTitle: 'Architecture & Customization',
  },
  {
    id: 'tool-stages',
    type: 'group',
    title: 'Production Stages & Routing Gates',
    subtitle: 'Configure factory floor work centers, sequential routing, and quality checklists.',
    groupKey: 'production_stages',
    groupTitle: 'Production Stages',
    categoryTitle: 'Architecture & Customization',
  },
  {
    id: 'tool-fields',
    type: 'group',
    title: 'Custom Fields & Extended Attributes',
    subtitle: 'Define dynamic metadata fields for products, customers, batches, and orders.',
    groupKey: 'custom_fields',
    groupTitle: 'Custom Fields',
    categoryTitle: 'Architecture & Customization',
  },
  {
    id: 'tool-documents',
    type: 'group',
    title: 'Document Templates & Printing',
    subtitle: 'Invoices, challans, POs, and thermal POS receipt layouts with letterhead.',
    groupKey: 'documents',
    groupTitle: 'Document Templates',
    categoryTitle: 'Architecture & Customization',
  },
];

export const SettingsOmniSearch: React.FC<SettingsOmniSearchProps> = ({
  isOpen,
  onClose,
  schema,
  formValues,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Index all schema settings
  const allSearchItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [...STATIC_TOOLS];

    Object.entries(schema).forEach(([groupKey, groupMeta]) => {
      // Add group itself
      items.push({
        id: `group-${groupKey}`,
        type: 'group',
        title: groupMeta.title || groupKey,
        subtitle: groupMeta.description,
        groupKey,
        groupTitle: groupMeta.title || groupKey,
        categoryTitle: 'Settings Domains',
      });

      // Add each parameter inside group
      if (groupMeta.settings) {
        Object.entries(groupMeta.settings).forEach(([settingKey, settingMeta]) => {
          const rawVal = formValues[settingKey] ?? settingMeta.default;
          let valStr = '';
          if (settingMeta.sensitive) {
            valStr = '••••••••';
          } else if (typeof rawVal === 'boolean') {
            valStr = rawVal ? 'Enabled' : 'Disabled';
          } else if (typeof rawVal === 'string' || typeof rawVal === 'number') {
            valStr = String(rawVal);
          }

          items.push({
            id: `setting-${groupKey}-${settingKey}`,
            type: 'setting',
            title: settingMeta.label || settingKey,
            subtitle: `Parameter key: ${settingKey}`,
            groupKey,
            groupTitle: groupMeta.title || groupKey,
            categoryTitle: 'Configuration Parameter',
            settingKey,
            isSensitive: settingMeta.sensitive,
            valuePreview: valStr,
          });
        });
      }
    });

    return items;
  }, [schema, formValues]);

  // Filter based on search query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      // Show default top recommended quick jumps
      return STATIC_TOOLS.slice(0, 6);
    }

    const q = query.toLowerCase().trim();
    return allSearchItems
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.settingKey?.toLowerCase().includes(q) ||
          item.groupTitle.toLowerCase().includes(q)
        );
      })
      .slice(0, 15);
  }, [allSearchItems, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        const item = filteredResults[selectedIndex];
        onSelectResult(item.groupKey, item.settingKey, item.route);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings Command Palette"
        className="relative w-full max-w-2xl bg-surface rounded-2xl border border-default shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-default bg-surface gap-3">
          <Search className="size-5 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search all 120+ settings, API keys, currencies, roles, domains..."
            className="w-full bg-transparent text-default text-sm placeholder:text-subtle focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-muted hover:text-default rounded-md"
              aria-label="Clear search query"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-mono text-muted bg-surface-sunken border border-default rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-default/40 flex-1">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Settings className="size-8 text-muted mx-auto opacity-50" />
              <p className="text-sm font-semibold text-default">No settings found</p>
              <p className="text-xs text-muted max-w-sm mx-auto">
                We couldn't find any parameters matching "{query}". Try searching for terms like "bKash", "Steadfast", "Currency", "VAT", or "Invoice".
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectResult(item.groupKey, item.settingKey, item.route);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors',
                    isSelected ? 'bg-primary-subtle text-default' : 'hover:bg-surface-sunken'
                  )}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-default truncate">{item.title}</span>
                      {item.isSensitive && (
                        <Badge tone="danger-subtle" icon={Lock}>
                          Sensitive
                        </Badge>
                      )}
                      {item.type === 'external' && (
                        <Badge tone="primary-subtle">Governance Tool</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-2xs text-muted">
                      <span>{item.groupTitle}</span>
                      <ChevronRight className="size-3" />
                      <span className="truncate">{item.subtitle}</span>
                    </div>
                  </div>

                  {item.valuePreview && (
                    <span className="font-mono text-2xs px-2 py-1 bg-surface border border-default rounded text-muted shrink-0">
                      {item.valuePreview}
                    </span>
                  )}

                  <ArrowRight
                    className={cn(
                      'size-4 shrink-0 transition-transform',
                      isSelected ? 'text-primary translate-x-0.5' : 'text-muted'
                    )}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-surface-sunken border-t border-default flex items-center justify-between text-2xs text-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono px-1 py-0.5 bg-surface border border-default rounded">↑</kbd>{' '}
              <kbd className="font-mono px-1 py-0.5 bg-surface border border-default rounded">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono px-1.5 py-0.5 bg-surface border border-default rounded">ENTER</kbd> to select
            </span>
          </div>
          <span>Showing {filteredResults.length} instant results</span>
        </div>
      </div>
    </div>
  );
};
