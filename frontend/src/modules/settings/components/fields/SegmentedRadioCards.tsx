import React from 'react';
import { cn } from '../../../../lib/utils';
import { Check } from 'lucide-react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
}

interface SegmentedRadioCardsProps {
  label: string;
  settingKey: string;
  value: string | unknown;
  options: RadioOption[];
  onChange: (val: string) => void;
  description?: string | undefined;
}

export const SegmentedRadioCards: React.FC<SegmentedRadioCardsProps> = ({
  label,
  settingKey,
  value,
  options,
  onChange,
  description,
}) => {
  const currentVal = String(value ?? '');

  return (
    <div
      data-setting-key={settingKey}
      className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-3"
    >
      <div>
        <label className="text-xs font-semibold text-default block">{label}</label>
        {description && <p className="text-[11px] text-muted leading-relaxed mt-0.5">{description}</p>}
      </div>

      <div
        className={cn(
          'grid gap-2.5',
          options.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
        )}
      >
        {options.map((opt) => {
          const isSelected = currentVal === opt.value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer relative overflow-hidden',
                isSelected
                  ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30'
                  : 'bg-surface-sunken/40 border-default hover:border-default hover:bg-surface'
              )}
            >
              {Icon && (
                <div
                  className={cn(
                    'size-7 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5',
                    isSelected
                      ? 'bg-primary text-primary-contrast'
                      : 'bg-surface border border-default text-muted'
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
              )}

              <div className="space-y-0.5 flex-1 min-w-0 pr-4">
                <span
                  className={cn(
                    'text-xs font-bold block leading-snug',
                    isSelected ? 'text-primary' : 'text-default'
                  )}
                >
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-[11px] text-muted block leading-relaxed">
                    {opt.description}
                  </span>
                )}
              </div>

              {/* Selection Checkmark Indicator */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 size-4 rounded-full bg-primary text-primary-contrast flex items-center justify-center shadow-xs">
                  <Check className="size-2.5 stroke-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
