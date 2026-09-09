import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckCheck,
  Send,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface MessagingDeliverySimulatorProps {
  smsProvider?: string;
  smsSenderId?: string;
  whatsappPhoneNumberId?: string;
}

export const MessagingDeliverySimulator: React.FC<MessagingDeliverySimulatorProps> = ({
  smsProvider = 'greenweb',
  smsSenderId = 'SLICEMART',
  whatsappPhoneNumberId = '',
}) => {
  const [activeTab, setActiveTab] = useState<'sms' | 'whatsapp'>('whatsapp');

  return (
    <div className="rounded-xl border border-default bg-surface-sunken/60 overflow-hidden space-y-0 transition-all">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-surface border-b border-default flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-default block">
              Customer Notification Delivery Simulator
            </span>
            <span className="text-2xs text-muted block">
              Live smartphone mockup rendering transactional SMS and official Meta WhatsApp Cloud API templates
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-surface-sunken border border-default">
          <Button
            type="button"
            variant={activeTab === 'whatsapp' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('whatsapp')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            <MessageSquare className="size-3 mr-1 text-emerald-500" />
            WhatsApp Cloud
          </Button>
          <Button
            type="button"
            variant={activeTab === 'sms' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('sms')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            <Send className="size-3 mr-1 text-primary" />
            SMS Carrier ({smsProvider})
          </Button>
        </div>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4">
        {/* Smartphone Shell Mockup */}
        <div className="w-full max-w-sm mx-auto rounded-2xl border-2 border-default bg-surface p-3.5 shadow-md space-y-3">
          {/* Phone Status Bar */}
          <div className="flex items-center justify-between text-2xs text-muted font-mono px-1">
            <span>02:45</span>
            <span className="text-primary font-bold">● 4G VoLTE</span>
            <span>98%</span>
          </div>

          {activeTab === 'whatsapp' ? (
            /* WhatsApp Conversation Mockup */
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2">
                <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  W
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-default">SliceMart Official</span>
                    <CheckCheck className="size-3 text-emerald-500" />
                  </div>
                  <span className="text-2xs text-muted font-mono">
                    ID: {whatsappPhoneNumberId || 'Unlinked'}
                  </span>
                </div>
              </div>

              {/* Message Bubble */}
              <div className="p-3 rounded-lg bg-surface border border-emerald-500/20 shadow-xs space-y-1.5">
                <p className="text-xs text-default font-medium leading-relaxed">
                  👋 <strong>Hello Mr. Rahman!</strong> Your factory order <strong>#PO-2026-00109</strong> has been verified.
                </p>
                <div className="text-2xs text-muted bg-surface-sunken p-2 rounded border border-default space-y-0.5">
                  <p>🚚 Courier: Steadfast Express (Consignment: ST-99214)</p>
                  <p>💰 COD Collection: ৳ 4,250 BDT</p>
                </div>
                <div className="flex items-center justify-between pt-1 text-2xs text-muted">
                  <span>Meta Official Template</span>
                  <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                    <CheckCheck className="size-3" /> Delivered
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* SMS Mockup */
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <div>
                  <span className="text-xs font-bold text-default block">
                    {smsSenderId || 'SLICEMART'}
                  </span>
                  <span className="text-2xs text-muted uppercase">Masked Sender ID</span>
                </div>
                <span className="text-2xs font-mono text-muted">{smsProvider}</span>
              </div>

              {/* SMS Bubble */}
              <div className="p-3 rounded-lg bg-surface border border-default shadow-xs space-y-1">
                <p className="text-xs text-default leading-relaxed">
                  Your order INV-2026-00482 has been dispatched from Dhaka Plant. Driver OTP: <strong>8492</strong>. Thank you for shopping with us!
                </p>
                <span className="text-2xs text-muted block text-right font-mono">
                  128 Chars &middot; 1 SMS Part
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
