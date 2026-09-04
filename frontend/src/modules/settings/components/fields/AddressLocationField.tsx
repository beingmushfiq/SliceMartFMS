import React, { useState } from 'react';
import {
  MapPin,
  Building,
  Factory,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface AddressLocationFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string;
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
    ? 'Physical plant, manufacturing floors, and inbound raw material receiving dock.'
    : 'Official corporate registered address for statutory filings, VAT challans, and legal service.';

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
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3 hover:border-primary/30 transition-all">
      {/* Meta Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="size-4" />
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

        {/* Action Shortcuts */}
        <div className="flex items-center gap-1 shrink-0">
          {strVal && (
            <button
              type="button"
              onClick={handleOpenMap}
              title="Open in Google Maps"
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-sunken border border-default transition-colors cursor-pointer"
            >
              <ExternalLink className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!strVal}
            title="Copy Address"
            className={cn(
              'p-1.5 rounded-lg border transition-colors cursor-pointer',
              copied
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                : 'text-muted hover:text-default hover:bg-surface-sunken border-default'
            )}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Multi-line Address Textarea */}
      <div className="relative">
        <textarea
          rows={2}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter street, industrial zone, city, postal code..."
          className="w-full bg-surface-sunken border border-default rounded-xl p-3 text-xs font-medium text-default placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-1 text-3xs text-muted">
          <span className="flex items-center gap-1">
            <MapPin className="size-2.5 text-primary" /> Verified Coordinates & Tax Jurisdiction
          </span>
          <span className="font-mono">{strVal.length} chars</span>
        </div>
      </div>
    </div>
  );
};
