import { useState, useEffect } from 'react';
import { CheckCircle2, Plus, RefreshCw, Search, XCircle } from 'lucide-react';
import type { PosTerminal } from '../../../types/api/pos';
import { api } from '../../../lib/api/client';

export function PosTerminalsSection() {
  const [terminals, setTerminals] = useState<PosTerminal[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [branchId] = useState<number>(1);
  const [warehouseId] = useState<number>(1);

  const fetchTerminals = async () => {
    setLoading(true);
    try {
      const res = await api.get<PosTerminal[]>('/pos/terminals');
      setTerminals(res.data ?? []);
    } catch (err) {
      console.error('Failed to load POS terminals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminals();
  }, []);

  const handleCreateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/pos/terminals', {
        code,
        name,
        branch_id: branchId,
        default_warehouse_id: warehouseId,
        is_active: true,
      });
      setShowCreateModal(false);
      setCode('');
      setName('');
      await fetchTerminals();
    } catch (err) {
      console.error('Failed to create terminal', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTerminals = terminals.filter(
    (t) =>
      t.code?.toLowerCase().includes(search.toLowerCase()) ||
      t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by terminal code, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchTerminals}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" />
          Add POS Terminal
        </button>
      </div>

      {/* Terminals Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Terminal Code</th>
                <th className="px-4 py-3">Name / Label</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Default Warehouse</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredTerminals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading terminals...' : 'No POS terminals registered.'}
                  </td>
                </tr>
              ) : (
                filteredTerminals.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">{t.code}</td>
                    <td className="px-4 py-3 text-zinc-200">{t.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{t.branch_name ?? 'Main Outlet'}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {t.default_warehouse_name ?? 'Shop Floor Stock'}
                    </td>
                    <td className="px-4 py-3">
                      {t.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Terminal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">
              Register POS Terminal Register
            </h3>
            <form onSubmit={handleCreateTerminal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Terminal Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POS-REG-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Terminal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Front Cash Counter 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Register Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
