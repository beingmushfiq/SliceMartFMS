import React, { useState } from 'react';
import {
  ShoppingCart,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Calendar,
  FileText,
  Printer,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { FormGroup, Input, Select, Textarea } from '../../../components/ui/FormElements';

// ── Requisition / Order PO Modal ──────────────────────────────
export interface OrderPOItem {
  id: string;
  name: string;
  sku: string;
  warehouse: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  suggestedQty: number;
}

export function OrderPOModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: OrderPOItem | null;
  onSuccess?: () => void;
}) {
  const [quantity, setQuantity] = useState(item?.suggestedQty ?? 200);
  const [vendor, setVendor] = useState('Apex Industrial Components Ltd');
  const [notes, setNotes] = useState('Urgent buffer replenishment for Morning Shift run');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`Purchase Requisition Created for ${quantity} ${item.unit} of ${item.name}`, {
        description: `Ref: PR-2026-${Math.floor(1000 + Math.random() * 9000)} • Routed to Procurement Queue`,
      });
      onSuccess?.();
      onClose();
    }, 400);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create Urgent Purchase Order"
      subtitle="Warehouse Requisition • Immediate Factory PO"
      size="md"
      icon={
        <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
          <ShoppingCart className="size-4" />
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button variant="secondary" size="md" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={isSubmitting}
            onClick={handleSubmit}
            type="submit"
            leftIcon={<ShoppingCart className="size-3.5" />}
          >
            Confirm & Issue PO
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Stock Summary Banner */}
        <div className="rounded-xl border border-default bg-surface-sunken p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-default text-sm">{item.name}</span>
            <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-500/25">
              {item.currentStock <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-muted pt-1 border-t border-default/60">
            <div>
              Location: <strong className="text-default font-mono">{item.warehouse}</strong>
            </div>
            <div>
              Current: <strong className="text-red-500 font-mono">{item.currentStock} {item.unit}</strong>
            </div>
            <div>
              Min Buffer: <strong className="text-default font-mono">{item.minThreshold} {item.unit}</strong>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormGroup label={`Requisition Quantity (${item.unit})`} required>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </FormGroup>

          <FormGroup label="Preferred Supplier" required>
            <Select value={vendor} onChange={(e) => setVendor(e.target.value)}>
              <option value="Apex Industrial Components Ltd">Apex Industrial Components</option>
              <option value="Global Sourcing Ltd (China)">Global Sourcing Ltd (China)</option>
              <option value="MicroTech Circuits BD">MicroTech Circuits BD</option>
            </Select>
          </FormGroup>
        </div>

        <FormGroup label="Requisition Remarks / Priority">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Specify reason for expedited order..."
          />
        </FormGroup>
      </form>
    </Modal>
  );
}

