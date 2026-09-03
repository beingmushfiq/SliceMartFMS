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
  description?: string;
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
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3 md:col-span-2">
      <div>
        <span className="text-xs font-bold text-default block">{label}</span>
        <span className="font-mono text-2xs text-muted block">{settingKey}</span>
        {description && <p className="text-2xs text-muted mt-0.5">{description}</p>}
      </div>

      <div className={cn(
        'grid gap-2.5',
        options.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
      )}>
        {options.map((opt) => {
          const isSelected = currentVal === opt.value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer relative overflow-hidden',
                isSelected
                  ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary'
                  : 'bg-surface-sunken border-default hover:border-strong hover:bg-surface'
              )}
            >
              {Icon && (
                <div
                  className={cn(
                    'size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? 'bg-primary text-primary-fg' : 'bg-surface border border-default text-muted'
                  )}
                >
                  <Icon className="size-4" />
                </div>
              )}

              <div className="space-y-0.5 flex-1 min-w-0 pr-5">
                <span
                  className={cn(
                    'text-xs font-bold block truncate',
                    isSelected ? 'text-primary' : 'text-default'
                  )}
                >
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-2xs text-muted block leading-relaxed line-clamp-2">
                    {opt.description}
                  </span>
                )}
              </div>

              {/* Selection Checkmark Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 size-4 rounded-full bg-primary text-primary-fg flex items-center justify-center">
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
