import React from 'react';
import { cn } from '../../../../lib/utils';
import { Check } from 'lucide-react';

interface SettingToggleCardProps {
  label: string;
  settingKey: string;
  value: boolean | unknown;
  onChange: (val: boolean) => void;
  description?: string | undefined;
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
      data-setting-key={settingKey}
      aria-checked={isChecked}
      onClick={() => onChange(!isChecked)}
      className={cn(
        'w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/30',
        isChecked
          ? 'bg-surface border-primary/30 shadow-xs ring-1 ring-primary/10'
          : 'bg-surface-sunken/40 border-default hover:border-default hover:bg-surface'
      )}
    >
      <div className="space-y-1 min-w-0 flex-1 pr-2">
        <span className="text-xs font-semibold text-default block">{label}</span>
        {description && (
          <p className="text-2xs text-muted leading-relaxed">{description}</p>
        )}
      </div>

      {/* Modern Switch Indicator */}
      <div
        aria-hidden="true"
        className={cn(
          'w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 pointer-events-none',
          isChecked ? 'bg-primary' : 'bg-surface border border-default'
        )}
      >
        <div
          className={cn(
            'bg-white size-5 rounded-full shadow-sm transform transition-transform duration-200 flex items-center justify-center',
            isChecked ? 'translate-x-5' : 'translate-x-0 bg-slate-300 dark:bg-slate-500'
          )}
        >
          {isChecked && <Check className="size-3 text-primary stroke-3" />}
        </div>
      </div>
    </button>
  );
};
