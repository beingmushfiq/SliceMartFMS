import React from 'react';
import {
  ShoppingBag,
  Sparkles,
  Clock,
  MessageCircle,
  Truck,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface StorefrontCheckoutSimulatorProps {
  minOrderAmount?: number | string;
  freeShippingThreshold?: number | string;
  estimatedDeliveryDaysInsideCity?: number | string;
  estimatedDeliveryDaysOutsideCity?: number | string;
  whatsappOrderingEnabled?: boolean | string;
  whatsappBusinessNumber?: string;
  guestCheckoutAllowed?: boolean | string;
}

export const StorefrontCheckoutSimulator: React.FC<StorefrontCheckoutSimulatorProps> = ({
  minOrderAmount = 500,
  freeShippingThreshold = 2500,
  estimatedDeliveryDaysInsideCity = 2,
  estimatedDeliveryDaysOutsideCity = 4,
  whatsappOrderingEnabled = true,
  whatsappBusinessNumber = '',
  guestCheckoutAllowed = true,
}) => {
  const minOrder = Number(minOrderAmount) || 0;
  const freeShip = Number(freeShippingThreshold) || 0;
  const sampleCartTotal = 1850;

  const freeShippingProgress = freeShip > 0 ? Math.min(100, Math.round((sampleCartTotal / freeShip) * 100)) : 100;
  const remainingForFreeShipping = Math.max(0, freeShip - sampleCartTotal);

  const isWaEnabled = whatsappOrderingEnabled === true || whatsappOrderingEnabled === '1' || whatsappOrderingEnabled === 'true';

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
              Storefront Checkout &amp; Delivery SLA Simulator
            </span>
            <span className="text-2xs text-muted block">
              Live customer cart conversion rules, free delivery progress, and estimated delivery countdowns
            </span>
          </div>
        </div>

        <Badge tone="success-subtle" className="text-2xs">
          Storefront Live
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4">
        <div className="max-w-md mx-auto rounded-xl border border-default bg-surface p-4 shadow-xs space-y-3.5">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-default pb-2.5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-primary" />
              <span className="text-xs font-bold text-default">Customer Shopping Bag (3 Items)</span>
            </div>
            <span className="font-mono text-xs font-bold text-default">৳ {sampleCartTotal.toLocaleString()}</span>
          </div>

          {/* Free Shipping Progress Meter */}
          {freeShip > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="flex justify-between text-2xs">
                <span className="text-default font-medium">
                  {remainingForFreeShipping > 0
                    ? `Add ৳ ${remainingForFreeShipping.toLocaleString()} more for Free Shipping!`
                    : '🎉 You have unlocked Free Nationwide Shipping!'}
                </span>
                <span className="font-mono font-bold text-primary">{freeShippingProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface border border-default overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Delivery SLA Row */}
          <div className="grid grid-cols-2 gap-2 text-2xs">
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-1">
              <span className="text-muted flex items-center gap-1 font-medium">
                <Truck className="size-3 text-primary" /> Inside Metro Dhaka
              </span>
              <span className="text-xs font-bold text-default block">
                {estimatedDeliveryDaysInsideCity} Business Days
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-1">
              <span className="text-muted flex items-center gap-1 font-medium">
                <Clock className="size-3 text-accent" /> Nationwide Suburbs
              </span>
              <span className="text-xs font-bold text-default block">
                {estimatedDeliveryDaysOutsideCity} Business Days
              </span>
            </div>
          </div>

          {/* Checkout Triggers */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-2xs text-muted">
              <span>Minimum Basket Policy:</span>
              <span className="font-semibold text-default">৳ {minOrder} BDT</span>
            </div>

            {/* Simulated Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 rounded-lg bg-primary text-primary-contrast font-bold text-xs shadow-xs hover:opacity-95 transition-all text-center"
              >
                Proceed to Checkout {guestCheckoutAllowed ? '(Guest OK)' : ''}
              </button>

              {isWaEnabled && (
                <button
                  type="button"
                  title={whatsappBusinessNumber ? `Direct WhatsApp Checkout (${whatsappBusinessNumber})` : 'Direct WhatsApp Checkout'}
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <MessageCircle className="size-3.5" />
                  <span>WhatsApp</span>
                  {whatsappBusinessNumber && (
                    <span className="text-[10px] opacity-80 hidden sm:inline font-mono">({whatsappBusinessNumber})</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
