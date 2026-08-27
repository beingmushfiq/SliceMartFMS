import { useState, useEffect } from 'react'
import {
  Calculator,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import type { StockCount } from '../../../types/api/inventory'
import { api } from '../../../lib/api/client'

export function StockCountsSection() {
  const [counts, setCounts] = useState<StockCount[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchCounts = async () => {
    setLoading(true)
    try {
      const res = await api.get<StockCount[]>('/inventory/counts')
      setCounts(res.data ?? [])
    } catch (err) {
      console.error('Failed to load counts', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  const filteredCounts = counts.filter(
    (c) =>
      c.count_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.count_type?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: StockCount['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Draft
          </span>
        )
      case 'counting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Calculator className="h-3 w-3 text-amber-400" /> Counting
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Reconciled
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
            onClick={fetchCounts}
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
            placeholder="Search count session #, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Counts Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Count Session #</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Count Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Snapshotted Lines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredCounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading physical count sessions...' : 'No count sessions found'}
                  </td>
                </tr>
              ) : (
                filteredCounts.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                      {c.count_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{c.warehouse_name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-zinc-300">{c.count_type} count</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{c.count_date}</td>
                    <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">
                      {c.items?.length ?? 0} item(s)
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
