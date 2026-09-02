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
  const [activeTab, setActiveTab] = useState<DocumentsTabId>('templates');
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
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-primary/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
              <FileText className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>Documents & Printing Infrastructure</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Platform Service
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized document rendering, paper specifications, device print profiles, and authoritative sequence numbering.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      {activeTab !== 'editor' && (
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DocumentsTabId)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
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
