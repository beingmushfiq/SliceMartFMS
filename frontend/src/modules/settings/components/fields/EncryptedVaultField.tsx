import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Lock, KeyRound } from 'lucide-react';
import { notify } from '../../../../components/ui/Toast';

interface EncryptedVaultFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string | undefined;
  placeholder?: string;
}

export const EncryptedVaultField: React.FC<EncryptedVaultFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
  placeholder = '••••••••••••••••••••••••',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const strVal = typeof value === 'string' ? value : String(value ?? '');
  const isConfigured = Boolean(strVal);

  const handleCopy = () => {
    if (!strVal) return;
    navigator.clipboard.writeText(strVal);
    setCopied(true);
    notify.info('Credential copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${settingKey}`}
          className="flex items-center gap-2 text-xs font-semibold text-default cursor-pointer"
        >
          <KeyRound className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
          <span>{label}</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-semibold bg-danger-subtle text-danger border border-danger/20">
            <Lock className="size-2.5" /> Encrypted
          </span>
        </label>

        {/* Status Indicator */}
        <div className="shrink-0">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold bg-surface-sunken text-muted border border-default">
              Not Set
            </span>
          )}
        </div>
      </div>

      {/* Masked Secret Input with Eye & Copy Actions */}
      <div className="relative flex items-center rounded-lg border border-default bg-surface-sunken/40 overflow-hidden focus-within:bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
        <input
          id={`field-${settingKey}`}
          type={isRevealed ? 'text' : 'password'}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2 text-xs font-mono text-default placeholder:text-muted/50 pr-20 focus:outline-none"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {strVal && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-muted hover:text-default rounded-md hover:bg-surface transition-colors cursor-pointer"
              title="Copy secret"
              aria-label="Copy secret"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsRevealed(!isRevealed)}
            className="p-1 text-muted hover:text-default rounded-md hover:bg-surface transition-colors cursor-pointer"
            title={isRevealed ? 'Hide secret' : 'Reveal secret'}
            aria-label={isRevealed ? 'Hide secret' : 'Reveal secret'}
          >
            {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Un-truncated Helpful Context Note */}
      {description && (
        <p className="text-[11px] text-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
};
