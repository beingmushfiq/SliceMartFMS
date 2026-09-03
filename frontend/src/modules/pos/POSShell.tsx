import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  CreditCard,
  DollarSign,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import type { PosSession, PosCheckoutPayload, PosCheckoutResult } from '../../types/api/pos';
import type { Product } from '../../types/api/catalog';
import { api } from '../../lib/api/client';
import { useCurrency } from '../../hooks/useCurrency';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
}

interface POSShellProps {
  session: PosSession;
  onExit: () => void;
}

interface CartSlot {
  id: number;
  label: string;
  cart: CartItem[];
  customerName: string;
  customerPhone: string;
  tenderMethod: 'cash' | 'card' | 'mobile_banking';
  cashTendered: string;
}

export function POSShell({ session, onExit }: POSShellProps) {
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  
  // Multi-cart slots (up to 5 concurrent held transactions)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [slots, setSlots] = useState<CartSlot[]>([
    { id: 1, label: 'Cart 1', cart: [], customerName: '', customerPhone: '', tenderMethod: 'cash', cashTendered: '' },
    { id: 2, label: 'Cart 2 (Hold)', cart: [], customerName: '', customerPhone: '', tenderMethod: 'cash', cashTendered: '' },
    { id: 3, label: 'Cart 3 (Hold)', cart: [], customerName: '', customerPhone: '', tenderMethod: 'cash', cashTendered: '' },
  ]);

  const currentSlot = slots[activeSlotIndex] ?? slots[0]!;
  const cart = currentSlot.cart;
  const customerName = currentSlot.customerName;
  const customerPhone = currentSlot.customerPhone;
  const tenderMethod = currentSlot.tenderMethod;
  const cashTendered = currentSlot.cashTendered;

  const [checkingOut, setCheckingOut] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<PosCheckoutResult | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const cashTenderedInputRef = useRef<HTMLInputElement>(null);

  const updateCurrentSlot = useCallback((updater: Partial<CartSlot> | ((prev: CartSlot) => CartSlot)) => {
    setSlots((prev) =>
      prev.map((s, idx) => {
        if (idx === activeSlotIndex) {
          return typeof updater === 'function' ? updater(s) : { ...s, ...updater };
        }
        return s;
      })
    );
  }, [activeSlotIndex]);

  const { data: products = [], isLoading: loadingProducts, isFetching: fetchingProducts, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ['catalog', 'products', 'pos'],
    queryFn: async () => {
      const res = await api.get<Product[]>('/catalog/products');
      return res.data ?? [];
    },
  });

  // Global Keyboard Shortcuts for POS Cashier Velocity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        customerNameInputRef.current?.focus();
      } else if (e.key === 'F9') {
        e.preventDefault();
        const methods = ['cash', 'card', 'mobile_banking'] as const;
        const currentIdx = methods.indexOf(tenderMethod);
        const nextIdx = (currentIdx + 1) % methods.length;
        const nextMethod = methods[nextIdx] ?? 'cash';
        updateCurrentSlot({ tenderMethod: nextMethod });
      } else if (e.key === 'F10') {
        e.preventDefault();
        updateCurrentSlot({ tenderMethod: 'cash' });
        setTimeout(() => cashTenderedInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tenderMethod, updateCurrentSlot]);

  const addToCart = (product: Product) => {
    updateCurrentSlot((prev) => {
      const existing = prev.cart.find((item) => String(item.product.id) === String(product.id));
      const updatedCart = existing
        ? prev.cart.map((item) =>
            String(item.product.id) === String(product.id)
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [
            ...prev.cart,
            {
              product,
              quantity: 1,
              unit_price: 100,
              discount: 0,
            },
          ];
      return { ...prev, cart: updatedCart };
    });
  };

  const updateQuantity = (productId: string | number, delta: number) => {
    updateCurrentSlot((prev) => {
      const updatedCart = prev.cart
        .map((item) => {
          if (String(item.product.id) === String(productId)) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      return { ...prev, cart: updatedCart };
    });
  };

  const removeFromCart = (productId: string | number) => {
    updateCurrentSlot((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => String(item.product.id) !== String(productId)),
    }));
  };

  const clearCart = () => {
    updateCurrentSlot({
      cart: [],
      customerName: '',
      customerPhone: '',
      cashTendered: '',
    });
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const discountTotal = cart.reduce((sum, item) => sum + item.discount, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal);
  const changeGiven =
    tenderMethod === 'cash' && parseFloat(cashTendered || '0') > grandTotal
      ? parseFloat(cashTendered) - grandTotal
      : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);

    const payload: PosCheckoutPayload = {
      pos_session_id: session.id,
      customer_name: customerName || 'Walk-in Customer',
      customer_phone: customerPhone || null,
      order_date: new Date().toISOString().slice(0, 10),
      discount_amount: discountTotal.toFixed(4),
      items: cart.map((item) => ({
        product_id: parseInt(String(item.product.id), 10) || 1,
        quantity: item.quantity.toFixed(4),
        unit_id: parseInt(String(item.product.base_unit_id), 10) || 1,
        unit_price: item.unit_price.toFixed(4),
      })),
      payments: [
        {
          method: tenderMethod,
          amount: grandTotal.toFixed(4),
          change_given: changeGiven.toFixed(4),
        },
      ],
    };

    try {
      const res = await api.post<{ data: PosCheckoutResult }>('/pos/checkout', payload);
      setLastReceipt(res.data.data);
      clearCart();
    } catch (err) {
      console.error('POS Checkout Failed', err);
      alert('Checkout failed. Please ensure terminal session is active and stock is valid.');
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface text-default">
      {/* POS Top Bar */}
      <header className="flex h-14 items-center justify-between border-b border-default bg-surface-sunken/90 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            POS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-default">
                {session.terminal_name ?? 'POS Register'}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ● Live Shift
              </span>
            </div>
            <p className="text-[11px] text-muted font-mono">Session: {session.session_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted">
            <div>
              Branch:{' '}
              <span className="text-default font-medium">
                {session.branch_name ?? 'Main Outlet'}
              </span>
            </div>
            <div>
              Expected Cash:{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {formatCurrency(session.expected_cash)}
              </span>
            </div>
          </div>

          <button
            onClick={onExit}
            className="flex items-center gap-1 rounded-xl border border-default bg-surface px-3 py-1.5 text-xs font-medium text-default hover:bg-surface-sunken cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
            Exit Terminal
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product Catalog Grid */}
        <div className="flex flex-1 flex-col border-r border-default p-4">
          {/* Search & Barcode Scan */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode or search products (SKU, Name)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-default bg-surface-sunken pl-10 pr-4 text-sm text-default placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => refetchProducts()}
              disabled={fetchingProducts}
              className="flex h-11 items-center gap-1 rounded-xl border border-default bg-surface-sunken px-3 text-muted hover:text-default cursor-pointer transition-colors"
              title="Refresh Products"
            >
              <RefreshCw className={`h-4 w-4 ${fetchingProducts ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loadingProducts ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted">
                No products found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex flex-col items-start rounded-xl border border-default bg-surface p-3 text-left transition-all hover:border-primary/50 hover:bg-surface-sunken active:scale-[0.98] cursor-pointer shadow-2xs"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      {p.name.charAt(0)}
                    </div>
                    <div className="mt-2 font-medium text-xs text-default line-clamp-1">
                      {p.name}
                    </div>
                    <div className="font-mono text-[10px] text-muted">{p.sku}</div>
                    <div className="mt-2 font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(100)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Payment Tender Panel */}
        <div className="flex w-96 flex-col bg-surface-sunken/40 p-4">
          {/* Multi-Cart Hold & Resume Tab Switcher */}
          <div className="flex items-center gap-1.5 mb-3 bg-surface p-1 rounded-xl border border-default">
            {slots.map((slot, idx) => {
              const count = slot.cart.reduce((s, i) => s + i.quantity, 0);
              const isActive = idx === activeSlotIndex;
              return (
                <button
                  key={slot.id}
                  onClick={() => setActiveSlotIndex(idx)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-muted hover:text-default hover:bg-surface-sunken'
                  }`}
                >
                  <span>{slot.label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-primary-hover text-white' : 'bg-surface-sunken text-emerald-600 dark:text-emerald-400 border border-default'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-default pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-sm text-default">{currentSlot.label} Order</span>
              <span className="rounded-full bg-surface-sunken border border-default px-2 py-0.5 text-[10px] font-bold text-muted">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer">
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-default py-2">
            {cart.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted">
                <ShoppingBag className="h-8 w-8 stroke-1 text-muted mb-2" />
                <p className="text-xs">Cart is empty</p>
                <p className="text-[10px] text-muted">Scan barcode (F2) or click items to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between py-2.5">
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-xs text-default line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="font-mono text-[10px] text-muted">
                      {formatCurrency(item.unit_price)} / unit
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-default bg-surface text-default hover:bg-surface-sunken cursor-pointer transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs text-default">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-default bg-surface text-default hover:bg-surface-sunken cursor-pointer transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="ml-1 text-muted hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Checkout Form */}
          <div className="border-t border-default pt-3 space-y-3">
            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={customerNameInputRef}
                type="text"
                placeholder="Customer Name (F4)"
                value={customerName}
                onChange={(e) => updateCurrentSlot({ customerName: e.target.value })}
                className="h-8 rounded-xl border border-default bg-surface px-2.5 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone (017...)"
                value={customerPhone}
                onChange={(e) => updateCurrentSlot({ customerPhone: e.target.value })}
                className="h-8 rounded-xl border border-default bg-surface px-2.5 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => updateCurrentSlot({ tenderMethod: 'cash' })}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-[10px] font-semibold uppercase transition-all cursor-pointer ${
                  tenderMethod === 'cash'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-default bg-surface text-muted hover:bg-surface-sunken hover:text-default'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Cash (F10)
              </button>
              <button
                type="button"
                onClick={() => updateCurrentSlot({ tenderMethod: 'card' })}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-[10px] font-semibold uppercase transition-all cursor-pointer ${
                  tenderMethod === 'card'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-default bg-surface text-muted hover:bg-surface-sunken hover:text-default'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Card
              </button>
              <button
                type="button"
                onClick={() => updateCurrentSlot({ tenderMethod: 'mobile_banking' })}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-[10px] font-semibold uppercase transition-all cursor-pointer ${
                  tenderMethod === 'mobile_banking'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-default bg-surface text-muted hover:bg-surface-sunken hover:text-default'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                bKash/Nagad
              </button>
            </div>

            {/* Cash Tendered Input */}
            {tenderMethod === 'cash' && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-sunken border border-default p-2">
                <span className="text-[11px] text-muted">Cash Received:</span>
                <input
                  ref={cashTenderedInputRef}
                  type="number"
                  step="1"
                  placeholder={grandTotal.toString()}
                  value={cashTendered}
                  onChange={(e) => updateCurrentSlot({ cashTendered: e.target.value })}
                  className="h-7 w-28 rounded-lg border border-default bg-surface px-2 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {/* Order Summary Breakdown */}
            <div className="space-y-1 text-xs text-muted border-t border-default pt-2 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {changeGiven > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Change Return:</span>
                  <span>{formatCurrency(changeGiven)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-default pt-1">
                <span className="font-sans">Total Payable:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkingOut}
              className="w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] cursor-pointer"
            >
              {checkingOut ? 'Processing...' : `Complete Sale (${formatCurrency(grandTotal)})`}
            </button>

            {/* Cashier Velocity Hotkey Bar */}
            <div className="flex items-center justify-between text-[10px] text-muted pt-1 font-mono">
              <span>[F2] Search</span>
              <span>[F4] Customer</span>
              <span>[F9] Pay Method</span>
              <span>[F10] Cash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-default bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-center text-base font-bold text-default">Sale Completed!</h3>
            <p className="text-center font-mono text-xs text-muted mt-1">
              Invoice #{lastReceipt.invoice.invoice_number}
            </p>

            <div className="mt-4 rounded-xl border border-default bg-surface-sunken p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between text-muted">
                <span>Order No:</span>
                <span className="text-default">{lastReceipt.order.order_number}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Amount Paid:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(lastReceipt.order.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Session:</span>
                <span className="text-default">{lastReceipt.session.session_number}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-default bg-surface-sunken py-2 text-xs font-medium text-default hover:bg-surface cursor-pointer transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-white hover:bg-primary-hover cursor-pointer transition-colors"
              >
                Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
