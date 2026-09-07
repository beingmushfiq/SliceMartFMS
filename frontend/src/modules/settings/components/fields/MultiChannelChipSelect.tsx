import React from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface MultiChannelChipSelectProps {
  label: string;
  settingKey: string;
  value: string[] | unknown;
  onChange: (val: string[]) => void;
  description?: string;
}

interface ChannelOption {
  id: string;
  label: string;
  icon: React.ElementType;
  tone: string;
}

const NOTIFICATION_CHANNELS: ChannelOption[] = [
  { id: 'in_app', label: 'In-App Banner', icon: Bell, tone: 'text-sky-500' },
  { id: 'email', label: 'Email Digest', icon: Mail, tone: 'text-amber-500' },
  { id: 'sms', label: 'Instant SMS', icon: MessageSquare, tone: 'text-emerald-500' },
  { id: 'whatsapp', label: 'WhatsApp Alert', icon: Phone, tone: 'text-green-500' },
];

const PAYMENT_METHODS: ChannelOption[] = [
  { id: 'cash', label: 'Cash Drawer', icon: Banknote, tone: 'text-emerald-500' },
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, tone: 'text-indigo-500' },
  { id: 'bkash', label: 'bKash MFS', icon: Smartphone, tone: 'text-pink-500' },
  { id: 'nagad', label: 'Nagad MFS', icon: Smartphone, tone: 'text-orange-500' },
];

export const MultiChannelChipSelect: React.FC<MultiChannelChipSelectProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
}) => {
  const currentArray: string[] = Array.isArray(value)
    ? value.map(String)
    : typeof value === 'string'
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const isPaymentKey = settingKey.includes('payment_methods');
  const options = isPaymentKey ? PAYMENT_METHODS : NOTIFICATION_CHANNELS;

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
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-default block">{label}</span>
          <span className="font-mono text-2xs text-muted block">{settingKey}</span>
          {description && <p className="text-2xs text-muted mt-0.5">{description}</p>}
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
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer select-none',
                isSelected
                  ? 'bg-primary/10 border-primary text-primary shadow-2xs'
                  : 'bg-surface-sunken border-default text-muted hover:border-strong hover:text-default'
              )}
            >
              <div
                className={cn(
                  'size-4 rounded-full flex items-center justify-center transition-colors',
                  isSelected ? 'bg-primary text-primary-fg' : 'border border-default'
                )}
              >
                {isSelected ? <Check className="size-2.5 stroke-3" /> : null}
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
