import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Plus, RefreshCw, Search, Truck, XCircle } from 'lucide-react';
import type { SalesOrder } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';

export function SalesOrdersSection() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get<SalesOrder[]>('/sales/orders');
      setOrders(res.data ?? []);
    } catch (err) {
      console.error('Failed to load sales orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    api.get<SalesOrder[]>('/sales/orders')
      .then((res) => {
        if (!ignore) setOrders(res.data ?? []);
      })
      .catch((err) => {
        console.error('Failed to load sales orders', err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleApprove = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await api.post(`/sales/orders/${orderId}/approve`, {});
      await fetchOrders();
    } catch (err) {
      console.error('Failed to approve sales order', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/sales/orders', {
        channel,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        order_date: orderDate,
        notes: notes || undefined,
        items,
      });
      setShowCreateModal(false);
      // reset form
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      await fetchOrders();
    } catch (err) {
      console.error('Failed to create sales order', err);
    } finally {
      setLoading(false);
    }
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-surface-sunken text-muted border border-default">
            <Clock className="size-3 text-muted" /> Draft
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" /> Confirmed
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Truck className="size-3 text-indigo-600 dark:text-indigo-400" /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="size-3 text-rose-600 dark:text-rose-400" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-surface-sunken text-muted border border-default">
            {status}
          </span>
        );
    }
  };

  const getChannelBadge = (ch: SalesOrder['channel']) => {
    const colors: Record<string, string> = {
      counter: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dealer: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      phone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      field: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      online: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
          colors[ch] ?? 'bg-surface-sunken text-muted border-default'
        }`}
      >
        {ch}
      </span>
    );
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
            className="h-9 rounded-xl border border-default bg-surface-sunken px-3 text-xs text-default focus:border-primary focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="dealer">Dealer</option>
            <option value="counter">Counter</option>
            <option value="phone">Phone</option>
            <option value="field">Field</option>
            <option value="online">Online</option>
          </select>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 text-xs font-medium text-muted hover:bg-surface hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading sales orders...' : 'No sales orders found.'}
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
                      {parseFloat(order.total_amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-muted">{order.currency_code}</span>
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
                          onClick={() => handleApprove(order.id)}
                          disabled={actionLoading === order.id}
                          className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading === order.id ? 'Confirming...' : 'Confirm'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-xl">
            <h3 className="text-base font-semibold text-default">Create New Sales Order</h3>
            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-default mb-1">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as typeof channel)}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
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
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
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
                  disabled={loading}
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
