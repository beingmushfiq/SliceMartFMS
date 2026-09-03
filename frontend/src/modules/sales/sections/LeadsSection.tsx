import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import type { Lead, LeadStatus, LeadSource } from '../../../types/api/sales';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../hooks/useCurrency';
import { SelectDropdown } from '../../../components/ui/Dropdown';

const SAMPLE_LEADS: Lead[] = [
  {
    id: 1,
    uuid: 'lead-001',
    name: 'Rahim Chowdhury',
    company_name: 'Bengal Textile Mills Ltd',
    email: 'rahim@bengaltextile.com',
    phone: '+8801711223344',
    status: 'proposal',
    deal_value: '450000.00',
    currency_code: 'USD',
    source: 'storefront',
    assigned_to: 'Kazi Farhan (Sales Exec)',
    notes: 'Inquiring for bulk customized poly packaging and industrial rolls (10,000 units/mo).',
    expected_close_date: '2026-09-15',
    created_at: '2026-08-20',
  },
  {
    id: 2,
    uuid: 'lead-002',
    name: 'Anika Tabassum',
    company_name: 'Urban Retailers Hub',
    email: 'anika@urbanretail.bd',
    phone: '+8801822334455',
    status: 'qualified',
    deal_value: '185000.00',
    currency_code: 'USD',
    source: 'referral',
    assigned_to: 'Nusrat Jahan',
    notes: 'Looking to switch suppliers for corrugated master cartons.',
    expected_close_date: '2026-09-08',
    created_at: '2026-08-22',
  },
  {
    id: 3,
    uuid: 'lead-003',
    name: 'Mahmudul Hasan',
    company_name: 'Apex Footwear Supply Chain',
    email: 'm.hasan@apexsupplies.com',
    phone: '+8801933445566',
    status: 'negotiation',
    deal_value: '820000.00',
    currency_code: 'USD',
    source: 'website',
    assigned_to: 'Kazi Farhan (Sales Exec)',
    notes: 'Price negotiation on 5-ply export grade boxes. Requested 3% volume discount.',
    expected_close_date: '2026-09-02',
    created_at: '2026-08-15',
  },
  {
    id: 4,
    uuid: 'lead-004',
    name: 'Zubair Al-Mamun',
    company_name: 'Dhaka Superstore Mart',
    email: 'zubair@dhakasuper.com',
    phone: '+8801644556677',
    status: 'new',
    deal_value: '95000.00',
    currency_code: 'USD',
    source: 'cold_outreach',
    assigned_to: 'Unassigned',
    notes: 'Initial contact made. Requested product catalog & standard price list.',
    expected_close_date: '2026-09-20',
    created_at: '2026-08-29',
  },
  {
    id: 5,
    uuid: 'lead-005',
    name: 'Farida Yasmin',
    company_name: 'Prime Garments Exporters',
    email: 'farida@primegarments.com',
    phone: '+8801755667788',
    status: 'won',
    deal_value: '1200000.00',
    currency_code: 'USD',
    source: 'event',
    assigned_to: 'Tanvir Ahmed',
    notes: 'Deal closed! Contract signed for annual delivery contract.',
    expected_close_date: '2026-08-28',
    created_at: '2026-08-01',
  },
];

const STAGES: { id: LeadStatus; label: string; tone: string; dotBg: string; badgeBg: string }[] = [
  { id: 'new', label: 'New Inquiries', tone: 'text-sky-600 dark:text-sky-400', dotBg: 'bg-sky-500', badgeBg: 'bg-sky-500/10 border-sky-500/20' },
  { id: 'contacted', label: 'Contacted', tone: 'text-blue-600 dark:text-blue-400', dotBg: 'bg-blue-500', badgeBg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'qualified', label: 'Qualified', tone: 'text-indigo-600 dark:text-indigo-400', dotBg: 'bg-indigo-500', badgeBg: 'bg-indigo-500/10 border-indigo-500/20' },
  { id: 'proposal', label: 'Proposal Sent', tone: 'text-purple-600 dark:text-purple-400', dotBg: 'bg-purple-500', badgeBg: 'bg-purple-500/10 border-purple-500/20' },
  { id: 'negotiation', label: 'Negotiation', tone: 'text-amber-600 dark:text-amber-400', dotBg: 'bg-amber-500', badgeBg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'won', label: 'Closed Won', tone: 'text-emerald-600 dark:text-emerald-400', dotBg: 'bg-emerald-500', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'lost', label: 'Closed Lost', tone: 'text-rose-600 dark:text-rose-400', dotBg: 'bg-rose-500', badgeBg: 'bg-rose-500/10 border-rose-500/20' },
];

