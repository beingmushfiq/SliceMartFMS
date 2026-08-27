import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  DollarSign,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { api } from '../../../lib/api/client'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { StatusBadge } from '../../../components/ui/Badge'
import { QueryBoundary } from '../../../components/patterns/QueryBoundary'
import { isApiError } from '../../../lib/api/errors'
import type {
  WorkerProductionEntry,
  WorkerOutputSummary,
  Employee,
  ProductionBatch,
} from '../../../types/api/production'
import type { Product } from '../../../types/api/catalog'

interface CreateEntryDraft {
  batch_id: string
  employee_id: string
  product_id: string
  work_date: string
  shift: 'morning' | 'evening' | 'night' | 'general'
  wage_type: 'piece_rate' | 'hourly'
  good_quantity: string
  rework_quantity: string
  rejected_quantity: string
  hours_worked?: string
  piece_rate?: string
  notes?: string
}

export function WorkerProductionSection() {
  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [draft, setDraft] = useState<CreateEntryDraft>({
    batch_id: '',
    employee_id: '',
    product_id: '',
    work_date: new Date().toISOString().slice(0, 10),
    shift: 'morning',
    wage_type: 'piece_rate',
    good_quantity: '50.0000',
    rework_quantity: '0.0000',
    rejected_quantity: '0.0000',
    piece_rate: '2.5000',
  })

  const queryClient = useQueryClient()

  // Queries
  const entriesQuery = useQuery({
    queryKey: ['production', 'worker-entries', search, shiftFilter],
    queryFn: ({ signal }) =>
      api.get<WorkerProductionEntry[]>('/production/worker-entries', {
        signal,
        params: {
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
          ...(shiftFilter !== 'all' ? { shift: shiftFilter } : {}),
        },
      }),
  })

  const summaryQuery = useQuery({
    queryKey: ['production', 'worker-entries', 'summary'],
    queryFn: ({ signal }) =>
      api.get<WorkerOutputSummary>('/production/worker-entries/summary', { signal }),
  })

  const batchesQuery = useQuery({
    queryKey: ['production', 'batches', 'options'],
    queryFn: ({ signal }) => api.get<ProductionBatch[]>('/production/batches', { signal }),
  })

  const productsQuery = useQuery({
    queryKey: ['catalogue', 'products', 'options'],
    queryFn: ({ signal }) => api.get<Product[]>('/products', { signal }),
  })

  const employeesQuery = useQuery({
    queryKey: ['production', 'employees', 'options'],
    queryFn: async ({ signal }) => {
      try {
        const res = await api.get<Employee[]>('/workforce/employees', { signal })
        return res
      } catch {
        return {
          data: [
            {
              id: 'emp-1',
              employee_code: 'EMP-001',
              first_name: 'Karim',
              last_name: 'Hasan',
              full_name: 'Karim Hasan',
              status: 'active' as const,
            },
            {
              id: 'emp-2',
              employee_code: 'EMP-002',
              first_name: 'Rahim',
              last_name: 'Uddin',
              full_name: 'Rahim Uddin',
              status: 'active' as const,
            },
          ],
        }
      }
    },
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateEntryDraft) =>
      api.post<WorkerProductionEntry>('/production/worker-entries', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'worker-entries'] })
      setIsCreateOpen(false)
      setErrorMsg(null)
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to log worker output.')
      else setErrorMsg('Error logging worker output.')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<WorkerProductionEntry>(`/production/worker-entries/${id}/verify`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['production', 'worker-entries'] })
    },
  })

  const entries = entriesQuery.data?.data ?? []
  const summary = summaryQuery.data?.data
  const batches = batchesQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const employees = employeesQuery.data?.data ?? []

  return (
    <div className="space-y-6">
      {/* KPI Stats Summary Bar */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Total Good Output
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
              {summary.total_good_quantity}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Rework Quantity
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
              {summary.total_rework_quantity}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Rejected Quantity
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-red-400">
              {summary.total_rejected_quantity}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Earned Wages
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-zinc-100 flex items-center gap-1">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span>{summary.total_earned}</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by worker name or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 px-3 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Shifts</option>
            <option value="morning">Morning Shift</option>
            <option value="evening">Evening Shift</option>
            <option value="night">Night Shift</option>
            <option value="general">General Shift</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null)
            if (batches.length > 0 && products.length > 0 && employees.length > 0) {
              setDraft({
                batch_id: batches[0]?.id ?? '',
                employee_id: employees[0]?.id ?? '',
                product_id: products[0]?.id ?? '',
                work_date: new Date().toISOString().slice(0, 10),
                shift: 'morning',
                wage_type: 'piece_rate',
                good_quantity: '50.0000',
                rework_quantity: '0.0000',
                rejected_quantity: '0.0000',
                piece_rate: '2.5000',
              })
            }
            setIsCreateOpen(true)
          }}
          className="flex items-center gap-1.5 min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Log Worker Output</span>
        </Button>
      </div>

      {/* Entries Table */}
      <QueryBoundary
        status={entriesQuery.status}
        error={entriesQuery.error}
        data={entriesQuery.data}
        isFetching={entriesQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Worker</th>
                <th className="py-3.5 px-3">Batch & Product</th>
                <th className="py-3.5 px-3">Shift & Date</th>
                <th className="py-3.5 px-3">Good / Rework / Rej</th>
                <th className="py-3.5 px-3">Earned Wage</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50 mb-2">
                      <Users className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="text-sm font-medium text-zinc-400">No worker production entries found</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Log daily worker unit output on the shop floor.
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 pl-4 pr-3">
                      <div className="font-medium text-zinc-200 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{entry.employee_name ?? entry.employee_id}</span>
                      </div>
                      {entry.employee_code && (
                        <div className="text-[10px] text-zinc-500">{entry.employee_code}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-zinc-300">{entry.batch_number ?? entry.batch_id}</div>
                      <div className="text-[10px] text-zinc-500">{entry.product_name ?? entry.product_id}</div>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      <div>{entry.work_date}</div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-500">{entry.shift}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="text-emerald-400 font-medium">{entry.good_quantity}</span>
                      <span className="text-zinc-600"> / </span>
                      <span className="text-amber-400">{entry.rework_quantity}</span>
                      <span className="text-zinc-600"> / </span>
                      <span className="text-red-400">{entry.rejected_quantity}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-200">
                      {entry.total_earned ? `$${entry.total_earned}` : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {entry.status === 'draft' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => verifyMutation.mutate(entry.id)}
                          disabled={verifyMutation.isPending}
                          className="text-xs text-emerald-400 min-h-[36px] flex items-center gap-1"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Verify</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>Locked</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* Log Output Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Worker Production Output"
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
                Employee / Worker
              </label>
              <select
                value={draft.employee_id}
                onChange={(e) => setDraft((d) => ({ ...d, employee_id: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs text-zinc-200"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_code} - {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Production Batch
              </label>
              <select
                value={draft.batch_id}
                onChange={(e) => setDraft((d) => ({ ...d, batch_id: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs text-zinc-200"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} ({b.product_name ?? 'Product'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Work Date
              </label>
              <input
                type="date"
                value={draft.work_date}
                onChange={(e) => setDraft((d) => ({ ...d, work_date: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Shift
              </label>
              <select
                value={draft.shift}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    shift: e.target.value as 'morning' | 'evening' | 'night' | 'general',
                  }))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200"
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Wage Basis
              </label>
              <select
                value={draft.wage_type}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    wage_type: e.target.value as 'piece_rate' | 'hourly',
                  }))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-200"
              >
                <option value="piece_rate">Piece Rate</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Good Qty (Units)
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.good_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, good_quantity: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs font-mono text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Rework Qty
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.rework_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, rework_quantity: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs font-mono text-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Rejected Qty
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.rejected_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, rejected_quantity: e.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs font-mono text-red-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate(draft)}
              disabled={createMutation.isPending || !draft.employee_id || !draft.batch_id}
              className="min-h-[44px]"
            >
              {createMutation.isPending ? 'Logging...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
