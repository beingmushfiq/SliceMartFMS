import React from 'react';
import { Minus, Plus, Clock } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface DurationStepperFieldProps {
  label: string;
  settingKey: string;
  value: number | string | unknown;
  onChange: (val: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export const DurationStepperField: React.FC<DurationStepperFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  unit = 'Days',
  min = 1,
  max = 365,
  step = 1,
  description,
}) => {
  const numericVal = typeof value === 'number' ? value : Number(value) || min;

  const handleDecrement = () => {
    onChange(Math.max(min, numericVal - step));
  };

  const handleIncrement = () => {
    onChange(Math.min(max, numericVal + step));
  };

  // Derive presets based on unit
  const presets =
    unit.toLowerCase().includes('min')
      ? [15, 30, 60, 120, 240]
      : unit.toLowerCase().includes('month')
      ? [1, 3, 6, 12]
      : [7, 14, 30, 60, 90, 365];

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs font-bold text-default block truncate">{label}</span>
          <span className="font-mono text-2xs text-muted block truncate">{settingKey}</span>
          {description && <p className="text-2xs text-muted mt-0.5">{description}</p>}
        </div>

        {/* Stepper Control Pill */}
        <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={numericVal <= min}
            className="size-7 rounded-lg bg-surface border border-default flex items-center justify-center text-muted hover:text-default hover:border-strong disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Decrease value"
          >
            <Minus className="size-3" />
          </button>

          <div className="px-2 text-center min-w-16">
            <span className="font-mono text-sm font-bold text-default block leading-none">
              {numericVal}
            </span>
            <span className="text-2xs font-semibold text-primary block mt-0.5 uppercase tracking-wider">
              {unit}
            </span>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={numericVal >= max}
            className="size-7 rounded-lg bg-surface border border-default flex items-center justify-center text-muted hover:text-default hover:border-strong disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Increase value"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center justify-between pt-0.5 text-2xs">
        <div className="flex items-center gap-1 text-muted">
          <Clock className="size-3" />
          <span>Presets:</span>
        </div>
        <div className="flex items-center gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                'px-2 py-0.5 rounded-lg border text-2xs font-mono font-semibold transition-colors cursor-pointer',
                numericVal === p
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-surface-sunken border-default text-muted hover:border-strong hover:text-default'
              )}
            >
              {p}{unit.charAt(0).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
