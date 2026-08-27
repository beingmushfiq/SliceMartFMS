import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertOctagon, DollarSign, Plus, Search, Trash2 } from 'lucide-react'
import { api } from '../../../lib/api/client'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { QueryBoundary } from '../../../components/patterns/QueryBoundary'
import { isApiError } from '../../../lib/api/errors'
import type { WastageRecord } from '../../../types/api/qc'
import type { ProductionBatch } from '../../../types/api/production'
import type { Product, Warehouse } from '../../../types/api/catalog'
import type { Unit } from '../../../types/api/unit'

interface ReasonCodeOption {
  id: string
  label: string
  code: string
  name: string
  context: string
}

interface CreateWastageDraft {
  wastage_number: string
  product_id: string
  production_batch_id?: string | undefined
  stage: 'input' | 'in_process' | 'output' | 'qc' | 'storage' | 'transit'
  quantity: string
  unit_id: string
  reason_code_id: string
  estimated_cost: string
  is_recoverable: boolean
  recovered_quantity?: string | undefined
  warehouse_id?: string | undefined
  notes?: string | undefined
}

export function WastageRecordsSection() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [draft, setDraft] = useState<CreateWastageDraft>({
    wastage_number: '',
    product_id: '',
    stage: 'in_process',
    quantity: '5.0000',
    unit_id: '',
    reason_code_id: '',
    estimated_cost: '25.0000',
    is_recoverable: false,
  })

  const queryClient = useQueryClient()

  // Queries
  const wastageQuery = useQuery({
    queryKey: ['qc', 'wastage-records', search, stageFilter],
    queryFn: ({ signal }) =>
      api.get<WastageRecord[]>('/qc/wastage-records', {
        signal,
        params: {
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
          ...(stageFilter !== 'all' ? { stage: stageFilter } : {}),
        },
      }),
  })

  const productsQuery = useQuery({
    queryKey: ['catalogue', 'products', 'options'],
    queryFn: ({ signal }) => api.get<Product[]>('/products', { signal }),
  })

  const unitsQuery = useQuery({
    queryKey: ['catalogue', 'units', 'options'],
    queryFn: ({ signal }) => api.get<Unit[]>('/units', { signal }),
  })

  const batchesQuery = useQuery({
    queryKey: ['production', 'batches', 'options'],
    queryFn: ({ signal }) => api.get<ProductionBatch[]>('/production/batches', { signal }),
  })

  const warehousesQuery = useQuery({
    queryKey: ['catalogue', 'warehouses', 'options'],
    queryFn: ({ signal }) => api.get<Warehouse[]>('/warehouses', { signal }),
  })

  const reasonCodesQuery = useQuery({
    queryKey: ['catalogue', 'reason-codes', 'options'],
    queryFn: ({ signal }) => api.get<ReasonCodeOption[]>('/reason-codes/options', { signal }),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateWastageDraft) =>
      api.post<WastageRecord>('/qc/wastage-records', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['qc', 'wastage-records'] })
      setIsCreateOpen(false)
      setErrorMsg(null)
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to log wastage record.')
      else setErrorMsg('Error logging wastage record.')
    },
  })

  const records = wastageQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const units = unitsQuery.data?.data ?? []
  const batches = batchesQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []
  const reasonCodes = reasonCodesQuery.data?.data ?? []

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by wastage number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 px-3 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="input">Material Input</option>
            <option value="in_process">In-Process</option>
            <option value="output">Output Sorting</option>
            <option value="qc">QC Rejection</option>
            <option value="storage">Storage Loss</option>
            <option value="transit">In Transit</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null)
            if (products.length > 0 && units.length > 0 && reasonCodes.length > 0) {
              setDraft({
                wastage_number: `WST-${Date.now().toString().slice(-6)}`,
                product_id: products[0]?.id ?? '',
                stage: 'in_process',
                quantity: '5.0000',
                unit_id: units[0]?.id ?? '',
                reason_code_id: reasonCodes[0]?.id ?? '',
                estimated_cost: '25.0000',
                is_recoverable: false,
                ...(warehouses[0]?.id ? { warehouse_id: warehouses[0].id } : {}),
              })
            }
            setIsCreateOpen(true)
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Wastage Record</span>
        </Button>
      </div>

      {/* Table */}
      <QueryBoundary
        status={wastageQuery.status}
        error={wastageQuery.error}
        data={wastageQuery.data}
        isFetching={wastageQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Record Number</th>
                <th className="py-3.5 px-3">Product / Batch</th>
                <th className="py-3.5 px-3">Process Stage</th>
                <th className="py-3.5 px-3">Reason Code</th>
                <th className="py-3.5 px-3">Quantity</th>
                <th className="py-3.5 px-3">Cost Impact</th>
                <th className="py-3.5 pr-4 text-right">Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50 mb-2">
                      <Trash2 className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="text-sm font-medium text-zinc-400">No wastage records found</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Track process scrap, damaged materials and manufacturing shrinkage.
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-emerald-400">
                      {rec.record_number}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-zinc-200 font-medium">{rec.product_name ?? rec.product_id}</div>
                      {rec.batch_number && (
                        <div className="text-[10px] font-mono text-zinc-500">
                          Batch: {rec.batch_number}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 capitalize text-zinc-300">
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium">
                        {rec.recorded_date}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-zinc-300 flex items-center gap-1">
                        <AlertOctagon className="h-3.5 w-3.5 text-amber-400" />
                        <span>{rec.reason_name ?? rec.reason_code ?? 'Defect'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-red-400">
                      {rec.quantity}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-200 flex items-center gap-0.5">
                      <DollarSign className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{rec.total_cost}</span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Badge tone="surface-sunken">Scrapped</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* Create Wastage Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Scrap / Material Wastage"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Wastage Number
              </label>
              <input
                type="text"
                value={draft.wastage_number}
                onChange={(e) => setDraft((d) => ({ ...d, wastage_number: e.target.value }))}
                placeholder="e.g. WST-2026-001"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Process Stage
              </label>
              <select
                value={draft.stage}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    stage: e.target.value as CreateWastageDraft['stage'],
                  }))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200"
              >
                <option value="input">Material Input</option>
                <option value="in_process">In-Process</option>
                <option value="output">Output Sorting</option>
                <option value="qc">QC Rejection</option>
                <option value="storage">Storage Loss</option>
                <option value="transit">In Transit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Product / Material
              </label>
              <select
                value={draft.product_id}
                onChange={(e) => setDraft((d) => ({ ...d, product_id: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Batch (Optional)
              </label>
              <select
                value={draft.production_batch_id ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    ...(e.target.value ? { production_batch_id: e.target.value } : { production_batch_id: undefined }),
                  }))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200"
              >
                <option value="">None (Storage/Transit)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Scrapped Qty
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.quantity}
                onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-red-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Unit of Measure
              </label>
              <select
                value={draft.unit_id}
                onChange={(e) => setDraft((d) => ({ ...d, unit_id: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} ({u.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Reason Code
              </label>
              <select
                value={draft.reason_code_id}
                onChange={(e) => setDraft((d) => ({ ...d, reason_code_id: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200"
              >
                {reasonCodes.map((rc) => (
                  <option key={rc.id} value={rc.id}>
                    {rc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Estimated Cost Impact ($)
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.estimated_cost}
                onChange={(e) => setDraft((d) => ({ ...d, estimated_cost: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Warehouse / Location
              </label>
              <select
                value={draft.warehouse_id ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    ...(e.target.value ? { warehouse_id: e.target.value } : { warehouse_id: undefined }),
                  }))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate(draft)}
              disabled={createMutation.isPending || !draft.wastage_number || !draft.product_id}
            >
              {createMutation.isPending ? 'Logging...' : 'Save Record'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
