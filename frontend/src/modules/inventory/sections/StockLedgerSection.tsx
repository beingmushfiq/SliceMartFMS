import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Boxes, Layers, RefreshCw, Search } from 'lucide-react';
import type { StockMovement, StockBalance } from '../../../types/api/inventory';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../hooks/useCurrency';

export function StockLedgerSection() {
  const { formatCurrency } = useCurrency();
  const [viewMode, setViewMode] = useState<'movements' | 'balances'>('balances');
  const [search, setSearch] = useState('');

  const {
    data: balances = [],
    isLoading: balancesLoading,
    isFetching: balancesFetching,
    refetch: refetchBalances,
  } = useQuery({
    queryKey: ['inventory', 'balances'],
    queryFn: async ({ signal }) => {
      const res = await api.get<StockBalance[]>('/inventory/balances', { signal });
      return res.data ?? [];
    },
    enabled: viewMode === 'balances',
  });

  const {
    data: movements = [],
    isLoading: movementsLoading,
    isFetching: movementsFetching,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ['inventory', 'movements'],
    queryFn: async ({ signal }) => {
      const res = await api.get<StockMovement[]>('/inventory/movements', { signal });
      return res.data ?? [];
    },
    enabled: viewMode === 'movements',
  });

  const loading =
    viewMode === 'balances'
      ? balancesLoading || balancesFetching
      : movementsLoading || movementsFetching;

  const handleRefresh = () => {
    if (viewMode === 'balances') {
      refetchBalances();
    } else {
      refetchMovements();
    }
  };

  const filteredBalances = balances.filter(
    (b) =>
      b.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.product_sku?.toLowerCase().includes(search.toLowerCase()) ||
      b.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      (b.batch_code && b.batch_code.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredMovements = movements.filter(
    (m) =>
      m.movement_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.movement_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Controls & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-surface-sunken p-1 border border-default shadow-2xs">
            <button
              onClick={() => setViewMode('balances')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'balances'
                  ? 'bg-surface text-primary shadow-xs border border-default/70'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Boxes className="size-3.5" />
              <span>Stock Balances</span>
            </button>
            <button
              onClick={() => setViewMode('movements')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'movements'
                  ? 'bg-surface text-primary shadow-xs border border-default/70'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Layers className="size-3.5" />
              <span>Audit Ledger</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-muted hover:text-default hover:bg-surface-sunken rounded-xl border border-default transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder={`Search ${viewMode === 'balances' ? 'SKU, product, lot...' : 'movements, ref...'}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-surface-sunken border border-default rounded-xl text-default placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Modern Data Grid Container with Subtle Outline */}
      <div className="rounded-2xl border border-default bg-surface shadow-xs overflow-hidden">
        {viewMode === 'balances' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-default">
              <thead className="bg-surface-sunken/70 text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
                <tr>
                  <th className="px-4 py-3.5">Product / SKU</th>
                  <th className="px-4 py-3.5">Warehouse</th>
                  <th className="px-4 py-3.5">Lot / Batch</th>
                  <th className="px-4 py-3.5">State</th>
                  <th className="px-4 py-3.5 text-right">Available Qty</th>
                  <th className="px-4 py-3.5 text-right">Avg Unit Cost</th>
                  <th className="px-4 py-3.5 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted">
                      {loading ? 'Loading current inventory...' : 'No stock balance records found'}
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-sunken/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-default">{b.product_name ?? '—'}</div>
                        <div className="text-[11px] font-mono text-muted">
                          {b.product_sku ?? '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted">{b.warehouse_name ?? '—'}</td>
                      <td className="px-4 py-3.5 font-mono text-muted">{b.batch_code ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            b.stock_state === 'available'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : b.stock_state === 'quarantine'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : b.stock_state === 'damaged'
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                  : 'bg-surface-sunken text-muted border border-default'
                          }`}
                        >
                          {b.stock_state}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {parseFloat(b.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-default">
                        {formatCurrency(b.average_cost)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-default">
                        {formatCurrency(b.total_value)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-default">
              <thead className="bg-surface-sunken/70 text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-default">
                <tr>
                  <th className="px-4 py-3.5">Movement #</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Warehouse</th>
                  <th className="px-4 py-3.5">Batch</th>
                  <th className="px-4 py-3.5 text-right">Quantity</th>
                  <th className="px-4 py-3.5 text-right">Balance After</th>
                  <th className="px-4 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted">
                      {loading ? 'Loading ledger movements...' : 'No ledger movements found'}
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-sunken/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-semibold text-default">
                        {m.movement_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-default">
                          {m.direction === 'in' ? (
                            <ArrowDownLeft className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="size-3.5 text-rose-600 dark:text-rose-400" />
                          )}
                          <span className="capitalize">{m.movement_type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-default">{m.product_name ?? '—'}</div>
                        <div className="text-[11px] font-mono text-muted">
                          {m.product_sku ?? '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted">{m.warehouse_name ?? '—'}</td>
                      <td className="px-4 py-3.5 font-mono text-muted">{m.batch_code ?? '—'}</td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-bold ${
                          m.direction === 'in'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {m.direction === 'in' ? '+' : '-'}
                        {parseFloat(m.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-default">
                        {parseFloat(m.balance_after).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[11px] text-muted font-mono">
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
  );
}
