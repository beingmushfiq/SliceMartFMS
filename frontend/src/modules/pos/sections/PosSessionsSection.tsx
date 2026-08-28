import { useState, useEffect } from 'react';
import { Clock, Lock, Play, Plus, RefreshCw, Search, StopCircle } from 'lucide-react';
import type { PosSession, PosTerminal } from '../../../types/api/pos';
import { api } from '../../../lib/api/client';

interface PosSessionsSectionProps {
  onLaunchPOS: (session: PosSession) => void;
}

export function PosSessionsSection({ onLaunchPOS }: PosSessionsSectionProps) {
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [terminals, setTerminals] = useState<PosTerminal[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState<number | null>(null);
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // Open session form state
  const [selectedTerminalId, setSelectedTerminalId] = useState<number>(1);
  const [branchId, setBranchId] = useState<number>(1);
  const [warehouseId, setWarehouseId] = useState<number>(1);
  const [openingCash, setOpeningCash] = useState('1000.0000');
  const [openNotes, setOpenNotes] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const [sessRes, termRes] = await Promise.all([
        api.get<PosSession[]>('/pos/sessions'),
        api.get<PosTerminal[]>('/pos/terminals'),
      ]);
      setSessions(sessRes.data ?? []);
      const termList = termRes.data ?? [];
      setTerminals(termList);
      if (termList.length > 0 && termList[0]) {
        setSelectedTerminalId(termList[0].id);
        setBranchId(termList[0].branch_id);
        setWarehouseId(termList[0].default_warehouse_id ?? 1);
      }
    } catch (err) {
      console.error('Failed to load POS sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ data: PosSession }>('/pos/sessions', {
        terminal_id: selectedTerminalId,
        branch_id: branchId,
        warehouse_id: warehouseId,
        opening_cash: openingCash,
        notes: openNotes || undefined,
      });
      setShowOpenModal(false);
      await fetchSessions();
      if (res.data?.data) {
        onLaunchPOS(res.data.data);
      }
    } catch (err) {
      console.error('Failed to open POS session', err);
      alert('Failed to open shift session. Ensure terminal has no active open session.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCloseModal) return;
    setLoading(true);
    try {
      await api.post(`/pos/sessions/${showCloseModal}/close`, {
        counted_cash: countedCash,
        notes: closeNotes || undefined,
      });
      setShowCloseModal(null);
      setCountedCash('');
      setCloseNotes('');
      await fetchSessions();
    } catch (err) {
      console.error('Failed to close POS session', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.session_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.terminal_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.operator_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: PosSession['status']) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Open / Live
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Clock className="h-3 w-3 text-zinc-400" /> Closed
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="h-3 w-3 text-amber-400" /> Locked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by session #, terminal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchSessions}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowOpenModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" />
          Open New Shift Session
        </button>
      </div>

      {/* Sessions Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Session Number</th>
                <th className="px-4 py-3">Terminal</th>
                <th className="px-4 py-3">Opened At</th>
                <th className="px-4 py-3">Opening Cash</th>
                <th className="px-4 py-3">Sales Count</th>
                <th className="px-4 py-3">Expected Cash</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? 'Loading POS sessions...' : 'No POS sessions found.'}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                      {s.session_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{s.terminal_name ?? 'POS Register'}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {s.opened_at.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      {parseFloat(s.opening_cash || '0').toFixed(2)} BDT
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-zinc-200">{s.sales_count}</td>
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                      {parseFloat(s.expected_cash || '0').toFixed(2)} BDT
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(s.status)}</td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {s.status === 'open' && (
                        <>
                          <button
                            onClick={() => onLaunchPOS(s)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-sm"
                          >
                            <Play className="h-3 w-3 fill-current" /> Launch POS
                          </button>
                          <button
                            onClick={() => setShowCloseModal(s.id)}
                            className="inline-flex items-center gap-1 rounded bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
                          >
                            <StopCircle className="h-3 w-3 text-rose-400" /> Close Shift
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">Open POS Cash Register Shift</h3>
            <form onSubmit={handleOpenSession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Terminal Register</label>
                <select
                  value={selectedTerminalId}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    setSelectedTerminalId(id);
                    const term = terminals.find((t) => t.id === id);
                    if (term) {
                      setBranchId(term.branch_id);
                      setWarehouseId(term.default_warehouse_id ?? 1);
                    }
                  }}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  {terminals.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">
                  Opening Float / Cash in Drawer (BDT)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Shift Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes for this shift..."
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? 'Opening...' : 'Start Shift & Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">End & Close POS Shift</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Count all physical cash in the drawer before closing the session.
            </p>
            <form onSubmit={handleCloseSession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">
                  Actual Counted Cash (BDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5250.00"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Closing Notes</label>
                <textarea
                  rows={2}
                  placeholder="Explain any cash discrepancy or shift summary..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(null)}
                  className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {loading ? 'Closing Shift...' : 'Close & Reconcile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
