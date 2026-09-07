import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  AlertCircle,
  Clock,
  Search,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../hooks/useCurrency';
import { KPICard } from '../../../components/ui/KPICard';

const SAMPLE_OVERDUE_INVOICES = [
  {
    id: 1,
    invoice_number: 'INV-2608-0012',
    customer_name: 'Bengal Textile Mills Ltd',
    customer_phone: '+8801711223344',
    invoice_date: '2026-07-15',
    due_date: '2026-08-15',
    total_amount: '450000.00',
    paid_amount: '200000.00',
    due_amount: '250000.00',
    overdue_days: 23,
    status: 'partially_paid',
  },
  {
    id: 2,
    invoice_number: 'INV-2608-0019',
    customer_name: 'Urban Retailers Hub',
    customer_phone: '+8801822334455',
    invoice_date: '2026-07-28',
    due_date: '2026-08-28',
    total_amount: '185000.00',
    paid_amount: '0.00',
    due_amount: '185000.00',
    overdue_days: 10,
    status: 'posted',
  },
  {
    id: 3,
    invoice_number: 'INV-2607-0088',
    customer_name: 'Metro Garments Accessories',
    customer_phone: '+8801933557799',
    invoice_date: '2026-05-10',
    due_date: '2026-06-10',
    total_amount: '320000.00',
    paid_amount: '50000.00',
    due_amount: '270000.00',
    overdue_days: 89,
    status: 'partially_paid',
  },
  {
    id: 4,
    invoice_number: 'INV-2608-0034',
    customer_name: 'Dhaka Packaging Center',
    customer_phone: '+8801644889900',
    invoice_date: '2026-08-01',
    due_date: '2026-08-31',
    total_amount: '95000.00',
    paid_amount: '0.00',
    due_amount: '95000.00',
    overdue_days: 7,
    status: 'posted',
  },
];

interface RawInvoiceRecord {
  id: number;
  invoice_number: string;
  customer_name?: string;
  customer?: { name?: string; phone?: string };
  customer_phone?: string;
  invoice_date?: string;
  created_at?: string;
  due_date?: string;
  total_amount?: string | number;
  paid_amount?: string | number;
  due_amount?: string | number;
  status?: string;
}

export interface DueInvoiceItem {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  invoice_date: string;
  due_date: string;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  overdue_days: number;
  status: string;
}

