import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Search, Warehouse as WarehouseIcon } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QueryBoundary } from '../../../components/patterns/QueryBoundary';
import { isApiError } from '../../../lib/api/errors';
import type { Warehouse, WarehouseLocation } from '../../../types/api/catalog';

interface CreateWarehouseForm {
  code: string;
  name: string;
  type: string;
  address: string;
  allows_negative_stock: boolean;
  is_default: boolean;
}

export function WarehousesSection() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationDraft, setLocationDraft] = useState({ code: '', name: '', type: 'bin' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateWarehouseForm>({
    code: '',
    name: '',
    type: 'general',
    address: '',
    allows_negative_stock: false,
    is_default: false,
  });

  const queryClient = useQueryClient();

  const warehousesQuery = useQuery({
    queryKey: ['catalogue', 'warehouses', search],
    queryFn: ({ signal }) =>
      api.get<Warehouse[]>('/warehouses', {
        signal,
        params: search.trim().length >= 2 ? { q: search.trim() } : {},
      }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWarehouseForm) => api.post<Warehouse>('/warehouses', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'warehouses'] });
      setIsCreateOpen(false);
      setDraft({
        code: '',
        name: '',
        type: 'general',
        address: '',
        allows_negative_stock: false,
        is_default: false,
      });
      setErrorMsg(null);
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.code === 'DUPLICATE') setErrorMsg('Warehouse code already exists.');
        else setErrorMsg(err.message ?? 'Failed to create warehouse.');
      } else {
        setErrorMsg('Error creating warehouse.');
      }
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; type: string }) =>
      api.post<WarehouseLocation>(`/warehouses/${selectedWarehouse?.id}/locations`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalogue', 'warehouses'] });
      setIsLocationModalOpen(false);
      setLocationDraft({ code: '', name: '', type: 'bin' });
    },
  });

  const warehouses = warehousesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search warehouses..."
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
          <span>New Warehouse</span>
        </Button>
      </div>

      <QueryBoundary
        status={warehousesQuery.status}
        error={warehousesQuery.error}
        data={warehousesQuery.data}
        isFetching={warehousesQuery.isFetching}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-zinc-500">
              No physical warehouses configured.
            </div>
          ) : (
            warehouses.map((w) => (
              <div
                key={w.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200">
                        <WarehouseIcon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100 text-sm">{w.name}</h3>
                        <p className="font-mono text-[11px] text-zinc-500">{w.code}</p>
                      </div>
                    </div>
                    {w.is_default && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Default
                      </span>
                    )}
                  </div>

                  {w.address && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      <span className="truncate">{w.address}</span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300 capitalize">
                      {w.type} storage
                    </span>
                    {w.allows_negative_stock && (
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-400">
                        Allows Negative Stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    {w.is_active ? '● Operating' : '○ Disabled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWarehouse(w);
                      setIsLocationModalOpen(true);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Bin</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </QueryBoundary>

      {/* Create Warehouse Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Warehouse"
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
                placeholder="e.g. WH-CENTRAL"
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
                <option value="general">General</option>
                <option value="raw_materials">Raw Materials Depot</option>
                <option value="finished_goods">Finished Goods Depot</option>
                <option value="transit">In-Transit Storage</option>
                <option value="showroom">Showroom / Store</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Warehouse Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Central Finished Goods Depot"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Address</label>
            <input
              type="text"
              placeholder="e.g. Plot 45, Tejgaon Industrial Area, Dhaka"
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.is_default}
                onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span>Set as Default Warehouse</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.allows_negative_stock}
                onChange={(e) => setDraft({ ...draft, allows_negative_stock: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span>Allow Negative Stock</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Warehouse'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Location Bin Modal */}
      <Modal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title={`Add Bin Location to ${selectedWarehouse?.name ?? 'Warehouse'}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLocationMutation.mutate(locationDraft);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Location / Bin Code *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. AISLE-1-RACK-A"
              value={locationDraft.code}
              onChange={(e) =>
                setLocationDraft({ ...locationDraft, code: e.target.value.toUpperCase() })
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Location Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Aisle 1 Rack A Top Shelf"
              value={locationDraft.name}
              onChange={(e) => setLocationDraft({ ...locationDraft, name: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => setIsLocationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createLocationMutation.isPending}>
              {createLocationMutation.isPending ? 'Adding...' : 'Add Location'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
