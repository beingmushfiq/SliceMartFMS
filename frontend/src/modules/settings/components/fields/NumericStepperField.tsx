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
  description?: string;
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
      ? '× Multiplier'
      : 'Units');

  const handleStep = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? step : -step;
    const newVal = Math.round((numericVal + delta) * 100) / 100;
    if (newVal >= min && newVal <= max) {
      onChange(newVal);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3 hover:border-primary/30 transition-all">
      {/* Top Meta Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Hash className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-default">{label}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {resolvedUnit}
              </span>
            </div>
            {description && (
              <p className="text-2xs text-muted mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
        </div>

        {/* Current Value Display Pill */}
        <div className="px-2.5 py-1 bg-surface-sunken border border-default rounded-lg shrink-0">
          <span className="font-mono text-xs font-bold text-primary">
            {numericVal} <span className="text-3xs text-muted font-normal">{resolvedUnit}</span>
          </span>
        </div>
      </div>

      {/* Stepper Controls & Manual Input */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleStep('down')}
          disabled={numericVal <= min}
          className="size-9 rounded-xl bg-surface-sunken border border-default hover:border-primary hover:text-primary flex items-center justify-center text-default disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
        >
          <Minus className="size-3.5" />
        </button>

        <div className="relative flex-1">
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
            className="w-full bg-surface-sunken border border-default rounded-xl px-3 py-2 text-center text-xs font-mono font-bold text-default focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => handleStep('up')}
          disabled={numericVal >= max}
          className="size-9 rounded-xl bg-surface-sunken border border-default hover:border-primary hover:text-primary flex items-center justify-center text-default disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