// ── Stock Review Modal ─────────────────────────────────────────
export function StockReviewModal({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: OrderPOItem | null;
}) {
  if (!item) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={item.name}
      subtitle="Material Audit & Buffer Threshold Analysis"
      size="md"
      icon={
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <Sparkles className="size-4" />
        </div>
      }
      footer={
        <div className="flex items-center justify-end w-full">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-default bg-surface-sunken p-3.5">
            <span className="text-xs text-muted">Available Stock</span>
            <p className="mt-1 text-2xl font-bold font-mono text-amber-500">
              {item.currentStock} {item.unit}
            </p>
            <span className="text-[11px] text-muted">Min Threshold: {item.minThreshold} pcs</span>
          </div>
          <div className="rounded-xl border border-default bg-surface-sunken p-3.5">
            <span className="text-xs text-muted">Estimated Runway</span>
            <p className="mt-1 text-2xl font-bold font-mono text-default">~ 1.8 Days</p>
            <span className="text-[11px] text-amber-500 font-semibold">
              Deficit: {item.minThreshold - item.currentStock} pcs
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-default p-3.5 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-default/60">
            <span className="text-muted">Storage Zone</span>
            <span className="font-semibold text-default">{item.warehouse} • Bin Rack C-04</span>
          </div>
          <div className="flex justify-between py-1 border-b border-default/60">
            <span className="text-muted">Associated Products</span>
            <span className="font-semibold text-default">Infrared Cooker IR-101, IR-102</span>
          </div>
          <div className="flex justify-between py-1 border-b border-default/60">
            <span className="text-muted">Average Daily Burn</span>
            <span className="font-semibold text-default">42 pcs / day</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Vendor Lead Time</span>
            <span className="font-semibold text-default">2-3 business days</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Quality Control Audit Modal ────────────────────────────────
export function QCAuditModal({
  isOpen,
  onClose,
  qcItem,
  onInspectDone,
}: {
  isOpen: boolean;
  onClose: () => void;
  qcItem: {
    id: string;
    orderNo: string;
    product: string;
    qty: number;
    status: string;
    rework?: number;
    failed?: number;
  } | null;
  onInspectDone?: (decision: 'pass' | 'rework' | 'fail') => void;
}) {
  const [defectNotes, setDefectNotes] = useState('');

  if (!qcItem) return null;

  const handleAction = (decision: 'pass' | 'rework' | 'fail') => {
    if (decision === 'pass') {
      toast.success(`Batch ${qcItem.id} Passed QC Inspection!`, {
        description: `Ready for finished packaging & inventory transfer (${qcItem.qty} pcs).`,
      });
    } else if (decision === 'rework') {
      toast.warning(`Batch ${qcItem.id} Tagged for Rework`, {
        description: `Returned to Line Supervisor for recalibration.`,
      });
    } else {
      toast.error(`Batch ${qcItem.id} Flagged as Scrap Reject`, {
        description: `Units logged to material scrap ledger.`,
      });
    }
    onInspectDone?.(decision);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Quality Inspection Terminal"
      subtitle={`${qcItem.id} • Order: ${qcItem.orderNo}`}
      size="md"
      icon={
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
          <ShieldCheck className="size-4" />
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <Button variant="danger" size="sm" onClick={() => handleAction('fail')}>
            Scrap Reject
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAction('rework')}
              leftIcon={<RotateCcw className="size-3.5" />}
            >
              Route to Rework
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction('pass')}
              leftIcon={<CheckCircle2 className="size-3.5" />}
            >
              Pass & Release
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-default bg-surface-sunken p-3.5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-default text-sm">{qcItem.product}</span>
            <span className="font-mono font-bold text-default text-sm">{qcItem.qty} pcs</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted pt-2 border-t border-default/60">
            <div>Sample Size: <strong>100% Comprehensive</strong></div>
            <div>Test Standard: <strong>ISO-9001 Heat Sensor</strong></div>
          </div>
        </div>

        <FormGroup label="Inspector Notes & Defect Criteria">
          <Textarea
            rows={2}
            value={defectNotes}
            onChange={(e) => setDefectNotes(e.target.value)}
            placeholder="Surface alignment checked, sensor tolerances within spec..."
          />
        </FormGroup>
      </div>
    </Modal>
  );
}

// ── Invoice Quick View Modal ──────────────────────────────────
export function InvoiceQuickViewModal({
  isOpen,
  onClose,
  invoice,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    customer: string;
    type: 'B2B' | 'B2C';
    amount: string;
    status: string;
    payment: string;
  } | null;
}) {
  if (!invoice) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Invoice ${invoice.id}`}
      subtitle="Sales Tax Invoice & Payment Status"
      size="md"
      icon={
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
          <FileText className="size-4" />
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              toast.info('Invoice printing initiated');
              window.print();
            }}
            leftIcon={<Printer className="size-3.5" />}
          >
            Print Receipt
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-sunken border border-default">
          <div>
            <span className="text-[11px] text-muted">Customer:</span>
            <p className="text-sm font-bold text-default mt-0.5">{invoice.customer}</p>
            <span className="rounded-md bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 text-[10px] mt-1 inline-block">
              {invoice.type} Channel
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted">Total:</span>
            <p className="text-lg font-bold font-mono text-default mt-0.5">{invoice.amount}</p>
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                invoice.payment === 'PAID'
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : invoice.payment === 'PARTIAL'
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-red-500/15 text-red-600'
              }`}
            >
              {invoice.payment}
            </span>
          </div>
        </div>

        <div className="space-y-2 border border-default rounded-xl p-3 text-xs">
          <h4 className="font-bold text-default text-xs mb-1">Itemized Breakdown</h4>
          <div className="flex justify-between py-1.5 border-b border-default/50 text-[11px]">
            <span>Infrared Cooker IR-101 (Commercial Grade) × 4</span>
            <span className="font-mono font-semibold">৳ 12,000</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-default/50 text-[11px]">
            <span>Toughened Glass Top Replacement Plate × 2</span>
            <span className="font-mono font-semibold">৳ 2,000</span>
          </div>
          <div className="flex justify-between pt-2 font-bold text-default text-xs">
            <span>Total Payable</span>
            <span className="font-mono">{invoice.amount}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Custom Date Range Modal ────────────────────────────────────
