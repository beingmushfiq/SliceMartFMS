import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Warehouse,
  Boxes,
  AlertTriangle,
  ShoppingCart,
  Eye,
  ArrowRight,
  Truck,
  ArrowRightLeft,
} from 'lucide-react';
import type { OrderPOItem } from './DashboardModals';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../lib/format/currency';

interface InventoryDashboardViewProps {
  attentionItems: OrderPOItem[];
  onOpenOrderPO: (item: OrderPOItem) => void;
  onOpenReviewStock: (item: OrderPOItem) => void;
}

export const InventoryDashboardView: React.FC<InventoryDashboardViewProps> = ({
  attentionItems,
  onOpenOrderPO,
  onOpenReviewStock,
}) => {
  const { formatCurrency } = useCurrency();

  const { data: metrics } = useQuery({
    queryKey: ['tenant', 'dashboard', 'metrics'],
    queryFn: async () => {
      try {
        const res = await api.get<{
          data: {
            inventory: {
              total_valuation: number;
              low_stock_count: number;
            };
          };
        }>('/dashboard/metrics');
        return res.data.data;
      } catch {
        return null;
      }
    },
  });

  const stockMovements: Array<{
    id: string;
    type: string;
    item: string;
    qty: string;
    warehouse: string;
    time: string;
    status: string;
  }> = [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & INVENTORY GREETING
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-default font-sans">
              Warehouse & Stock Inventory
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Stock Audits Current
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Raw materials intake, warehouse storage, replenishment orders & goods receipt
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventory"
            className="flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-all shadow-2xs"
          >
            <ArrowRightLeft className="size-3.5 text-muted" />
            <span>Stock Transfer</span>
          </Link>
          <Link
            to="/purchasing"
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-600 to-orange-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:from-amber-500 hover:to-orange-500 transition-all"
          >
            <Truck className="size-3.5" />
            <span>Receive Inbound GRN</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 6-KPI INVENTORY STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: Total SKUs */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              TOTAL SKUS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Boxes className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              {metrics?.inventory?.total_valuation ? 'Live Catalog' : '0 SKUs'}
            </div>
            <span className="text-[10px] font-semibold text-muted">
              Active Facility
            </span>
          </div>
        </div>

        {/* KPI 2: Inventory Value */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              STOCK VALUATION
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Warehouse className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              {formatCurrency(metrics?.inventory?.total_valuation ?? 0)}
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Raw & Finished Goods
            </span>
          </div>
        </div>

        {/* KPI 3: Critical Out of Stock */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              OUT OF STOCK
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-red-500">
              {metrics?.inventory?.low_stock_count ?? 0} Items
            </div>
            <span className="text-[10px] font-semibold text-red-500">
              Immediate Reorder
            </span>
          </div>
        </div>

        {/* KPI 4: Low Stock Warnings */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              LOW STOCK
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-500">
              {attentionItems.length} Items
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              Below Safety Threshold
            </span>
          </div>
        </div>

        {/* KPI 5: Pending Inbound GRNs */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              PENDING GRN
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Truck className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              0 Shipments
            </div>
            <span className="text-[10px] font-semibold text-muted">
              Inbound Receiving
            </span>
          </div>
        </div>

        {/* KPI 6: Transfers in Transit */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              TRANSIT ORDERS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ArrowRightLeft className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              0 Transfers
            </div>
            <span className="text-[10px] font-semibold text-muted">
              Inter-facility Log
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. REORDER QUEUE & WAREHOUSE CAPACITY
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Reorder Queue */}
        <div className="lg:col-span-2 rounded-2xl border border-default bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-default">Immediate Replenishment Queue</h3>
              <p className="text-[11px] text-muted">Material items requiring urgent purchase orders</p>
            </div>
            <span className="rounded-full bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold">
              {attentionItems.length} Alerts
            </span>
          </div>

          <div className="divide-y divide-default">
            {attentionItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted">
                All inventory stock levels are within optimal thresholds
              </div>
            ) : (
              attentionItems.map((item) => {
                const isOutOfStock = item.currentStock <= 0;
                return (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-surface-sunken/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-default">{item.name}</span>
                        <span className="text-[10px] text-muted font-mono">({item.sku})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <span>Warehouse: <strong className="text-default">{item.warehouse}</strong></span>
                        <span>•</span>
                        <span>Stock: <strong className={isOutOfStock ? 'text-red-500' : 'text-amber-500'}>{item.currentStock} {item.unit}</strong></span>
                        <span>•</span>
                        <span>Min: {item.minThreshold}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenReviewStock(item)}
                        className="flex items-center gap-1 rounded-lg border border-default bg-surface px-2.5 py-1.5 text-xs font-semibold text-default hover:bg-surface-sunken transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="size-3 text-muted" />
                        <span>Review</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenOrderPO(item)}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="size-3" />
                        <span>Order PO</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            to="/inventory"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-3 border-t border-default"
          >
            <span>Open Complete Inventory Ledger</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Warehouse Capacity & Recent Movements */}
        <div className="rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-default pb-2">
              <h3 className="text-sm font-bold text-default">Warehouse Capacity</h3>
              <span className="text-[10px] text-muted uppercase font-semibold">Active Hubs</span>
            </div>

            <div className="space-y-4">
              {/* Primary Facility */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-default">Main Warehouse</span>
                  <span className="font-mono text-muted">Optimal</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: '45%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>General Stock</span>
                  <span>Operational Status</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/inventory"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-2 border-t border-default"
          >
            <span>Manage Warehouses & Bins</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. RECENT INBOUND RECEIPTS & INTERNAL MOVEMENTS
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-default bg-surface p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-default">Recent Stock Activity</h3>
            <p className="text-[11px] text-muted">Real-time ledger of inbound shipments and warehouse transfers</p>
          </div>
          <Link
            to="/inventory"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Movement History</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {stockMovements.length === 0 ? (
            <div className="col-span-full text-center py-6 text-xs text-muted font-sans">
              No recent stock movements or receipts recorded
            </div>
          ) : (
            stockMovements.map((move) => (
              <div key={move.id} className="p-3 rounded-xl border border-default bg-surface-sunken/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-surface px-1.5 py-0.5 text-[9px] font-mono font-bold text-primary border border-default">
                    {move.type}
                  </span>
                  <span className="text-[10px] text-muted font-mono">{move.time}</span>
                </div>
                <div className="text-xs font-bold text-default truncate">{move.item}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">{move.warehouse}</span>
                  <strong className="font-mono text-emerald-500">{move.qty}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
