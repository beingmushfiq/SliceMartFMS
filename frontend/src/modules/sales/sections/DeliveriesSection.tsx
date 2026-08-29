import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Navigation, RefreshCw, Search, Truck, XCircle } from 'lucide-react';
import type { DeliveryOrder } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';

export function DeliveriesSection() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get<DeliveryOrder[]>('/sales/deliveries');
      setDeliveries(res.data ?? []);
    } catch (err) {
      console.error('Failed to load delivery orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleDispatch = async (deliveryId: number) => {
    setActionLoading(deliveryId);
    try {
      await api.post(`/sales/deliveries/${deliveryId}/dispatch`, {});
      await fetchDeliveries();
    } catch (err) {
      console.error('Failed to dispatch delivery order', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.delivery_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.recipient_phone?.toLowerCase().includes(search.toLowerCase()) ||
      d.sales_order_number?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Pending
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Navigation className="h-3 w-3 text-blue-400 animate-pulse" /> In Transit
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Delivered
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 text-rose-400" /> {status}
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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by delivery #, recipient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-xl border border-default bg-surface-sunken pl-8 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-default bg-surface-sunken px-3 text-xs text-default focus:border-primary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={fetchDeliveries}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface-sunken px-3 text-xs font-medium text-muted hover:bg-surface hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Delivery Number</th>
                <th className="px-4 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">Warehouse</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading delivery orders...' : 'No delivery orders found.'}
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {del.delivery_number}
                    </td>
                    <td className="px-4 py-3.5 text-default font-medium">{del.recipient_name}</td>
                    <td className="px-4 py-3.5 text-muted">{del.recipient_phone}</td>
                    <td className="px-4 py-3.5 text-muted">{del.warehouse_name ?? 'Main WH'}</td>
                    <td className="px-4 py-3.5 uppercase text-[10px] text-muted">
                      {del.delivery_type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(del.status)}</td>
                    <td className="px-4 py-3.5 text-right">
                      {del.status === 'pending' && (
                        <button
                          onClick={() => handleDispatch(del.id)}
                          disabled={actionLoading === del.id}
                          className="flex items-center gap-1 ml-auto rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Truck className="h-3 w-3" />
                          {actionLoading === del.id ? 'Dispatching...' : 'Dispatch'}
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
    </div>
  );
}
