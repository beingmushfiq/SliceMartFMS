import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Plus,
  FileText,
  Users,
  Store,
  ArrowRight,
  Eye,
  Inbox,
  Package,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../lib/format/currency';
import type { DashboardMetricsData, DashboardInvoiceItem } from '../../../types/api/dashboard';

interface FastProductItem {
  id: string | number;
  name: string;
  sku: string;
  sale_price: number | string;
}

export interface DashboardInvoice {
  id: string;
  customer: string;
  type: 'B2B' | 'B2C';
  amount: string;
  status: string;
  payment: string;
  date?: string;
}

interface SalesDashboardViewProps {
  onOpenInvoice?: (invoice: DashboardInvoice) => void;
}

export const SalesDashboardView: React.FC<SalesDashboardViewProps> = ({ onOpenInvoice }) => {
  const { formatCurrency } = useCurrency();
  const [salesFilter, setSalesFilter] = useState<'all' | 'DELIVERED' | 'CONFIRMED'>('all');

  const { data: metrics } = useQuery<DashboardMetricsData | null>({
    queryKey: ['tenant', 'dashboard', 'metrics'],
    queryFn: async () => {
      try {
        const res = await api.get<DashboardMetricsData | { data: DashboardMetricsData }>(
          '/dashboard/metrics'
        );
        const raw = res.data;
        if (raw && typeof raw === 'object') {
          if ('commercial' in raw) return raw as DashboardMetricsData;
          if (
            'data' in raw &&
            raw.data &&
            typeof raw.data === 'object' &&
            'commercial' in raw.data
          ) {
            return raw.data as DashboardMetricsData;
          }
        }
        return null;
      } catch {
        return null;
      }
    },
  });

  const { data: rawInvoices = [] } = useQuery<DashboardInvoiceItem[]>({
    queryKey: ['sales', 'dashboard-invoices-list'],
    queryFn: async () => {
      try {
        const res = await api.get<DashboardInvoiceItem[] | { data: DashboardInvoiceItem[] }>(
          '/sales/invoices?per_page=10'
        );
        const d = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        return Array.isArray(d) ? d : [];
      } catch {
        return [];
      }
    },
  });

  const { data: rawProducts = [] } = useQuery<FastProductItem[]>({
    queryKey: ['catalogue', 'fast-moving-products'],
    queryFn: async () => {
      try {
        const res = await api.get<FastProductItem[] | { data: FastProductItem[] }>(
          '/products?per_page=5'
        );
        const d = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        return Array.isArray(d) ? d : [];
      } catch {
        return [];
      }
    },
  });

  const invoices: DashboardInvoice[] = useMemo(() => {
    return rawInvoices.map((inv) => ({
      id: inv.invoice_number,
      customer: inv.customer?.name || 'Commercial Customer',
      type: 'B2B',
      amount: formatCurrency(Number(inv.total_amount) || 0),
      status: inv.status,
      payment: inv.payment_status || 'UNPAID',
      date:
        inv.invoice_date ||
        (inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Recent'),
    }));
  }, [rawInvoices, formatCurrency]);

  const filteredInvoices = useMemo(() => {
    if (salesFilter === 'all') return invoices;
    return invoices.filter((inv) => inv.status === salesFilter);
  }, [salesFilter, invoices]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & COMMERCIAL GREETING
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-default font-sans">
              Commercial & POS Operations
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Counter #01 Active
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Sales orders, invoices, retail counter register & storefront fulfillment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/sales"
            className="flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-all shadow-2xs"
          >
            <Plus className="size-3.5" />
            <span>New Order</span>
          </Link>
          <Link
            to="/pos"
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:from-emerald-500 hover:to-teal-500 transition-all"
          >
            <ShoppingCart className="size-3.5" />
            <span>Launch POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 6-KPI COMMERCIAL STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: Today's Sales */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              TODAY'S SALES
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              {metrics ? formatCurrency(metrics.commercial.today_revenue) : formatCurrency(0)}
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Month:{' '}
              {metrics ? formatCurrency(metrics.commercial.month_revenue) : formatCurrency(0)}
            </span>
          </div>
        </div>

        {/* KPI 2: Active Sales Orders */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              ACTIVE ORDERS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              {metrics ? `${metrics.commercial.active_orders} Orders` : '0 Orders'}
            </div>
            <span className="text-[10px] font-semibold text-muted">Active Fulfillment</span>
          </div>
        </div>

        {/* KPI 3: POS Terminal Drawer */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              POS DRAWER
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShoppingCart className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              {formatCurrency(0)}
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Terminal Active
            </span>
          </div>
        </div>

        {/* KPI 4: Pending Invoices */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              RECEIVABLES
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              {metrics
                ? formatCurrency(metrics.commercial.total_receivable_due)
                : formatCurrency(0)}
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              Outstanding Due
            </span>
          </div>
        </div>

        {/* KPI 5: Storefront Web Orders */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              STOREFRONT ECOM
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Store className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              0 Orders
            </div>
            <span className="text-[10px] font-semibold text-muted">Ecom Sync Online</span>
          </div>
        </div>

        {/* KPI 6: Active Leads */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              ACTIVE LEADS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              0 Prospects
            </div>
            <span className="text-[10px] font-semibold text-muted">Pipeline Ready</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SALES & INVOICES + TOP SELLING PRODUCTS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Invoices List with Interactive Quick View */}
        <div className="lg:col-span-2 rounded-2xl border border-default bg-surface p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-default">Recent Invoices & Receivables</h3>
              <p className="text-[11px] text-muted">
                Track customer invoices and payment clearance
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken p-1 text-xs">
              <button
                type="button"
                onClick={() => setSalesFilter('all')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  salesFilter === 'all'
                    ? 'bg-surface text-default shadow-2xs'
                    : 'text-muted hover:text-default'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSalesFilter('DELIVERED')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  salesFilter === 'DELIVERED'
                    ? 'bg-surface text-default shadow-2xs'
                    : 'text-muted hover:text-default'
                }`}
              >
                Delivered
              </button>
              <button
                type="button"
                onClick={() => setSalesFilter('CONFIRMED')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  salesFilter === 'CONFIRMED'
                    ? 'bg-surface text-default shadow-2xs'
                    : 'text-muted hover:text-default'
                }`}
              >
                Confirmed
              </button>
            </div>
          </div>

          <div className="divide-y divide-default">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-surface-sunken/40 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-default truncate">
                        {inv.customer}
                      </span>
                      <span className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-[9px] font-mono font-bold text-muted border border-default">
                        {inv.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted font-mono">
                      <span>{inv.id}</span>
                      <span>•</span>
                      <span>{inv.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-extrabold font-mono text-default">
                        {inv.amount}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          inv.payment === 'PAID'
                            ? 'text-emerald-500'
                            : inv.payment === 'PARTIAL'
                              ? 'text-amber-500'
                              : 'text-red-500'
                        }`}
                      >
                        {inv.payment}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenInvoice?.(inv)}
                      className="flex items-center gap-1 rounded-lg border border-default bg-surface px-2.5 py-1 text-xs font-semibold text-default hover:bg-surface-sunken transition-colors cursor-pointer shadow-2xs"
                    >
                      <Eye className="size-3 text-muted" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted text-xs flex flex-col items-center justify-center gap-2">
                <Inbox className="size-8 text-muted/50" />
                <p>No commercial invoices recorded.</p>
                <Link to="/sales" className="text-xs text-primary font-semibold hover:underline">
                  Create Commercial Invoice
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/sales"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-3 border-t border-default"
          >
            <span>Open All Sales Invoices</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Top Products / SKU Velocity */}
        <div className="rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-default pb-2">
              <h3 className="text-sm font-bold text-default">Catalogue SKUs</h3>
              <span className="text-[10px] text-muted uppercase font-semibold">Active Master</span>
            </div>
            <div className="space-y-3">
              {rawProducts.length > 0 ? (
                rawProducts.map((p) => (
                  <div
                    key={p.id || p.sku}
                    className="flex items-center justify-between p-2 rounded-xl bg-surface-sunken/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-default truncate">{p.name}</span>
                      </div>
                      <div className="text-[10px] text-muted font-mono">{p.sku}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-default">
                        {formatCurrency(Number(p.sale_price) || 0)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted text-xs flex flex-col items-center justify-center gap-2">
                  <Package className="size-8 text-muted/50" />
                  <p>No catalogue items recorded.</p>
                  <Link
                    to="/catalogue"
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Manage Catalogue
                  </Link>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/catalogue"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-2 border-t border-default"
          >
            <span>View Catalogue Master</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
