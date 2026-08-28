import { useState, useEffect, useRef } from 'react';
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

export function POSShell({ session, onExit }: POSShellProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tenderMethod, setTenderMethod] = useState<'cash' | 'card' | 'mobile_banking'>('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<PosCheckoutResult | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get<Product[]>('/catalog/products');
      setProducts(res.data ?? []);
    } catch (err) {
      console.error('Failed to load products for POS', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => String(item.product.id) === String(product.id));
      if (existing) {
        return prev.map((item) =>
          String(item.product.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: 100,
          discount: 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: string | number, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (String(item.product.id) === String(productId)) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string | number) => {
    setCart((prev) => prev.filter((item) => String(item.product.id) !== String(productId)));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashTendered('');
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
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100">
      {/* POS Top Bar */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-sm">
            POS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-100">
                {session.terminal_name ?? 'POS Register'}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                ● Live Shift
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">Session: {session.session_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400">
            <div>
              Branch:{' '}
              <span className="text-zinc-200 font-medium">
                {session.branch_name ?? 'Main Outlet'}
              </span>
            </div>
            <div>
              Expected Cash:{' '}
              <span className="text-emerald-400 font-mono font-medium">
                {parseFloat(session.expected_cash || '0').toFixed(2)} BDT
              </span>
            </div>
          </div>

          <button
            onClick={onExit}
            className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <X className="h-4 w-4" />
            Exit Terminal
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product Catalog Grid */}
        <div className="flex flex-1 flex-col border-r border-zinc-800 p-4">
          {/* Search & Barcode Scan */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode or search products (SKU, Name)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              onClick={fetchProducts}
              disabled={loadingProducts}
              className="flex h-11 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className={`h-4 w-4 ${loadingProducts ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loadingProducts ? (
              <div className="flex h-48 items-center justify-center text-xs text-zinc-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-xs text-zinc-500">
                No products found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex flex-col items-start rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-all hover:border-emerald-500/50 hover:bg-zinc-900 active:scale-[0.98]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                      {p.name.charAt(0)}
                    </div>
                    <div className="mt-2 font-medium text-xs text-zinc-200 line-clamp-1">
                      {p.name}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-500">{p.sku}</div>
                    <div className="mt-2 font-mono font-bold text-xs text-emerald-400">
                      100.00 <span className="text-[9px] font-normal text-zinc-500">BDT</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Payment Tender Panel */}
        <div className="flex w-96 flex-col bg-zinc-900/40 p-4">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-sm text-zinc-100">Active Order</span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-[11px] text-rose-400 hover:underline">
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 py-2">
            {cart.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-zinc-500">
                <ShoppingBag className="h-8 w-8 stroke-1 text-zinc-600 mb-2" />
                <p className="text-xs">Cart is empty</p>
                <p className="text-[10px] text-zinc-600">Scan or select products to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between py-2.5">
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-xs text-zinc-200 line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-500">
                      {item.unit_price.toFixed(2)} BDT / unit
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs text-zinc-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="ml-1 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Checkout Form */}
          <div className="border-t border-zinc-800 pt-3 space-y-3">
            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 rounded border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone (017...)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-8 rounded border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setTenderMethod('cash')}
                className={`flex flex-col items-center gap-1 rounded border py-2 text-[10px] font-semibold uppercase transition-all ${
                  tenderMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setTenderMethod('card')}
                className={`flex flex-col items-center gap-1 rounded border py-2 text-[10px] font-semibold uppercase transition-all ${
                  tenderMethod === 'card'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setTenderMethod('mobile_banking')}
                className={`flex flex-col items-center gap-1 rounded border py-2 text-[10px] font-semibold uppercase transition-all ${
                  tenderMethod === 'mobile_banking'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                bKash/Nagad
              </button>
            </div>

            {/* Cash Tendered Input */}
            {tenderMethod === 'cash' && (
              <div className="flex items-center justify-between gap-2 rounded bg-zinc-900/90 border border-zinc-800 p-2">
                <span className="text-[11px] text-zinc-400">Cash Received:</span>
                <input
                  type="number"
                  step="1"
                  placeholder={grandTotal.toString()}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="h-7 w-28 rounded border border-zinc-700 bg-zinc-800 px-2 text-right font-mono font-bold text-xs text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {/* Order Summary Breakdown */}
            <div className="space-y-1 text-xs text-zinc-400 border-t border-zinc-800/80 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)} BDT</span>
              </div>
              {changeGiven > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Change Return:</span>
                  <span>{changeGiven.toFixed(2)} BDT</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-zinc-100 pt-1">
                <span className="font-sans">Total Payable:</span>
                <span className="text-emerald-400">{grandTotal.toFixed(2)} BDT</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkingOut}
              className="w-full rounded-lg bg-emerald-600 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]"
            >
              {checkingOut ? 'Processing...' : `Complete Sale (${grandTotal.toFixed(2)} BDT)`}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-center text-emerald-400 mb-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-center text-base font-bold text-zinc-100">Sale Completed!</h3>
            <p className="text-center font-mono text-xs text-zinc-400 mt-1">
              Invoice #{lastReceipt.invoice.invoice_number}
            </p>

            <div className="mt-4 rounded border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Order No:</span>
                <span className="text-zinc-200">{lastReceipt.order.order_number}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Amount Paid:</span>
                <span className="text-emerald-400 font-bold">
                  {lastReceipt.order.total_amount} BDT
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Session:</span>
                <span className="text-zinc-300">{lastReceipt.session.session_number}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                className="flex-1 rounded-md bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500"
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
