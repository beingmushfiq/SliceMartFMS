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

const DEFAULT_FALLBACK_TEMPLATES: DocumentTemplate[] = [
  {
    id: 1,
    uuid: 'tpl-sales-inv-def',
    name: 'Standard Commercial VAT Invoice',
    document_type: 'sales_invoice',
    paper_size_id: 1,
    print_profile_id: 1,
    status: 'active',
    is_default: true,
    current_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    uuid: 'tpl-delivery-chal-def',
    name: 'Standard Goods Delivery Challan',
    document_type: 'delivery_challan',
    paper_size_id: 1,
    print_profile_id: 1,
    status: 'active',
    is_default: true,
    current_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    uuid: 'tpl-po-voucher-def',
    name: 'Standard Purchase Order Voucher',
    document_type: 'purchase_order',
    paper_size_id: 1,
    print_profile_id: 1,
    status: 'active',
    is_default: true,
    current_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    uuid: 'tpl-money-receipt-def',
    name: 'Official Money Collection Receipt',
    document_type: 'payment_receipt',
    paper_size_id: 1,
    print_profile_id: 1,
    status: 'active',
    is_default: true,
    current_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    uuid: 'tpl-pos-thermal-def',
    name: '80mm POS Thermal Receipt Slip',
    document_type: 'pos_receipt_80mm',
    paper_size_id: 6,
    print_profile_id: 2,
    status: 'active',
    is_default: true,
    current_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    uuid: 'tpl-barcode-sticker-def',
    name: '50x35mm Retail Barcode Sticker',
    document_type: 'barcode_label',
    paper_size_id: 9,
    print_profile_id: 3,
    status: 'active',
    is_default: true,
    current_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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

  const { data: templates = DEFAULT_FALLBACK_TEMPLATES, isLoading, isFetching, refetch } = useQuery<DocumentTemplate[]>({
    queryKey: ['documents', 'templates'],
    queryFn: async () => {
      try {
        const res = await api.get<DocumentTemplate[] | { data: DocumentTemplate[] }>('/documents/templates');
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
        if (res.data && 'data' in res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('Failed to load document templates, using standard templates:', err);
      }
      return DEFAULT_FALLBACK_TEMPLATES;
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
      const res = await api.get<DocumentTemplateVersion[] | { data: DocumentTemplateVersion[] }>(`/documents/templates/${template.id}/versions`);
      if (Array.isArray(res.data)) {
        setVersions(res.data);
      } else if (res.data && 'data' in res.data && Array.isArray(res.data.data)) {
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
          <h3 className="text-base font-bold text-default tracking-tight">Document Templates</h3>
          <p className="text-xs text-muted">
            Define layout structures, column visibility, branding, and paper sizes across business documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-muted hover:text-default hover:bg-surface-sunken rounded-xl border border-default transition-colors cursor-pointer"
            title="Refresh Templates"
          >
            <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onCreateTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-surface border border-default text-xs shadow-2xs">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by name or document type..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-sunken border border-default text-default placeholder:text-muted/60 focus:outline-hidden focus:border-primary text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-muted" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-surface-sunken border border-default rounded-xl px-3 py-2 text-default text-xs focus:outline-hidden focus:border-primary capitalize cursor-pointer"
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
            <div key={n} className="h-44 rounded-2xl bg-surface-sunken animate-pulse border border-default" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-default bg-surface/50">
          <Layers className="size-8 text-muted mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-default">No Templates Found</h4>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
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
          <p className="text-xs text-muted">
            Historical versions are immutable snapshots. You can activate any previous version to restore its layout.
          </p>

          {versionsLoading ? (
            <div className="py-8 text-center text-xs text-muted">Loading version logs...</div>
          ) : (
            <div className="space-y-2.5 max-h-90 overflow-y-auto pr-1">
              {versions.map((ver) => {
                const isCurrentActive = ver.id === historyTemplate?.active_version_id;
                return (
                  <div
                    key={ver.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrentActive
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-default bg-surface-sunken'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-default">v{ver.version}</span>
                        {isCurrentActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="size-3" /> Active Version
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted capitalize">
                            {ver.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-default mt-1">
                        {ver.change_summary || 'Configuration update'}
                      </p>
                      <span className="text-[10px] text-muted font-mono">
                        {new Date(ver.created_at).toLocaleString()}
                      </span>
                    </div>

                    {!isCurrentActive && (
                      <button
                        type="button"
                        onClick={() => handleActivateVersion(ver.version)}
                        className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-sunken text-xs font-semibold text-default border border-default transition-colors cursor-pointer"
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
