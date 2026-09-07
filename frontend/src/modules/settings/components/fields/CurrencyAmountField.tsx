import React from 'react';
import { cn } from '../../../../lib/utils';
import { Plus } from 'lucide-react';

interface CurrencyAmountFieldProps {
  label: string;
  settingKey: string;
  value: number | string | unknown;
  onChange: (val: number) => void;
  currencySymbol?: string;
  currencyCode?: string;
  description?: string;
  min?: number;
}

export const CurrencyAmountField: React.FC<CurrencyAmountFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  currencySymbol = '৳',
  currencyCode = 'BDT',
  description,
  min = 0,
}) => {
  const numericVal = typeof value === 'number' ? value : Number(value) || 0;

  const handleAdd = (delta: number) => {
    onChange(Math.max(min, numericVal + delta));
  };

  const handleSetPreset = (presetVal: number) => {
    onChange(presetVal);
  };

  // Determine appropriate quick presets based on current scale
  const presets =
    numericVal >= 50000
      ? [10000, 25000, 50000, 100000]
      : [500, 1000, 2000, 5000];

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3">
      <div>
        <span className="text-xs font-bold text-default block">{label}</span>
        <span className="font-mono text-2xs text-muted block">{settingKey}</span>
        {description && <p className="text-2xs text-muted mt-0.5">{description}</p>}
      </div>

      {/* Currency Adorned Input */}
      <div className="flex items-center rounded-xl border border-default bg-surface-sunken overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <span className="px-3 py-2 bg-surface border-r border-default font-mono text-xs font-bold text-primary select-none shrink-0">
          {currencySymbol}
        </span>
        <input
          type="number"
          min={min}
          step="any"
          value={numericVal === 0 && value === '' ? '' : numericVal}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : Number(e.target.value);
            onChange(Math.max(min, val));
          }}
          className="w-full bg-transparent px-3 py-2 text-xs font-mono font-bold text-default focus:outline-none"
          placeholder="0.00"
        />
        <span className="px-3 py-2 text-2xs font-mono font-semibold text-muted select-none shrink-0">
          {currencyCode}
        </span>
      </div>

      {/* Preset Quick-Buttons */}
      <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5 text-2xs">
        <div className="flex items-center gap-1">
          <span className="text-muted">Presets:</span>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSetPreset(p)}
              className={cn(
                'px-2 py-0.5 rounded-lg border text-2xs font-mono font-semibold transition-colors cursor-pointer',
                numericVal === p
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-surface border-default text-muted hover:border-strong hover:text-default'
              )}
            >
              {currencySymbol}{p.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleAdd(1000)}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-surface border border-default hover:border-primary hover:text-primary transition-colors text-2xs font-semibold text-muted cursor-pointer"
          >
            <Plus className="size-2.5" /> 1k
          </button>
          <button
            type="button"
            onClick={() => handleAdd(5000)}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-surface border border-default hover:border-primary hover:text-primary transition-colors text-2xs font-semibold text-muted cursor-pointer"
          >
            <Plus className="size-2.5" /> 5k
          </button>
        </div>
      </div>
    </div>
  );
};
