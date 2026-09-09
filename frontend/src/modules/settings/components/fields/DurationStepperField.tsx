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
  description?: string | undefined;
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
    <div className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${settingKey}`}
          className="flex items-center gap-2 text-xs font-semibold text-default cursor-pointer"
        >
          <Clock className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
          <span>{label}</span>
        </label>

        {/* Stepper Control Pill */}
        <div className="flex items-center gap-1 bg-surface-sunken/60 border border-default rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={numericVal <= min}
            className="size-7 rounded-md bg-surface border border-default/60 flex items-center justify-center text-muted hover:text-default hover:border-default disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Decrease value"
          >
            <Minus className="size-3" />
          </button>

          <div className="px-2.5 text-center min-w-14">
            <span className="font-mono text-xs font-bold text-default">
              {numericVal}
            </span>
            <span className="text-[10px] font-medium text-muted ml-1">
              {unit}
            </span>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={numericVal >= max}
            className="size-7 rounded-md bg-surface border border-default/60 flex items-center justify-center text-muted hover:text-default hover:border-default disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Increase value"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center justify-between pt-0.5 text-2xs">
        <span className="text-muted text-[11px]">Quick Presets:</span>
        <div className="flex items-center gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                'px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium transition-colors cursor-pointer',
                numericVal === p
                  ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                  : 'bg-surface-sunken/40 border-default text-muted hover:border-default hover:text-default'
              )}
            >
              {p}{unit.charAt(0).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Un-truncated Helpful Context Note */}
      {description && (
        <p className="text-[11px] text-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
};
