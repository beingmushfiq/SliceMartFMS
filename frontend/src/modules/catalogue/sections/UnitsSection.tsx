import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Ruler, Search } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { Unit } from '../../../types/api/unit';

interface CreateUnitForm {
  code: string;
  name: string;
  type: string;
  is_base: boolean;
  precision: number;
}

export function UnitsSection() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateUnitForm>({
    code: '',
    name: '',
    type: 'piece',
    is_base: true,
    precision: 2,
  });

  const queryClient = useQueryClient();

  const unitsQuery = useQuery({
    queryKey: ['catalogue', 'units', search],
    queryFn: ({ signal }) =>
      api.get<Unit[]>('/units', {
        signal,
        params: search.trim().length >= 2 ? { q: search.trim() } : {},
      }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUnitForm) => api.post<Unit>('/units', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'units'] });
      setIsCreateOpen(false);
      setDraft({ code: '', name: '', type: 'piece', is_base: true, precision: 2 });
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.code === 'DUPLICATE') setErrorMsg('Unit code already exists.');
        else setErrorMsg(err.message ?? 'Failed to create unit.');
      } else {
        setErrorMsg('Error creating unit.');
      }
    },
  });

  const units = unitsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search units..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
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
          <span>New Unit</span>
        </Button>
      </div>

      <QueryBoundary
        status={unitsQuery.status}
        error={unitsQuery.error}
        data={unitsQuery.data}
        isFetching={unitsQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Code</th>
                <th className="py-3.5 px-3">Name</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Is Base</th>
                <th className="py-3.5 px-3">Precision</th>
                <th className="py-3.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {units.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No measurement units found.
                  </td>
                </tr>
              ) : (
                units.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 font-mono font-medium text-emerald-400">
                      {u.code}
                    </td>
                    <td className="py-3.5 px-3 text-zinc-100 font-medium">{u.name}</td>
                    <td className="py-3.5 px-3 capitalize">
                      <span className="inline-flex items-center gap-1 text-zinc-400">
                        <Ruler className="h-3 w-3" />
                        {u.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          u.is_base
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {u.is_base ? 'Base Unit' : 'Derived'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono">{u.precision} decimal(s)</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          u.is_active
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
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
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Unit of Measurement"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(draft);
          }}
          className="space-y-4"
        >
          {errorMsg && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. PCS, KG, LTR"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Type *</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="piece">Piece (Discrete)</option>
                <option value="weight">Weight</option>
                <option value="volume">Volume</option>
                <option value="length">Length</option>
                <option value="area">Area</option>
                <option value="time">Time</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Pieces, Kilogram, Litre"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Decimal Precision
              </label>
              <input
                type="number"
                min="0"
                max="4"
                value={draft.precision}
                onChange={(e) =>
                  setDraft({ ...draft, precision: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="is_base"
                checked={draft.is_base}
                onChange={(e) => setDraft({ ...draft, is_base: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <label htmlFor="is_base" className="text-xs text-zinc-300">
                Is Base Unit
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Unit'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
