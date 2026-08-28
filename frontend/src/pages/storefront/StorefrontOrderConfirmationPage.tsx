import React from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import type { StorefrontConfig, StorefrontOrderConfirmation } from '../../types/api/storefront';

interface OutletContextType {
  config: StorefrontConfig;
  subdomain: string;
}

export const StorefrontOrderConfirmationPage: React.FC = () => {
  const { config, subdomain } = useOutletContext<OutletContextType>();
  const location = useLocation();
  const order = (location.state as { order?: StorefrontOrderConfirmation })?.order;

  const currency = order?.currency ?? config.currency ?? 'BDT';

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="rounded-3xl border border-emerald-500/30 bg-zinc-900/60 p-8 sm:p-10 text-center shadow-2xl space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mx-auto ring-8 ring-emerald-500/5 shadow-inner">
          <CheckCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Order Confirmed!
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Thank you for ordering with {config.name}. Your order has been dispatched directly to our production queue.
          </p>
        </div>

        {order && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-left space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-zinc-800/80 pb-2.5">
              <span className="text-zinc-500">Order Number</span>
              <span className="font-mono font-bold text-emerald-400">{order.order_number}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-zinc-800/80 pb-2.5">
              <span className="text-zinc-500">Total Amount</span>
              <span className="font-bold text-zinc-100">
                {currency} {parseFloat(order.total_amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Payment Status</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                {order.payment_method.toUpperCase()} (Pending on Delivery)
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 space-y-2">
          {order && (
            <a
              href={`https://wa.me/${(config.whatsapp_number || '+8801700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hello ${config.name}, I have just placed order #${order.order_number} for ৳${parseFloat(
                  order.total_amount
                ).toFixed(2)}. Please confirm receipt and delivery schedule.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-emerald-500/30 bg-emerald-950/40 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition-all shadow-sm"
            >
              <span>💬 Chat on WhatsApp for Live Order Updates</span>
            </a>
          )}

          <Link
            to={`/store/${subdomain}`}
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
