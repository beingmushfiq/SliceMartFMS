import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Plus, RefreshCw, Search, XCircle, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import type { SalesOrder } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/document/formatters';

export function SalesOrdersSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Order Form state
  const [channel, setChannel] = useState<'counter' | 'dealer' | 'phone' | 'field' | 'online'>(
    'dealer'
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items] = useState<
    Array<{ product_id: number; quantity: string; unit_id: number; unit_price: string }>
  >([{ product_id: 1, quantity: '1.0000', unit_id: 1, unit_price: '100.0000' }]);

  const { data: orders = [], isLoading, isFetching, refetch } = useQuery<SalesOrder[]>({
    queryKey: ['sales', 'orders'],
    queryFn: async () => {
      const res = await api.get<SalesOrder[]>('/sales/orders');
      return res.data ?? [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await api.post(`/sales/orders/${orderId}/approve`, {});
    },
    onSuccess: () => {
      toast.success('Sales order confirmed successfully.');
      queryClient.invalidateQueries({ queryKey: ['sales', 'orders'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm sales order');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      await api.post('/sales/orders', {
        channel,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        order_date: orderDate,
        notes: notes || undefined,
        items,
      });
    },
    onSuccess: () => {
      toast.success('Sales order created.');
      setShowCreateModal(false);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['sales', 'orders'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create sales order');
    },
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate();
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.channel?.toLowerCase().includes(search.toLowerCase());

    const matchesChannel = channelFilter === 'all' || o.channel === channelFilter;

    return matchesSearch && matchesChannel;
  });

  const getStatusBadge = (status: SalesOrder['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="h-3 w-3 text-blue-400" /> Confirmed
          </span>
        );
      case 'allocated':
      case 'picking':
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="h-3 w-3 text-amber-400 animate-spin" /> {status}
          </span>
        );
      case 'dispatched':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {status}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 text-rose-400" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-surface-sunken text-muted border border-default">
            {status}
          </span>
        );
    }
  };

  const getChannelBadge = (ch: SalesOrder['channel']) => {
    switch (ch) {
      case 'counter':
        return <span className="text-muted font-medium">Counter POS</span>;
      case 'dealer':
        return <span className="text-blue-500 font-medium">B2B Dealer</span>;
      case 'phone':
        return <span className="text-purple-500 font-medium">Telesales</span>;
      case 'field':
        return <span className="text-amber-500 font-medium">Field DSR</span>;
      case 'online':
        return <span className="text-emerald-500 font-medium">E-Commerce</span>;
      default:
        return <span className="text-muted">{ch}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by order #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-xl border border-default bg-surface-sunken pl-8 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="h-9 rounded-xl border border-default bg-surface-sunken px-3 text-xs text-default focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="dealer">B2B Dealer</option>
            <option value="counter">Counter POS</option>
            <option value="phone">Telesales</option>
            <option value="field">Field DSR</option>
            <option value="online">E-Commerce</option>
          </select>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 text-xs font-medium text-muted hover:bg-surface hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-medium text-primary-fg hover:opacity-90 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          New Sales Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Order Number</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="size-5 animate-spin text-primary" />
                      <span>Loading sales orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingCart className="size-8 text-muted/50" />
                      <span className="font-medium">No sales orders found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3.5 text-muted">{order.order_date}</td>
                    <td className="px-4 py-3.5">{getChannelBadge(order.channel)}</td>
                    <td className="px-4 py-3.5 text-default font-medium">
                      {order.customer_name ?? 'Walk-in / Direct'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      {formatCurrency(order.total_amount, '৳')}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : order.payment_status === 'partially_paid'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {order.status === 'draft' && (
                        <button
                          onClick={() => approveMutation.mutate(order.id)}
                          disabled={approveMutation.isPending}
                          className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {approveMutation.isPending ? 'Confirming...' : 'Confirm'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-xl">
            <h3 className="text-base font-semibold text-default">Create New Sales Order</h3>
            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-default mb-1">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as typeof channel)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="dealer">Dealer</option>
                  <option value="counter">Counter</option>
                  <option value="phone">Phone</option>
                  <option value="field">Field</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-default mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Retail Partner A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-default mb-1">Customer Phone</label>
                <input
                  type="text"
                  placeholder="+8801700000000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-default mb-1">Order Date</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-default mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional delivery instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-default px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-sunken hover:text-default transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-primary-fg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
