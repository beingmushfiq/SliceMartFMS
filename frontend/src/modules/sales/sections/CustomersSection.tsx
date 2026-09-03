import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Award,
  Users,
  TrendingUp,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { CustomerCrm } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../hooks/useCurrency';

const SAMPLE_CUSTOMERS: CustomerCrm[] = [
  {
    id: 1,
    uuid: 'cust-001',
    name: 'Bengal Textile Mills Ltd',
    type: 'corporate',
    email: 'accounts@bengaltextile.com',
    phone: '+8801711223344',
    address: 'Plot 42, Sector 7, Uttara Commercial Area',
    city: 'Dhaka',
    credit_limit: '1000000.00',
    current_balance: '345000.00',
    loyalty_points: 1420,
    total_orders_count: 28,
    lifetime_value: '3850000.00',
    status: 'active',
    created_at: '2025-11-12',
  },
  {
    id: 2,
    uuid: 'cust-002',
    name: 'Chittagong Packaging Solutions',
    type: 'wholesale',
    email: 'procure@ctgpackaging.com',
    phone: '+8801819988776',
    address: '102 Agrabad Commercial Area',
    city: 'Chittagong',
    credit_limit: '500000.00',
    current_balance: '120000.00',
    loyalty_points: 860,
    total_orders_count: 14,
    lifetime_value: '1920000.00',
    status: 'active',
    created_at: '2026-01-18',
  },
  {
    id: 3,
    uuid: 'cust-003',
    name: 'Apex Footwear Dealer Network',
    type: 'dealer',
    email: 'distribution@apexdealer.bd',
    phone: '+8801912345678',
    address: 'Shafipur, Kaliakair',
    city: 'Gazipur',
    credit_limit: '1500000.00',
    current_balance: '820000.00',
    loyalty_points: 3100,
    total_orders_count: 52,
    lifetime_value: '7400000.00',
    status: 'active',
    created_at: '2025-08-04',
  },
  {
    id: 4,
    uuid: 'cust-004',
    name: 'Kazi Super Mart (Gulshan-2)',
    type: 'retail',
    email: 'manager@kazimart.com',
    phone: '+8801611122233',
    address: 'House 14, Road 113, Gulshan-2',
    city: 'Dhaka',
    credit_limit: '150000.00',
    current_balance: '0.00',
    loyalty_points: 450,
    total_orders_count: 9,
    lifetime_value: '420000.00',
    status: 'active',
    created_at: '2026-04-10',
  },
  {
    id: 5,
    uuid: 'cust-005',
    name: 'Al-Madina Trading & Distribution',
    type: 'wholesale',
    email: 'info@almadinatrading.com',
    phone: '+8801733445566',
    address: 'Khatunganj Commercial Street',
    city: 'Chittagong',
    credit_limit: '300000.00',
    current_balance: '298000.00',
    loyalty_points: 120,
    total_orders_count: 4,
    lifetime_value: '310000.00',
    status: 'blocked',
    created_at: '2026-03-01',
  },
];

interface PartyRaw {
  id: number;
  uuid?: string;
  name: string;
  customer_tier?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  credit_limit?: string | null;
  current_balance?: string | null;
  loyalty_points?: number;
  total_orders_count?: number;
  lifetime_value?: string | null;
  status?: string;
  created_at?: string | null;
}

