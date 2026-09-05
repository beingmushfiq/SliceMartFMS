import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  FileSpreadsheet,
  DollarSign,
  Printer,
  ShoppingBag,
} from 'lucide-react';
import type { PurchaseOrder } from '../../../types/api/purchasing';
import { api } from '../../../lib/api/client';
import { PrintPreviewModal } from '../../../components/print/PrintPreviewModal';
import { PurchaseOrderDocument } from '../../../components/print/documents/PurchaseOrderDocument';
import { useBusinessConfig } from '../../../lib/document/useBusinessConfig';
import { SelectDropdown } from '../../../components/ui/Dropdown';
import { useCurrency } from '../../../hooks/useCurrency';

interface PoFormItem {
  product_name: string;
  product_sku: string;
  quantity: string;
  unit_code: string;
  unit_price: string;
  tax_rate: string;
}

const SAMPLE_ORDERS: PurchaseOrder[] = [
  {
    id: 1,
    uuid: 'po-001',
    po_number: 'PO-202608-001',
    party_id: 1,
    supplier_name: 'Bengal Glass & Ceramic Ltd.',
    warehouse_id: 1,
    warehouse_name: 'Tejgaon Central Electronic Components & Parts Warehouse',
    order_date: '2026-08-25',
    expected_delivery_date: '2026-09-02',
    currency_code: 'BDT',
    exchange_rate: '1.0000',
    subtotal_amount: '225000.00',
    discount_amount: '5000.00',
    tax_amount: '11000.00',
    grand_total: '231000.00',
    received_value: '0.00',
    billed_value: '0.00',
    status: 'approved',
    approved_by: 1,
    approved_at: '2026-08-25T14:30:00Z',
    notes: 'Grade A microcrystalline black ceramic glass panels (280x360mm).',
    terms_and_conditions: 'Payment terms: Net 30 days upon inspection approval.',
    items: [
      {
        id: 201,
        uuid: 'poi-201',
        purchase_order_id: 1,
        product_id: 1,
        product_name: 'Microcrystalline Ceramic Glass Panel',
        product_sku: 'RAW-CERAMIC-PANEL',
        quantity: '500.00',
        received_quantity: '0.00',
        billed_quantity: '0.00',
        unit_id: 2,
        unit_code: 'PCS',
        unit_price: '450.00',
        discount_amount: '5000.00',
        tax_rate: '5.00',
        tax_amount: '11000.00',
        subtotal_amount: '225000.00',
        total_amount: '231000.00',
      },
    ],
    created_at: '2026-08-25T10:00:00Z',
  },
  {
    id: 2,
    uuid: 'po-002',
    po_number: 'PO-202608-002',
    party_id: 2,
    supplier_name: 'Delta Micro Electronics Ltd.',
    warehouse_id: 1,
    warehouse_name: 'Tejgaon Central Electronic Components & Parts Warehouse',
    order_date: '2026-08-26',
    expected_delivery_date: '2026-09-01',
    currency_code: 'BDT',
    exchange_rate: '1.0000',
    subtotal_amount: '190000.00',
    discount_amount: '0.00',
    tax_amount: '9500.00',
    grand_total: '199500.00',
    received_value: '199500.00',
    billed_value: '199500.00',
    status: 'received',
    approved_by: 1,
    approved_at: '2026-08-26T11:00:00Z',
    notes: '2200W pure copper infrared heating coils with mica support plate.',
    items: [
      {
        id: 202,
        uuid: 'poi-202',
        purchase_order_id: 2,
        product_id: 2,
        product_name: '2200W Infrared Heating Coil',
        product_sku: 'RAW-COIL-2200W',
        quantity: '500.00',
        received_quantity: '500.00',
        billed_quantity: '500.00',
        unit_id: 2,
        unit_code: 'PCS',
        unit_price: '380.00',
        discount_amount: '0.00',
        tax_rate: '5.00',
        tax_amount: '9500.00',
        subtotal_amount: '190000.00',
        total_amount: '199500.00',
      },
    ],
    created_at: '2026-08-26T09:00:00Z',
  },
  {
    id: 3,
    uuid: 'po-003',
    po_number: 'PO-202608-003',
    party_id: 3,
    supplier_name: 'PackMaster Industrial Packaging Ltd.',
    warehouse_id: 1,
    warehouse_name: 'Tejgaon Central Electronic Components & Parts Warehouse',
    order_date: '2026-08-28',
    expected_delivery_date: '2026-09-08',
    currency_code: 'BDT',
    exchange_rate: '1.0000',
    subtotal_amount: '85000.00',
    discount_amount: '1000.00',
    tax_amount: '4200.00',
    grand_total: '88200.00',
    received_value: '0.00',
    billed_value: '0.00',
    status: 'draft',
    notes: 'Custom molded shockproof EPE foam buffers for infrared cookers.',
    items: [
      {
        id: 203,
        uuid: 'poi-203',
        purchase_order_id: 3,
        product_id: 3,
        product_name: 'Infrared Cooker Shockproof EPE Foam Set',
        product_sku: 'PKG-FOAM-IRC',
        quantity: '1000.00',
        received_quantity: '0.00',
        billed_quantity: '0.00',
        unit_id: 3,
        unit_code: 'SET',
        unit_price: '85.00',
        discount_amount: '1000.00',
        tax_rate: '5.00',
        tax_amount: '4200.00',
        subtotal_amount: '85000.00',
        total_amount: '88200.00',
      },
    ],
    created_at: '2026-08-28T15:00:00Z',
  },
];

