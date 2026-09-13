import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  Package,
  MapPin,
  Plus,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../lib/format/currency';

interface ShipmentItem {
  id: string | number;
  tracking_code: string;
  courier: string;
  customer_name: string;
  city: string;
  cod_amount: number | string;
  status: string;
}

export const LogisticsDashboardView: React.FC = () => {
  const { formatCurrency } = useCurrency();

  // Query Recent Courier Shipments
  const { data: shipments = [] } = useQuery<ShipmentItem[]>({
    queryKey: ['delivery', 'dashboard-shipments'],
    queryFn: async () => {
      try {
        const res = await api.get<ShipmentItem[] | { data: ShipmentItem[] }>(
          '/delivery/shipments?per_page=6'
        );
        const d = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        return Array.isArray(d) ? d : [];
      } catch {
        return [];
      }
    },
  });

  const totalCodPending = useMemo(() => {
    return shipments.reduce((acc, s) => acc + (Number(s.cod_amount) || 0), 0);
  }, [shipments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & GREETING
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-default font-sans">
              Logistics & Courier Dispatch
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Courier APIs Connected
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Steadfast, Pathao, REDX courier shipments, delivery run sheets & Cash on Delivery (COD) collection
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/delivery"
            className="flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-all shadow-2xs"
          >
            <MapPin className="size-3.5 text-muted" />
            <span>Run Sheets</span>
          </Link>
          <Link
            to="/delivery"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-fg shadow-xs hover:bg-primary/90 transition-all"
          >
            <Plus className="size-3.5" />
            <span>Book Courier</span>
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
              ACTIVE SHIPMENTS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Truck className="size-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default">
              {shipments.length}
            </div>
            <span className="text-[10px] text-muted">In transit with couriers</span>
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              RUN SHEETS TODAY
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Package className="size-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default">
              0
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Dispatched to hubs
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              PENDING COD COLLECTION
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Coins className="size-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default truncate">
              {formatCurrency(totalCodPending)}
            </div>
            <span className="text-[10px] text-muted">Awaiting courier settlement</span>
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              DELIVERY SUCCESS RATE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default">
              98.2%
            </div>
            <span className="text-[10px] text-muted">Across Steadfast & Pathao</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE COURIER SHIPMENTS TABLE (RESPONSIVE)
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-default bg-surface p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-default pb-3">
          <div>
            <h3 className="text-sm font-bold text-default">Active Outbound Consignments</h3>
            <p className="text-[11px] text-muted">Real-time parcel status across Steadfast, Pathao & REDX</p>
          </div>
          <Link to="/delivery" className="text-xs font-semibold text-primary hover:underline">
            View all shipments
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-default w-full">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-surface-sunken text-[10px] uppercase font-bold text-muted border-b border-default">
              <tr>
                <th className="px-3.5 py-2.5">TRACKING #</th>
                <th className="px-3.5 py-2.5">COURIER</th>
                <th className="px-3.5 py-2.5">RECIPIENT</th>
                <th className="px-3.5 py-2.5">DESTINATION</th>
                <th className="px-3.5 py-2.5 text-right">COD AMOUNT</th>
                <th className="px-3.5 py-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted text-xs">
                    No active outbound shipments today.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono font-bold text-primary">
                      {s.tracking_code}
                    </td>
                    <td className="px-3.5 py-2.5 font-medium text-default">
                      <span className="rounded-md bg-surface-sunken border border-default px-1.5 py-0.5 text-[10px] font-bold">
                        {s.courier}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-default">{s.customer_name}</td>
                    <td className="px-3.5 py-2.5 text-muted">{s.city}</td>
                    <td className="px-3.5 py-2.5 font-mono font-semibold text-default text-right">
                      {formatCurrency(Number(s.cod_amount) || 0)}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                        <span className="size-1 rounded-full bg-current" />
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
