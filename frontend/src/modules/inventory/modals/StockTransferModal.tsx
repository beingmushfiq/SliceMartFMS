import React, { useState } from 'react';
import { X, ArrowRightLeft, Warehouse, AlertCircle } from 'lucide-react';
import { notify } from '../../../components/ui/Toast';

interface StockTransferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialProductId?: number;
  initialProductName?: string;
}

const SAMPLE_WAREHOUSES = [
  { id: 1, name: 'Tejgaon Central Raw Materials Warehouse' },
  { id: 2, name: 'Tejgaon Finished Goods Dispatch Center' },
  { id: 3, name: 'Gulshan Retail Floor Stock' },
  { id: 4, name: 'Chittagong Regional Distribution Hub' },
];

const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Premium Cotton Oxford Shirt - Blue / L', sku: 'SHT-OXF-BLU-L', available: 250, unit: 'PCS' },
  { id: 2, name: 'Slim Fit Denim Jeans 14oz - Indigo / 32', sku: 'JNS-SLM-IND-32', available: 180, unit: 'PCS' },
  { id: 3, name: 'Microcrystalline Ceramic Glass Panel', sku: 'RAW-CERAMIC-PANEL', available: 500, unit: 'PCS' },
  { id: 4, name: 'Copper Core Induction Heating Coil', sku: 'RAW-INDUCT-COIL', available: 420, unit: 'PCS' },
];

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialProductName = '',
}) => {
  const [fromWarehouseId, setFromWarehouseId] = useState<number>(1);
  const [toWarehouseId, setToWarehouseId] = useState<number>(2);
  const [productName, setProductName] = useState(initialProductName || SAMPLE_PRODUCTS[0]?.name || '');
  const [quantity, setQuantity] = useState('20');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const selectedProduct = SAMPLE_PRODUCTS.find((p) => p.name === productName) || SAMPLE_PRODUCTS[0]!;
  const fromWarehouse = SAMPLE_WAREHOUSES.find((w) => w.id === fromWarehouseId) ?? SAMPLE_WAREHOUSES[0]!;
  const toWarehouse = SAMPLE_WAREHOUSES.find((w) => w.id === toWarehouseId) ?? SAMPLE_WAREHOUSES[1]!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWarehouseId === toWarehouseId) {
      notify.warning('Invalid Transfer Route', {
        description: 'Source and destination warehouses cannot be the same.',
      });
      return;
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      notify.warning('Validation Error', { description: 'Please enter a valid quantity to transfer.' });
      return;
    }

    const transferNumber = `TRF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

    notify.success('Stock Transfer Dispatched', {
      description: `${transferNumber}: Dispatched ${numQty} ${selectedProduct.unit} of "${productName}" from ${fromWarehouse.name} to ${toWarehouse.name}.`,
    });

    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-default rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-default">Move Stock (Internal Warehouse Transfer)</h3>
              <p className="text-xs text-muted">
                Move inventory between factory, retail store, and regional distribution centers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-default p-1 rounded-lg transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Route: From -> To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-surface-sunken rounded-xl border border-default">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1 flex items-center gap-1">
                <Warehouse className="size-3 text-blue-500" />
                <span>Source Warehouse</span>
              </label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-default rounded-lg bg-surface text-default text-xs font-semibold focus:border-blue-500 focus:outline-none"
              >
                {SAMPLE_WAREHOUSES.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1 flex items-center gap-1">
                <Warehouse className="size-3 text-emerald-500" />
                <span>Destination Warehouse</span>
              </label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-default rounded-lg bg-surface text-default text-xs font-semibold focus:border-blue-500 focus:outline-none"
              >
                {SAMPLE_WAREHOUSES.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === fromWarehouseId}>
                    {w.name} {w.id === fromWarehouseId ? '(Same as Source)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-default mb-1">
              Product to Transfer <span className="text-blue-500">*</span>
            </label>
            <select
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
            >
              {SAMPLE_PRODUCTS.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} (Available: {p.available} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">
                Transfer Quantity ({selectedProduct.unit}) <span className="text-blue-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max={selectedProduct.available}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm font-mono font-bold focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-muted">Max available: {selectedProduct.available} {selectedProduct.unit}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-default mb-1">Transfer Date</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Van / Driver / Courier Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. HiAce Van #11 (Driver Kalam)"
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Transfer Purpose / Note</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Replenish retail showroom weekend stock"
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-muted flex items-center gap-2">
            <AlertCircle className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Moving stock deducts inventory from <strong>{fromWarehouse.name}</strong> and immediately credits <strong>{toWarehouse.name}</strong>.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-default text-muted hover:text-default transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRightLeft className="size-3.5" />
              <span>Dispatch Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
