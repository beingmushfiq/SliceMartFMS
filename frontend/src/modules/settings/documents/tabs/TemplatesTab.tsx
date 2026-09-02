// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES TAB — Template Management & List
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../../../lib/api/client';
import { Modal, ConfirmDialog } from '../../../../components/ui/Modal';
import { TemplateCard } from '../components/TemplateCard';
import type { DocumentTemplate, DocumentTemplateVersion } from '../../../../types/api/documents';

interface TemplatesTabProps {
  onEditTemplate: (template: DocumentTemplate) => void;
  onCreateTemplate: () => void;
}

export function TemplatesTab({ onEditTemplate, onCreateTemplate }: TemplatesTabProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Version History Modal state
  const [historyTemplate, setHistoryTemplate] = useState<DocumentTemplate | null>(null);
  const [versions, setVersions] = useState<DocumentTemplateVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Archive Confirm state
  const [archiveTarget, setArchiveTarget] = useState<DocumentTemplate | null>(null);

  const { data: templates = [], isLoading, isFetching, refetch } = useQuery<DocumentTemplate[]>({
    queryKey: ['documents', 'templates'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: DocumentTemplate[] }>('/documents/templates');
        if (res.data?.data) {
          return res.data.data;
        }
      } catch {
        // Fallback
      }
      return [];
    },
  });

  const handleSetDefault = async (template: DocumentTemplate) => {
    try {
      await api.post(`/documents/templates/${template.id}/set-default`);
      toast.success(`"${template.name}" set as default for ${template.document_type}`);
      queryClient.invalidateQueries({ queryKey: ['documents', 'templates'] });
    } catch {
      toast.error('Failed to set default template');
    }
  };

  const handleDuplicate = async (template: DocumentTemplate) => {
    const newName = `${template.name} (Copy)`;
    try {
      await api.post(`/documents/templates/${template.id}/duplicate`, { name: newName });
      toast.success(`Template cloned as "${newName}"`);
      queryClient.invalidateQueries({ queryKey: ['documents', 'templates'] });
    } catch {
      toast.error('Failed to clone template');
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      await api.delete(`/documents/templates/${archiveTarget.id}`);
      toast.success(`Template "${archiveTarget.name}" archived`);
      setArchiveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['documents', 'templates'] });
    } catch {
      toast.error('Failed to archive template');
    }
  };

  const handleViewVersions = async (template: DocumentTemplate) => {
    setHistoryTemplate(template);
    setVersionsLoading(true);
    try {
      const res = await api.get<{ data: DocumentTemplateVersion[] }>(`/documents/templates/${template.id}/versions`);
      if (res.data?.data) {
        setVersions(res.data.data);
      }
    } catch {
      toast.error('Failed to load version history');
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleActivateVersion = async (version: number) => {
    if (!historyTemplate) return;
    try {
      await api.post(`/documents/templates/${historyTemplate.id}/versions/${version}/activate`);
      toast.success(`Version ${version} activated for "${historyTemplate.name}"`);
      setHistoryTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['documents', 'templates'] });
    } catch {
      toast.error('Failed to activate version');
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.document_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || t.document_type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [templates, searchQuery, selectedType]);

  const documentTypesList = useMemo(() => {
    const set = new Set(templates.map((t) => t.document_type));
    return Array.from(set);
  }, [templates]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Document Templates</h3>
          <p className="text-xs text-slate-400">
            Define layout structures, column visibility, branding, and paper sizes across business documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Templates"
          >
            <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onCreateTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by name or document type..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-primary text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-primary capitalize cursor-pointer"
          >
            <option value="all">All Document Types</option>
            {documentTypesList.map((type) => (
              <option key={type} value={type} className="capitalize">
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-xl bg-slate-800/40 animate-pulse border border-slate-700/40" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <Layers className="size-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No Templates Found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No document templates match your search criteria. Create a new custom template or reset filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={onEditTemplate}
              onDuplicate={handleDuplicate}
              onSetDefault={handleSetDefault}
              onArchive={(t) => setArchiveTarget(t)}
              onViewVersions={handleViewVersions}
            />
          ))}
        </div>
      )}

      {/* Version History Modal */}
      <Modal
        open={Boolean(historyTemplate)}
        onClose={() => setHistoryTemplate(null)}
        title={`Version History — ${historyTemplate?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Historical versions are immutable snapshots. You can activate any previous version to restore its layout.
          </p>

          {versionsLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading version logs...</div>
          ) : (
            <div className="space-y-2.5 max-h-90 overflow-y-auto pr-1">
              {versions.map((ver) => {
                const isCurrentActive = ver.id === historyTemplate?.active_version_id;
                return (
                  <div
                    key={ver.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrentActive
                        ? 'border-emerald-700/60 bg-emerald-950/20'
                        : 'border-slate-700/60 bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">v{ver.version}</span>
                        {isCurrentActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                            <CheckCircle2 className="size-3" /> Active Version
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 capitalize">
                            {ver.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {ver.change_summary || 'Configuration update'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ver.created_at).toLocaleString()}
                      </span>
                    </div>

                    {!isCurrentActive && (
                      <button
                        onClick={() => handleActivateVersion(ver.version)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                      >
                        Restore v{ver.version}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Document Template?"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? Documents previously issued with this template will continue referencing their frozen snapshots.`}
        confirmLabel="Archive Template"
        variant="danger"
      />
    </div>
  );
}
