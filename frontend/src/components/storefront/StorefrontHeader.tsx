import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Store, MessageCircle, Truck, Sparkles, ShieldCheck } from 'lucide-react';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import type { StorefrontConfig } from '../../types/api/storefront';

interface StorefrontHeaderProps {
  config: StorefrontConfig | null;
  subdomain: string;
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({ config, subdomain }) => {
  const { cart, openDrawer } = useStorefrontCartStore();

  const itemCount = cart?.item_count ?? 0;
  const cartTotal = cart?.total_amount ? parseFloat(cart.total_amount) : 0;
  const currency = config?.currency ?? 'BDT';

  const whatsappNumber = config?.whatsapp_number?.replace(/[^0-9]/g, '') || '8801700000000';
  const whatsappMsg = encodeURIComponent(
    config?.whatsapp_default_message ||
      `Hello ${config?.name ?? 'SliceMart'}, I would like to place an order from your direct factory catalog.`
  );

  return (
    <header className="sticky top-0 z-40 w-full transition-all">
      {/* Top Announcement Ticker Bar */}
      <div className="bg-linear-to-r from-emerald-950 via-teal-900 to-emerald-950 text-emerald-300 text-[11px] py-1.5 px-4 border-b border-emerald-500/20 font-medium select-none shadow-xs">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-white">Direct Factory Dispatch:</span>
            <span className="hidden sm:inline text-emerald-200/90">
              Freshly packaged daily from certified manufacturing line
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-1 text-emerald-300 font-mono">
              <Truck className="size-3 text-emerald-400" />
              <span>Express Delivery Available</span>
            </div>
            <span className="text-emerald-500/40 hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-1 text-emerald-300">
              <ShieldCheck className="size-3 text-emerald-400" />
              <span>HACCP Quality Inspected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Navigation Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl transition-all shadow-xs">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Name */}
          <Link
            to={`/store/${subdomain}`}
            className="group flex items-center gap-3 transition-transform active:scale-98 cursor-pointer"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-zinc-950 shadow-lg shadow-emerald-500/25 ring-1 ring-white/20 group-hover:shadow-emerald-500/40 transition-all">
              <Store className="size-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white group-hover:text-emerald-400 text-base sm:text-lg transition-colors">
                  {config?.name ?? 'SliceMart'}
                </span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Official Store
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <Sparkles className="size-3 text-amber-400 inline" />
                <span>Direct Factory Outlet</span>
              </div>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300">
            <Link
              to={`/store/${subdomain}`}
              className="hover:text-emerald-400 transition-colors py-1 hover:border-b-2 hover:border-emerald-400"
            >
              All Products
            </Link>
            <Link
              to={`/store/${subdomain}/track`}
              className="hover:text-emerald-400 transition-colors py-1 hover:border-b-2 hover:border-emerald-400"
            >
              Track My Order
            </Link>
            <Link
              to={`/store/${subdomain}/pages/about-us`}
              className="hover:text-emerald-400 transition-colors py-1 hover:border-b-2 hover:border-emerald-400"
            >
              Factory Heritage
            </Link>
            <Link
              to={`/store/${subdomain}/pages/faq`}
              className="hover:text-emerald-400 transition-colors py-1 hover:border-b-2 hover:border-emerald-400"
            >
              Help & FAQ
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Direct WhatsApp Ordering */}
            {config?.whatsapp_ordering_enabled !== false && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                title="Order directly via WhatsApp"
              >
                <MessageCircle className="size-3.5 text-emerald-400 fill-emerald-400/20" />
                <span>WhatsApp Order</span>
              </a>
            )}

            {/* Customer Account */}
            <Link
              to={`/store/${subdomain}/account`}
              className="hidden lg:inline-block text-xs font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
            >
              Account
            </Link>

            {/* Cart Trigger with Total Preview */}
            <button
              type="button"
              onClick={openDrawer}
              className="group relative flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-zinc-900/90 hover:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:border-emerald-400 cursor-pointer active:scale-95"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="size-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <>
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-zinc-950 font-mono">
                    {itemCount}
                  </span>
                  <span className="hidden md:inline text-[11px] font-mono text-emerald-400 font-bold ml-0.5">
                    {currency} {cartTotal.toLocaleString()}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
