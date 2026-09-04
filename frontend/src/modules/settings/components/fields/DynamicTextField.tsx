import React, { useState } from 'react';
import {
  Tag,
  Hash,
  Globe,
  Sliders,
  Type,
  KeyRound,
  Shield,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface DynamicTextFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string;
  placeholder?: string;
}

export const DynamicTextField: React.FC<DynamicTextFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
  placeholder,
}) => {
  const [copied, setCopied] = useState(false);
  const strVal = typeof value === 'string' ? value : String(value ?? '');

  // Derive contextual icon dynamically
  const Icon = settingKey.includes('code')
    ? Hash
    : settingKey.includes('id') || settingKey.includes('tag')
    ? Tag
    : settingKey.includes('url') || settingKey.includes('domain')
    ? Globe
    : settingKey.includes('token') || settingKey.includes('key')
    ? KeyRound
    : settingKey.includes('security') || settingKey.includes('auth')
    ? Shield
    : settingKey.includes('format') || settingKey.includes('separator')
    ? Sliders
    : Type;

  // Derive badge tag dynamically
  const badgeTag = settingKey.includes('code')
    ? 'GL Account Code'
    : settingKey.includes('id')
    ? 'Telemetry / Tracking ID'
    : settingKey.includes('separator')
    ? 'Formatting Glyph'
    : settingKey.includes('sender')
    ? 'Telecom Sender ID'
    : 'System Parameter';

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
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-default">{label}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {badgeTag}
              </span>
            </div>
            {description && (
              <p className="text-2xs text-muted mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
        </div>

        {/* Copy Action */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!strVal}
          title="Copy Value"
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

      {/* Input Field */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          className="w-full bg-surface-sunken border border-default rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-default placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>
    </div>
  );
};
