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
  description?: string | undefined;
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

  const isMono =
    settingKey.includes('code') ||
    settingKey.includes('id') ||
    settingKey.includes('token') ||
    settingKey.includes('key');

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

  const handleCopy = () => {
    if (!strVal) return;
    navigator.clipboard.writeText(strVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-2.5">
      {/* Field Label & Actions */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${settingKey}`}
          className="flex items-center gap-2 text-xs font-semibold text-default cursor-pointer"
        >
          <Icon className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
          <span>{label}</span>
        </label>

        {isMono && strVal && (
          <button
            type="button"
            onClick={handleCopy}
            title="Copy value"
            className="p-1 rounded-md text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Input Field */}
      <div className="relative flex items-center">
        <input
          id={`field-${settingKey}`}
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          className={cn(
            'w-full rounded-lg border border-default bg-surface-sunken/40 px-3 py-2 text-xs text-default placeholder:text-muted/50 transition-all focus:bg-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15',
            isMono ? 'font-mono' : 'font-medium'
          )}
        />
      </div>

      {/* Un-truncated Helpful Context Note */}
      {description && (
        <p className="text-[11px] text-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
};
