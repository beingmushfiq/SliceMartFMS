import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  PackageCheck,
  Clock,
  TrendingUp,
  Plus,
  Boxes,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../lib/format/currency';

interface PurchaseOrderItem {
  id: string | number;
  po_number: string;
  supplier?: { name: string };
  total_amount: number | string;
  status: string;
  order_date: string;
  items_count?: number;
}

interface RequisitionItem {
  id: string | number;
  requisition_number: string;
  department?: string;
  status: string;
  required_date?: string;
}

export const PurchasingDashboardView: React.FC = () => {
  const { formatCurrency } = useCurrency();

  // Query Recent POs
  const { data: purchaseOrders = [] } = useQuery<PurchaseOrderItem[]>({
    queryKey: ['purchasing', 'dashboard-orders'],
    queryFn: async () => {
      try {
        const res = await api.get<PurchaseOrderItem[] | { data: PurchaseOrderItem[] }>(
          '/purchasing/orders?per_page=6'
        );
        const d = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        return Array.isArray(d) ? d : [];
      } catch {
        return [];
      }
    },
  });

  // Query Requisitions
  const { data: requisitions = [] } = useQuery<RequisitionItem[]>({
    queryKey: ['purchasing', 'dashboard-requisitions'],
    queryFn: async () => {
      try {
        const res = await api.get<RequisitionItem[] | { data: RequisitionItem[] }>(
          '/purchasing/requisitions?per_page=5'
        );
        const d = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        return Array.isArray(d) ? d : [];
      } catch {
        return [];
      }
    },
  });

  const totalPoSpend = useMemo(() => {
    return purchaseOrders.reduce((acc, po) => acc + (Number(po.total_amount) || 0), 0);
  }, [purchaseOrders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & GREETING
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-default font-sans">
              Procurement & SCM Command
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Vendor Channels Active
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Material requisitions, supplier purchase orders, goods receipt notes (GRN) & vendor bills
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/purchasing"
            className="flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-all shadow-2xs"
          >
            <Boxes className="size-3.5 text-muted" />
            <span>Requisitions</span>
          </Link>
          <Link
            to="/purchasing"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-fg shadow-xs hover:bg-primary/90 transition-all"
          >
            <Plus className="size-3.5" />
            <span>Create PO</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4-CARD METRIC STRIP (RESPONSIVE)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              OPEN PURCHASE ORDERS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingCart className="size-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default">
              {purchaseOrders.length}
            </div>
            <span className="text-[10px] text-muted">Awaiting fulfillment</span>
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              PENDING REQUISITIONS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default">
              {requisitions.length}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              Requires department review
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              GOODS RECEIPTS (GRN)
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <PackageCheck className="size-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default">
              0
            </div>
            <span className="text-[10px] text-muted">Intake awaiting inspection</span>
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              PO PIPELINE VALUE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default truncate">
              {formatCurrency(totalPoSpend)}
            </div>
            <span className="text-[10px] text-muted">Active commitment</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RECENT PURCHASE ORDERS & REQUISITIONS TABLE (RESPONSIVE)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PO Table (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-default bg-surface p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-default pb-3">
            <div>
              <h3 className="text-sm font-bold text-default">Active Purchase Orders</h3>
              <p className="text-[11px] text-muted">Vendor contracts and material order dispatches</p>
            </div>
            <Link to="/purchasing" className="text-xs font-semibold text-primary hover:underline">
              View all orders
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-default w-full">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-surface-sunken text-[10px] uppercase font-bold text-muted border-b border-default">
                <tr>
                  <th className="px-3.5 py-2.5">PO NUMBER</th>
                  <th className="px-3.5 py-2.5">VENDOR</th>
                  <th className="px-3.5 py-2.5">DATE</th>
                  <th className="px-3.5 py-2.5 text-right">TOTAL</th>
                  <th className="px-3.5 py-2.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted text-xs">
                      No active purchase orders registered yet.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-surface-sunken/60 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono font-bold text-primary">
                        {po.po_number}
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-default">
                        {po.supplier?.name || 'Authorized Supplier'}
                      </td>
                      <td className="px-3.5 py-2.5 text-muted font-mono">{po.order_date}</td>
                      <td className="px-3.5 py-2.5 font-mono font-semibold text-default text-right">
                        {formatCurrency(Number(po.total_amount) || 0)}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                          <span className="size-1 rounded-full bg-current" />
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requisitions Queue (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-default bg-surface p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-default pb-3">
            <div>
              <h3 className="text-sm font-bold text-default">Requisitions Queue</h3>
              <p className="text-[11px] text-muted">Internal plant material requests</p>
            </div>
            <Link to="/purchasing" className="text-xs font-semibold text-primary hover:underline">
              Review
            </Link>
          </div>

          <div className="space-y-2.5">
            {requisitions.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted">
                No requisitions awaiting approval
              </div>
            ) : (
              requisitions.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-default bg-surface-sunken/30 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-primary">
                      {req.requisition_number}
                    </span>
                    <span className="rounded-md bg-amber-500/10 text-amber-600 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-default font-medium">
                    {req.department || 'Production Assembly'}
                  </div>
                  {req.required_date && (
                    <div className="text-[10px] text-muted font-mono">
                      Needed: {req.required_date}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