export function CustomDateRangeModal({
  isOpen,
  onClose,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (start: string, end: string) => void;
}) {
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-17');

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Filter Production Period"
      subtitle="Select custom date range for trend analysis"
      size="sm"
      icon={
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Calendar className="size-4" />
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onApply(startDate, endDate);
              onClose();
            }}
          >
            Apply Filter
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <FormGroup label="From Date">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="To Date">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </FormGroup>
      </div>
    </Modal>
  );
}

// ── Worker Detail Modal ─────────────────────────────────────────
export function WorkerDetailModal({
  isOpen,
  onClose,
  worker,
}: {
  isOpen: boolean;
  onClose: () => void;
  worker: {
    initials: string;
    name: string;
    output: string;
    rate: number;
    badge: string;
    color: string;
  } | null;
}) {
  if (!worker) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={worker.name}
      subtitle="Floor Operator Performance Profile"
      size="md"
      icon={
        <div className="flex size-8 items-center justify-center rounded-full bg-surface-sunken font-bold text-xs border border-default">
          {worker.initials}
        </div>
      }
      footer={
        <div className="flex items-center justify-end w-full">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-default bg-surface-sunken p-3.5">
            <span className="text-muted text-xs">Today's Output</span>
            <p className="text-2xl font-bold font-mono text-default mt-1">{worker.output}</p>
          </div>
          <div className="rounded-xl border border-default bg-surface-sunken p-3.5">
            <span className="text-muted text-xs">Efficiency Score</span>
            <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">{worker.rate}%</p>
          </div>
        </div>

        <div className="rounded-xl border border-default p-3.5 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-default/50">
            <span className="text-muted">Assigned Line</span>
            <span className="font-semibold text-default">Line 01 — Precision Assembly</span>
          </div>
          <div className="flex justify-between py-1 border-b border-default/50">
            <span className="text-muted">Shift Schedule</span>
            <span className="font-semibold text-default">Morning Shift (08:00 - 16:30)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Piece-Rate Earnings</span>
            <span className="font-semibold text-default">৳ 1,450.00 (Standard Tier)</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Production Order Detail Modal ──────────────────────────────
export function ProductionOrderDetailModal({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    product: string;
    target: number;
    produced: number;
    progress: number;
    status: string;
  } | null;
}) {
  if (!order) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Manufacturing Run ${order.id}`}
      subtitle={order.product}
      size="md"
      icon={
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-4" />
        </div>
      }
      footer={
        <div className="flex items-center justify-end w-full">
          <Button variant="primary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-surface-sunken p-3.5 border border-default space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted">Yield Progress:</span>
            <span className="font-mono font-bold text-default">
              {order.produced} / {order.target} pcs ({order.progress}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface overflow-hidden border border-default">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${order.progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-default p-3.5 space-y-2 text-xs">
          <h4 className="font-bold text-default text-xs mb-1">Bill of Materials (BOM) Allocation</h4>
          <div className="flex justify-between py-1 border-b border-default/50 text-[11px]">
            <span>PCB Control Board (V3.2)</span>
            <span className="font-mono font-semibold">{order.target} units</span>
          </div>
          <div className="flex justify-between py-1 border-b border-default/50 text-[11px]">
            <span>Toughened Microcrystalline Glass Plate</span>
            <span className="font-mono font-semibold">{order.target} units</span>
          </div>
          <div className="flex justify-between py-1 text-[11px]">
            <span>Pure Copper Induction Coil (2200W)</span>
            <span className="font-mono font-semibold">{order.target} units</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
