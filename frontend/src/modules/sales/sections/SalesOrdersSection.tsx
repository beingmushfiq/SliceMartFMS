import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Plus, RefreshCw, Search, XCircle, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import type { SalesOrder } from '../../../types/api/sales';
import type { Product } from '../../../types/api/catalog';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../hooks/useCurrency';
import { OrderProcessingModal } from '../components/OrderProcessingModal';
import { SelectDropdown } from '../../../components/ui/Dropdown';

interface SalesOrdersSectionProps {
  onNavigateToTab?: (tab: string) => void;
}

interface SoFormItem {
  product_id: number;
  product_name: string;
  quantity: string;
  unit_id: number;
  unit_price: string;
  discount_type?: 'flat' | 'percentage';
  discount_amount: string;
}

export function SalesOrdersSection({ onNavigateToTab }: SalesOrdersSectionProps = {}) {
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // New Order Form state
  const [channel, setChannel] = useState<'counter' | 'dealer' | 'phone' | 'field' | 'online'>(
    'dealer'
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [orderDiscountType, setOrderDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [orderDiscountValue, setOrderDiscountValue] = useState('');
  const [items, setItems] = useState<SoFormItem[]>([
    {
      product_id: 1,
      product_name: 'Standard Catalog Item',
      quantity: '1',
      unit_id: 1,
      unit_price: '100.00',
      discount_type: 'flat',
      discount_amount: '0.00',
    },
  ]);

  const calculateSoTotals = (
    itemsList: SoFormItem[],
    orderDiscType: 'flat' | 'percentage',
    orderDiscValStr: string
  ) => {
    const grossSubtotal = itemsList.reduce(
      (sum, it) => sum + parseFloat(it.quantity || '0') * parseFloat(it.unit_price || '0'),
      0
    );
    const itemDiscounts = itemsList.map((it) => {
      const lineGross = parseFloat(it.quantity || '0') * parseFloat(it.unit_price || '0');
      const isPct = it.discount_type === 'percentage';
      const discVal = parseFloat(it.discount_amount || '0') || 0;
      const discAmt = isPct ? lineGross * (discVal / 100) : Math.min(lineGross, discVal);
      const lineNet = Math.max(0, lineGross - discAmt);
      return { lineGross, discAmt, lineNet };
    });
    const totalLineDiscounts = itemDiscounts.reduce((sum, i) => sum + i.discAmt, 0);
    const netSubtotalBeforeOrderDisc = Math.max(0, grossSubtotal - totalLineDiscounts);

    const orderDiscVal = Math.max(0, parseFloat(orderDiscValStr || '0') || 0);
    const orderDiscountAmount =
      orderDiscType === 'percentage'
        ? netSubtotalBeforeOrderDisc * (orderDiscVal / 100)
        : Math.min(netSubtotalBeforeOrderDisc, orderDiscVal);

    const totalDiscount = totalLineDiscounts + orderDiscountAmount;
    const netTotal = Math.max(0, netSubtotalBeforeOrderDisc - orderDiscountAmount);

    return {
      grossSubtotal,
      totalLineDiscounts,
      orderDiscountAmount,
      totalDiscount,
      netTotal,
    };
  };

  const { data: catalogProducts = [] } = useQuery<Product[]>({
    queryKey: ['catalog', 'products', 'sales-dropdown'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data?: Product[] } | Product[]>('/products?per_page=100');
        const raw = res.data;
        return Array.isArray(raw) ? raw : (raw?.data ?? []);
      } catch {
        return [];
      }
    },
  });

  const addItem = () => {
    const firstProduct = catalogProducts[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: Number(firstProduct?.id || prev.length + 1),
        product_name: firstProduct?.name || 'New Item',
        quantity: '1',
        unit_id: Number(firstProduct?.base_unit_id || 1),
        unit_price: firstProduct?.default_sale_price || '100.00',
        discount_type: 'flat',
        discount_amount: '0.00',
      },
    ]);
  };

  const updateItem = (index: number, patch: Partial<SoFormItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

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
        order_discount_type: orderDiscountType,
        order_discount_value: orderDiscountValue || '0',
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_id: it.unit_id,
          unit_price: it.unit_price,
          discount_type: it.discount_type || 'flat',
          discount_value: it.discount_amount || '0',
          discount_amount: it.discount_amount || '0.00',
        })),
      });
    },
    onSuccess: () => {
      toast.success('Sales order created.');
      setShowCreateModal(false);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setOrderDiscountType('flat');
      setOrderDiscountValue('');
      setItems([
        {
          product_id: 1,
          product_name: 'Standard Catalog Item',
          quantity: '1',
          unit_id: 1,
          unit_price: '100.00',
          discount_type: 'flat',
          discount_amount: '0.00',
        },
      ]);
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
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3 text-amber-500" /> Pending Review
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

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Channels' },
              { value: 'dealer', label: 'B2B Dealer', colorDot: 'bg-indigo-500' },
              { value: 'counter', label: 'Counter POS', colorDot: 'bg-emerald-500' },
              { value: 'phone', label: 'Telesales', colorDot: 'bg-amber-500' },
              { value: 'field', label: 'Field DSR', colorDot: 'bg-blue-500' },
              { value: 'online', label: 'E-Commerce', colorDot: 'bg-purple-500' },
            ]}
            value={channelFilter}
            onChange={(val) => setChannelFilter(val)}
            size="sm"
            aria-label="Filter orders by channel"
          />

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
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-surface-sunken/70 transition-colors cursor-pointer group"
                    title="Click row to view and process order"
                  >
                    <td className="px-4 py-3.5 font-mono font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3.5 text-muted">{order.order_date}</td>
                    <td className="px-4 py-3.5">{getChannelBadge(order.channel)}</td>
                    <td className="px-4 py-3.5 text-default font-medium">
                      {order.customer_name ?? 'Walk-in / Direct'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      {formatCurrency(order.total_amount)}
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
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {(order.status === 'draft' || order.status === 'pending') && (
                          <button
                            type="button"
                            onClick={() => approveMutation.mutate(order.id)}
                            disabled={approveMutation.isPending}
                            className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1"
                            title="Confirm order immediately"
                          >
                            <CheckCircle2 className="size-3" />
                            {approveMutation.isPending ? 'Confirming...' : 'Confirm'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 cursor-pointer transition-colors flex items-center gap-1"
                          title="Open order processing workflow"
                        >
                          <SlidersHorizontal className="size-3" />
                          <span>Process</span>
                        </button>
                      </div>
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
          <div className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-default">Create New Sales Order</h3>
                <p className="text-xs text-muted mt-0.5">Enter order details, line items, editable pricing and discounts</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-default cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              {/* Items Builder */}
              <div className="border border-default rounded-xl p-3 bg-surface-sunken/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default">Order Line Items & Pricing</span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" /> Add Item Line
                  </button>
                </div>

                {/* Items Grid Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted px-1">
                  <div className="col-span-5">Product / Item</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Price (৳)</div>
                  <div className="col-span-2">Discount (৳)</div>
                  <div className="col-span-1 text-center">Del</div>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-surface p-2.5 rounded-lg border border-default">
                    <div className="col-span-5">
                      {catalogProducts.length > 0 ? (
                        <select
                          value={item.product_id}
                          onChange={(e) => {
                            const pId = Number(e.target.value);
                            const found = catalogProducts.find((p) => Number(p.id) === pId);
                            updateItem(idx, {
                              product_id: pId,
                              product_name: found?.name || item.product_name,
                              unit_price: found?.default_sale_price || item.unit_price,
                              unit_id: Number(found?.base_unit_id || 1),
                            });
                          }}
                          className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default focus:border-primary focus:outline-none"
                        >
                          {catalogProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatCurrency(p.default_sale_price || '0')})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={item.product_name}
                          onChange={(e) => updateItem(idx, { product_name: e.target.value })}
                          className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default focus:border-primary focus:outline-none"
                        />
                      )}
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, { unit_price: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono text-right focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0.00"
                          value={item.discount_amount}
                          onChange={(e) => updateItem(idx, { discount_amount: e.target.value })}
                          className="w-full rounded-l-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 font-mono text-right focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(idx, {
                              discount_type: item.discount_type === 'percentage' ? 'flat' : 'percentage',
                            })
                          }
                          className="flex h-7.5 w-6 shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-default bg-surface hover:bg-surface-sunken font-bold text-[10px] text-muted hover:text-default cursor-pointer transition-colors"
                          title="Toggle Flat (৳) or Percentage (%)"
                        >
                          {item.discount_type === 'percentage' ? '%' : '৳'}
                        </button>
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                          title="Remove item line"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Full Order Discount & Calculation Summary */}
                {(() => {
                  const totals = calculateSoTotals(items, orderDiscountType, orderDiscountValue);
                  return (
                    <div className="space-y-2 pt-2 border-t border-default/60">
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface border border-default">
                        <span className="text-xs font-semibold text-default">
                          Full Order Discount
                          <span className="block text-[10px] text-muted font-normal">
                            Discount applied on sales order subtotal
                          </span>
                        </span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={orderDiscountValue}
                            onChange={(e) => setOrderDiscountValue(e.target.value)}
                            className="w-24 rounded-l-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 font-mono text-right focus:border-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setOrderDiscountType(orderDiscountType === 'percentage' ? 'flat' : 'percentage')
                            }
                            className="flex h-7.5 w-7 shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-default bg-surface-sunken hover:bg-surface font-bold text-[10px] text-muted hover:text-default cursor-pointer transition-colors"
                            title="Toggle Flat (৳) or Percentage (%)"
                          >
                            {orderDiscountType === 'percentage' ? '%' : '৳'}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-xs font-mono">
                        <div className="flex justify-between w-56 text-muted">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(totals.grossSubtotal)}</span>
                        </div>
                        {totals.totalDiscount > 0 && (
                          <div className="flex justify-between w-56 text-rose-500">
                            <span>Discount:</span>
                            <span>-{formatCurrency(totals.totalDiscount)}</span>
                          </div>
                        )}
                        {totals.orderDiscountAmount > 0 && (
                          <div className="text-[10px] text-muted">
                            (Includes Order Discount: {formatCurrency(totals.orderDiscountAmount)})
                          </div>
                        )}
                        <div className="flex justify-between w-56 font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-default/40">
                          <span>Net Total:</span>
                          <span>{formatCurrency(totals.netTotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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

      {/* Order Processing Modal */}
      <OrderProcessingModal
        order={orders.find((o) => o.id === selectedOrder?.id) ?? selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onNavigateToTab={onNavigateToTab}
      />
    </div>
  );
}
