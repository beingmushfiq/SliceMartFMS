import React, { useState } from 'react';
import { PhoneCall, Copy, Check, PhoneForwarded } from 'lucide-react';

interface ContactPhoneFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string | undefined;
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
  const badgeLabel = isWhatsApp ? 'WhatsApp Business' : 'Hotline';
  const defaultHint = isWhatsApp
    ? 'Official business messaging channel for customer order tracking & direct notifications.'
    : '24/7 central plant dispatch, logistics coordination, and management escalation line.';

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
    <div className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-2.5">
      {/* Field Label & Actions */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${settingKey}`}
          className="flex items-center gap-2 text-xs font-semibold text-default cursor-pointer"
        >
          <PhoneCall className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted bg-surface-sunken border border-default/60 px-2 py-0.5 rounded-md select-none shrink-0">
            {badgeLabel}
          </span>
          {strVal && (
            <div className="flex items-center gap-1 border-l border-default/60 pl-2">
              <button
                type="button"
                onClick={handleDial}
                title="Dial number"
                className="p-1 rounded-md text-muted hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
                aria-label="Dial phone number"
              >
                <PhoneForwarded className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy number"
                className="p-1 rounded-md text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                aria-label="Copy phone number"
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

      {/* Adorned Phone Input */}
      <div className="flex items-center rounded-lg border border-default bg-surface-sunken/40 overflow-hidden focus-within:bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-sunken/80 border-r border-default select-none shrink-0 text-muted">
          <span className="text-xs">🇧🇩</span>
          <span className="font-mono text-xs font-medium text-default">+880</span>
        </div>
        <input
          id={`field-${settingKey}`}
          type="tel"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="+880 1700-000000"
          className="w-full bg-transparent px-3 py-2 text-xs font-mono font-medium text-default focus:outline-none placeholder:text-muted/50"
        />
      </div>

      {/* Un-truncated Helpful Context Note */}
      <p className="text-[11px] text-muted leading-relaxed">
        {description || defaultHint}
      </p>
    </div>
  );
};
