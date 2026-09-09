import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface PrefixSerialFieldProps {
  label: string;
  settingKey: string;
  value: string | unknown;
  onChange: (val: string) => void;
  description?: string | undefined;
}

export const PrefixSerialField: React.FC<PrefixSerialFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
}) => {
  const prefix = typeof value === 'string' ? value : 'INV-';
  const sampleSerial = `${prefix.toUpperCase()}00482`;

  return (
    <div className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-2.5">
      {/* Field Label & Live Mock Pill */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${settingKey}`}
          className="flex items-center gap-2 text-xs font-semibold text-default cursor-pointer"
        >
          <FileSpreadsheet className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-sunken border border-default/60 rounded-md shrink-0">
          <span className="text-[10px] text-muted">Example:</span>
          <span className="font-mono text-xs font-semibold text-primary">{sampleSerial}</span>
        </div>
      </div>

      {/* Prefix Input */}
      <input
        id={`field-${settingKey}`}
        type="text"
        value={prefix}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="e.g. INV-"
        maxLength={10}
        className="w-full rounded-lg border border-default bg-surface-sunken/40 px-3 py-2 text-xs font-mono font-bold text-default uppercase tracking-wider transition-all focus:bg-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />

      {/* Un-truncated Helpful Context Note */}
      {description && (
        <p className="text-[11px] text-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
};