export function CustomersSection() {
  const queryClient = useQueryClient();
  const { currencyCode, formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCrm | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: 'retail' | 'wholesale' | 'dealer' | 'corporate';
    email: string;
    phone: string;
    address: string;
    city: string;
    credit_limit: string;
    status: 'active' | 'inactive' | 'blocked';
  }>({
    name: '',
    type: 'retail',
    email: '',
    phone: '',
    address: '',
    city: 'Dhaka',
    credit_limit: '100000',
    status: 'active',
  });

  const { data: customers = SAMPLE_CUSTOMERS, isFetching, refetch } = useQuery<CustomerCrm[]>({
    queryKey: ['sales', 'customers'],
    queryFn: async () => {
      try {
        const res = await api.get<PartyRaw[]>('/parties?type=customer');
        if (res.data && res.data.length > 0) {
          const rawList = res.data as PartyRaw[];
          return rawList.map((p) => {
            const validTier = (['retail', 'wholesale', 'dealer', 'corporate'].includes(p.customer_tier || '')
              ? p.customer_tier
              : 'retail') as 'retail' | 'wholesale' | 'dealer' | 'corporate';
            const validStatus = (['active', 'inactive', 'blocked'].includes(p.status || '')
              ? p.status
              : 'active') as 'active' | 'inactive' | 'blocked';

            return {
              id: p.id,
              uuid: p.uuid ?? `cust-${p.id}`,
              name: p.name,
              type: validTier,
              email: p.email ?? null,
              phone: p.phone ?? '',
              address: p.address ?? null,
              city: p.city ?? 'Dhaka',
              credit_limit: p.credit_limit ?? '100000.00',
              current_balance: p.current_balance ?? '0.00',
              loyalty_points: p.loyalty_points ?? 0,
              total_orders_count: p.total_orders_count ?? 1,
              lifetime_value: p.lifetime_value ?? '0.00',
              status: validStatus,
              created_at: p.created_at?.slice(0, 10) ?? '2026-01-01',
            };
          });
        }
      } catch {
        // Fallback to sample customers
      }
      return SAMPLE_CUSTOMERS;
    },
    initialData: SAMPLE_CUSTOMERS,
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: CustomerCrm = {
      id: Date.now(),
      uuid: `cust-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      email: formData.email || null,
      phone: formData.phone,
      address: formData.address || null,
      city: formData.city || null,
      credit_limit: formData.credit_limit || '0.00',
      current_balance: '0.00',
      loyalty_points: 0,
      total_orders_count: 0,
      lifetime_value: '0.00',
      status: formData.status,
      created_at: new Date().toISOString().slice(0, 10),
    };

    queryClient.setQueryData<CustomerCrm[]>(['sales', 'customers'], (prev = []) => [newCustomer, ...prev]);
    toast.success('Customer registered successfully.');
    setShowCreateModal(false);
    setFormData({
      name: '',
      type: 'retail',
      email: '',
      phone: '',
      address: '',
      city: 'Dhaka',
      credit_limit: '100000',
      status: 'active',
    });
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      c.phone.includes(search) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalReceivables = customers.reduce(
    (sum, c) => sum + parseFloat(c.current_balance || '0'),
    0
  );

  const totalLifetimeSales = customers.reduce(
    (sum, c) => sum + parseFloat(c.lifetime_value || '0'),
    0
  );

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Total Accounts (CRM)
            </span>
            <div className="p-2 rounded-xl bg-primary-subtle text-primary border border-primary/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-default">
            {customers.length}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            {customers.filter((c) => c.status === 'active').length} active buying accounts
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Outstanding Receivables (A/R)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatCurrency(totalReceivables)}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Pending customer collections
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Cumulative Customer LTV
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalLifetimeSales)}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Total lifetime billed revenue
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Loyalty Rewards Outstanding
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {customers.reduce((sum, c) => sum + c.loyalty_points, 0).toLocaleString()} Pts
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Redeemable against store orders
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search customers by name, phone, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface pl-9 pr-3.5 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="corporate">Corporate</option>
            <option value="dealer">Dealer</option>
            <option value="wholesale">Wholesale</option>
            <option value="retail">Retail</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked / Over-limit</option>
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-muted hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
            title="Refresh Customers"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Customer Profile</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Customer Name & Contact</th>
                <th className="px-4 py-3.5">Account Tier</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Credit Limit</th>
                <th className="px-4 py-3.5">Current Balance</th>
                <th className="px-4 py-3.5">Lifetime Billed</th>
                <th className="px-4 py-3.5">Loyalty Points</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Ledger & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted">
                    No customer accounts found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-default">{c.name}</div>
                      <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                        {c.email && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {c.email}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 capitalize">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-sunken border border-default">
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{c.city || 'Dhaka'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs">
                      {formatCurrency(c.credit_limit)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold">
                      <span
                        className={
                          parseFloat(c.current_balance || '0') > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-default'
                        }
                      >
                        {formatCurrency(c.current_balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.lifetime_value)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {c.loyalty_points} pts
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : c.status === 'blocked'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-surface-sunken text-muted border border-default'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowLedgerModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-default bg-surface-sunken px-2.5 py-1 text-[11px] font-medium text-default hover:bg-surface transition-colors cursor-pointer"
                      >
                        <FileText className="h-3 w-3 text-primary" />
                        <span>Ledger</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Ledger Modal */}
      {showLedgerModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <div>
                <h3 className="text-base font-bold text-default">{selectedCustomer.name}</h3>
                <div className="text-xs text-muted">
                  Customer Statement & Financial Ledger ({selectedCustomer.type.toUpperCase()} ACCOUNT)
                </div>
              </div>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="text-muted hover:text-default cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-sunken border border-default text-xs">
              <div>
                <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Credit Limit</p>
                <p className="text-base font-bold font-mono text-default mt-0.5">
                  {formatCurrency(selectedCustomer.credit_limit)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-default bg-surface-sunken">
                <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Current Balance</p>
                <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatCurrency(selectedCustomer.current_balance)}
                </p>
              </div>
              <div>
                <div className="text-muted text-[10px] uppercase font-semibold">Total Orders</div>
                <div className="font-mono font-bold text-default mt-0.5">
                  {selectedCustomer.total_orders_count} Orders Completed
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-default">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-sunken text-muted uppercase text-[10px] border-b border-default">
                  <tr>
                    <th className="px-3.5 py-2.5">Date</th>
                    <th className="px-3.5 py-2.5">Reference</th>
                    <th className="px-3.5 py-2.5">Transaction Type</th>
                    <th className="px-3.5 py-2.5 text-right">Debit (Invoice)</th>
                    <th className="px-3.5 py-2.5 text-right">Credit (Receipt)</th>
                    <th className="px-3.5 py-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default font-mono text-[11px]">
                  <tr>
                    <td className="px-3.5 py-2.5 text-muted">2026-08-10</td>
                    <td className="px-3.5 py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">INV-2026-0042</td>
                    <td className="px-3.5 py-2.5 text-default">Sales Tax Invoice</td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-default">{formatCurrency(150000)}</td>
                    <td className="px-3.5 py-2.5 text-right text-muted">-</td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400">{formatCurrency(150000)}</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 text-muted">2026-08-15</td>
                    <td className="px-3.5 py-2.5 text-sky-600 dark:text-sky-400 font-semibold">REC-2026-0089</td>
                    <td className="px-3.5 py-2.5 text-default">Bank Wire Receipt (BRAC Bank)</td>
                    <td className="px-3.5 py-2.5 text-right text-muted">-</td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(150000)}</td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(0)}</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 text-muted">2026-08-25</td>
                    <td className="px-3.5 py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">INV-2026-0098</td>
                    <td className="px-3.5 py-2.5 text-default">Sales Tax Invoice</td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-default">
                      {formatCurrency(selectedCustomer.current_balance)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-muted">-</td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(selectedCustomer.current_balance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-default">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-default bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-base font-bold text-default">Create Customer Account (CRM)</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-default cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Footwear Ltd"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Account Classification *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'retail' | 'wholesale' | 'dealer' | 'corporate',
                      })
                    }
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                  >
                    <option value="retail">Retail Buyer</option>
                    <option value="wholesale">Wholesale Buyer</option>
                    <option value="dealer">Authorized Dealer</option>
                    <option value="corporate">Corporate Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Primary Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+8801700000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="billing@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    City / Division
                  </label>
                  <input
                    type="text"
                    placeholder="Dhaka, Chittagong..."
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-default mb-1">
                    Approved Credit Limit ({currencyCode})
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Billing & Delivery Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street address, factory location, or warehouse delivery point..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-default px-4 py-2 text-muted hover:bg-surface-sunken hover:text-default transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
