import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Plus, RefreshCw, Search, Truck, XCircle } from 'lucide-react';
import type { SalesOrder } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';

export function SalesOrdersSection() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
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
    fetchOrders();
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Confirmed
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Truck className="h-3 w-3 text-indigo-400" /> Delivered
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  const getChannelBadge = (ch: SalesOrder['channel']) => {
    const colors: Record<string, string> = {
      counter: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dealer: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      phone: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      field: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      online: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase border ${
          colors[ch] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'
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
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by order #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
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
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" />
          New Sales Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading sales orders...' : 'No sales orders found.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{order.order_date}</td>
                    <td className="px-4 py-3">{getChannelBadge(order.channel)}</td>
                    <td className="px-4 py-3 text-zinc-200">
                      {order.customer_name ?? 'Walk-in / Direct'}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                      {parseFloat(order.total_amount || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-zinc-500">{order.currency_code}</span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : order.payment_status === 'partially_paid'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(order.id)}
                          disabled={actionLoading === order.id}
                          className="rounded bg-emerald-600/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50"
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
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">Create New Sales Order</h3>
            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as typeof channel)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="dealer">Dealer</option>
                  <option value="counter">Counter</option>
                  <option value="phone">Phone</option>
                  <option value="field">Field</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Retail Partner A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Customer Phone</label>
                <input
                  type="text"
                  placeholder="+8801700000000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Order Date</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">
                  Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional delivery instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
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
