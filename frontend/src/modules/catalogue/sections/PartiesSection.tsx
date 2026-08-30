import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import { notify } from '../../../components/ui/Toast';
import type { Party } from '../../../types/api/party';

interface PartyFormDraft {
  code: string;
  name: string;
  legal_name?: string;
  is_customer: boolean;
  is_supplier: boolean;
  is_dealer: boolean;
  is_agent: boolean;
  type: string;
  phone?: string;
  email?: string;
  credit_limit: string;
  credit_days: number;
  line1?: string;
  city?: string;
  is_active?: boolean;
}

export function PartiesSection() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'customer' | 'supplier' | 'dealer' | 'agent'
  >('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [viewingParty, setViewingParty] = useState<Party | null>(null);
  const [deletingParty, setDeletingParty] = useState<Party | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<PartyFormDraft>({
    code: '',
    name: '',
    legal_name: '',
    is_customer: true,
    is_supplier: false,
    is_dealer: false,
    is_agent: false,
    type: 'business',
    phone: '',
    email: '',
    credit_limit: '0.0000',
    credit_days: 0,
    line1: '',
    city: 'Dhaka',
    is_active: true,
  });

  const queryClient = useQueryClient();

  const partiesQuery = useQuery({
    queryKey: ['catalogue', 'parties', search, roleFilter],
    queryFn: ({ signal }) => {
      const params: Record<string, string> = {};
      if (search.trim().length >= 2) params['q'] = search.trim();
      if (roleFilter === 'customer') params['is_customer'] = 'true';
      if (roleFilter === 'supplier') params['is_supplier'] = 'true';
      if (roleFilter === 'dealer') params['is_dealer'] = 'true';
      if (roleFilter === 'agent') params['is_agent'] = 'true';

      return api.get<Party[]>('/parties', { signal, params });
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: PartyFormDraft) => {
      const payload: Record<string, unknown> = {
        code: form.code,
        name: form.name,
        legal_name: form.legal_name || null,
        is_customer: form.is_customer,
        is_supplier: form.is_supplier,
        is_dealer: form.is_dealer,
        is_agent: form.is_agent,
        type: form.type,
        phone: form.phone || null,
        email: form.email || null,
        credit_limit: form.credit_limit,
        credit_days: form.credit_days,
      };

      if (form.line1 && form.city) {
        payload['addresses'] = [
          {
            type: 'billing',
            line1: form.line1,
            city: form.city,
            is_default: true,
          },
        ];
      }

      return api.post<Party>('/parties', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'parties'] });
      setIsCreateOpen(false);
      setDraft({
        code: '',
        name: '',
        legal_name: '',
        is_customer: true,
        is_supplier: false,
        is_dealer: false,
        is_agent: false,
        type: 'business',
        phone: '',
        email: '',
        credit_limit: '0.0000',
        credit_days: 0,
        line1: '',
        city: 'Dhaka',
        is_active: true,
      });
      setErrorMsg(null);
      notify.success('Party contact created successfully.');
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.code === 'DUPLICATE') setErrorMsg('Party code already in use.');
        else setErrorMsg(err.message ?? 'Failed to create party.');
      } else {
        setErrorMsg('Error creating party.');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PartyFormDraft> }) =>
      api.patch<Party>(`/parties/${id}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'parties'] });
      setEditingParty(null);
      setErrorMsg(null);
      notify.success('Party updated successfully.');
    },
    onError: (err) => {
      if (isApiError(err)) {
        setErrorMsg(err.message ?? 'Failed to update party.');
      } else {
        setErrorMsg('Error updating party.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/parties/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'parties'] });
      setDeletingParty(null);
      notify.success('Party deleted successfully.');
    },
    onError: (err) => {
      const msg = isApiError(err) ? err.message : 'Failed to delete party.';
      notify.error(msg);
    },
  });

  const handleOpenEdit = (p: Party) => {
    setErrorMsg(null);
    setDraft({
      code: p.code,
      name: p.name,
      legal_name: p.legal_name || '',
      is_customer: p.is_customer,
      is_supplier: p.is_supplier,
      is_dealer: p.is_dealer,
      is_agent: p.is_agent,
      type: p.type,
      phone: p.phone || '',
      email: p.email || '',
      credit_limit: p.credit_limit,
      credit_days: p.credit_days,
      line1: '',
      city: 'Dhaka',
      is_active: p.status === 'active',
    });
    setEditingParty(p);
  };

  const parties = partiesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by code, name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors shadow-2xs"
            />
          </div>

          <div className="flex overflow-x-auto rounded-xl border border-default bg-surface p-1 shadow-2xs">
            {(['all', 'customer', 'supplier', 'dealer', 'agent'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  roleFilter === r
                    ? 'bg-primary text-primary-fg shadow-2xs'
                    : 'text-muted hover:text-default'
                }`}
              >
                {r === 'all' ? 'All Parties' : `${r}s`}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setErrorMsg(null);
            setDraft({
              code: '',
              name: '',
              legal_name: '',
              is_customer: true,
              is_supplier: false,
              is_dealer: false,
              is_agent: false,
              type: 'business',
              phone: '',
              email: '',
              credit_limit: '0.0000',
              credit_days: 0,
              line1: '',
              city: 'Dhaka',
              is_active: true,
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Party</span>
        </Button>
      </div>

      {/* Parties Table */}
      <QueryBoundary
        status={partiesQuery.status}
        error={partiesQuery.error}
        data={partiesQuery.data}
        isFetching={partiesQuery.isFetching}
      >
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default border-collapse">
            <thead className="border-b border-default bg-surface-sunken/70 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Party Name & Code</th>
                <th className="py-3.5 px-3">Roles</th>
                <th className="py-3.5 px-3">Contact</th>
                <th className="py-3.5 px-3">Credit Limit</th>
                <th className="py-3.5 px-3">Current Balance</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {parties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted">
                    No parties found matching the criteria.
                  </td>
                </tr>
              ) : (
                parties.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-sunken/50 transition-colors">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="font-semibold text-default">{p.name}</div>
                      <div className="text-[11px] text-primary font-mono mt-0.5">{p.code}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {p.is_customer && (
                          <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                            Customer
                          </span>
                        )}
                        {p.is_supplier && (
                          <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                            Supplier
                          </span>
                        )}
                        {p.is_dealer && (
                          <span className="rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                            Dealer
                          </span>
                        )}
                        {p.is_agent && (
                          <span className="rounded bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-teal-600 dark:text-teal-400">
                            Agent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 space-y-0.5">
                      {p.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-muted">
                          <Phone className="size-3 text-muted" />
                          <span>{p.phone}</span>
                        </div>
                      )}
                      {p.email && (
                        <div className="flex items-center gap-1 text-[11px] text-muted">
                          <Mail className="size-3 text-muted" />
                          <span>{p.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-default">
                      {p.credit_limit} BDT
                      <div className="text-[10px] text-muted font-sans">{p.credit_days} days term</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      <span
                        className={
                          Number(p.current_balance) > 0
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : 'text-default'
                        }
                      >
                        {p.current_balance} BDT
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          p.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 pl-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingParty(p)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="View Party Details"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="Edit Party"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingParty(p)}
                          className="inline-flex items-center justify-center size-7 rounded-lg text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-sunken transition-colors cursor-pointer"
                          title="Delete Party"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </QueryBoundary>

      {/* Create Party Modal */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Party">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. CUST-001, SUP-004"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Entity Type</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              >
                <option value="business">Corporate / Business</option>
                <option value="individual">Individual / Retail</option>
                <option value="government">Government Body</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-default mb-1">Display Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Acme Supermarket Ltd."
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-default mb-1">Party Roles *</label>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-default">
                <input
                  type="checkbox"
                  checked={draft.is_customer}
                  onChange={(e) => setDraft({ ...draft, is_customer: e.target.checked })}
                  className="size-4 rounded border-default text-primary"
                />
                <span>Customer</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-default">
                <input
                  type="checkbox"
                  checked={draft.is_supplier}
                  onChange={(e) => setDraft({ ...draft, is_supplier: e.target.checked })}
                  className="size-4 rounded border-default text-primary"
                />
                <span>Supplier</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-default">
                <input
                  type="checkbox"
                  checked={draft.is_dealer}
                  onChange={(e) => setDraft({ ...draft, is_dealer: e.target.checked })}
                  className="size-4 rounded border-default text-primary"
                />
                <span>Dealer / Distributor</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-default">
                <input
                  type="checkbox"
                  checked={draft.is_agent}
                  onChange={(e) => setDraft({ ...draft, is_agent: e.target.checked })}
                  className="size-4 rounded border-default text-primary"
                />
                <span>Sales Agent</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Phone</label>
              <input
                type="text"
                placeholder="+880 1700-000000"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-default mb-1">Email</label>
              <input
                type="email"
                placeholder="contact@company.com"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Party'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Party Modal */}
      {editingParty && (
        <Modal
          open={Boolean(editingParty)}
          onClose={() => setEditingParty(null)}
          title={`Edit Party: ${editingParty.name}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingParty.id,
                payload: draft,
              });
            }}
            className="space-y-4"
          >
            {errorMsg && (
              <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-default mb-1">Code *</label>
                <input
                  required
                  type="text"
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-default mb-1">Entity Type</label>
                <select
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                >
                  <option value="business">Corporate / Business</option>
                  <option value="individual">Individual / Retail</option>
                  <option value="government">Government Body</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-default mb-1">Display Name *</label>
              <input
                required
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-default mb-1">Phone</label>
                <input
                  type="text"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-default mb-1">Email</label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="party_edit_is_active"
                checked={draft.is_active ?? true}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="size-4 rounded border-default text-primary focus:ring-primary/20"
              />
              <label htmlFor="party_edit_is_active" className="text-xs font-medium text-default">
                Active Party Status
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
              <Button variant="secondary" type="button" onClick={() => setEditingParty(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Party'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Party Modal */}
      {viewingParty && (
        <Modal
          open={Boolean(viewingParty)}
          onClose={() => setViewingParty(null)}
          title={`Party Record: ${viewingParty.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-sunken/60 border border-default">
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Code</span>
                <span className="font-mono font-bold text-primary text-sm">{viewingParty.code}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Type</span>
                <span className="font-medium text-default capitalize">{viewingParty.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Phone</span>
                <span className="font-mono text-default">{viewingParty.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Email</span>
                <span className="text-default">{viewingParty.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Credit Limit</span>
                <span className="font-mono text-default">{viewingParty.credit_limit} BDT</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Current Ledger Balance</span>
                <span className="font-mono font-bold text-default">{viewingParty.current_balance} BDT</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingParty(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Party Modal */}
      {deletingParty && (
        <Modal
          open={Boolean(deletingParty)}
          onClose={() => setDeletingParty(null)}
          title="Delete Party"
        >
          <div className="space-y-4 text-xs">
            <p className="text-default">
              Are you sure you want to delete party{' '}
              <strong className="text-primary font-mono">{deletingParty.name}</strong> (
              {deletingParty.code})?
            </p>
            <p className="text-muted text-[11px]">
              This operation will be rejected if open invoices, orders, or ledger balances are associated with this party.
            </p>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
              <Button variant="secondary" onClick={() => setDeletingParty(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deletingParty.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
