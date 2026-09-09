import React from 'react';
import { Minus, Plus, Hash } from 'lucide-react';

interface NumericStepperFieldProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string | undefined;
}

export const NumericStepperField: React.FC<NumericStepperFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  min = 0,
  max = 100000,
  step = 1,
  unit,
  description,
}) => {
  const numericVal = typeof value === 'number' ? value : Number(value) || 0;

  // Resolve unit dynamically if not explicitly passed
  const resolvedUnit =
    unit ||
    (settingKey.includes('hours')
      ? 'Hours'
      : settingKey.includes('days')
      ? 'Days'
      : settingKey.includes('months')
      ? 'Months'
      : settingKey.includes('mins') || settingKey.includes('minutes')
      ? 'Mins'
      : settingKey.includes('length')
      ? 'Chars'
      : settingKey.includes('attempts')
      ? 'Attempts'
      : settingKey.includes('places')
      ? 'Decimals'
      : settingKey.includes('per_page')
      ? 'Items'
      : settingKey.includes('multiplier')
      ? 'Multiplier'
      : 'Units');

  const handleStep = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? step : -step;
    const newVal = Math.round((numericVal + delta) * 100) / 100;
    if (newVal >= min && newVal <= max) {
      onChange(newVal);
    }
  };

  return (
    <div className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-2.5">
      {/* Field Label & Unit Badge */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${settingKey}`}
          className="flex items-center gap-2 text-xs font-semibold text-default cursor-pointer"
        >
          <Hash className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
          <span>{label}</span>
        </label>

        <span className="text-[10px] font-mono font-medium text-muted bg-surface-sunken border border-default/60 px-2 py-0.5 rounded-md select-none shrink-0">
          {resolvedUnit}
        </span>
      </div>

      {/* Stepper Controls & Manual Input */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleStep('down')}
          disabled={numericVal <= min}
          className="size-8 rounded-lg bg-surface-sunken border border-default hover:border-default hover:bg-surface flex items-center justify-center text-default disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
          aria-label="Decrease value"
        >
          <Minus className="size-3.5" />
        </button>

        <div className="relative flex-1">
          <input
            id={`field-${settingKey}`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={numericVal}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val)) {
                onChange(Math.max(min, Math.min(max, val)));
              }
            }}
            className="w-full rounded-lg border border-default bg-surface-sunken/40 px-3 py-1.5 text-xs font-mono font-semibold text-center text-default transition-all focus:bg-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <button
          type="button"
          onClick={() => handleStep('up')}
          disabled={numericVal >= max}
          className="size-8 rounded-lg bg-surface-sunken border border-default hover:border-default hover:bg-surface flex items-center justify-center text-default disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
          aria-label="Increase value"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Un-truncated Helpful Context Note */}
      {description && (
        <p className="text-[11px] text-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
};
