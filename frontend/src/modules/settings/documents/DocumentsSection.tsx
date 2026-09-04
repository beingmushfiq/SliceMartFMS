// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS SECTION — Settings → Documents & Printing Workspace
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  FileText,
  Ruler,
  Printer,
  Binary,
  Building2,
  History,
} from 'lucide-react';
import { TemplatesTab } from './tabs/TemplatesTab';
import { TemplateEditorTab } from './tabs/TemplateEditorTab';
import { PaperSizesTab } from './tabs/PaperSizesTab';
import { PrintProfilesTab } from './tabs/PrintProfilesTab';
import { NumberingTab } from './tabs/NumberingTab';
import { BusinessIdentityTab } from './tabs/BusinessIdentityTab';
import { ReprintHistoryTab } from './tabs/ReprintHistoryTab';
import { useWorkspaceTab } from '../../../hooks/useWorkspaceTab';
import type { DocumentTemplate } from '../../../types/api/documents';

export type DocumentsTabId =
  | 'templates'
  | 'editor'
  | 'paper_sizes'
  | 'print_profiles'
  | 'numbering'
  | 'business_identity'
  | 'history';

export function DocumentsSection() {
  const [activeTab, setActiveTab] = useWorkspaceTab<DocumentsTabId>(
    'templates',
    [
      'templates',
      'editor',
      'paper_sizes',
      'print_profiles',
      'numbering',
      'business_identity',
      'history',
    ] as const,
    'doc_tab'
  );
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

  const handleEditTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setActiveTab('editor');
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setActiveTab('editor');
  };

  const handleEditorBack = () => {
    setEditingTemplate(null);
    setActiveTab('templates');
  };

  const handleEditorSaved = () => {
    setEditingTemplate(null);
    setActiveTab('templates');
  };

  const TABS = [
    { id: 'templates', label: 'Document Templates', icon: FileText },
    { id: 'paper_sizes', label: 'Paper Sizes', icon: Ruler },
    { id: 'print_profiles', label: 'Print Profiles', icon: Printer },
    { id: 'numbering', label: 'Number Sequences', icon: Binary },
    { id: 'business_identity', label: 'Business Identity', icon: Building2 },
    { id: 'history', label: 'Reprint History', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header banner */}
      <div className="rounded-2xl border border-default bg-surface p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <FileText className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-default tracking-tight flex items-center gap-2">
                <span>Documents & Printing Infrastructure</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Platform Service
                </span>
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Centralized document rendering, paper specifications, device print profiles, and authoritative sequence numbering.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Tray */}
      {activeTab !== 'editor' && (
        <div className="flex overflow-x-auto p-1.5 bg-surface-sunken rounded-2xl border border-default shadow-2xs">
          <nav className="flex gap-1.5 min-w-full sm:min-w-0" aria-label="Documents infrastructure tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as DocumentsTabId)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-fg font-semibold shadow-xs border border-primary'
                      : 'text-muted hover:text-default hover:bg-surface/70 border border-transparent'
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? 'text-primary-fg' : 'text-muted'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Tab Contents */}
      <main>
        {activeTab === 'templates' && (
          <TemplatesTab
            onEditTemplate={handleEditTemplate}
            onCreateTemplate={handleCreateTemplate}
          />
        )}
        {activeTab === 'editor' && (
          <TemplateEditorTab
            template={editingTemplate}
            onBack={handleEditorBack}
            onSaved={handleEditorSaved}
          />
        )}
        {activeTab === 'paper_sizes' && <PaperSizesTab />}
        {activeTab === 'print_profiles' && <PrintProfilesTab />}
        {activeTab === 'numbering' && <NumberingTab />}
        {activeTab === 'business_identity' && <BusinessIdentityTab />}
        {activeTab === 'history' && <ReprintHistoryTab />}
      </main>
    </div>
  );
}
