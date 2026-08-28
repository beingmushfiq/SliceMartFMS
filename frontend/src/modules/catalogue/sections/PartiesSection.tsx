import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Plus, Search } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { Party } from '../../../types/api/party';

interface CreatePartyForm {
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
  contact_name?: string;
  contact_phone?: string;
}

export function PartiesSection() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'customer' | 'supplier' | 'dealer' | 'agent'
  >('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreatePartyForm>({
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
    contact_name: '',
    contact_phone: '',
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
    mutationFn: (form: CreatePartyForm) => {
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

      if (form.contact_name) {
        payload['contacts'] = [
          {
            name: form.contact_name,
            phone: form.contact_phone || null,
            is_primary: true,
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
        contact_name: '',
        contact_phone: '',
      });
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.code === 'DUPLICATE') setErrorMsg('Party code already exists.');
        else setErrorMsg(err.message ?? 'Failed to create party.');
      } else {
        setErrorMsg('Error creating party.');
      }
    },
  });

  const parties = partiesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by code, name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 text-xs">
            {(['all', 'customer', 'supplier', 'dealer', 'agent'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-colors ${
                  roleFilter === r
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {r === 'all' ? 'All Roles' : `${r}s`}
              </button>
            ))}
          </div>
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
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Party</th>
                <th className="py-3.5 px-3">Roles</th>
                <th className="py-3.5 px-3">Contact</th>
                <th className="py-3.5 px-3">Credit Limit</th>
                <th className="py-3.5 px-3">Current Balance</th>
                <th className="py-3.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {parties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No parties found matching the criteria.
                  </td>
                </tr>
              ) : (
                parties.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="font-medium text-zinc-100">{p.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{p.code}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {p.is_customer && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">
                            Customer
                          </span>
                        )}
                        {p.is_supplier && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                            Supplier
                          </span>
                        )}
                        {p.is_dealer && (
                          <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-medium text-purple-400">
                            Dealer
                          </span>
                        )}
                        {p.is_agent && (
                          <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-medium text-teal-400">
                            Agent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 space-y-0.5">
                      {p.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <Phone className="h-3 w-3 text-zinc-500" />
                          <span>{p.phone}</span>
                        </div>
                      )}
                      {p.email && (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <Mail className="h-3 w-3 text-zinc-500" />
                          <span>{p.email}</span>
                        </div>
                      )}
                      {!p.phone && !p.email && <span className="text-zinc-600">-</span>}
                    </td>
                    <td className="py-3.5 px-3 font-mono">{p.credit_limit}</td>
                    <td className="py-3.5 px-3 font-mono font-medium text-zinc-200">
                      {p.current_balance}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          p.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {p.status}
                      </span>
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
                placeholder="e.g. CUST-001, SUPP-001"
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
                <option value="business">Business / Corporate</option>
                <option value="individual">Individual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Display Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Acme Electronics Ltd."
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Role Checkboxes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Roles *</label>
            <div className="flex flex-wrap gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_customer}
                  onChange={(e) => setDraft({ ...draft, is_customer: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Customer</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_supplier}
                  onChange={(e) => setDraft({ ...draft, is_supplier: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Supplier</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_dealer}
                  onChange={(e) => setDraft({ ...draft, is_dealer: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Dealer</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_agent}
                  onChange={(e) => setDraft({ ...draft, is_agent: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Agent</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Phone</label>
              <input
                type="text"
                placeholder="e.g. +8801700000000"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="e.g. info@acme.test"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Credit Limit</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={draft.credit_limit}
                onChange={(e) => setDraft({ ...draft, credit_limit: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Credit Days</label>
              <input
                type="number"
                min="0"
                value={draft.credit_days}
                onChange={(e) =>
                  setDraft({ ...draft, credit_days: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Party'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
