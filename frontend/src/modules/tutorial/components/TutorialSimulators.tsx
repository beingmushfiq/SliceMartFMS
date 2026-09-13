import React, { useState } from 'react';
import {
  Calculator,
  Microscope,
  Store,
  Truck,
  CheckCircle2,
  Receipt,
  RotateCcw,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   1. BOM RECIPE CALCULATOR SIMULATOR
───────────────────────────────────────────────────────────── */
export const BomCalculatorSimulator: React.FC = () => {
  const [batchTarget, setBatchTarget] = useState<number>(100);

  const flourKg = (batchTarget * 0.35).toFixed(1);
  const yeastKg = (batchTarget * 0.01).toFixed(2);
  const sugarKg = (batchTarget * 0.04).toFixed(1);
  const pouches = batchTarget;
  const estimatedCost = (batchTarget * 26.8).toFixed(2);

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-surface-sunken p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Calculator className="size-4" />
          </div>
          <span className="text-xs font-bold text-default">Interactive BOM Formula Sandbox</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
          Live Recipe Math
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Target Batch Size (Loaves):</span>
          <span className="font-mono font-bold text-default">{batchTarget} pcs</span>
        </div>
        <input
          type="range"
          min="10"
          max="1000"
          step="10"
          value={batchTarget}
          onChange={(e) => setBatchTarget(Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted font-mono">
          <span>10 pcs</span>
          <span>500 pcs</span>
          <span>1,000 pcs</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-default">
        <div className="rounded-xl border border-default bg-surface p-2.5 text-center">
          <div className="text-[10px] text-muted">Organic Flour</div>
          <div className="text-sm font-mono font-bold text-default mt-0.5">{flourKg} kg</div>
          <div className="text-[9px] text-muted">@ 0.35 kg/pc</div>
        </div>
        <div className="rounded-xl border border-default bg-surface p-2.5 text-center">
          <div className="text-[10px] text-muted">Active Yeast</div>
          <div className="text-sm font-mono font-bold text-default mt-0.5">{yeastKg} kg</div>
          <div className="text-[9px] text-muted">@ 0.01 kg/pc</div>
        </div>
        <div className="rounded-xl border border-default bg-surface p-2.5 text-center">
          <div className="text-[10px] text-muted">Fine Sugar</div>
          <div className="text-sm font-mono font-bold text-default mt-0.5">{sugarKg} kg</div>
          <div className="text-[9px] text-muted">@ 0.04 kg/pc</div>
        </div>
        <div className="rounded-xl border border-default bg-surface p-2.5 text-center">
          <div className="text-[10px] text-muted">BOPP Pouches</div>
          <div className="text-sm font-mono font-bold text-default mt-0.5">{pouches} pcs</div>
          <div className="text-[9px] text-muted">@ 1 pc/unit</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium">
        <span>Estimated Raw Material Input Value:</span>
        <span className="font-mono font-bold">৳ {estimatedCost}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   2. QC INSPECTOR SIMULATOR
───────────────────────────────────────────────────────────── */
export const QcInspectorSimulator: React.FC = () => {
  const [passed, setPassed] = useState(94);
  const [rework, setRework] = useState(4);
  const [scrap, setScrap] = useState(2);

  const total = passed + rework + scrap;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

  const resetQc = () => {
    setPassed(94);
    setRework(4);
    setScrap(2);
  };

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-surface-sunken p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Microscope className="size-4" />
          </div>
          <span className="text-xs font-bold text-default">QA Inspection & Routing Simulator</span>
        </div>
        <button
          type="button"
          onClick={resetQc}
          className="text-xs text-muted hover:text-default flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Yield Meter */}
      <div className="rounded-xl border border-default bg-surface p-3 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-muted">Batch QA Yield Rate:</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            {passRate}% Approved
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            style={{ width: `${(passed / total) * 100}%` }}
            className="bg-emerald-500 transition-all duration-300"
          />
          <div
            style={{ width: `${(rework / total) * 100}%` }}
            className="bg-amber-500 transition-all duration-300"
          />
          <div
            style={{ width: `${(scrap / total) * 100}%` }}
            className="bg-rose-500 transition-all duration-300"
          />
        </div>
      </div>

      {/* Interactive Outcome Toggles */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-center space-y-1.5">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            Passed ({passed})
          </div>
          <div className="text-[10px] text-muted">Routes to Finished Store</div>
          <div className="flex justify-center gap-1">
            <button
              type="button"
              onClick={() => setPassed((p) => Math.max(0, p - 1))}
              className="px-2 py-0.5 rounded border border-default bg-surface text-xs font-mono font-bold cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setPassed((p) => p + 1)}
              className="px-2 py-0.5 rounded border border-default bg-surface text-xs font-mono font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 text-center space-y-1.5">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
            Rework ({rework})
          </div>
          <div className="text-[10px] text-muted">Routes to Rectification</div>
          <div className="flex justify-center gap-1">
            <button
              type="button"
              onClick={() => setRework((r) => Math.max(0, r - 1))}
              className="px-2 py-0.5 rounded border border-default bg-surface text-xs font-mono font-bold cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setRework((r) => r + 1)}
              className="px-2 py-0.5 rounded border border-default bg-surface text-xs font-mono font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-2.5 text-center space-y-1.5">
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
            Scrap ({scrap})
          </div>
          <div className="text-[10px] text-muted">Loss Ledger & Reason</div>
          <div className="flex justify-center gap-1">
            <button
              type="button"
              onClick={() => setScrap((s) => Math.max(0, s - 1))}
              className="px-2 py-0.5 rounded border border-default bg-surface text-xs font-mono font-bold cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setScrap((s) => s + 1)}
              className="px-2 py-0.5 rounded border border-default bg-surface text-xs font-mono font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   3. POS CHECKOUT COUNTER SIMULATOR
───────────────────────────────────────────────────────────── */
interface PosCartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export const PosCheckoutSimulator: React.FC = () => {
  const [cart, setCart] = useState<PosCartItem[]>([
    { id: '1', name: 'Artisan Sourdough Loaf', price: 180, qty: 1 },
  ]);
  const [isCompleted, setIsCompleted] = useState(false);

  const addItem = (name: string, price: number) => {
    setIsCompleted(false);
    setCart((prev) => {
      const found = prev.find((i) => i.name === name);
      if (found) {
        return prev.map((i) => (i.name === name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: String(Date.now()), name, price, qty: 1 }];
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax;

  const handleCheckout = () => {
    setIsCompleted(true);
  };

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-surface-sunken p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Store className="size-4" />
          </div>
          <span className="text-xs font-bold text-default">Interactive POS Counter Experience</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold">
          Scan & Pay
        </span>
      </div>

      {/* Quick Tap Items */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-muted">Tap to scan into counter cart:</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => addItem('Artisan Sourdough Loaf', 180)}
            className="flex flex-col items-center justify-center rounded-xl border border-default bg-surface p-2 hover:border-primary/50 transition-all cursor-pointer text-center"
          >
            <span className="text-xs font-bold text-default">🍞 Sourdough</span>
            <span className="text-[10px] font-mono text-muted">৳ 180</span>
          </button>
          <button
            type="button"
            onClick={() => addItem('Butter Croissant', 120)}
            className="flex flex-col items-center justify-center rounded-xl border border-default bg-surface p-2 hover:border-primary/50 transition-all cursor-pointer text-center"
          >
            <span className="text-xs font-bold text-default">🥐 Croissant</span>
            <span className="text-[10px] font-mono text-muted">৳ 120</span>
          </button>
          <button
            type="button"
            onClick={() => addItem('Cold Brew Bottle', 150)}
            className="flex flex-col items-center justify-center rounded-xl border border-default bg-surface p-2 hover:border-primary/50 transition-all cursor-pointer text-center"
          >
            <span className="text-xs font-bold text-default">☕ Cold Brew</span>
            <span className="text-[10px] font-mono text-muted">৳ 150</span>
          </button>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="rounded-xl border border-default bg-surface p-3 space-y-2">
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between text-xs">
              <span className="text-default">
                {item.qty}x {item.name}
              </span>
              <span className="font-mono font-semibold text-default">৳ {item.price * item.qty}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-default flex justify-between text-xs">
          <span className="text-muted">VAT (5%):</span>
          <span className="font-mono text-default">৳ {tax}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>Grand Total:</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">৳ {grandTotal}</span>
        </div>
      </div>

      {/* Checkout Action */}
      {!isCompleted ? (
        <button
          type="button"
          onClick={handleCheckout}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
        >
          <Receipt className="size-4" />
          <span>Complete Checkout & Print Thermal Slip (F12)</span>
        </button>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            <span>Sale #POS-89241 Confirmed • Stock Deducted</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCart([{ id: '1', name: 'Artisan Sourdough Loaf', price: 180, qty: 1 }]);
              setIsCompleted(false);
            }}
            className="text-[11px] underline text-muted hover:text-default cursor-pointer"
          >
            New Sale
          </button>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   4. COURIER DISPATCH SIMULATOR
───────────────────────────────────────────────────────────── */
export const CourierDispatchSimulator: React.FC = () => {
  const [carrier, setCarrier] = useState<'RedX' | 'Steadfast' | 'Pathao'>('Steadfast');
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const handleBook = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    setTrackingId(`${carrier.toUpperCase().slice(0, 3)}-${random}`);
  };

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-surface-sunken p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Truck className="size-4" />
          </div>
          <span className="text-xs font-bold text-default">Third-Party Courier Booking API</span>
        </div>
        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
          Live Adapter
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-muted">Select Carrier API Integration:</div>
        <div className="grid grid-cols-3 gap-2">
          {(['Steadfast', 'Pathao', 'RedX'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCarrier(c);
                setTrackingId(null);
              }}
              className={`rounded-xl border p-2 text-xs font-bold transition-all cursor-pointer ${
                carrier === c
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-default bg-surface text-muted hover:text-default'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-default bg-surface p-3 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-muted">Delivery City:</span>
          <span className="font-semibold text-default">Dhaka Metro (Same-Day)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">COD Cash to Collect:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">৳ 1,450.00</span>
        </div>
      </div>

      {!trackingId ? (
        <button
          type="button"
          onClick={handleBook}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
        >
          <Truck className="size-4" />
          <span>Dispatch & Transmit Consignment to {carrier}</span>
        </button>
      ) : (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted">Tracking Waybill:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {trackingId}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Status:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Pickup Requested via Webhook
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
