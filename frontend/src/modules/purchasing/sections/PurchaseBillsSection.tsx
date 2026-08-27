import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import type { PurchaseBill } from '../../../types/api/purchasing'
import { api } from '../../../lib/api/client'

export function PurchaseBillsSection() {
  const [bills, setBills] = useState<PurchaseBill[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchBills = async () => {
    setLoading(true)
    try {
      const res = await api.get<PurchaseBill[]>('/purchasing/bills')
      setBills(res.data ?? [])
    } catch (err) {
      console.error('Failed to load purchase bills', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBills()
  }, [])

  const filteredBills = bills.filter(
    (b) =>
      b.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.supplier_invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.po_number?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: PurchaseBill['status']) => {
    switch (status) {
      case 'draft':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3 text-amber-400" /> Pending AP
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="h-3 w-3 text-blue-400" /> Approved
          </span>
        )
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CreditCard className="h-3 w-3 text-emerald-400" /> Settled
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 text-rose-400" /> Cancelled
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
            onClick={fetchBills}
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
            placeholder="Search bill #, supplier invoice #, PO #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Bill Number</th>
                <th className="px-4 py-3">Supplier Invoice #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Bill Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading purchase bills...' : 'No purchase bills found'}
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                      {b.bill_number}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      {b.supplier_invoice_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{b.supplier_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{b.bill_date}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{b.due_date}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-zinc-100">
                      {b.currency_code} {parseFloat(b.grand_total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(b.status)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          b.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : b.payment_status === 'partially_paid'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {b.payment_status.replace('_', ' ')}
                      </span>
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
