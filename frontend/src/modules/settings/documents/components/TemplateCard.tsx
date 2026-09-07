// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

import {
  Edit3,
  Copy,
  Star,
  Archive,
  History,
} from 'lucide-react';
import type { DocumentTemplate } from '../../../../types/api/documents';
import { DocumentTypeIcon } from './DocumentTypeIcon';

interface TemplateCardProps {
  template: DocumentTemplate;
  onEdit: (template: DocumentTemplate) => void;
  onDuplicate: (template: DocumentTemplate) => void;
  onSetDefault: (template: DocumentTemplate) => void;
  onArchive: (template: DocumentTemplate) => void;
  onViewVersions: (template: DocumentTemplate) => void;
}

export function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onSetDefault,
  onArchive,
  onViewVersions,
}: TemplateCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-default bg-surface p-4.5 hover:border-primary/50 hover:shadow-md transition-all shadow-xs">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <DocumentTypeIcon type={template.document_type} className="size-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-default tracking-tight">{template.name}</h4>
              <p className="text-[11px] text-muted font-mono capitalize mt-0.5">
                {template.document_type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {template.is_default && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Star className="size-3 fill-amber-500 text-amber-500" />
                Default
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                template.status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-surface-sunken text-muted border border-default'
              }`}
            >
              {template.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 my-3.5 py-2.5 px-3 rounded-xl bg-surface-sunken border border-default text-xs">
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider block">Paper Format</span>
            <span className="font-medium text-default truncate block mt-0.5">
              {template.paper_size?.name || 'A4 Standard'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider block">Version</span>
            <span className="font-mono font-semibold text-primary block mt-0.5">
              v{template.current_version}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-default mt-1">
        <button
          type="button"
          onClick={() => onViewVersions(template)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-default transition-colors cursor-pointer"
          title="Version History"
        >
          <History className="size-3.5" />
          <span>History</span>
        </button>

        <div className="flex items-center gap-1">
          {!template.is_default && (
            <button
              type="button"
              onClick={() => onSetDefault(template)}
              className="p-1.5 rounded-lg text-muted hover:text-amber-600 hover:bg-surface-sunken transition-colors cursor-pointer"
              title="Set as Default Template"
            >
              <Star className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDuplicate(template)}
            className="p-1.5 rounded-lg text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
            title="Clone Template"
          >
            <Copy className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onArchive(template)}
            className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Archive Template"
          >
            <Archive className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(template)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-fg hover:opacity-90 text-xs font-semibold shadow-2xs transition-all ml-1 cursor-pointer"
          >
            <Edit3 className="size-3.5" />
            <span>Customize</span>
          </button>
        </div>
      </div>
    </div>
  );
}
