import React, { useState } from 'react';
import { X, Receipt, AlertCircle } from 'lucide-react';
import type { PurchaseBill, PurchaseOrder } from '../../../types/api/purchasing';
import { useCurrency } from '../../../hooks/useCurrency';
import { notify } from '../../../components/ui/Toast';

interface FastBillModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newBill: PurchaseBill) => void;
  initialPo?: PurchaseOrder | null;
  availablePos?: PurchaseOrder[];
}

export const FastBillModal: React.FC<FastBillModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialPo = null,
  availablePos = [],
}) => {
  const { formatCurrency } = useCurrency();
  const [selectedPoId, setSelectedPoId] = useState<number>(initialPo?.id ?? (availablePos[0]?.id || 0));
  const activePo = initialPo || availablePos.find((p) => p.id === selectedPoId) || null;

  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [amount, setAmount] = useState(activePo?.grand_total || '231000.00');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const handlePoChange = (poId: number) => {
    setSelectedPoId(poId);
    const found = availablePos.find((p) => p.id === poId);
    if (found) {
      setAmount(found.grand_total || '0.00');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      notify.warning('Validation Error', { description: 'Please enter a valid bill amount.' });
      return;
    }

    const billNumber = `BILL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

    const newBill: PurchaseBill = {
      id: Date.now(),
      uuid: `bill-${Date.now()}`,
      bill_number: billNumber,
      purchase_order_id: activePo?.id ?? null,
      po_number: activePo?.po_number ?? null,
      party_id: activePo?.party_id ?? 1,
      supplier_name: activePo?.supplier_name ?? 'Bengal Glass & Ceramic Ltd.',
      bill_date: billDate,
      due_date: dueDate,
      supplier_invoice_number: vendorInvoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      currency_code: 'BDT',
      exchange_rate: '1.0000',
      subtotal_amount: (numAmount * 0.95).toFixed(2),
      tax_amount: (numAmount * 0.05).toFixed(2),
      discount_amount: '0.00',
      grand_total: numAmount.toFixed(2),
      paid_amount: '0.00',
      status: 'pending',
      payment_status: 'unpaid',
      notes: notes || 'Verified with receiving challan.',
      created_at: new Date().toISOString(),
    };

    onSuccess(newBill);
    notify.success('Supplier Bill Logged', {
      description: `${billNumber} recorded for ${newBill.supplier_name} (${formatCurrency(numAmount)}). Due on ${dueDate}. Ready for payout in Finance.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-default rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-default">Enter Supplier Bill & Invoice</h3>
              <p className="text-xs text-muted">
                Record vendor invoice in Accounts Payable. You can settle it in Cash & Bank in 1 click.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">
                Purchase Order Reference
              </label>
              {initialPo ? (
                <div className="px-3 py-2 border border-default rounded-xl bg-surface-sunken text-xs font-mono font-bold text-default">
                  {initialPo.po_number} ({initialPo.supplier_name})
                </div>
              ) : (
                <select
                  value={selectedPoId}
                  onChange={(e) => handlePoChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
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
                Vendor&apos;s Invoice Number <span className="text-indigo-500">*</span>
              </label>
              <input
                type="text"
                value={vendorInvoiceNumber}
                onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                placeholder="e.g. BGL-INV-2026-8801"
                required
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Bill Date</label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">
                Payment Due Date <span className="text-indigo-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-default mb-1">
              Total Bill Amount (৳) <span className="text-indigo-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm font-mono font-bold focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-default mb-1">Billing Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified with warehouse delivery challan and QC report"
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-muted flex items-center gap-2">
            <AlertCircle className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Once recorded, this bill will appear in your Accounts Payable list and Finance workspace ready for single-click payment settlement.
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
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Receipt className="size-3.5" />
              <span>Record Supplier Bill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
