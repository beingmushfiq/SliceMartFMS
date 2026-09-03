import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Lock, ShieldCheck } from 'lucide-react';
import { notify } from '../../../../components/ui/Toast';

interface EncryptedVaultFieldProps {
  label: string;
  settingKey: string;
  value: string | unknown;
  onChange: (val: string) => void;
  description?: string;
  placeholder?: string;
}

export const EncryptedVaultField: React.FC<EncryptedVaultFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
  placeholder = 'Enter encrypted API credential...',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const strVal = typeof value === 'string' ? value : '';
  const isConfigured = Boolean(strVal && strVal.trim().length > 0);

  const handleCopy = () => {
    if (!strVal) return;
    navigator.clipboard.writeText(strVal);
    setCopied(true);
    notify.info('Credential copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-default">{label}</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-semibold bg-danger-subtle text-danger border border-danger/20">
              <Lock className="size-2.5" /> Encrypted
            </span>
          </div>
          <span className="font-mono text-2xs text-muted block">{settingKey}</span>
          {description && <p className="text-2xs text-muted mt-0.5">{description}</p>}
        </div>

        {/* Status Indicator */}
        <div className="shrink-0">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="size-3" /> Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-surface-sunken text-muted border border-default">
              Not Set
            </span>
          )}
        </div>
      </div>

      {/* Masked Secret Input with Eye & Copy Actions */}
      <div className="relative flex items-center rounded-xl border border-default bg-surface-sunken overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <input
          type={isRevealed ? 'text' : 'password'}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3.5 py-2.5 text-xs font-mono text-default placeholder:text-subtle pr-20 focus:outline-none"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {strVal && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-muted hover:text-default rounded-lg hover:bg-surface transition-colors cursor-pointer"
              title="Copy secret"
              aria-label="Copy secret"
            >
              {copied ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsRevealed(!isRevealed)}
            className="p-1.5 text-muted hover:text-default rounded-lg hover:bg-surface transition-colors cursor-pointer"
            title={isRevealed ? 'Hide secret' : 'Reveal secret'}
            aria-label={isRevealed ? 'Hide secret' : 'Reveal secret'}
          >
            {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
