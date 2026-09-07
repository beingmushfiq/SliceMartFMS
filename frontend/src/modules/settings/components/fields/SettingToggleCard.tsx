import React from 'react';
import { cn } from '../../../../lib/utils';
import { Check, X } from 'lucide-react';

interface SettingToggleCardProps {
  label: string;
  settingKey: string;
  value: boolean | unknown;
  onChange: (val: boolean) => void;
  description?: string;
}

export const SettingToggleCard: React.FC<SettingToggleCardProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
}) => {
  const isChecked = Boolean(value);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      onClick={() => onChange(!isChecked)}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer md:col-span-2 select-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
        isChecked
          ? 'bg-surface border-primary/40 shadow-xs ring-1 ring-primary/20'
          : 'bg-surface-sunken border-default hover:border-strong'
      )}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-default">{label}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider',
              isChecked
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-surface text-muted border border-default'
            )}
          >
            {isChecked ? <Check className="size-2.5 stroke-3" /> : <X className="size-2.5" />}
            {isChecked ? 'Active' : 'Disabled'}
          </span>
        </div>
        <span className="font-mono text-2xs text-muted block">{settingKey}</span>
        {description && <p className="text-2xs text-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>

      {/* Visual Spring Switch Indicator */}
      <div
        aria-hidden="true"
        className={cn(
          'w-12 h-6.5 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 pointer-events-none',
          isChecked ? 'bg-primary shadow-xs' : 'bg-surface border border-default'
        )}
      >
        <div
          className={cn(
            'bg-white size-4.5 rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center',
            isChecked ? 'translate-x-5.5' : 'translate-x-0 bg-slate-300 dark:bg-slate-500'
          )}
        >
          {isChecked && <Check className="size-2.5 text-primary stroke-3" />}
        </div>
      </div>
    </button>
  );
};
