import React, { useState } from 'react';
import {
  Building,
  Factory,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface AddressLocationFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string | undefined;
}

export const AddressLocationField: React.FC<AddressLocationFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
}) => {
  const [copied, setCopied] = useState(false);
  const strVal = typeof value === 'string' ? value : String(value ?? '');

  const isFactory = settingKey.includes('factory') || settingKey.includes('plant');
  const Icon = isFactory ? Factory : Building;
  const tag = isFactory ? 'Manufacturing Facility' : 'Registered Headquarters';
  const defaultHint = isFactory
    ? 'Physical manufacturing plant, production floors, and inbound raw material receiving dock.'
    : 'Official corporate registered address for statutory filings, VAT challans, and commercial correspondence.';

  const handleCopy = () => {
    if (!strVal) return;
    navigator.clipboard.writeText(strVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleOpenMap = () => {
    if (!strVal) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(strVal)}`,
      '_blank',
      'noopener,noreferrer'
    );
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

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted bg-surface-sunken border border-default/60 px-2 py-0.5 rounded-md select-none shrink-0">
            {tag}
          </span>
          {strVal && (
            <div className="flex items-center gap-1 border-l border-default/60 pl-2">
              <button
                type="button"
                onClick={handleOpenMap}
                title="Open in Google Maps"
                className="p-1 rounded-md text-muted hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
                aria-label="Open in Google Maps"
              >
                <ExternalLink className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy address"
                className="p-1 rounded-md text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-line Address Textarea */}
      <textarea
        id={`field-${settingKey}`}
        rows={2}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter street, industrial zone, city, postal code..."
        className="w-full rounded-lg border border-default bg-surface-sunken/40 p-2.5 text-xs font-medium text-default placeholder:text-muted/50 transition-all focus:bg-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none"
      />

      {/* Un-truncated Helpful Context Note */}
      <div className="flex items-center justify-between text-[11px] text-muted leading-relaxed">
        <p>{description || defaultHint}</p>
        {strVal && (
          <span className="text-3xs font-mono text-muted/70 shrink-0 ml-2">
            {strVal.length} chars
          </span>
        )}
      </div>
    </div>
  );
};
