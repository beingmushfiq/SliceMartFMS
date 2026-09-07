import React, { useState } from 'react';
import { PhoneCall, Copy, Check, PhoneForwarded } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface ContactPhoneFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string;
}

export const ContactPhoneField: React.FC<ContactPhoneFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
}) => {
  const [copied, setCopied] = useState(false);
  const strVal = typeof value === 'string' ? value : String(value ?? '');

  const isWhatsApp = settingKey.includes('whatsapp');
  const badgeLabel = isWhatsApp ? 'WhatsApp Business' : 'Direct Operations Hotline';
  const defaultHint = isWhatsApp
    ? 'Official business channel for customer order notifications & 1-tap ordering.'
    : '24/7 Central plant dispatch, logistics driver coordination, and escalation line.';

  const handleCopy = () => {
    if (!strVal) return;
    navigator.clipboard.writeText(strVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDial = () => {
    if (!strVal) return;
    window.location.href = `tel:${strVal.replace(/[^0-9+]/g, '')}`;
  };

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3 hover:border-primary/30 transition-all">
      {/* Top Meta Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <PhoneCall className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-default">{label}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {badgeLabel}
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
              onClick={handleDial}
              title="Test Dial / Open Phone App"
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-sunken border border-default transition-colors cursor-pointer"
            >
              <PhoneForwarded className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!strVal}
            title="Copy Phone Number"
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

      {/* Adorned Phone Input */}
      <div className="flex items-center rounded-xl border border-default bg-surface-sunken overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-surface border-r border-default select-none shrink-0">
          <span className="text-sm">🇧🇩</span>
          <span className="font-mono text-xs font-bold text-primary">+880</span>
        </div>
        <input
          type="tel"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="+880 1700-000000"
          className="w-full bg-transparent px-3 py-2.5 text-xs font-mono font-bold text-default focus:outline-none placeholder:text-muted/60"
        />
      </div>
    </div>
  );
};
