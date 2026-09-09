import React from 'react';
import { cn } from '../../../../lib/utils';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  CreditCard,
  Building,
  Check,
} from 'lucide-react';

interface MultiChannelChipSelectProps {
  label: string;
  settingKey: string;
  value: unknown;
  onChange: (val: string[]) => void;
  description?: string | undefined;
}

interface ChannelOption {
  id: string;
  label: string;
  icon: React.ElementType;
  tone: string;
}

const NOTIFICATION_CHANNELS: ChannelOption[] = [
  { id: 'in_app', label: 'In-App Bell', icon: Bell, tone: 'text-primary' },
  { id: 'email', label: 'Email Dispatch', icon: Mail, tone: 'text-sky-500' },
  { id: 'sms', label: 'SMS Carrier', icon: Smartphone, tone: 'text-amber-500' },
  { id: 'whatsapp', label: 'WhatsApp Cloud', icon: MessageSquare, tone: 'text-emerald-500' },
];

const PAYMENT_METHOD_OPTIONS: ChannelOption[] = [
  { id: 'cash', label: 'Cash Drawer', icon: Building, tone: 'text-emerald-500' },
  { id: 'card', label: 'POS Terminal Card', icon: CreditCard, tone: 'text-primary' },
  { id: 'bkash', label: 'bKash MFS', icon: Smartphone, tone: 'text-pink-500' },
  { id: 'nagad', label: 'Nagad Wallet', icon: Smartphone, tone: 'text-orange-500' },
  { id: 'bank_transfer', label: 'Bank Direct Wire', icon: Building, tone: 'text-blue-500' },
];

export const MultiChannelChipSelect: React.FC<MultiChannelChipSelectProps> = ({
  label,
  settingKey: _settingKey,
  value,
  onChange,
  description,
}) => {
  const currentArray = Array.isArray(value) ? (value as string[]) : [];

  const isPaymentMethod = _settingKey === 'allowed_payment_methods';
  const options = isPaymentMethod ? PAYMENT_METHOD_OPTIONS : NOTIFICATION_CHANNELS;

  const toggleOption = (id: string) => {
    if (currentArray.includes(id)) {
      onChange(currentArray.filter((item) => item !== id));
    } else {
      onChange([...currentArray, id]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="group rounded-xl border border-default/80 bg-surface p-4 transition-all duration-200 hover:border-default hover:shadow-2xs space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-default block">{label}</label>
          {description && <p className="text-[11px] text-muted leading-relaxed mt-0.5">{description}</p>}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-2xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Select All
          </button>
          <span className="text-muted text-2xs">•</span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-2xs font-semibold text-muted hover:text-default cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((opt) => {
          const isSelected = currentArray.includes(opt.id);
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleOption(opt.id)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer select-none',
                isSelected
                  ? 'bg-primary/10 border-primary text-primary shadow-2xs'
                  : 'bg-surface-sunken/40 border-default text-muted hover:border-default hover:text-default hover:bg-surface'
              )}
            >
              <div
                className={cn(
                  'size-3.5 rounded-full flex items-center justify-center transition-colors',
                  isSelected ? 'bg-primary text-primary-contrast' : 'border border-default'
                )}
              >
                {isSelected ? <Check className="size-2 stroke-3" /> : null}
              </div>
              <Icon className={cn('size-3.5 shrink-0', isSelected ? opt.tone : 'text-muted')} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
