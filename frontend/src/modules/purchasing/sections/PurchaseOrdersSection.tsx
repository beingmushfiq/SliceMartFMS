import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import type { PurchaseOrder } from '../../../types/api/purchasing'
import { api } from '../../../lib/api/client'

export function PurchaseOrdersSection() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get<PurchaseOrder[]>('/purchasing/orders')
      setOrders(res.data ?? [])
    } catch (err) {
      console.error('Failed to load purchase orders', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleApprove = async (orderId: number) => {
    setActionLoading(orderId)
    try {
      await api.post(`/purchasing/orders/${orderId}/approve`, {})
      await fetchOrders()
    } catch (err) {
      console.error('Failed to approve PO', err)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.warehouse_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Approved
          </span>
        )
      case 'partially_received':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="h-3 w-3 text-blue-400" /> Partial GRN
          </span>
        )
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckCircle2 className="h-3 w-3 text-purple-400" /> Fulfilled
          </span>
        )
      case 'cancelled':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-700/20 text-zinc-400 border border-zinc-700/30">
            <XCircle className="h-3 w-3 text-zinc-400" /> {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg border border-zinc-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search PO #, supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Destination Warehouse</th>
                <th className="px-4 py-3">Order Date</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading purchase orders...' : 'No purchase order records found'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">{o.po_number}</td>
                    <td className="px-4 py-3 text-zinc-200">{o.supplier_name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-300">{o.warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{o.order_date}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-zinc-100">
                      {o.currency_code} {parseFloat(o.grand_total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(o.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {o.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(o.id)}
                          disabled={actionLoading === o.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {actionLoading === o.id ? 'Approving...' : 'Approve'}
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
  )
}
