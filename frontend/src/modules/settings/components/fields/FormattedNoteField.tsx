import React, { useState } from 'react';
import { Quote, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface FormattedNoteFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string;
  rows?: number;
}

export const FormattedNoteField: React.FC<FormattedNoteFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
  rows = 2,
}) => {
  const [copied, setCopied] = useState(false);
  const strVal = typeof value === 'string' ? value : String(value ?? '');

  const isReceipt = settingKey.includes('receipt');
  const isTagline = settingKey.includes('tagline') || settingKey.includes('hero');
  const tag = isReceipt
    ? 'Customer Thermal Receipt Print'
    : isTagline
    ? 'Storefront Hero Headline'
    : 'System Note';

  const defaultHint = isReceipt
    ? 'Printed on official thermal paper handed to customer at checkout counter.'
    : 'Prominently displayed to visitors on the e-commerce storefront landing banner.';

  const handleCopy = () => {
    if (!strVal) return;
    navigator.clipboard.writeText(strVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3 hover:border-primary/30 transition-all">
      {/* Top Meta Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Quote className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-default">{label}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {tag}
              </span>
            </div>
            <p className="text-2xs text-muted mt-0.5 line-clamp-1">
              {description || defaultHint}
            </p>
          </div>
        </div>

        {/* Copy Action */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!strVal}
          title="Copy Note"
          className={cn(
            'p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0',
            copied
              ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
              : 'text-muted hover:text-default hover:bg-surface-sunken border-default'
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          rows={rows}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter formal copy or customer greeting note..."
          className="w-full bg-surface-sunken border border-default rounded-xl p-3 text-xs font-medium text-default placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-1 text-3xs text-muted">
          <span className="flex items-center gap-1">
            <Sparkles className="size-2.5 text-primary" /> Live preview on generated print documents
          </span>
          <span className="font-mono">{strVal.length} chars</span>
        </div>
      </div>
    </div>
  );
};