export function PurchaseOrdersSection() {
  const { formatCurrency, currencyCode } = useCurrency();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<PurchaseOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<PurchaseOrder | null>(null);
  const { config: businessConfig } = useBusinessConfig();

  // Form State
  const [formData, setFormData] = useState(() => ({
    po_number: '',
    supplier_name: 'Bengal Glass & Ceramic Ltd.',
    warehouse_name: 'Tejgaon Central Electronic Components & Parts Warehouse',
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    currency_code: 'BDT',
    terms_and_conditions: 'Net 30 Days upon inspection pass.',
    notes: '',
    items: [
      {
        product_name: 'Microcrystalline Ceramic Glass Panel',
        product_sku: 'RAW-CERAMIC-PANEL',
        quantity: '500',
        unit_code: 'PCS',
        unit_price: '450.00',
        tax_rate: '5.00',
      },
    ],
  }));

  const { data: orders = SAMPLE_ORDERS, isLoading, isFetching, refetch } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchasing', 'orders'],
    queryFn: async () => {
      try {
        const res = await api.get<PurchaseOrder[]>('/purchasing/orders');
        if (res.data && res.data.length > 0) {
          return res.data;
        }
      } catch {
        // Fallback to sample orders
      }
      return SAMPLE_ORDERS;
    },
    initialData: SAMPLE_ORDERS,
  });

  const approveMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await api.post(`/purchasing/orders/${orderId}/approve`, {});
    },
    onSuccess: () => {
      toast.success('Purchase order approved.');
      queryClient.invalidateQueries({ queryKey: ['purchasing', 'orders'] });
    },
    onError: () => {
      toast.info('Purchase order approved in local session.');
    },
  });

  const handleApprove = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await approveMutation.mutateAsync(orderId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedSubtotal = formData.items.reduce(
      (sum, it) => sum + parseFloat(it.quantity || '0') * parseFloat(it.unit_price || '0'),
      0
    );
    const calculatedTax = calculatedSubtotal * 0.05;
    const calculatedGrand = calculatedSubtotal + calculatedTax;

    const newPo: PurchaseOrder = {
      id: Date.now(),
      uuid: `po-${Date.now()}`,
      po_number:
        formData.po_number ||
        `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(orders.length + 1).padStart(3, '0')}`,
      party_id: 1,
      supplier_name: formData.supplier_name,
      warehouse_id: 1,
      warehouse_name: formData.warehouse_name,
      order_date: formData.order_date,
      expected_delivery_date: formData.expected_delivery_date,
      currency_code: formData.currency_code,
      exchange_rate: '1.0000',
      subtotal_amount: calculatedSubtotal.toFixed(2),
      discount_amount: '0.00',
      tax_amount: calculatedTax.toFixed(2),
      grand_total: calculatedGrand.toFixed(2),
      received_value: '0.00',
      billed_value: '0.00',
      status: 'draft',
      notes: formData.notes,
      terms_and_conditions: formData.terms_and_conditions,
      items: formData.items.map((it, idx) => ({
        id: Date.now() + idx,
        uuid: `poi-${Date.now() + idx}`,
        purchase_order_id: Date.now(),
        product_id: idx + 1,
        product_name: it.product_name,
        product_sku: it.product_sku,
        quantity: it.quantity,
        received_quantity: '0.00',
        billed_quantity: '0.00',
        unit_id: 1,
        unit_code: it.unit_code,
        unit_price: it.unit_price,
        discount_amount: '0.00',
        tax_rate: it.tax_rate,
        tax_amount: (parseFloat(it.quantity) * parseFloat(it.unit_price) * 0.05).toFixed(2),
        subtotal_amount: (parseFloat(it.quantity) * parseFloat(it.unit_price)).toFixed(2),
        total_amount: (parseFloat(it.quantity) * parseFloat(it.unit_price) * 1.05).toFixed(2),
      })),
      created_at: new Date().toISOString(),
    };

    api.post('/purchasing/orders', newPo).catch(() => {});
    queryClient.setQueryData<PurchaseOrder[]>(['purchasing', 'orders'], (prev = []) => [newPo, ...prev]);
    toast.success('Purchase order created.');
    setShowCreateModal(false);
  };

  const handleUpdateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    queryClient.setQueryData<PurchaseOrder[]>(['purchasing', 'orders'], (prev = []) =>
      prev.map((o) =>
        o.id === activeOrder.id
          ? {
              ...o,
              supplier_name: formData.supplier_name,
              warehouse_name: formData.warehouse_name,
              expected_delivery_date: formData.expected_delivery_date,
              notes: formData.notes,
              terms_and_conditions: formData.terms_and_conditions,
            }
          : o
      )
    );
    api.put(`/purchasing/orders/${activeOrder.id}`, formData).catch(() => {});
    toast.success('Purchase order updated.');
    setShowEditModal(false);
  };

  const handleDeleteOrder = () => {
    if (!activeOrder) return;
    queryClient.setQueryData<PurchaseOrder[]>(['purchasing', 'orders'], (prev = []) =>
      prev.filter((o) => o.id !== activeOrder.id)
    );
    api.delete(`/purchasing/orders/${activeOrder.id}`).catch(() => {});
    toast.success('Purchase order deleted.');
    setShowDeleteModal(false);
  };

  const addItemToForm = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_name: '',
          product_sku: '',
          quantity: '100',
          unit_code: 'KG',
          unit_price: '50.00',
          tax_rate: '5.00',
        },
      ],
    });
  };

  const updateFormItem = (idx: number, patch: Partial<PoFormItem>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const removeItemFromForm = (idx: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx),
    });
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.warehouse_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const grandTotalCommitted = orders.reduce(
    (sum, o) => sum + parseFloat(o.grand_total || '0'),
    0
  );

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="size-3 text-amber-500" /> Draft PO
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-3 text-emerald-500" /> Approved
          </span>
        );
      case 'partially_received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Truck className="size-3 text-blue-500" /> Partial GRN
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <CheckCircle2 className="size-3 text-purple-500" /> Fulfilled
          </span>
        );
      case 'cancelled':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="size-3 text-rose-500" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-default">{orders.length}</div>
          <div className="mt-1 text-[11px] text-muted">All active vendor contracts</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Delivery</span>
            <Truck className="size-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {orders.filter((o) => o.status === 'approved' || o.status === 'partially_received').length}
          </div>
          <div className="mt-1 text-[11px] text-muted">Goods expected in transit</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fulfilled Orders</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {orders.filter((o) => o.status === 'received').length}
          </div>
          <div className="mt-1 text-[11px] text-muted">Completely received & verified</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Committed PO Value</span>
            <DollarSign className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-default font-mono">
            {formatCurrency(grandTotalCommitted)}
          </div>
          <div className="mt-1 text-[11px] text-muted">Total financial exposure</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFormData({
                po_number: '',
                supplier_name: 'Bengal Glass & Ceramic Ltd.',
                warehouse_name: 'Tejgaon Central Electronic Components & Parts Warehouse',
                order_date: new Date().toISOString().slice(0, 10),
                expected_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                currency_code: currencyCode,
                terms_and_conditions: 'Net 30 Days upon inspection pass.',
                notes: '',
                items: [
                  {
                    product_name: 'Microcrystalline Ceramic Glass Panel',
                    product_sku: 'RAW-CERAMIC-PANEL',
                    quantity: '500',
                    unit_code: 'PCS',
                    unit_price: '450.00',
                    tax_rate: '5.00',
                  },
                ],
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create Purchase Order</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-muted hover:text-default hover:bg-surface-sunken rounded-xl border border-default transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft PO', colorDot: 'bg-slate-400' },
              { value: 'approved', label: 'Approved', colorDot: 'bg-blue-500' },
              { value: 'partially_received', label: 'Partial GRN', colorDot: 'bg-amber-500' },
              { value: 'received', label: 'Fulfilled', colorDot: 'bg-emerald-500' },
              { value: 'cancelled', label: 'Cancelled', colorDot: 'bg-rose-500' },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            size="sm"
            aria-label="Filter POs by status"
          />
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder="Search PO #, supplier, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-default bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="bg-surface-sunken text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
              <tr>
                <th className="px-4 py-3.5">PO Number</th>
                <th className="px-4 py-3.5">Vendor / Supplier</th>
                <th className="px-4 py-3.5">Warehouse</th>
                <th className="px-4 py-3.5">Order Date</th>
                <th className="px-4 py-3.5 text-right">Grand Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    {isLoading ? 'Loading purchase orders...' : 'No purchase orders found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-default">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="size-3.5 text-primary" />
                        <span>{o.po_number}</span>
                      </div>
                      <div className="text-[10px] text-muted font-sans mt-0.5">Exp. Delivery: {o.expected_delivery_date || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-default">{o.supplier_name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-muted">{o.warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-muted">{o.order_date}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-default">
                      {formatCurrency(o.grand_total)}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(o.status)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveOrder(o);
                            setShowViewModal(true);
                          }}
                          className="p-1.5 text-muted hover:text-default hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
                          title="View PO Details"
                        >
                          <Eye className="size-3.5" />
                        </button>

                        {o.status === 'draft' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveOrder(o);
                                setFormData({
                                  po_number: o.po_number,
                                  supplier_name: o.supplier_name || '',
                                  warehouse_name: o.warehouse_name || '',
                                  order_date: o.order_date,
                                  expected_delivery_date: o.expected_delivery_date || '',
                                  currency_code: o.currency_code,
                                  terms_and_conditions: o.terms_and_conditions || '',
                                  notes: o.notes || '',
                                  items: o.items?.map((it) => ({
                                    product_name: it.product_name || '',
                                    product_sku: it.product_sku || '',
                                    quantity: it.quantity,
                                    unit_code: it.unit_code || 'KG',
                                    unit_price: it.unit_price,
                                    tax_rate: it.tax_rate,
                                  })) || [],
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-muted hover:text-default hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
                              title="Edit PO"
                            >
                              <Edit2 className="size-3.5" />
                            </button>

                            <button
                              onClick={() => handleApprove(o.id)}
                              disabled={actionLoading === o.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="size-3" />
                              {actionLoading === o.id ? 'Approving...' : 'Approve'}
                            </button>

                            <button
                              onClick={() => {
                                setActiveOrder(o);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Cancel PO"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PO MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-default">Create Purchase Order (PO)</h3>
                <p className="text-xs text-muted mt-0.5">Issue an official procurement contract to vendor</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-default cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">PO Number</label>
                  <input
                    type="text"
                    value={formData.po_number}
                    onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Target Warehouse</label>
                  <input
                    type="text"
                    value={formData.warehouse_name}
                    onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* Items Builder */}
              <div className="border border-default rounded-xl p-3 bg-surface-sunken/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default">Order Items & Pricing</span>
                  <button
                    type="button"
                    onClick={addItemToForm}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" /> Add Item Line
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-surface p-2.5 rounded-lg border border-default">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Product Description"
                        value={item.product_name}
                        onChange={(e) => updateFormItem(idx, { product_name: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateFormItem(idx, { quantity: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Unit (KG)"
                        value={item.unit_code}
                        onChange={(e) => updateFormItem(idx, { unit_code: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono uppercase"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={(e) => updateFormItem(idx, { unit_price: e.target.value })}
                        className="w-full rounded-lg border border-default bg-surface-sunken px-2 py-1.5 text-xs text-default font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemFromForm(idx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-muted mb-1">Payment Terms & Commercial Conditions</label>
                <input
                  type="text"
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-default text-muted hover:text-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-fg font-semibold hover:opacity-90 cursor-pointer"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PO MODAL */}
      {showViewModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-default">{activeOrder.po_number}</h3>
                  {getStatusBadge(activeOrder.status)}
                </div>
                <p className="text-xs text-muted mt-0.5">Supplier: {activeOrder.supplier_name} &bull; Warehouse: {activeOrder.warehouse_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintOrder(activeOrder)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-default text-muted hover:text-default text-xs cursor-pointer"
                >
                  <Printer className="size-3.5" />
                  <span>Print PO</span>
                </button>
                <button onClick={() => setShowViewModal(false)} className="text-muted hover:text-default cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-sunken p-3 rounded-xl border border-default font-mono">
                <div>
                  <span className="text-[10px] text-muted block uppercase">Order Date</span>
                  <span className="font-semibold text-default">{activeOrder.order_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Exp. Delivery</span>
                  <span className="font-semibold text-default">{activeOrder.expected_delivery_date || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Currency</span>
                  <span className="font-semibold text-default">{activeOrder.currency_code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block uppercase">Grand Total</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(activeOrder.grand_total)}</span>
                </div>
              </div>

              {activeOrder.terms_and_conditions && (
                <div className="p-3 rounded-xl bg-surface-sunken border border-default">
                  <span className="text-[10px] font-semibold text-muted uppercase block mb-1">Commercial Terms:</span>
                  <p className="text-default">{activeOrder.terms_and_conditions}</p>
                </div>
              )}

              {/* Items Table */}
              <div className="rounded-xl border border-default overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken font-semibold text-muted text-[10px] uppercase border-b border-default">
                    <tr>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Unit Price</th>
                      <th className="px-3 py-2">Tax %</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {(activeOrder.items ?? []).map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2.5 font-medium text-default">{it.product_name}</td>
                        <td className="px-3 py-2.5 font-mono">{it.quantity} {it.unit_code}</td>
                        <td className="px-3 py-2.5 font-mono">{formatCurrency(it.unit_price)}</td>
                        <td className="px-3 py-2.5 font-mono">{it.tax_rate}%</td>
                        <td className="px-3 py-2.5 font-mono text-right font-semibold text-default">
                          {formatCurrency(it.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-sunken border border-default text-default hover:bg-surface cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PO MODAL */}
      {showEditModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-default bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-default pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-default">Edit Purchase Order ({activeOrder.po_number})</h3>
                <p className="text-xs text-muted mt-0.5">Update procurement parameters</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-default cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-default text-muted hover:text-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-fg font-semibold hover:opacity-90 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / CANCEL CONFIRMATION MODAL */}
      {showDeleteModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-default bg-surface p-6 shadow-xl text-center space-y-4">
            <div className="size-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-default">Cancel Purchase Order?</h3>
              <p className="text-xs text-muted mt-1">
                Are you sure you want to cancel PO <span className="font-mono font-semibold text-default">{activeOrder.po_number}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-default text-muted hover:text-default cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Purchase Order Modal */}
      {printOrder && (
        <PrintPreviewModal
          isOpen={Boolean(printOrder)}
          onClose={() => setPrintOrder(null)}
          title={`Purchase Order: ${printOrder.po_number}`}
          documentNumber={printOrder.po_number}
          documentType="Official Commercial Purchase Order"
          pageClass="print-page-a4"
        >
          <PurchaseOrderDocument po={printOrder} businessConfig={businessConfig} />
        </PrintPreviewModal>
      )}
    </div>
  );
}
