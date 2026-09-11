import React, { useState } from 'react';
import { X, PackageCheck, AlertCircle } from 'lucide-react';
import type { GoodsReceipt, GoodsReceiptItem, PurchaseOrder } from '../../../types/api/purchasing';
import { notify } from '../../../components/ui/Toast';

interface FastGrnModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newGrn: GoodsReceipt) => void;
  initialPo?: PurchaseOrder | null;
  availablePos?: PurchaseOrder[];
}

export const FastGrnModal: React.FC<FastGrnModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialPo = null,
  availablePos = [],
}) => {
  const [selectedPoId, setSelectedPoId] = useState<number>(initialPo?.id ?? (availablePos[0]?.id || 0));
  const activePo = initialPo || availablePos.find((p) => p.id === selectedPoId) || null;

  const [deliveryChallan, setDeliveryChallan] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchCode, setBatchCode] = useState(() => `BATCH-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [notes, setNotes] = useState('');

  // Item intake lines
  const [receivedQtys, setReceivedQtys] = useState<Record<number, { received: string; rejected: string }>>(() => {
    const map: Record<number, { received: string; rejected: string }> = {};
    if (activePo?.items) {
      activePo.items.forEach((item, idx) => {
        const pending = Math.max(0, (parseFloat(item.quantity) || 0) - (parseFloat(item.received_quantity) || 0));
        map[idx] = { received: String(pending || item.quantity), rejected: '0' };
      });
    }
    return map;
  });

  if (!open) return null;

  const handlePoChange = (poId: number) => {
    setSelectedPoId(poId);
    const found = availablePos.find((p) => p.id === poId);
    if (found?.items) {
      const map: Record<number, { received: string; rejected: string }> = {};
      found.items.forEach((item, idx) => {
        const pending = Math.max(0, (parseFloat(item.quantity) || 0) - (parseFloat(item.received_quantity) || 0));
        map[idx] = { received: String(pending || item.quantity), rejected: '0' };
      });
      setReceivedQtys(map);
    }
  };

  const handleQtyChange = (idx: number, field: 'received' | 'rejected', val: string) => {
    setReceivedQtys((prev) => ({
      ...prev,
      [idx]: {
        received: prev[idx]?.received || '0',
        rejected: prev[idx]?.rejected || '0',
        [field]: val,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const grnNumber = `GRN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

    const grnItems: GoodsReceiptItem[] = (activePo?.items || [
      {
        id: 1,
        uuid: 'poi-temp',
        purchase_order_id: 1,
        product_id: 1,
        product_name: 'Raw Materials Batch',
        product_sku: 'RAW-001',
        quantity: '100.00',
        received_quantity: '0.00',
        billed_quantity: '0.00',
        unit_id: 1,
        unit_code: 'PCS',
        unit_price: '450.00',
        discount_amount: '0.00',
        tax_rate: '5.00',
        tax_amount: '0.00',
        subtotal_amount: '45000.00',
        total_amount: '45000.00',
      },
    ]).map((item, idx) => {
      const rec = parseFloat(receivedQtys[idx]?.received || item.quantity) || 0;
      const rej = parseFloat(receivedQtys[idx]?.rejected || '0') || 0;
      const accepted = Math.max(0, rec - rej);
      const cost = parseFloat(item.unit_price) || 0;

      return {
        id: Date.now() + idx,
        uuid: `gri-${Date.now()}-${idx}`,
        goods_receipt_id: Date.now(),
        purchase_order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || 'Material Item',
        product_sku: item.product_sku || 'RAW',
        batch_code: batchCode,
        received_quantity: rec.toFixed(2),
        rejected_quantity: rej.toFixed(2),
        accepted_quantity: accepted.toFixed(2),
        unit_id: item.unit_id,
        unit_code: item.unit_code || 'pcs',
        unit_cost: cost.toFixed(4),
        total_cost: (accepted * cost).toFixed(4),
      };
    });

    const totalAccepted = grnItems.reduce((acc, item) => acc + (parseFloat(item.accepted_quantity) || 0), 0);

    const newGrn: GoodsReceipt = {
      id: Date.now(),
      uuid: `grn-${Date.now()}`,
      grn_number: grnNumber,
      purchase_order_id: activePo?.id ?? null,
      po_number: activePo?.po_number ?? null,
      party_id: activePo?.party_id ?? 1,
      supplier_name: activePo?.supplier_name ?? 'Bengal Glass & Ceramic Ltd.',
      warehouse_id: activePo?.warehouse_id ?? 1,
      warehouse_name: activePo?.warehouse_name ?? 'Tejgaon Central Raw Materials Warehouse',
      receipt_date: receiptDate,
      supplier_document_number: deliveryChallan || `CHALLAN-${Date.now().toString().slice(-5)}`,
      status: 'completed',
      notes: notes || 'Gate intake verified and accepted into stock.',
      items: grnItems,
      created_at: new Date().toISOString(),
    };

    onSuccess(newGrn);
    notify.success('Goods Received & Stock Updated', {
      description: `${grnNumber}: Accepted ${totalAccepted} units into ${newGrn.warehouse_name}. Stock is now live.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-default rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-default">Inward Delivery (Fast Goods Receipt - GRN)</h3>
              <p className="text-xs text-muted">
                Receive incoming truck shipment. Accepted quantities immediately increase live warehouse stock.
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
          {/* PO Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">
                Purchase Order Reference <span className="text-emerald-500">*</span>
              </label>
              {initialPo ? (
                <div className="px-3 py-2 border border-default rounded-xl bg-surface-sunken text-xs font-mono font-bold text-default">
                  {initialPo.po_number} ({initialPo.supplier_name})
                </div>
              ) : (
                <select
                  value={selectedPoId}
                  onChange={(e) => handlePoChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {availablePos.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} — {po.supplier_name}
                    </option>
                  ))}
                  {availablePos.length === 0 && (
                    <option value={0}>PO-202608-001 (Bengal Glass & Ceramic Ltd.)</option>
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-default mb-1">
                Supplier Delivery Challan # <span className="text-emerald-500">*</span>
              </label>
              <input
                type="text"
                value={deliveryChallan}
                onChange={(e) => setDeliveryChallan(e.target.value)}
                placeholder="e.g. CH-2026-9910"
                required
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Receipt Date</label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Assigned Batch / Lot Code</label>
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Intake Table */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Gate Inspection & Quantities
              </label>
              <span className="text-[11px] text-muted">Verify item counts vs supplier challan</span>
            </div>

            <div className="space-y-2">
              {(activePo?.items || [
                {
                  id: 1,
                  product_name: 'Microcrystalline Ceramic Glass Panel',
                  product_sku: 'RAW-CERAMIC-PANEL',
                  quantity: '500.00',
                  received_quantity: '0.00',
                  unit_code: 'PCS',
                },
              ]).map((item, idx) => {
                const pending = Math.max(0, (parseFloat(item.quantity) || 0) - (parseFloat(item.received_quantity) || 0));
                const rec = parseFloat(receivedQtys[idx]?.received || String(pending || item.quantity)) || 0;
                const rej = parseFloat(receivedQtys[idx]?.rejected || '0') || 0;
                const accepted = Math.max(0, rec - rej);

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-sunken border border-default space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-default">{item.product_name}</div>
                      <div className="font-mono text-muted text-[11px]">
                        Ordered: {item.quantity} {item.unit_code || 'PCS'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-muted mb-0.5">Delivered Qty</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={receivedQtys[idx]?.received ?? String(pending || item.quantity)}
                          onChange={(e) => handleQtyChange(idx, 'received', e.target.value)}
                          className="w-full px-2 py-1.5 border border-default rounded-lg bg-surface text-default font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-rose-500 font-semibold mb-0.5">Rejected (Damaged)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={receivedQtys[idx]?.rejected ?? '0'}
                          onChange={(e) => handleQtyChange(idx, 'rejected', e.target.value)}
                          className="w-full px-2 py-1.5 border border-default rounded-lg bg-surface text-rose-600 dark:text-rose-400 font-mono text-xs focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-emerald-500 font-semibold mb-0.5">Accepted into Stock</label>
                        <div className="px-2 py-1.5 border border-default rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                          {accepted} {item.unit_code || 'PCS'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-default mb-1">Intake Gate Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Arrived via truck DHK-METRO-14-1102; clean condition"
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-muted flex items-center gap-2">
            <AlertCircle className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Stock levels for accepted items will increase instantly. If any units were marked as damaged/rejected, they are recorded for vendor credit return.
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
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <PackageCheck className="size-3.5" />
              <span>Confirm Gate Intake & Add to Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
