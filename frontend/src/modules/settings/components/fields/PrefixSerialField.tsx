import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface PrefixSerialFieldProps {
  label: string;
  settingKey: string;
  value: string | unknown;
  onChange: (val: string) => void;
  description?: string;
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
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3">
      <div>
        <span className="text-xs font-bold text-default block">{label}</span>
        <span className="font-mono text-2xs text-muted block">{settingKey}</span>
        {description && <p className="text-2xs text-muted mt-0.5">{description}</p>}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Prefix Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={prefix}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="e.g. INV-"
            maxLength={10}
            className="w-full bg-surface-sunken border border-default rounded-xl px-3 py-2 text-xs font-mono font-bold text-default uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Live Mock Pill */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl shrink-0">
          <FileSpreadsheet className="size-3.5 text-primary" />
          <span className="font-mono text-xs font-bold text-primary">{sampleSerial}</span>
        </div>
      </div>
    </div>
  );
};
