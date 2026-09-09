import React, { useState } from 'react';
import { Mail, Copy, Check, Send } from 'lucide-react';

interface ContactEmailFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string | undefined;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ContactEmailField: React.FC<ContactEmailFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
}) => {
  const [copied, setCopied] = useState(false);
  const strVal = typeof value === 'string' ? value : String(value ?? '');

  const isValidEmail = EMAIL_REGEX.test(strVal.trim());
  const isNotification = settingKey.includes('notification');
  const badgeLabel = isNotification ? 'Transactional' : 'Public Support';
  const defaultHint = isNotification
    ? 'Sender address used for automated order confirmations, password resets, and alert dispatches.'
    : 'Primary email inbox for incoming customer inquiries, RFQs, and commercial communications.';

  const handleCopy = () => {
    if (!strVal) return;
    navigator.clipboard.writeText(strVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCompose = () => {
    if (!strVal) return;
    window.location.href = `mailto:${strVal.trim()}`;
  };

  return (
    <div className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-2.5">
      {/* Field Label & Actions */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${settingKey}`}
          className="flex items-center gap-2 text-xs font-semibold text-default cursor-pointer"
        >
          <Mail className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted bg-surface-sunken border border-default/60 px-2 py-0.5 rounded-md select-none shrink-0">
            {badgeLabel}
          </span>
          {strVal && (
            <div className="flex items-center gap-1 border-l border-default/60 pl-2">
              {isValidEmail && (
                <button
                  type="button"
                  onClick={handleCompose}
                  title="Compose email"
                  className="p-1 rounded-md text-muted hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
                  aria-label="Compose email"
                >
                  <Send className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy email"
                className="p-1 rounded-md text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                aria-label="Copy email address"
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

      {/* Input Field */}
      <div className="relative flex items-center">
        <input
          id={`field-${settingKey}`}
          type="email"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="support@company.com"
          className="w-full rounded-lg border border-default bg-surface-sunken/40 px-3 py-2 text-xs font-medium text-default placeholder:text-muted/50 transition-all focus:bg-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* Un-truncated Helpful Context Note */}
      <p className="text-[11px] text-muted leading-relaxed">
        {description || defaultHint}
      </p>
    </div>
  );
};
