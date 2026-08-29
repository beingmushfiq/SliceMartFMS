import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Sliders, Plus, Search, XCircle } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { QcParameter } from '../../../types/api/qc';

interface CreateParameterDraft {
  code: string;
  name: string;
  category: string;
  data_type: 'numeric' | 'boolean' | 'options' | 'text';
  min_value?: string;
  max_value?: string;
  target_value?: string;
  unit_of_measure?: string;
  is_mandatory: boolean;
}

export function QcParametersSection() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<CreateParameterDraft>({
    code: '',
    name: '',
    category: 'physical',
    data_type: 'numeric',
    min_value: '0.0000',
    max_value: '100.0000',
    target_value: '50.0000',
    unit_of_measure: 'mm',
    is_mandatory: true,
  });

  const queryClient = useQueryClient();

  const paramsQuery = useQuery({
    queryKey: ['qc', 'parameters', search, categoryFilter],
    queryFn: ({ signal }) =>
      api.get<QcParameter[]>('/qc/parameters', {
        signal,
        params: {
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
          ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
        },
      }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateParameterDraft) => api.post<QcParameter>('/qc/parameters', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['qc', 'parameters'] });
      setIsCreateOpen(false);
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to create parameter.');
      else setErrorMsg('Error creating QC parameter.');
    },
  });

  const parameters = paramsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search parameters by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface-sunken py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-default bg-surface-sunken py-2 px-3 text-xs text-default focus:border-primary focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="physical">Physical Inspection</option>
            <option value="chemical">Chemical Analysis</option>
            <option value="microbiological">Microbiological</option>
            <option value="packaging">Packaging Quality</option>
            <option value="sensory">Sensory & Taste</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            setDraft({
              code: `QC-${Date.now().toString().slice(-4)}`,
              name: '',
              category: 'physical',
              data_type: 'numeric',
              min_value: '0.0000',
              max_value: '100.0000',
              target_value: '50.0000',
              unit_of_measure: 'mm',
              is_mandatory: true,
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New QC Parameter</span>
        </Button>
      </div>

      {/* Table */}
      <QueryBoundary
        status={paramsQuery.status}
        error={paramsQuery.error}
        data={paramsQuery.data}
        isFetching={paramsQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Parameter Code</th>
                <th className="py-3.5 px-3">Name & Category</th>
                <th className="py-3.5 px-3">Type & Unit</th>
                <th className="py-3.5 px-3">Tolerance Specs</th>
                <th className="py-3.5 px-3">Mandatory</th>
                <th className="py-3.5 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {parameters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken border border-default mb-2">
                      <Sliders className="h-5 w-5 text-muted" />
                    </div>
                    <div className="text-sm font-medium text-default">
                      No QC parameters configured
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Configure your standard quality specs and tolerance bands.
                    </div>
                  </td>
                </tr>
              ) : (
                parameters.map((param) => (
                  <tr key={param.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {param.code}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-default">{param.name}</div>
                      <div className="text-[10px] text-muted uppercase">{param.category}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="capitalize text-default">{param.data_type}</div>
                      {param.unit_of_measure && (
                        <div className="text-[10px] text-muted">
                          Unit: {param.unit_of_measure}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-muted">
                      {param.data_type === 'numeric' ? (
                        <span>
                          [{param.min_value ?? '-∞'} ..{' '}
                          <strong className="text-emerald-600 dark:text-emerald-400">{param.target_value}</strong> ..{' '}
                          {param.max_value ?? '+∞'}]
                        </span>
                      ) : (
                        <span className="italic text-muted">Discrete check</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {param.is_mandatory ? (
                        <Badge tone="warning-subtle">Mandatory</Badge>
                      ) : (
                        <Badge tone="surface-sunken">Optional</Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {param.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Inactive</span>
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

      {/* Create Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add QC Standard Parameter"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Parameter Code
              </label>
              <input
                type="text"
                value={draft.code}
                onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
                placeholder="e.g. QC-WT-01"
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Parameter Name
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Net Unit Weight"
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="physical">Physical Inspection</option>
                <option value="chemical">Chemical Analysis</option>
                <option value="microbiological">Microbiological</option>
                <option value="packaging">Packaging Quality</option>
                <option value="sensory">Sensory & Taste</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Data Type
              </label>
              <select
                value={draft.data_type}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    data_type: e.target.value as 'numeric' | 'boolean' | 'options' | 'text',
                  }))
                }
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="numeric">Numeric (Measurement)</option>
                <option value="boolean">Boolean (Pass/Fail)</option>
                <option value="text">Text Notes</option>
              </select>
            </div>
          </div>

          {draft.data_type === 'numeric' && (
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-muted uppercase">Min Value</label>
                <input
                  type="number"
                  step="0.0001"
                  value={draft.min_value}
                  onChange={(e) => setDraft((d) => ({ ...d, min_value: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted uppercase">Target Value</label>
                <input
                  type="number"
                  step="0.0001"
                  value={draft.target_value}
                  onChange={(e) => setDraft((d) => ({ ...d, target_value: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted uppercase">Max Value</label>
                <input
                  type="number"
                  step="0.0001"
                  value={draft.max_value}
                  onChange={(e) => setDraft((d) => ({ ...d, max_value: e.target.value }))}
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted uppercase">Unit of Measure</label>
                <input
                  type="text"
                  value={draft.unit_of_measure}
                  onChange={(e) => setDraft((d) => ({ ...d, unit_of_measure: e.target.value }))}
                  placeholder="e.g. g, ml, mm"
                  className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-default">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate(draft)}
              disabled={createMutation.isPending || !draft.code || !draft.name}
            >
              {createMutation.isPending ? 'Saving...' : 'Create Parameter'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
