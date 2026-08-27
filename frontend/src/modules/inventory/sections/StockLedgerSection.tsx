import { useState, useEffect } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Layers,
  RefreshCw,
  Search,
} from 'lucide-react'
import type { StockMovement, StockBalance } from '../../../types/api/inventory'
import { api } from '../../../lib/api/client'

export function StockLedgerSection() {
  const [viewMode, setViewMode] = useState<'movements' | 'balances'>('balances')
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [balances, setBalances] = useState<StockBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      if (viewMode === 'balances') {
        const res = await api.get<StockBalance[]>('/inventory/balances')
        setBalances(res.data ?? [])
      } else {
        const res = await api.get<StockMovement[]>('/inventory/movements')
        setMovements(res.data ?? [])
      }
    } catch (err) {
      console.error('Failed to load stock data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [viewMode])

  const filteredBalances = balances.filter(
    (b) =>
      b.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.product_sku?.toLowerCase().includes(search.toLowerCase()) ||
      b.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      (b.batch_code && b.batch_code.toLowerCase().includes(search.toLowerCase()))
  )

  const filteredMovements = movements.filter(
    (m) =>
      m.movement_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.movement_type?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
            <button
              onClick={() => setViewMode('balances')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'balances'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Boxes className="h-3.5 w-3.5" />
              Stock Balances
            </button>
            <button
              onClick={() => setViewMode('movements')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'movements'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Audit Ledger (Movements)
            </button>
          </div>

          <button
            onClick={fetchData}
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
            placeholder={`Search ${viewMode === 'balances' ? 'SKU, product, lot...' : 'movements, ref...'}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
        {viewMode === 'balances' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Lot / Batch</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3 text-right">Available Qty</th>
                  <th className="px-4 py-3 text-right">Avg Unit Cost</th>
                  <th className="px-4 py-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      {loading ? 'Loading current inventory...' : 'No stock balance records found'}
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">{b.product_name ?? '—'}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{b.product_sku ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{b.warehouse_name ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-zinc-400">{b.batch_code ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            b.stock_state === 'available'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : b.stock_state === 'quarantine'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : b.stock_state === 'damaged'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-zinc-700/20 text-zinc-400 border border-zinc-700/30'
                          }`}
                        >
                          {b.stock_state}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">
                        {parseFloat(b.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">
                        ${parseFloat(b.average_cost).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-zinc-100">
                        ${parseFloat(b.total_value).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Movement #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Balance After</th>
                  <th className="px-4 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                      {loading ? 'Loading ledger movements...' : 'No ledger movements found'}
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-zinc-200">
                        {m.movement_number}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300">
                          {m.direction === 'in' ? (
                            <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3 text-rose-400" />
                          )}
                          {m.movement_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">{m.product_name ?? '—'}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{m.product_sku ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{m.warehouse_name ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-zinc-400">{m.batch_code ?? '—'}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold ${
                          m.direction === 'in' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {m.direction === 'in' ? '+' : '-'}
                        {parseFloat(m.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">
                        {parseFloat(m.balance_after).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-[11px] text-zinc-500 font-mono">
                        {m.moved_at ? new Date(m.moved_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
