import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api/client';
import type { PlatformAdminUser, PlatformRole } from '../../types/api/platform';
import { Button } from '../../components/ui/Button';
import {
  Search,
  RotateCcw,
  UserPlus,
  Mail,
  Key,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';

interface AdminsResponse {
  data: PlatformAdminUser[];
  meta: {
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
  };
}

export const PlatformAdminWorkspace: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<PlatformAdminUser | null>(null);

  // Create Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');

  // Fetch Available Platform Roles
  const { data: roles = [] } = useQuery<PlatformRole[]>({
    queryKey: ['platform', 'roles'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: PlatformRole[] } | PlatformRole[]>('/platform/roles');
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

  // Fetch Platform Admins List
  const { data, isLoading, isFetching, refetch } = useQuery<AdminsResponse>({
    queryKey: ['platform', 'admins', search, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 25 };
      if (search) params['search'] = search;
      const res = await api.get<AdminsResponse>('/platform/admins', { params });
      return res.data;
    },
  });

  const admins = data?.data ?? [];

  // Create Admin Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      password: string;
      role_id?: number;
    }) => {
      const res = await api.post<{ admin: PlatformAdminUser }>('/platform/admins', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Platform administrator created successfully');
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setSelectedRoleId('');
      queryClient.invalidateQueries({ queryKey: ['platform', 'admins'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create platform admin';
      toast.error(msg);
    },
  });

  // Reset Password Mutation
  const resetMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const res = await api.post(`/platform/admins/${id}/reset-password`, { password });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Admin password reset successfully');
      setShowResetModal(false);
      setNewPassword('');
      setSelectedAdmin(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to reset password';
      toast.error(msg);
    },
  });

  // Toggle Status Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'active' | 'suspended' }) => {
      const res = await api.post(`/platform/admins/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Administrator status updated');
      queryClient.invalidateQueries({ queryKey: ['platform', 'admins'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    const payload: { name: string; email: string; password: string; role_id?: number } = {
      name,
      email,
      password,
    };
    if (selectedRoleId) {
      payload.role_id = Number(selectedRoleId);
    }
    createMutation.mutate(payload);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin || !newPassword) return;
    resetMutation.mutate({ id: selectedAdmin.id, password: newPassword });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Platform Administrators</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            DevCenterPoint platform control plane staff, RBAC assignments, and credential management.
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
            <UserPlus className="size-4" />
            <span>New Platform Admin</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search platform admins by name or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Admins Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading platform administrators...
          </div>
        ) : admins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3">Administrator</th>
                  <th className="px-5 py-3">Assigned Platform Roles</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last Active</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <span className="font-bold text-slate-100 block">{admin.name}</span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Mail className="size-3 text-slate-500" />
                          {admin.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {admin.roles && admin.roles.length > 0 ? (
                          admin.roles.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold"
                            >
                              {r.name}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                            Default Platform Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          admin.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {admin.status === 'active' ? (
                          <CheckCircle2 className="size-2.5" />
                        ) : (
                          <XCircle className="size-2.5" />
                        )}
                        <span>{admin.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {admin.last_login_at ? (
                        new Date(admin.last_login_at).toLocaleString()
                      ) : (
                        <span className="text-slate-600">Never</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setShowResetModal(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer transition-colors"
                        >
                          <Key className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            statusMutation.mutate({
                              id: admin.id,
                              status: admin.status === 'active' ? 'suspended' : 'active',
                            })
                          }
                          title={admin.status === 'active' ? 'Suspend Admin' : 'Activate Admin'}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            admin.status === 'active'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          <Lock className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No platform administrators found.
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono text-xs">
            <h2 className="text-lg font-bold text-slate-100 font-sans">New Platform Administrator</h2>
            <p className="text-slate-400 mt-1">
              Grant root or role-delegated access to the DevCenterPoint control plane.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@devcenterpoint.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Initial Password * (8+ chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Initial Platform Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="">Default Platform Admin</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.slug})
                    </option>
                  ))}
                </select>
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
                  disabled={createMutation.isPending || !name || !email || password.length < 8}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono text-xs">
            <h2 className="text-lg font-bold text-slate-100 font-sans">Reset Admin Password</h2>
            <p className="text-slate-400 mt-1">
              Set a new password for <strong className="text-slate-200">{selectedAdmin.name}</strong> ({selectedAdmin.email}).
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">New Password (8+ chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedAdmin(null);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetMutation.isPending || newPassword.length < 8}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminWorkspace;
