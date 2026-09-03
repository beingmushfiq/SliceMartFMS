import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Eye,
  Microscope,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { SelectDropdown } from '../../../components/ui/Dropdown';
import { Badge, StatusBadge } from '../../../components/ui/Badge';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { QcInspection, QcParameter } from '../../../types/api/qc';
import type { ProductionBatch } from '../../../types/api/production';
import type { Product } from '../../../types/api/catalog';

interface CreateInspectionDraft {
  batch_id?: string | undefined;
  product_id: string;
  inspection_type: 'incoming' | 'in_process' | 'final';
  sample_size: string;
  inspected_quantity: string;
  passed_quantity: string;
  rejected_quantity: string;
  inspection_date: string;
  notes?: string;
  results: {
    qc_parameter_id: string;
    measured_value?: string;
    is_passed: boolean;
    remarks?: string;
  }[];
  defects: {
    defect_type: string;
    severity: 'minor' | 'major' | 'critical';
    quantity: string;
    description?: string;
  }[];
}

export function QcInspectionsSection() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QcInspection | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<CreateInspectionDraft>({
    product_id: '',
    inspection_type: 'in_process',
    sample_size: '10.0000',
    inspected_quantity: '10.0000',
    passed_quantity: '10.0000',
    rejected_quantity: '0.0000',
    inspection_date: new Date().toISOString().slice(0, 10),
    results: [],
    defects: [],
  });

  const queryClient = useQueryClient();

  // Queries
  const inspectionsQuery = useQuery({
    queryKey: ['qc', 'inspections', search, statusFilter, typeFilter],
    queryFn: ({ signal }) =>
      api.get<QcInspection[]>('/qc/inspections', {
        signal,
        params: {
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(typeFilter !== 'all' ? { inspection_type: typeFilter } : {}),
        },
      }),
  });

  const batchesQuery = useQuery({
    queryKey: ['production', 'batches', 'options'],
    queryFn: ({ signal }) => api.get<ProductionBatch[]>('/production/batches', { signal }),
  });

  const productsQuery = useQuery({
    queryKey: ['catalogue', 'products', 'options'],
    queryFn: ({ signal }) => api.get<Product[]>('/products', { signal }),
  });

  const paramsQuery = useQuery({
    queryKey: ['qc', 'parameters', 'options'],
    queryFn: ({ signal }) => api.get<QcParameter[]>('/qc/parameters', { signal }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateInspectionDraft) =>
      api.post<QcInspection>('/qc/inspections', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['qc', 'inspections'] });
      setIsCreateOpen(false);
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) setErrorMsg(err.message ?? 'Failed to log QC inspection.');
      else setErrorMsg('Error logging QC inspection.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post<QcInspection>(`/qc/inspections/${id}/approve`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['qc', 'inspections'] });
      if (selectedInspection) {
        setSelectedInspection((insp) => (insp ? { ...insp, status: 'passed' } : null));
      }
    },
  });

  const inspections = inspectionsQuery.data?.data ?? [];
  const batches = batchesQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
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
              placeholder="Search by inspection number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface-sunken py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft', colorDot: 'bg-slate-400' },
              { value: 'in_progress', label: 'In Progress', colorDot: 'bg-blue-500' },
              { value: 'passed', label: 'Passed', colorDot: 'bg-emerald-500' },
              { value: 'rework', label: 'Rework', colorDot: 'bg-amber-500' },
              { value: 'rejected', label: 'Rejected', colorDot: 'bg-rose-500' },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            size="sm"
            aria-label="Filter inspections by status"
          />

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'incoming', label: 'Incoming', colorDot: 'bg-cyan-500' },
              { value: 'in_process', label: 'In-Process', colorDot: 'bg-indigo-500' },
              { value: 'final', label: 'Final QC', colorDot: 'bg-emerald-500' },
            ]}
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            size="sm"
            aria-label="Filter inspections by type"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            if (products.length > 0) {
              setDraft({
                ...(batches[0]?.id ? { batch_id: batches[0].id } : {}),
                product_id: products[0]?.id ?? '',
                inspection_type: 'in_process',
                sample_size: '10.0000',
                inspected_quantity: '10.0000',
                passed_quantity: '10.0000',
                rejected_quantity: '0.0000',
                inspection_date: new Date().toISOString().slice(0, 10),
                results: parameters.slice(0, 3).map((p) => ({
                  qc_parameter_id: p.id,
                  measured_value: p.target_value ?? '1.0000',
                  is_passed: true,
                })),
                defects: [],
              });
            }
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New QC Inspection</span>
        </Button>
      </div>

      {/* Table */}
      <QueryBoundary
        status={inspectionsQuery.status}
        error={inspectionsQuery.error}
        data={inspectionsQuery.data}
        isFetching={inspectionsQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Inspection No</th>
                <th className="py-3.5 px-3">Type & Date</th>
                <th className="py-3.5 px-3">Product / Batch</th>
                <th className="py-3.5 px-3">Sample / Inspected</th>
                <th className="py-3.5 px-3">Pass / Reject Qty</th>
                <th className="py-3.5 px-3">Disposition</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {inspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken border border-default mb-2">
                      <Microscope className="h-5 w-5 text-muted" />
                    </div>
                    <div className="text-sm font-medium text-default">No QC inspections found</div>
                    <div className="text-xs text-muted mt-1">
                      Execute standard quality checks against production batches or raw materials.
                    </div>
                  </td>
                </tr>
              ) : (
                inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {insp.inspection_number}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="capitalize font-medium text-default">
                        {insp.inspection_type.replace('_', ' ')}
                      </div>
                      <div className="text-[10px] text-muted">{insp.inspection_date}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-default font-medium">{insp.product_name ?? insp.product_id}</div>
                      {insp.batch_number && (
                        <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                          Batch: {insp.batch_number}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-muted">
                      {insp.sample_size} <span className="text-muted">/</span>{' '}
                      {insp.inspected_quantity}
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{insp.passed_quantity}</span>
                      <span className="text-muted"> / </span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">{insp.rejected_quantity}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={insp.status} />
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {insp.status !== 'passed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => approveMutation.mutate(insp.id)}
                            disabled={approveMutation.isPending}
                            className="text-xs text-emerald-600 dark:text-emerald-400"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInspection(insp)}
                          className="text-xs text-muted hover:text-default"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* Create Inspection Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Execute QC Inspection"
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
                Inspection Type
              </label>
              <select
                value={draft.inspection_type}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    inspection_type: e.target.value as 'incoming' | 'in_process' | 'final',
                  }))
                }
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="incoming">Incoming Raw Material</option>
                <option value="in_process">In-Process Floor Check</option>
                <option value="final">Final Finished Good QA</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Production Batch
              </label>
              <select
                value={draft.batch_id ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    ...(e.target.value ? { batch_id: e.target.value } : { batch_id: undefined }),
                  }))
                }
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="">None (Independent)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Product Inspected
              </label>
              <select
                value={draft.product_id}
                onChange={(e) => setDraft((d) => ({ ...d, product_id: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Inspection Date
              </label>
              <input
                type="date"
                value={draft.inspection_date}
                onChange={(e) => setDraft((d) => ({ ...d, inspection_date: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Sample Size
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.sample_size}
                onChange={(e) => setDraft((d) => ({ ...d, sample_size: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-default font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Passed Qty
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.passed_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, passed_quantity: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-emerald-600 dark:text-emerald-400 font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Rejected Qty
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.rejected_quantity}
                onChange={(e) => setDraft((d) => ({ ...d, rejected_quantity: e.target.value }))}
                className="w-full rounded-xl border border-default bg-surface-sunken p-2 text-xs text-rose-600 dark:text-rose-400 font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-default">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate(draft)}
              disabled={createMutation.isPending || !draft.product_id}
            >
              {createMutation.isPending ? 'Logging...' : 'Save Inspection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details View Modal */}
      {selectedInspection && (
        <Modal
          open={Boolean(selectedInspection)}
          onClose={() => setSelectedInspection(null)}
          title={`Inspection Details: ${selectedInspection.inspection_number}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-surface-sunken p-3 border border-default">
              <div>
                <div className="text-sm font-semibold text-default">
                  {selectedInspection.product_name ?? selectedInspection.product_id}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Type: {selectedInspection.inspection_type} · Date:{' '}
                  {selectedInspection.inspection_date}
                </div>
              </div>
              <div>
                <StatusBadge status={selectedInspection.status} />
              </div>
            </div>

            {/* Results Table */}
            {selectedInspection.results && selectedInspection.results.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Measured Parameter Tests
                </div>
                <div className="rounded-xl border border-default overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-sunken text-muted border-b border-default">
                      <tr>
                        <th className="p-2.5">Parameter</th>
                        <th className="p-2.5">Measured Value</th>
                        <th className="p-2.5 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-default bg-surface">
                      {selectedInspection.results.map((res) => (
                        <tr key={res.id}>
                          <td className="p-2.5 text-default font-medium">
                            {res.parameter_name ?? res.qc_parameter_id}
                          </td>
                          <td className="p-2.5 font-mono text-muted">
                            {res.measured_value ?? res.measured_text ?? 'N/A'}
                          </td>
                          <td className="p-2.5 text-right">
                            {res.is_passed ? (
                              <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5" /> Fail
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Defects Table */}
            {selectedInspection.defects && selectedInspection.defects.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Logged Defect Records</span>
                </div>
                <div className="rounded-xl border border-rose-500/20 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-b border-rose-500/20">
                      <tr>
                        <th className="p-2.5">Defect Type</th>
                        <th className="p-2.5">Severity</th>
                        <th className="p-2.5">Defective Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-500/10 bg-surface">
                      {selectedInspection.defects.map((def) => (
                        <tr key={def.id}>
                          <td className="p-2.5 text-default font-medium">{def.defect_type}</td>
                          <td className="p-2.5 uppercase font-semibold text-[10px]">
                            {def.severity === 'critical' ? (
                              <Badge tone="danger-subtle">Critical</Badge>
                            ) : (
                              <Badge tone="warning-subtle">{def.severity}</Badge>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-rose-600 dark:text-rose-400 font-bold">{def.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-surface-sunken border border-default text-xs font-mono">
              <div>
                <span className="text-[10px] text-muted font-sans uppercase">Inspected</span>
                <div className="font-bold text-default">{selectedInspection.inspected_quantity}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted font-sans uppercase">Passed</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{selectedInspection.passed_quantity}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted font-sans uppercase">Rejected</span>
                <div className="font-bold text-rose-600 dark:text-rose-400">{selectedInspection.rejected_quantity}</div>
              </div>
            </div>

            {/* QC Stamp Sticker Preview */}
            <div className="p-4 rounded-xl bg-surface-sunken border border-default flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                  selectedInspection.status === 'passed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                }`}>
                  QC
                </div>
                <div>
                  <div className="font-bold text-xs text-default">
                    {selectedInspection.status === 'passed' ? 'CERTIFIED PASSED STAMP' : 'REWORK / DEFECT FLAG'}
                  </div>
                  <div className="text-[10px] text-muted font-mono">
                    Stamp ID: QC-STAMP-{selectedInspection.id}-{new Date().getFullYear()}
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
                className="text-xs"
              >
                Print QC Sticker
              </Button>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-default">
              {parseFloat(selectedInspection.rejected_quantity || '0') > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    alert(`Rework Batch successfully generated for ${selectedInspection.rejected_quantity} units of ${selectedInspection.product_name ?? 'Product'}. Assigned to Rework Cell #1.`);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                  ⚡ Convert to Rework Batch ({selectedInspection.rejected_quantity} pcs)
                </Button>
              )}
              <Button variant="secondary" onClick={() => setSelectedInspection(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