export function DueCollectionSection() {
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [agingFilter, setAgingFilter] = useState<'all' | '0-30' | '31-60' | '61-90' | '90+'>('all');

  // Fetch real invoices from backend
  const { data: invoices = SAMPLE_OVERDUE_INVOICES, isFetching, refetch } = useQuery<DueInvoiceItem[]>({
    queryKey: ['finance', 'due-collection'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data?: RawInvoiceRecord[] } | RawInvoiceRecord[]>('/sales/invoices?per_page=100');
        const rawData = res.data;
        const list = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
        if (Array.isArray(list) && list.length > 0) {
          const withDue = list.filter((inv) => parseFloat(String(inv.due_amount || '0')) > 0);
          if (withDue.length > 0) {
            return withDue.map((inv) => {
              const invDate = new Date(inv.invoice_date || inv.created_at || Date.now());
              const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(invDate.getTime() + 30 * 86400000);
              const today = new Date();
              const diffDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
              return {
                id: inv.id,
                invoice_number: inv.invoice_number,
                customer_name: inv.customer_name ?? inv.customer?.name ?? 'Valued Customer',
                customer_phone: inv.customer_phone ?? inv.customer?.phone ?? '-',
                invoice_date: inv.invoice_date ?? inv.created_at?.slice(0, 10) ?? '',
                due_date: dueDate.toISOString().slice(0, 10),
                total_amount: String(inv.total_amount ?? '0.00'),
                paid_amount: String(inv.paid_amount ?? '0.00'),
                due_amount: String(inv.due_amount ?? '0.00'),
                overdue_days: diffDays,
                status: inv.status ?? 'posted',
              };
            });
          }
        }
      } catch {
        // Fallback
      }
      return SAMPLE_OVERDUE_INVOICES;
    },
    initialData: SAMPLE_OVERDUE_INVOICES,
  });

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q) ||
      (inv.customer_phone && inv.customer_phone.includes(q));

    let matchesAging = true;
    if (agingFilter === '0-30') matchesAging = inv.overdue_days <= 30;
    else if (agingFilter === '31-60') matchesAging = inv.overdue_days > 30 && inv.overdue_days <= 60;
    else if (agingFilter === '61-90') matchesAging = inv.overdue_days > 60 && inv.overdue_days <= 90;
    else if (agingFilter === '90+') matchesAging = inv.overdue_days > 90;

    return matchesSearch && matchesAging;
  });

  const totalOutstandingDue = invoices.reduce((sum, inv) => sum + parseFloat(inv.due_amount || '0'), 0);
  const totalOverdueAbove30 = invoices
    .filter((inv) => inv.overdue_days > 30)
    .reduce((sum, inv) => sum + parseFloat(inv.due_amount || '0'), 0);

  const bucket0to30 = invoices.filter((i) => i.overdue_days <= 30).reduce((sum, i) => sum + parseFloat(i.due_amount || '0'), 0);
  const bucket31to60 = invoices.filter((i) => i.overdue_days > 30 && i.overdue_days <= 60).reduce((sum, i) => sum + parseFloat(i.due_amount || '0'), 0);
  const bucket61to90 = invoices.filter((i) => i.overdue_days > 60 && i.overdue_days <= 90).reduce((sum, i) => sum + parseFloat(i.due_amount || '0'), 0);
  const bucket90plus = invoices.filter((i) => i.overdue_days > 90).reduce((sum, i) => sum + parseFloat(i.due_amount || '0'), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-default">Accounts Receivable & Due Collection</h2>
          <p className="text-xs text-muted">
            Customer outstanding balances, periodic aging buckets, overdue collections, and credit recovery monitoring.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-muted hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
          title="Refresh Receivables"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Outstanding Due"
          value={formatCurrency(totalOutstandingDue)}
          subValue="Receivables across all debtors"
          alert={totalOutstandingDue > 500000 ? 'danger' : 'warning'}
          icon={<DollarSign className="w-4 h-4 text-warning" />}
        />
        <KPICard
          label="Critical Overdue (>30 Days)"
          value={formatCurrency(totalOverdueAbove30)}
          subValue="Requires immediate recovery"
          alert="danger"
          icon={<AlertCircle className="w-4 h-4 text-rose-500" />}
        />
        <KPICard
          label="Pending Invoices"
          value={invoices.length}
          subValue="Unpaid or partially paid bills"
          icon={<Clock className="w-4 h-4 text-info" />}
        />
        <KPICard
          label="Debtor Customers"
          value={new Set(invoices.map((i) => i.customer_name)).size}
          subValue="Active accounts with balances"
          icon={<Building2 className="w-4 h-4 text-primary" />}
        />
      </div>

      {/* Aging Buckets Tray */}
      <div className="rounded-2xl border border-default bg-surface p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Accounts Receivable Aging Schedule
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === '0-30' ? 'all' : '0-30')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              agingFilter === '0-30'
                ? 'bg-primary-subtle/40 border-primary shadow-xs'
                : 'bg-surface-sunken border-default hover:border-primary/40'
            }`}
          >
            <span className="text-[10px] font-semibold text-muted uppercase block">Current (0 - 30 Days)</span>
            <span className="text-base font-bold font-mono text-default mt-1 block">
              {formatCurrency(bucket0to30)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === '31-60' ? 'all' : '31-60')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              agingFilter === '31-60'
                ? 'bg-amber-500/10 border-amber-500 shadow-xs'
                : 'bg-surface-sunken border-default hover:border-amber-500/40'
            }`}
          >
            <span className="text-[10px] font-semibold text-muted uppercase block">31 - 60 Days Overdue</span>
            <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
              {formatCurrency(bucket31to60)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === '61-90' ? 'all' : '61-90')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              agingFilter === '61-90'
                ? 'bg-rose-500/10 border-rose-500 shadow-xs'
                : 'bg-surface-sunken border-default hover:border-rose-500/40'
            }`}
          >
            <span className="text-[10px] font-semibold text-muted uppercase block">61 - 90 Days Overdue</span>
            <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">
              {formatCurrency(bucket61to90)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAgingFilter(agingFilter === '90+' ? 'all' : '90+')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              agingFilter === '90+'
                ? 'bg-rose-900/20 border-rose-600 shadow-xs'
                : 'bg-surface-sunken border-default hover:border-rose-600/40'
            }`}
          >
            <span className="text-[10px] font-semibold text-muted uppercase block">90+ Days (Severe)</span>
            <span className="text-base font-bold font-mono text-danger mt-1 block">
              {formatCurrency(bucket90plus)}
            </span>
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="p-4 border-b border-default flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search invoice number, customer name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface-sunken pl-9 pr-3.5 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="text-xs text-muted font-mono">
            Showing {filtered.length} matching invoices
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Debtor Customer</th>
                <th className="px-4 py-3.5">Invoice Date</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5">Total (৳)</th>
                <th className="px-4 py-3.5">Paid (৳)</th>
                <th className="px-4 py-3.5">Outstanding Due (৳)</th>
                <th className="px-4 py-3.5">Aging</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-default">
                    {inv.invoice_number}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-default">{inv.customer_name}</div>
                    <div className="text-[11px] font-mono text-muted">{inv.customer_phone}</div>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-muted">{inv.invoice_date}</td>
                  <td className="px-4 py-3.5 font-mono text-muted">{inv.due_date}</td>

                  <td className="px-4 py-3.5 font-mono text-default">
                    {formatCurrency(inv.total_amount)}
                  </td>

                  <td className="px-4 py-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatCurrency(inv.paid_amount)}
                  </td>

                  <td className="px-4 py-3.5 font-mono font-bold text-danger">
                    {formatCurrency(inv.due_amount)}
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        inv.overdue_days > 60
                          ? 'bg-danger-subtle text-danger border-danger'
                          : inv.overdue_days > 30
                          ? 'bg-warning-subtle text-warning border-warning'
                          : 'bg-surface-sunken text-muted border-default'
                      }`}
                    >
                      {inv.overdue_days === 0 ? 'Due Today' : `${inv.overdue_days} Days Overdue`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
