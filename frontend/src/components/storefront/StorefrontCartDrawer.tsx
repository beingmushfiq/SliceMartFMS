import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from 'lucide-react';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import type { StorefrontConfig } from '../../types/api/storefront';

interface StorefrontCartDrawerProps {
  config: StorefrontConfig | null;
  subdomain: string;
}

export const StorefrontCartDrawer: React.FC<StorefrontCartDrawerProps> = ({ config, subdomain }) => {
  const { cart, isDrawerOpen, closeDrawer, updateQuantity, removeItem } =
    useStorefrontCartStore();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const items = cart?.items ?? [];
  const currency = config?.currency ?? 'BDT';

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate(`/store/${subdomain}/checkout`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-zinc-100">Your Cart</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                {cart?.item_count ?? 0}
              </span>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-600 mb-3">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-zinc-300">Your cart is empty</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Discover our factory fresh products and add your favorites to get started.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-900 bg-zinc-900/40 p-3.5"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-[11px] font-medium text-emerald-400 mt-0.5">
                      {currency} {parseFloat(item.unit_price).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, Math.max(0, parseInt(item.quantity) - 1))
                        }
                        className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-zinc-100">
                        {parseInt(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, parseInt(item.quantity) + 1)}
                        className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="border-t border-zinc-800/80 pt-4 space-y-3">
              {/* Coupon Input */}
              <div className="flex items-center gap-2">
                {cart?.coupon_code ? (
                  <div className="flex flex-1 items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                    <span>Coupon Applied: <strong className="font-mono">{cart.coupon_code}</strong></span>
                    <button
                      type="button"
                      onClick={() => useStorefrontCartStore.getState().removeCoupon()}
                      className="text-zinc-400 hover:text-rose-400 font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const input = (e.currentTarget.elements.namedItem('coupon') as HTMLInputElement);
                      if (input && input.value.trim()) {
                        await useStorefrontCartStore.getState().applyCoupon(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="flex flex-1 items-center gap-1.5"
                  >
                    <input
                      type="text"
                      name="coupon"
                      placeholder="Coupon code (e.g. SAVE20)"
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 uppercase placeholder:normal-case placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              <div className="space-y-1.5 border-t border-zinc-800/50 pt-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-200">
                    {currency} {parseFloat(cart?.subtotal ?? '0').toFixed(2)}
                  </span>
                </div>
                {parseFloat(cart?.discount_amount ?? '0') > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Discount ({cart?.coupon_code})</span>
                    <span>- {currency} {parseFloat(cart?.discount_amount ?? '0').toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-bold text-zinc-100 pt-1 border-t border-zinc-800/60">
                  <span>Total</span>
                  <span className="text-emerald-400">
                    {currency} {parseFloat(cart?.total_amount ?? '0').toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer active:scale-98"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const sessionToken = useStorefrontCartStore.getState().sessionToken;
                    try {
                      const res = await (await import('../../lib/api/client')).api.post<{
                        data: { whatsapp_url: string };
                      }>(
                        '/storefront/whatsapp/order-link',
                        {
                          cart_token: sessionToken,
                        },
                        {
                          headers: {
                            'X-Storefront-Subdomain': subdomain,
                          },
                        }
                      );
                      if (res.data?.data?.whatsapp_url) {
                        window.open(res.data.data.whatsapp_url, '_blank');
                      }
                    } catch {
                      window.open('https://wa.me/8801700000000', '_blank');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  <span>💬 Order Cart via WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
