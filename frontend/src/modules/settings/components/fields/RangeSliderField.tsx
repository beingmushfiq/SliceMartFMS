import React from 'react';
import { cn } from '../../../../lib/utils';
import { Percent } from 'lucide-react';

interface RangeSliderFieldProps {
  label: string;
  settingKey: string;
  value: number | string | unknown;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export const RangeSliderField: React.FC<RangeSliderFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.5,
  unit = '%',
  description,
}) => {
  const numericVal = typeof value === 'number' ? value : Number(value) || 0;

  // Derive preset markers based on max
  const presets = max === 100 ? [0, 5, 10, 15, 25, 50, 100] : [min, Math.round(max / 2), max];

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs font-bold text-default block truncate">{label}</span>
          <span className="font-mono text-2xs text-muted block truncate">{settingKey}</span>
          {description && <p className="text-2xs text-muted mt-0.5">{description}</p>}
        </div>

        {/* Numeric Badge with Stepper */}
        <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-xl px-2.5 py-1 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={numericVal}
            onChange={(e) => {
              const val = e.target.value === '' ? min : Number(e.target.value);
              onChange(Math.min(max, Math.max(min, val)));
            }}
            className="w-14 bg-transparent font-mono text-xs font-bold text-default text-right focus:outline-none"
          />
          <span className="text-2xs font-bold text-primary flex items-center gap-0.5">
            {unit === '%' ? <Percent className="size-3" /> : unit}
          </span>
        </div>
      </div>

      {/* Interactive Range Slider Track */}
      <div className="space-y-1.5 pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary h-2 bg-surface-sunken rounded-lg cursor-pointer appearance-none border border-default/50"
        />

        {/* Quick Presets */}
        <div className="flex items-center justify-between text-2xs text-muted">
          <span>{min}{unit}</span>
          <div className="flex items-center gap-1.5">
            {presets.slice(1, -1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={cn(
                  'px-1.5 py-0.5 rounded font-mono transition-colors hover:text-primary',
                  numericVal === p ? 'bg-primary/10 text-primary font-bold' : 'text-muted'
                )}
              >
                {p}{unit}
              </button>
            ))}
          </div>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
};
