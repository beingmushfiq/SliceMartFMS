import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Tag } from 'lucide-react'
import { api } from '../../../lib/api/client'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { QueryBoundary } from '../../../components/patterns/QueryBoundary'
import { isApiError } from '../../../lib/api/errors'
import type { Category } from '../../../types/api/catalog'

interface CreateCategoryForm {
  code: string
  name: string
  parent_id?: string | null
}

export function CategoriesSection() {
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [draft, setDraft] = useState<CreateCategoryForm>({ code: '', name: '', parent_id: null })

  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['catalogue', 'categories', search],
    queryFn: ({ signal }) =>
      api.get<Category[]>('/categories', {
        signal,
        params: search.trim().length >= 2 ? { q: search.trim() } : {},
      }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateCategoryForm) => api.post<Category>('/categories', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'categories'] })
      setIsCreateOpen(false)
      setDraft({ code: '', name: '', parent_id: null })
      setErrorMsg(null)
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.code === 'DUPLICATE') setErrorMsg('Category code already exists.')
        else setErrorMsg(err.message ?? 'Failed to create category.')
      } else {
        setErrorMsg('Error creating category.')
      }
    },
  })

  const categories = categoriesQuery.data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null)
            setIsCreateOpen(true)
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </Button>
      </div>

      <QueryBoundary
        status={categoriesQuery.status}
        error={categoriesQuery.error}
        data={categoriesQuery.data}
        isFetching={categoriesQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Code</th>
                <th className="py-3.5 px-3">Name</th>
                <th className="py-3.5 px-3">Path</th>
                <th className="py-3.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    No product categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 font-mono font-medium text-emerald-400">
                      {c.code}
                    </td>
                    <td className="py-3.5 px-3 text-zinc-100 font-medium flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-zinc-500">{c.path ?? '-'}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          c.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* Create Modal */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Product Category">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(draft)
          }}
          className="space-y-4"
        >
          {errorMsg && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Code *</label>
            <input
              required
              type="text"
              placeholder="e.g. COOKERS, APPLIANCES"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Category Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Infrared Cookers"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Parent Category (Optional)</label>
            <select
              value={draft.parent_id ?? ''}
              onChange={(e) => setDraft({ ...draft, parent_id: e.target.value || null })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">None (Top-level Category)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
