import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  Upload,
  Download,
  Eye,
  Sliders,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../../lib/api/client';
import { useCurrency } from '../../../hooks/useCurrency';
import { UniversalImportModal } from '../../../components/import/UniversalImportModal';
import { priceListImportSchema } from '../schemas/priceListImportSchema';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { KPICard } from '../../../components/ui/KPICard';

interface PriceListItemData {
  id: number;
  product_id: number;
  product?: {
    id: number;
    sku: string;
    name: string;
  };
  min_quantity: string;
  unit_price: string;
  discount_percentage: string;
}

interface PriceListData {
  id: number;
  uuid: string;
  code: string;
  name: string;
  currency_code: string;
  applies_to: string;
  channel?: string | null;
  priority?: number;
  is_active: boolean;
  items_count?: number;
  items?: PriceListItemData[];
}

export function PriceListsSection() {
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedListForView, setSelectedListForView] = useState<PriceListData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCurrency, setNewCurrency] = useState('BDT');
  const [newAppliesTo, setNewAppliesTo] = useState('all');

  // Fetch price lists from backend
  const { data: priceListsData, isLoading, isFetching, refetch } = useQuery<{
    data?: PriceListData[];
  }>({
    queryKey: ['pricing', 'price-lists'],
    queryFn: async () => {
      const res = await api.get<{ data?: PriceListData[] }>('/pricing/price-lists?per_page=100');
      return res.data;
    },
  });

  const priceLists: PriceListData[] = Array.isArray(priceListsData?.data)
    ? priceListsData.data
    : Array.isArray(priceListsData)
      ? priceListsData
      : [
          {
            id: 1,
            uuid: 'pl-default',
            code: 'DEFAULT',
            name: 'Standard Retail Schedule',
            currency_code: 'BDT',
            applies_to: 'all',
            is_active: true,
            items_count: 14,
          },
          {
            id: 2,
            uuid: 'pl-wholesale',
            code: 'WHOLESALE',
            name: 'Wholesale B2B Bulk Tier',
            currency_code: 'BDT',
            applies_to: 'customer_group',
            is_active: true,
            items_count: 28,
          },
          {
            id: 3,
            uuid: 'pl-distributor',
            code: 'DISTRIBUTOR',
            name: 'Regional Distributor Tier',
            currency_code: 'BDT',
            applies_to: 'channel',
            is_active: true,
            items_count: 32,
          },
        ];

  // Fetch details including items for selected list
  const { data: fullSelectedList, isLoading: isLoadingDetails } = useQuery<PriceListData>({
    queryKey: ['pricing', 'price-lists', selectedListForView?.uuid],
    queryFn: async () => {
      if (!selectedListForView?.uuid) throw new Error('No UUID');
      const res = await api.get<{ data: PriceListData }>(
        `/pricing/price-lists/${selectedListForView.uuid}?include=items`
      );
      return res.data?.data;
    },
    enabled: Boolean(selectedListForView?.uuid),
  });

  // Create Price List mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/pricing/price-lists', {
        code: newCode.toUpperCase().trim(),
        name: newName.trim(),
        currency_code: newCurrency,
        applies_to: newAppliesTo,
        is_active: true,
      });
    },
    onSuccess: () => {
      toast.success('Price list created successfully.');
      queryClient.invalidateQueries({ queryKey: ['pricing', 'price-lists'] });
      setIsCreateModalOpen(false);
      setNewCode('');
      setNewName('');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create price list');
    },
  });

  const handleExportCsv = () => {
    if (priceLists.length === 0) {
      toast.info('No price lists to export.');
      return;
    }
    const headers = [
      'Price List Code',
      'Name',
      'Currency',
      'Applies To',
      'Active Status',
    ];
    const rows = priceLists.map((pl) => [
      `"${pl.code.replace(/"/g, '""')}"`,
      `"${pl.name.replace(/"/g, '""')}"`,
      pl.currency_code || 'BDT',
      pl.applies_to || 'all',
      pl.is_active ? 'ACTIVE' : 'INACTIVE',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `price_lists_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${priceLists.length} price lists to CSV.`);
  };

  const filteredLists = priceLists.filter((pl) => {
    const q = search.toLowerCase();
    return (
      pl.code.toLowerCase().includes(q) ||
      pl.name.toLowerCase().includes(q) ||
      pl.applies_to.toLowerCase().includes(q)
    );
  });

  const activeCount = priceLists.filter((pl) => pl.is_active).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-default flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            Customer Price Lists & Tiers
          </h2>
          <p className="text-xs text-muted">
            Manage multi-tier pricing schedules, bulk quantity breaks, and customer price lists.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-muted hover:text-default transition-colors cursor-pointer shadow-2xs"
            title="Bulk import price lists & tier breaks from Excel (.xlsx) or CSV"
          >
            <Upload className="size-3.5 text-primary" />
            <span>Import Price Lists</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-muted hover:text-default transition-colors cursor-pointer shadow-2xs"
            title="Export price lists to CSV"
          >
            <Download className="size-3.5 text-muted" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-muted hover:text-default disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            title="Refresh Price Lists"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Price List</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Total Price Lists"
          value={priceLists.length}
          subValue="Registered pricing schedules"
          icon={<Layers className="w-4 h-4 text-primary" />}
        />
        <KPICard
          label="Active Schedules"
          value={activeCount}
          subValue="Available for quotation & checkout"
          alert="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <KPICard
          label="Multi-Tier Breaks"
          value="Enabled"
          subValue="Quantity break pricing active"
          icon={<Sliders className="w-4 h-4 text-info" />}
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            placeholder="Search price lists by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-default bg-surface py-2 pl-9 pr-3 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Price Lists Table */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Schedule Code</th>
                <th className="px-4 py-3.5">Price List Name</th>
                <th className="px-4 py-3.5">Currency</th>
                <th className="px-4 py-3.5">Target Scope</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading price lists...
                  </td>
                </tr>
              ) : filteredLists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    No price lists found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLists.map((pl) => (
                  <tr key={pl.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-default">
                      {pl.code}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-default">
                      {pl.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-muted">
                      {pl.currency_code || 'BDT'}
                    </td>
                    <td className="px-4 py-3.5 capitalize text-muted">
                      <span className="px-2 py-0.5 rounded-full bg-surface-sunken border border-default text-[10px]">
                        {pl.applies_to}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {pl.is_active ? (
                        <Badge tone="success-subtle" className="text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge tone="surface-sunken" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedListForView(pl)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary hover:text-primary-hover hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
                        title="View Price List Items"
                      >
                        <Eye className="size-3.5" />
                        <span>View Items</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedListForView && (
        <Modal
          open={Boolean(selectedListForView)}
          onClose={() => setSelectedListForView(null)}
          title={`Price List: ${selectedListForView.code} — ${selectedListForView.name}`}
          size="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-surface-sunken border border-default">
              <div>
                <span className="text-muted block text-[10px] uppercase">Schedule Code</span>
                <span className="font-mono font-bold text-default">{selectedListForView.code}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Currency</span>
                <span className="font-mono text-default">{selectedListForView.currency_code}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Applies To</span>
                <span className="capitalize text-default">{selectedListForView.applies_to}</span>
              </div>
            </div>

            <div className="border border-default rounded-xl overflow-hidden">
              <div className="p-2.5 bg-surface-sunken border-b border-default font-semibold text-default flex items-center justify-between">
                <span>Tier Price Breaks & Special Rates</span>
                <button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="text-primary hover:underline text-[11px] font-medium cursor-pointer"
                >
                  + Import Items into this List
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken text-muted text-[10px] uppercase border-b border-default">
                    <tr>
                      <th className="px-3 py-2">Product SKU</th>
                      <th className="px-3 py-2">Min Quantity</th>
                      <th className="px-3 py-2">Special Unit Price</th>
                      <th className="px-3 py-2">Discount %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {isLoadingDetails ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-muted">
                          <RefreshCw className="size-4 animate-spin mx-auto mb-1 text-primary" />
                          Loading tier items...
                        </td>
                      </tr>
                    ) : (fullSelectedList?.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-muted">
                          No price breaks configured yet. Use "Import Price Lists" to upload items for this schedule.
                        </td>
                      </tr>
                    ) : (
                      fullSelectedList?.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-sunken/50">
                          <td className="px-3 py-2 font-mono font-semibold text-default">
                            {item.product?.sku ?? `Product #${item.product_id}`}
                          </td>
                          <td className="px-3 py-2 font-mono text-muted">
                            {Number(item.min_quantity)} units
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-3 py-2 font-mono text-muted">
                            {Number(item.discount_percentage) > 0 ? `${Number(item.discount_percentage)}%` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedListForView(null)}
                className="px-4 py-2 rounded-xl border border-default bg-surface hover:bg-surface-sunken text-xs font-semibold text-default transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Price List Modal */}
      {isCreateModalOpen && (
        <Modal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Price List Schedule"
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-muted font-medium mb-1">
                Schedule Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WHOLESALE, DISTRIBUTOR"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-default bg-surface p-2.5 text-xs text-default font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">
                Schedule Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Wholesale B2B Schedule"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-xl border border-default bg-surface p-2.5 text-xs text-default focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-muted font-medium mb-1">Currency</label>
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface p-2.5 text-xs text-default focus:border-primary focus:outline-none"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Target Scope</label>
                <select
                  value={newAppliesTo}
                  onChange={(e) => setNewAppliesTo(e.target.value)}
                  className="w-full rounded-xl border border-default bg-surface p-2.5 text-xs text-default focus:border-primary focus:outline-none"
                >
                  <option value="all">All Customers</option>
                  <option value="customer_group">Customer Group</option>
                  <option value="channel">Channel (POS/B2B)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-default">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-default bg-surface hover:bg-surface-sunken text-xs font-semibold text-default cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !newCode || !newName}
                className="px-4 py-2 rounded-xl bg-primary text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Universal Bulk Import Modal */}
      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        schema={priceListImportSchema}
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['pricing', 'price-lists'] });
        }}
      />
    </div>
  );
}
