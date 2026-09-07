import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  FileCheck2,
  Landmark,
  Factory,
  Hash,
  FileBadge,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface LegalIdentifierFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string) => void;
  description?: string;
}

const FIELD_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    authorityTag: string;
    placeholder: string;
    contextHint: string;
  }
> = {
  company_legal_name: {
    icon: Building2,
    authorityTag: 'Primary Legal Entity',
    placeholder: 'e.g. SliceMart Industries Ltd.',
    contextHint: 'Appears on commercial invoices, challans, and customer receipts.',
  },
  trade_license_no: {
    icon: ShieldCheck,
    authorityTag: 'City Corporation Registry',
    placeholder: 'e.g. TRAD/DNCC/019283/2024',
    contextHint: 'Municipal trade license permit authorized for industrial operations.',
  },
  tax_identification_number: {
    icon: FileCheck2,
    authorityTag: 'NBR VAT 6.3 Validated',
    placeholder: 'e.g. BIN-99210029381',
    contextHint: 'National Board of Revenue 13-digit Business Identification Number.',
  },
  rjsc_registration_no: {
    icon: Landmark,
    authorityTag: 'Govt. Joint Stock Reg.',
    placeholder: 'e.g. C-184920/2023',
    contextHint: 'Registrar of Joint Stock Companies and Firms incorporation number.',
  },
  factory_license_no: {
    icon: Factory,
    authorityTag: 'DIFE Safety Certified',
    placeholder: 'e.g. DIFE/DHK/IND-04829',
    contextHint: 'Department of Inspection for Factories & Establishments compliance id.',
  },
  bin_branch_code: {
    icon: Hash,
    authorityTag: 'Tax Jurisdiction Unit',
    placeholder: 'e.g. 0001 (Tejgaon Central Plant)',
    contextHint: 'NBR registered 4-digit manufacturing plant or warehouse branch code.',
  },
};

export const LegalIdentifierField: React.FC<LegalIdentifierFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
}) => {
  const [copied, setCopied] = useState(false);
  const strVal = typeof value === 'string' ? value : String(value ?? '');
  const config = FIELD_CONFIG[settingKey] || {
    icon: FileBadge,
    authorityTag: 'Official Registration',
    placeholder: 'Enter registration identifier...',
    contextHint: 'Official enterprise registration parameter.',
  };

  const Icon = config.icon;

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
                {config.authorityTag}
              </span>
            </div>
            <p className="text-2xs text-muted mt-0.5 line-clamp-1">
              {description || config.contextHint}
            </p>
          </div>
        </div>

        {/* Verification Status Indicator */}
        {strVal ? (
          <span className="inline-flex items-center gap-1 text-3xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle2 className="size-3" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center text-3xs font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
            Not Set
          </span>
        )}
      </div>

      {/* Interactive Input with Copy Action */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className="w-full bg-surface-sunken border border-default rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono font-bold text-default placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!strVal}
          title="Copy Identifier"
          className={cn(
            'absolute right-2.5 p-1.5 rounded-lg transition-colors cursor-pointer',
            copied
              ? 'text-emerald-500 bg-emerald-500/10'
              : 'text-muted hover:text-default hover:bg-surface border border-transparent hover:border-default'
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
};
