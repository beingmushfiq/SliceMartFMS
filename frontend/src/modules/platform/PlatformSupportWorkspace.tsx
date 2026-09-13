import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api/client';
import type { PlatformSupportTicket, PlatformTenant } from '../../types/api/platform';
import { SelectDropdown } from '../../components/ui/Dropdown';
import { Button } from '../../components/ui/Button';
import {
  Search,
  RotateCcw,
  Plus,
  Building2,
  AlertTriangle,
  Flame,
  MessageSquare,
  Send,
  X,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TicketsResponse {
  data: PlatformSupportTicket[];
  meta: {
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
    stats: {
      total: number;
      open: number;
      in_progress: number;
      waiting: number;
      resolved: number;
      closed: number;
    };
  };
}

export const PlatformSupportWorkspace: React.FC = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Selected Ticket Drawer / Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<PlatformSupportTicket | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // New Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetTenantId, setTargetTenantId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('technical');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [description, setDescription] = useState('');

  // Fetch Tenants for target selection
  const { data: tenants = [] } = useQuery<PlatformTenant[]>({
    queryKey: ['platform', 'tenants', 'simple-list'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: PlatformTenant[] } | PlatformTenant[]>('/platform/tenants?per_page=100');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && 'data' in res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        return [];
      } catch {
        return [];
      }
    },
  });

  // Fetch Tickets List
  const { data, isLoading, isFetching, refetch } = useQuery<TicketsResponse>({
    queryKey: ['platform', 'support-tickets', statusFilter, priorityFilter, search, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 25 };
      if (statusFilter !== 'all') params['status'] = statusFilter;
      if (priorityFilter !== 'all') params['priority'] = priorityFilter;
      if (search) params['search'] = search;

      const res = await api.get<TicketsResponse>('/platform/support-tickets', { params });
      return res.data;
    },
  });

  const tickets = data?.data ?? [];
  const stats = data?.meta?.stats;

  // Fetch Single Ticket Details (for active notes thread)
  const { data: activeTicketDetails, refetch: refetchActiveTicket } = useQuery<PlatformSupportTicket>({
    queryKey: ['platform', 'support-ticket', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) throw new Error('No ticket selected');
      const res = await api.get<{ data: PlatformSupportTicket }>(`/platform/support-tickets/${selectedTicket.id}`);
      return res.data.data;
    },
    enabled: Boolean(selectedTicket),
  });

  // Create Ticket Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: {
      tenant_id: number;
      title: string;
      category: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      description: string;
    }) => {
      const res = await api.post('/platform/support-tickets', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Support ticket opened successfully');
      setShowCreateModal(false);
      setTargetTenantId('');
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['platform', 'support-tickets'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create ticket';
      toast.error(msg);
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await api.patch(`/platform/support-tickets/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Ticket status updated');
      queryClient.invalidateQueries({ queryKey: ['platform', 'support-tickets'] });
      refetchActiveTicket();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update ticket status';
      toast.error(msg);
    },
  });

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ id, note, is_internal }: { id: number; note: string; is_internal: boolean }) => {
      const res = await api.post(`/platform/support-tickets/${id}/notes`, {
        note,
        is_internal,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Response note added to conversation');
      setNewNoteContent('');
      refetchActiveTicket();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to add response';
      toast.error(msg);
    },
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTenantId || !title || !description) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate({
      tenant_id: Number(targetTenantId),
      title,
      category,
      priority,
      description,
    });
  };

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newNoteContent.trim()) return;
    addNoteMutation.mutate({
      id: selectedTicket.id,
      note: newNoteContent,
      is_internal: isInternalNote,
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Enterprise Support Desk</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Platform-to-tenant incident triage, resolution workflows, and client inquiry notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 font-mono text-xs cursor-pointer border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 font-mono text-xs font-bold cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            <Plus className="size-4" />
            <span>Open Support Ticket</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-slate-400 block text-[11px] mb-1 uppercase">Total Tickets</span>
            <span className="text-xl font-bold text-slate-100">{stats.total}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-amber-400 block text-[11px] mb-1 uppercase">Open & In Progress</span>
            <span className="text-xl font-bold text-amber-400">{stats.open + stats.in_progress}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-cyan-400 block text-[11px] mb-1 uppercase">Awaiting Tenant</span>
            <span className="text-xl font-bold text-cyan-400">{stats.waiting}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-emerald-400 block text-[11px] mb-1 uppercase">Resolved</span>
            <span className="text-xl font-bold text-emerald-400">{stats.resolved + stats.closed}</span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket #, subject, or description..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
          />
        </div>

        <div className="w-36">
          <SelectDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'waiting_on_tenant', label: 'Waiting Tenant' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </div>

        <div className="w-36">
          <SelectDropdown
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'high', label: 'High' },
              { value: 'normal', label: 'Normal' },
              { value: 'low', label: 'Low' },
            ]}
          />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading support tickets...
          </div>
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3">Ticket #</th>
                  <th className="px-5 py-3">Tenant</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Conversation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-100">{t.ticket_number}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Building2 className="size-3 text-slate-500" />
                        <span>{t.tenant?.name ?? `Tenant #${t.tenant_id}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-sans font-medium text-slate-200 max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : t.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t.priority === 'urgent' && <Flame className="size-2.5" />}
                        {t.priority === 'high' && <AlertTriangle className="size-2.5" />}
                        <span>{t.priority}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'open'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : t.status === 'in_progress'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : t.status === 'resolved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <span>{t.status.replace(/_/g, ' ')}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 capitalize">{t.category}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer transition-colors"
                      >
                        <MessageSquare className="size-3" />
                        <span>Thread ({t.notes_count ?? 0})</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No support tickets match the current filters.
          </div>
        )}

        {data?.meta?.pagination && data.meta.pagination.total_pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/40">
            <span>
              Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, data.meta.pagination.total)} of {data.meta.pagination.total} tickets
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-slate-200 font-bold px-2">
                Page {page} of {data.meta.pagination.total_pages}
              </span>
              <button
                type="button"
                disabled={page >= data.meta.pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details & Conversation Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-end p-0">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full shadow-2xl flex flex-col font-mono text-xs">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{selectedTicket.ticket_number}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase">
                    {selectedTicket.priority}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-slate-200 mt-1 text-base">{selectedTicket.title}</h3>
                <span className="text-[11px] text-slate-400">
                  {selectedTicket.tenant?.name} • Opened {new Date(selectedTicket.created_at).toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Ticket Status Controls */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between gap-3">
              <span className="text-slate-400 text-[11px]">Lifecycle Status:</span>
              <div className="flex items-center gap-1.5">
                {(['open', 'in_progress', 'waiting_on_tenant', 'resolved', 'closed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: s })}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      (activeTicketDetails?.status ?? selectedTicket.status) === s
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Initial Issue Description */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-bold text-slate-300">
                    <User className="size-3 text-amber-400" />
                    <span>Original Inquiry</span>
                  </span>
                  <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
                <p className="font-sans text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Notes Thread */}
              {activeTicketDetails?.notes && activeTicketDetails.notes.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                    Responses & Internal Thread
                  </span>
                  {activeTicketDetails.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-xl border ${
                        note.is_internal
                          ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                          : 'bg-slate-800/40 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                        <span className="font-bold text-slate-300">
                          {note.author?.name ?? 'Admin Staff'}
                          {note.is_internal && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded-sm bg-amber-500/20 text-amber-400 text-[9px]">
                              INTERNAL MEMO
                            </span>
                          )}
                        </span>
                        <span>{new Date(note.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="font-sans text-xs whitespace-pre-wrap leading-relaxed">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Note Reply Box */}
            <form onSubmit={handleSendNote} className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-slate-400">Add Staff Response</label>
                <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded-sm border-slate-700 bg-slate-900 text-amber-500"
                  />
                  <span>Internal note only (hidden from tenant)</span>
                </label>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type message to tenant or internal note..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-xs text-slate-100 focus:outline-hidden focus:border-amber-500 resize-none font-sans"
                />
                <button
                  type="submit"
                  disabled={addNoteMutation.isPending || !newNoteContent.trim()}
                  className="absolute right-2.5 bottom-3.5 p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-40 transition-colors"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono text-xs">
            <h2 className="text-lg font-bold text-slate-100 font-sans">Open Support Ticket</h2>
            <p className="text-slate-400 mt-1">
              Initialize a support tracking incident for a specific tenant.
            </p>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Target Tenant *</label>
                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Domain SSL configuration issue"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="technical">Technical / Bug</option>
                    <option value="billing">Billing & Plan</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="access">Access / Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem, error message, or inquiry..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !targetTenantId || !title || !description}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Opening...' : 'Open Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformSupportWorkspace;
