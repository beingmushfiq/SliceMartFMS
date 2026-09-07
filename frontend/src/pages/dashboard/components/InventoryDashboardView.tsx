import React from 'react';
import { Link } from 'react-router-dom';
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
  const stockMovements = [
    {
      id: 'TR-0891',
      type: 'INBOUND GRN',
      item: 'Copper Wiring Rolls (500m)',
      qty: '+200 pcs',
      warehouse: 'Warehouse A (Raw)',
      time: '12m ago',
      status: 'VERIFIED',
    },
    {
      id: 'TR-0890',
      type: 'INTERNAL TRANSFER',
      item: 'Infrared Cooker IR-101 (Finished)',
      qty: '48 pcs',
      warehouse: 'WH-A → WH-B',
      time: '45m ago',
      status: 'IN TRANSIT',
    },
    {
      id: 'TR-0889',
      type: 'MATERIAL ISSUE',
      item: 'PCB Control Board',
      qty: '-50 pcs',
      warehouse: 'Floor Line 1',
      time: '2h ago',
      status: 'ISSUED',
    },
    {
      id: 'TR-0888',
      type: 'INBOUND GRN',
      item: 'Toughened Glass Top (30cm)',
      qty: '+150 pcs',
      warehouse: 'Warehouse A (Raw)',
      time: '3h ago',
      status: 'VERIFIED',
    },
  ];

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
              489 SKUs
            </div>
            <span className="text-[10px] font-semibold text-muted">
              2 Active Facilities
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
              ৳ 14.6M
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
              1 Item
            </div>
            <span className="text-[10px] font-semibold text-red-500">
              PCB Control Board
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
              2 Items
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              Glass Top & Regulator
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
              3 Shipments
            </div>
            <span className="text-[10px] font-semibold text-muted">
              Apex Industrial / Vendor
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
              2 Transfers
            </div>
            <span className="text-[10px] font-semibold text-muted">
              WH-A → WH-B
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
              Action Required
            </span>
          </div>

          <div className="divide-y divide-default">
            {attentionItems.map((item) => {
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
            })}
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
              {/* WH-A */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-default">Warehouse A (Raw Materials)</span>
                  <span className="font-mono text-muted">72% Full</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: '72%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>15 Raw Categories</span>
                  <span>4,200 / 5,800 cu.m</span>
                </div>
              </div>

              {/* WH-B */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-default">Warehouse B (Finished Goods)</span>
                  <span className="font-mono text-muted">48% Full</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '48%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>482 Packaged Units</span>
                  <span>482 / 1,000 Pallets</span>
                </div>
              </div>

              {/* WH-C */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-default">Cold Storage / Spares</span>
                  <span className="font-mono text-muted">24% Full</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: '24%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>Electronic Sub-assemblies</span>
                  <span>Optimal Environment</span>
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
          {stockMovements.map((move) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};
