import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

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
  const [salesFilter, setSalesFilter] = useState<'all' | 'DELIVERED' | 'CONFIRMED'>('all');

  const invoices = useMemo(() => [
    {
      id: 'INV-0715',
      customer: 'Rahman Electronics & Hardware',
      type: 'B2B' as const,
      amount: '৳ 14,000',
      status: 'DELIVERED',
      payment: 'PARTIAL',
      date: 'Today, 11:30 AM',
    },
    {
      id: 'INV-0716',
      customer: 'Md. Shahidul Islam',
      type: 'B2C' as const,
      amount: '৳ 1,750',
      status: 'DELIVERED',
      payment: 'PAID',
      date: 'Today, 01:15 PM',
    },
    {
      id: 'INV-0717',
      customer: 'Karim Trading Corporation',
      type: 'B2B' as const,
      amount: '৳ 59,500',
      status: 'CONFIRMED',
      payment: 'UNPAID',
      date: 'Today, 03:45 PM',
    },
    {
      id: 'INV-0718',
      customer: 'Chittagong Retail Storefront',
      type: 'B2B' as const,
      amount: '৳ 22,300',
      status: 'CONFIRMED',
      payment: 'PARTIAL',
      date: 'Yesterday',
    },
  ], []);

  const topProducts = [
    { name: 'Infrared Cooker IR-101', code: 'IR-101', units: 48, revenue: '৳ 144,000', trend: '+24%' },
    { name: 'Toughened Glass Top (30cm)', code: 'RAW-GLS-300', units: 35, revenue: '৳ 52,500', trend: '+15%' },
    { name: 'Infrared Stove IS-201', code: 'IS-201', units: 18, revenue: '৳ 72,000', trend: '+8%' },
    { name: 'Heat Regulator (Bi-metal)', code: 'RAW-REG-202', units: 28, revenue: '৳ 22,400', trend: '+12%' },
  ];

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
              ৳ 75,250
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              32 Transactions
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
              12 Orders
            </div>
            <span className="text-[10px] font-semibold text-muted">
              4 Ready for Delivery
            </span>
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
              ৳ 15,200
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Session Open
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
              ৳ 73,500
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              3 Invoices Unpaid
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
              5 Orders
            </div>
            <span className="text-[10px] font-semibold text-muted">
              ৳ 12,400 Today
            </span>
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
              8 Prospects
            </div>
            <span className="text-[10px] font-semibold text-muted">
              2 High Priority
            </span>
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
              <p className="text-[11px] text-muted">Track customer invoices and payment clearance</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-default bg-surface-sunken p-1 text-xs">
              <button
                type="button"
                onClick={() => setSalesFilter('all')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  salesFilter === 'all' ? 'bg-surface text-default shadow-2xs' : 'text-muted hover:text-default'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSalesFilter('DELIVERED')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  salesFilter === 'DELIVERED' ? 'bg-surface text-default shadow-2xs' : 'text-muted hover:text-default'
                }`}
              >
                Delivered
              </button>
              <button
                type="button"
                onClick={() => setSalesFilter('CONFIRMED')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  salesFilter === 'CONFIRMED' ? 'bg-surface text-default shadow-2xs' : 'text-muted hover:text-default'
                }`}
              >
                Confirmed
              </button>
            </div>
          </div>

          <div className="divide-y divide-default">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-surface-sunken/40 px-2 rounded-xl transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-default">{inv.customer}</span>
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
                    <div className="text-xs font-extrabold font-mono text-default">{inv.amount}</div>
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
            ))}
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
              <h3 className="text-sm font-bold text-default">Fast-Moving SKUs</h3>
              <span className="text-[10px] text-muted uppercase font-semibold">Today</span>
            </div>
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.code} className="flex items-center justify-between p-2 rounded-xl bg-surface-sunken/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-default truncate">{p.name}</span>
                    </div>
                    <div className="text-[10px] text-muted font-mono">{p.units} units sold • {p.code}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-default">{p.revenue}</div>
                    <span className="text-[10px] font-semibold text-emerald-500">{p.trend}</span>
                  </div>
                </div>
              ))}
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
