import React, { useState } from 'react';
import { Mail, Copy, Check, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface ContactEmailFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string;
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
  const defaultHint = isNotification
    ? 'Email address used as sender envelope for transactional order updates and low stock alerts.'
    : 'Official channel for customer inquiries, automated purchase orders, and system reports.';

  const handleCopy = () => {
    if (!strVal) return;
    navigator.clipboard.writeText(strVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCompose = () => {
    if (!strVal) return;
    window.location.href = `mailto:${strVal.trim()}?subject=Test%20ERP%20Connection`;
  };

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3 hover:border-primary/30 transition-all">
      {/* Top Meta Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-default">{label}</span>
              {strVal && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider border',
                    isValidEmail
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  )}
                >
                  {isValidEmail ? (
                    <>
                      <CheckCircle2 className="size-2.5" /> Valid RFC Mail
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-2.5" /> Incomplete Format
                    </>
                  )}
                </span>
              )}
            </div>
            <p className="text-2xs text-muted mt-0.5 line-clamp-1">
              {description || defaultHint}
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-1 shrink-0">
          {strVal && isValidEmail && (
            <button
              type="button"
              onClick={handleCompose}
              title="Compose Test Email"
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-sunken border border-default transition-colors cursor-pointer"
            >
              <Send className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!strVal}
            title="Copy Email"
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

      {/* Input Field */}
      <div className="relative flex items-center">
        <input
          type="email"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="support@company.com"
          className="w-full bg-surface-sunken border border-default rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-default placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>
    </div>
  );
};
