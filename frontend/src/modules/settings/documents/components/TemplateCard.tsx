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
    <div className="flex flex-col justify-between rounded-xl border border-slate-700/60 bg-slate-800/60 p-4 hover:border-slate-600 hover:bg-slate-800/90 transition-all shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
              <DocumentTypeIcon type={template.document_type} className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white tracking-wide">{template.name}</h4>
              <p className="text-[11px] text-slate-400 font-mono capitalize">
                {template.document_type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {template.is_default && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                Default
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                template.status === 'active'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                  : 'bg-slate-700/80 text-slate-300 border border-slate-600'
              }`}
            >
              {template.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 my-3 py-2.5 px-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Paper Format</span>
            <span className="font-medium text-slate-200 truncate block">
              {template.paper_size?.name || 'A4 Standard'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Version</span>
            <span className="font-mono font-medium text-sky-400">
              v{template.current_version}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-1">
        <button
          onClick={() => onViewVersions(template)}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          title="Version History"
        >
          <History className="size-3.5" />
          <span>History</span>
        </button>

        <div className="flex items-center gap-1">
          {!template.is_default && (
            <button
              onClick={() => onSetDefault(template)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition-colors"
              title="Set as Default Template"
            >
              <Star className="size-3.5" />
            </button>
          )}

          <button
            onClick={() => onDuplicate(template)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Clone Template"
          >
            <Copy className="size-3.5" />
          </button>

          <button
            onClick={() => onArchive(template)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
            title="Archive Template"
          >
            <Archive className="size-3.5" />
          </button>

          <button
            onClick={() => onEdit(template)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40 text-xs font-semibold transition-all ml-1"
          >
            <Edit3 className="size-3.5" />
            <span>Customize</span>
          </button>
        </div>
      </div>
    </div>
  );
}
