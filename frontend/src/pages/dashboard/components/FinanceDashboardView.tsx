import React from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Building2,
  Receipt,
  PieChart as PieChartIcon,
  CreditCard,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { DashboardInvoice } from './SalesDashboardView';
import type { DueCustomerItem } from './DashboardModals';

interface FinanceDashboardViewProps {
  onOpenDueItem?: (item: DueCustomerItem) => void;
  onOpenInvoice?: (invoice: DashboardInvoice) => void;
}

const CASH_FLOW_DATA = [
  { month: 'Mar', inflow: 620000, outflow: 480000 },
  { month: 'Apr', inflow: 710000, outflow: 530000 },
  { month: 'May', inflow: 830000, outflow: 610000 },
  { month: 'Jun', inflow: 790000, outflow: 580000 },
  { month: 'Jul', inflow: 910000, outflow: 670000 },
  { month: 'Aug', inflow: 950000, outflow: 710000 },
];

export const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({
  onOpenDueItem,
  onOpenInvoice,
}) => {

  const dueAccounts: DueCustomerItem[] = [
    {
      id: 'DUE-001',
      customer: 'Karim Trading Corporation',
      phone: '+880 1711-234567',
      dueAmount: '৳ 59,500',
      invoicesCount: 2,
      oldestInvoiceDays: 14,
      lastPaymentDate: '10 Aug 2026',
    },
    {
      id: 'DUE-002',
      customer: 'Modern Kitchen & Home Appliance',
      phone: '+880 1819-876543',
      dueAmount: '৳ 85,000',
      invoicesCount: 3,
      oldestInvoiceDays: 22,
      lastPaymentDate: '28 Jul 2026',
    },
    {
      id: 'DUE-003',
      customer: 'Rahman Electronics & Hardware',
      phone: '+880 1912-345678',
      dueAmount: '৳ 14,000',
      invoicesCount: 1,
      oldestInvoiceDays: 8,
      lastPaymentDate: '14 Aug 2026',
    },
    {
      id: 'DUE-004',
      customer: 'Dhaka Division Wholesale Agency',
      phone: '+880 1610-998877',
      dueAmount: '৳ 42,000',
      invoicesCount: 2,
      oldestInvoiceDays: 19,
      lastPaymentDate: '02 Aug 2026',
    },
  ];

  const expenseBreakdown = [
    { category: 'Raw Materials & Components', amount: '৳ 380,000', percent: 52, color: 'bg-blue-500' },
    { category: 'Factory Labor & Piece-Rate', amount: '৳ 195,000', percent: 27, color: 'bg-emerald-500' },
    { category: 'Machinery Power & Utilities', amount: '৳ 85,000', percent: 12, color: 'bg-amber-500' },
    { category: 'Courier & Shipping Logistics', amount: '৳ 65,000', percent: 9, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & GREETING
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-default font-sans">
              Finance & Accounts Command
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              General Ledger Audited
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Receivables collection, liquidity balance, operational expenses & capital assets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/finance?tab=due-collection"
            className="flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-all shadow-2xs"
          >
            <DollarSign className="size-3.5 text-muted" />
            <span>Due Ledger</span>
          </Link>
          <Link
            to="/finance"
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:from-emerald-500 hover:to-teal-500 transition-all"
          >
            <Coins className="size-3.5" />
            <span>Chart of Accounts</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 6-KPI FINANCIAL STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: Total Receivables Due */}
        <div className="rounded-2xl border-y border-r border-default border-l-4 border-l-amber-500 bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              RECEIVABLES DUE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <DollarSign className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 245,000
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              12 Active Accounts
            </span>
          </div>
        </div>

        {/* KPI 2: Today's Collection */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              COLLECTIONS TODAY
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 42,500
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              +18% vs Yesterday
            </span>
          </div>
        </div>

        {/* KPI 3: Monthly Revenue */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              MONTHLY REVENUE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Receipt className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 950,000
            </div>
            <span className="text-[10px] font-semibold text-muted">
              Target: ৳ 1,200,000
            </span>
          </div>
        </div>

        {/* KPI 4: Pending Payables */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              SUPPLIER PAYABLES
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <CreditCard className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 180,000
            </div>
            <span className="text-[10px] font-semibold text-muted">
              4 Vendor Invoices
            </span>
          </div>
        </div>

        {/* KPI 5: Liquidity Balance */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              LIQUID CASH & BANK
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
              <Coins className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 1.42M
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Prime Bank & Cash
            </span>
          </div>
        </div>

        {/* KPI 6: Fixed Assets Value */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              CAPITAL ASSETS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Building2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 8.45M
            </div>
            <span className="text-[10px] font-semibold text-muted">
              18 Factory Machines
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DUAL CHARTS & CASH FLOW TREND
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (8 cols): 6-Month Inflow vs Outflow Cash Trend */}
        <div className="lg:col-span-8 rounded-2xl border border-default bg-surface p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-default pb-3">
            <div>
              <h3 className="text-sm font-bold text-default">Enterprise Cash Flow Trend</h3>
              <p className="text-[11px] text-muted">6-month revenue inflow vs operating expense outflow</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Inflow (৳)
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                Outflow (৳)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CASH_FLOW_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cashOutflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.07} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.6 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.6 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-raised, #18181b)',
                    borderColor: 'var(--border-default, #27272a)',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#cashInflow)" />
                <Area type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#cashOutflow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (4 cols): Expense Allocation */}
        <div className="lg:col-span-4 rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-sm font-bold text-default">Expense Allocation</h3>
              <PieChartIcon className="size-4 text-muted" />
            </div>

            <div className="mt-4 space-y-3">
              {expenseBreakdown.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-default font-medium truncate">{item.category}</span>
                    <span className="font-mono font-bold text-default">{item.amount}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                  </div>
                  <span className="text-[10px] text-muted block text-right font-mono">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/finance?tab=expenses"
            className="flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-3 border-t border-default"
          >
            <span>View Full Expense Ledger</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. AGED RECEIVABLES & DUE COLLECTION TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-default bg-surface p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
          <div>
            <h3 className="text-sm font-bold text-default">High Priority Customer Receivables</h3>
            <p className="text-[11px] text-muted">Aged commercial credit requiring follow-up</p>
          </div>
          <Link
            to="/finance?tab=due-collection"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span>Open Due Ledger</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-default">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-sunken text-[10px] uppercase font-bold text-muted border-b border-default">
              <tr>
                <th className="px-3 py-2.5">CUSTOMER</th>
                <th className="px-3 py-2.5">PHONE</th>
                <th className="px-3 py-2.5">INVOICES</th>
                <th className="px-3 py-2.5">OLDEST AGE</th>
                <th className="px-3 py-2.5">DUE AMOUNT</th>
                <th className="px-3 py-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {dueAccounts.map((due) => (
                <tr
                  key={due.id}
                  className="hover:bg-surface-sunken/60 cursor-pointer transition-colors"
                  onClick={() => onOpenDueItem?.(due)}
                >
                  <td className="px-3 py-2.5 font-semibold text-default">{due.customer}</td>
                  <td className="px-3 py-2.5 font-mono text-muted">{due.phone}</td>
                  <td className="px-3 py-2.5 font-mono">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInvoice?.({
                          id: `INV-${due.id.slice(-3)}`,
                          customer: due.customer,
                          type: 'B2B',
                          amount: due.dueAmount,
                          status: 'CONFIRMED',
                          payment: 'UNPAID',
                        });
                      }}
                      className="text-primary hover:underline font-semibold cursor-pointer"
                      title="Quick view latest invoice"
                    >
                      {due.invoicesCount} Invoices
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        due.oldestInvoiceDays > 20
                          ? 'bg-red-500/15 text-red-600'
                          : due.oldestInvoiceDays > 10
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-blue-500/15 text-blue-600'
                      }`}
                    >
                      {due.oldestInvoiceDays} days overdue
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-amber-500">{due.dueAmount}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDueItem?.(due);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-[11px] font-semibold text-primary border border-default hover:bg-surface-sunken transition-colors"
                    >
                      <Eye className="size-3" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
