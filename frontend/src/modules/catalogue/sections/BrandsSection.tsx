import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Plus, Search } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { Brand } from '../../../types/api/catalog';

interface CreateBrandForm {
  code: string;
  name: string;
  logo_path?: string | null;
}

export function BrandsSection() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateBrandForm>({ code: '', name: '', logo_path: null });

  const queryClient = useQueryClient();

  const brandsQuery = useQuery({
    queryKey: ['catalogue', 'brands', search],
    queryFn: ({ signal }) =>
      api.get<Brand[]>('/brands', {
        signal,
        params: search.trim().length >= 2 ? { q: search.trim() } : {},
      }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateBrandForm) => api.post<Brand>('/brands', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'brands'] });
      setIsCreateOpen(false);
      setDraft({ code: '', name: '', logo_path: null });
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.code === 'DUPLICATE') setErrorMsg('Brand code already exists.');
        else setErrorMsg(err.message ?? 'Failed to create brand.');
      } else {
        setErrorMsg('Error creating brand.');
      }
    },
  });

  const brands = brandsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-default bg-surface-sunken py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Brand</span>
        </Button>
      </div>

      <QueryBoundary
        status={brandsQuery.status}
        error={brandsQuery.error}
        data={brandsQuery.data}
        isFetching={brandsQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Code</th>
                <th className="py-3.5 px-3">Name</th>
                <th className="py-3.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted">
                    No brands found.
                  </td>
                </tr>
              ) : (
                brands.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {b.code}
                    </td>
                    <td className="py-3.5 px-3 text-default font-medium flex items-center gap-2">
                      <Boxes className="h-3.5 w-3.5 text-muted" />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          b.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-surface-sunken text-muted border border-default'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
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
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Brand">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(draft);
          }}
          className="space-y-4"
        >
          {errorMsg && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-default mb-1">Code *</label>
            <input
              required
              type="text"
              placeholder="e.g. SLICE, WALTON"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default focus:border-primary focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-default mb-1">Brand Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Slice Premium"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-default">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Brand'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
