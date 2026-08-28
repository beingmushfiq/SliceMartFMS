import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Store } from 'lucide-react';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import type { StorefrontConfig } from '../../types/api/storefront';

interface StorefrontHeaderProps {
  config: StorefrontConfig | null;
  subdomain: string;
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({ config, subdomain }) => {
  const { cart, openDrawer } = useStorefrontCartStore();

  const itemCount = cart?.item_count ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link
          to={`/store/${subdomain}`}
          className="group flex items-center gap-3 transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-zinc-100 group-hover:text-emerald-400 sm:text-lg">
                {config?.name ?? 'Storefront'}
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                Official
              </span>
            </div>
            <div className="text-[11px] text-zinc-500">Direct Factory Store</div>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to={`/store/${subdomain}`}
            className="hidden text-xs font-semibold text-zinc-300 transition-colors hover:text-white sm:block"
          >
            Catalog
          </Link>

          <Link
            to={`/store/${subdomain}/track`}
            className="hidden text-xs font-semibold text-zinc-300 transition-colors hover:text-white sm:block"
          >
            Track Order
          </Link>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={openDrawer}
            className="group relative flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 shadow-sm transition-all hover:border-emerald-500/50 hover:bg-zinc-800 hover:text-white cursor-pointer active:scale-95"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-zinc-950">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