export function LeadsSection() {
  const { formatCurrency, currencyCode, currencySymbol } = useCurrency();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    company_name: string;
    email: string;
    phone: string;
    status: LeadStatus;
    source: LeadSource;
    deal_value: string;
    assigned_to: string;
    expected_close_date: string;
    notes: string;
  }>({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    status: 'new',
    source: 'storefront',
    deal_value: '',
    assigned_to: '',
    expected_close_date: '',
    notes: '',
  });

  const { data: leads = SAMPLE_LEADS, isFetching, refetch } = useQuery<Lead[]>({
    queryKey: ['crm', 'leads'],
    queryFn: async () => {
      try {
        const res = await api.get<Lead[]>('/crm/leads');
        if (res.data && res.data.length > 0) {
          return res.data;
        }
      } catch {
        // Fallback to sample data
      }
      return SAMPLE_LEADS;
    },
    initialData: SAMPLE_LEADS,
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: Date.now(),
      uuid: `lead-${Date.now()}`,
      name: formData.name,
      company_name: formData.company_name || null,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      source: formData.source,
      deal_value: formData.deal_value || '0.00',
      currency_code: currencyCode,
      assigned_to: formData.assigned_to || 'Unassigned',
      expected_close_date: formData.expected_close_date || null,
      notes: formData.notes || null,
      created_at: new Date().toISOString().slice(0, 10),
    };

    queryClient.setQueryData<Lead[]>(['crm', 'leads'], (prev = []) => [newLead, ...prev]);
    toast.success('Lead captured successfully.');
    setShowCreateModal(false);
    setFormData({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      status: 'new',
      source: 'storefront',
      deal_value: '',
      assigned_to: '',
      expected_close_date: '',
      notes: '',
    });
  };

  const handleUpdateStage = (id: number, newStage: LeadStatus) => {
    queryClient.setQueryData<Lead[]>(['crm', 'leads'], (prev = []) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStage } : l))
    );
    toast.success(`Lead moved to ${newStage}.`);
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.company_name && l.company_name.toLowerCase().includes(search.toLowerCase())) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    const matchesStage = stageFilter === 'all' || l.status === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalPipelineValue = leads
    .filter((l) => l.status !== 'lost')
    .reduce((sum, l) => sum + parseFloat(l.deal_value || '0'), 0);

  const wonDealsValue = leads
    .filter((l) => l.status === 'won')
    .reduce((sum, l) => sum + parseFloat(l.deal_value || '0'), 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Active Pipeline Value
            </span>
            <div className="p-2 rounded-xl bg-primary-subtle text-primary border border-primary/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-default">
            {formatCurrency(totalPipelineValue)}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            {leads.filter((l) => l.status !== 'won' && l.status !== 'lost').length} active deals in progress
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Closed Won Value
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(wonDealsValue)}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            {leads.filter((l) => l.status === 'won').length} successfully won contracts
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Win Rate %
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-default">
            {(leads.length > 0 ? (leads.filter((l) => l.status === 'won').length / leads.length) * 100 : 0).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Conversion rate across all channels
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              New Inquiries (This Month)
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-default">
            {leads.filter((l) => l.status === 'new').length}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Awaiting sales rep assignment
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search leads by name, company, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface pl-9 pr-3.5 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <SelectDropdown
            options={[
              { value: 'all', label: 'All Stages' },
              ...STAGES.map((s) => ({ value: s.id, label: s.label, colorDot: s.dotBg })),
            ]}
            value={stageFilter}
            onChange={(val) => setStageFilter(val)}
            size="sm"
            aria-label="Filter leads by stage"
          />

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-muted hover:text-default disabled:opacity-50 transition-colors cursor-pointer"
            title="Refresh Leads"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-surface-sunken p-1 rounded-xl border border-default">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-surface text-default shadow-xs font-semibold'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-surface text-default shadow-xs font-semibold'
                  : 'text-muted hover:text-default'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="w-full overflow-x-auto pb-6 pt-1">
          <div className="flex gap-4 items-start min-w-max">
            {STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
              const stageValue = stageLeads.reduce((sum, l) => sum + parseFloat(l.deal_value || '0'), 0);

              return (
                <div
                  key={stage.id}
                  className="flex flex-col rounded-2xl border border-default bg-surface-sunken/50 p-3.5 w-72.5 shrink-0 shadow-2xs transition-all"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-default mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${stage.dotBg}`} />
                        <h3 className={`text-xs font-bold ${stage.tone}`}>{stage.label}</h3>
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-muted mt-0.5">
                        {formatCurrency(stageValue)}
                      </div>
                    </div>
                    <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-default border border-default shadow-2xs">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-155 pr-0.5">
                    {stageLeads.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted border-2 border-dashed border-default/70 rounded-xl bg-surface/30">
                        <p className="font-semibold">No leads</p>
                        <p className="text-[10px] text-muted/70 mt-0.5">Stage is empty</p>
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="group rounded-xl border border-default bg-surface p-3.5 shadow-2xs hover:shadow-sm transition-all hover:border-primary/40 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-default leading-tight truncate group-hover:text-primary transition-colors">
                                {lead.name}
                              </div>
                              {lead.company_name && (
                                <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5 truncate">
                                  <Building2 className="h-3 w-3 shrink-0 text-muted" />
                                  <span className="truncate">{lead.company_name}</span>
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-surface-sunken text-muted border border-default font-medium capitalize">
                              {lead.source.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(lead.deal_value || '0')}
                          </div>

                          {lead.notes && (
                            <p className="text-[11px] text-muted line-clamp-2 leading-relaxed bg-surface-sunken/50 p-2 rounded-lg border border-default/40">
                              {lead.notes}
                            </p>
                          )}

                          <div className="pt-2 border-t border-default/70 flex items-center justify-between text-[10px] text-muted">
                            <span className="truncate max-w-30 font-medium">{lead.assigned_to || 'Unassigned'}</span>
                            {lead.expected_close_date && (
                              <span className="font-mono">{lead.expected_close_date}</span>
                            )}
                          </div>

                          {/* Quick Stage Mover */}
                          <div className="pt-1">
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateStage(lead.id, e.target.value as LeadStatus)}
                              className="w-full text-[11px] rounded-lg border border-default bg-surface-sunken px-2.5 py-1.5 text-default focus:border-primary focus:outline-none cursor-pointer transition-colors"
                            >
                              {STAGES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  Move to {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-default">
              <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3.5">Lead Contact</th>
                  <th className="px-4 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Channel / Source</th>
                  <th className="px-4 py-3.5">Est. Deal Value</th>
                  <th className="px-4 py-3.5">Stage</th>
                  <th className="px-4 py-3.5">Assigned Rep</th>
                  <th className="px-4 py-3.5">Target Close</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted">
                      No leads match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((l) => {
                    const currentStage = STAGES.find((s) => s.id === l.status);
                    return (
                      <tr key={l.id} className="hover:bg-surface-sunken/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-default">{l.name}</div>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            <span>{l.phone}</span>
                            <span>•</span>
                            <span>{l.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted font-medium">
                          {l.company_name || '-'}
                        </td>
                        <td className="px-4 py-3.5 capitalize text-muted">
                          <span className="px-2 py-0.5 rounded-full bg-surface-sunken border border-default text-[10px]">
                            {l.source.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(l.deal_value || '0')}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${currentStage?.badgeBg} ${currentStage?.tone}`}>
                            {currentStage?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted">
                          {l.assigned_to || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3.5 text-muted font-mono text-[11px]">
                          {l.expected_close_date || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <select
                            value={l.status}
                            onChange={(e) => handleUpdateStage(l.id, e.target.value as LeadStatus)}
                            className="text-[10px] rounded-lg border border-default bg-surface-sunken px-2 py-1 text-default focus:outline-none cursor-pointer"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-default bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-base font-bold text-default">Add New Commercial Lead</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-default cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariqul Islam"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Footwear Ltd"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+8801700000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tariqul@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Estimated Deal Value ({currencySymbol} {currencyCode})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50000"
                    value={formData.deal_value}
                    onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Lead Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                  >
                    <option value="storefront">Storefront E-Commerce</option>
                    <option value="website">Corporate Website</option>
                    <option value="referral">Referral / Word of Mouth</option>
                    <option value="cold_outreach">Direct Sales Call / Field</option>
                    <option value="event">Trade Fair / Expo</option>
                    <option value="social_media">Social Media Channel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Assigned Sales Representative
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kazi Farhan"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Inquiry Notes & Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the products, quantities, specifications or special packaging requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-default px-4 py-2 text-muted hover:bg-surface-sunken hover:text-default transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
