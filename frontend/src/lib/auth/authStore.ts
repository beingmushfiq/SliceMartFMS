import { create } from 'zustand'
import { api, setAccessToken } from '../api/client'
import type { BranchInfo, LoginResponseData, MeResponseData, TenantInfo, User } from '../../types/api/auth'

export interface AuthState {
  user: User | null
  tenant: TenantInfo | null
  branches: BranchInfo[]
  activeBranch: BranchInfo | null
  permissions: Set<string>
  status: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated'
  error: string | null

  login: (credentials: { email: string; password: string; tenant_id?: string }) => Promise<void>
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
  hasPermission: (permission: string | string[]) => boolean
  switchBranch: (branchId: number) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  branches: [],
  activeBranch: null,
  permissions: new Set<string>(),
  status: 'idle',
  error: null,

  login: async (credentials) => {
    set({ status: 'authenticating', error: null })
    try {
      const response = await api.post<LoginResponseData>('/auth/login', credentials)
      const data = response.data
      setAccessToken(data.access_token)
      set({
        user: data.user,
        tenant: data.tenant,
        permissions: new Set(data.permissions),
        status: 'authenticated',
        error: null,
      })
      // Trigger bootstrap to load full branches info
      await get().bootstrap()
    } catch (err: unknown) {
      setAccessToken(null)
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please check and try again.'
      set({
        status: 'unauthenticated',
        error: message,
      })
      throw err
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null)
      set({
        user: null,
        tenant: null,
        branches: [],
        activeBranch: null,
        permissions: new Set(),
        status: 'unauthenticated',
        error: null,
      })
    }
  },

  bootstrap: async () => {
    try {
      const response = await api.get<MeResponseData>('/auth/me')
      const data = response.data
      set({
        user: data.user,
        tenant: data.tenant,
        branches: data.branches ?? [],
        activeBranch: data.active_branch,
        permissions: new Set(data.permissions ?? []),
        status: 'authenticated',
        error: null,
      })
    } catch {
      set({
        status: 'unauthenticated',
      })
    }
  },

  hasPermission: (permission: string | string[]) => {
    const { user, permissions } = get()
    if (!user) return false
    if (user.is_platform_admin) return true

    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.has(p))
    }
    return permissions.has(permission)
  },

  switchBranch: async (branchId: number) => {
    const res = await api.post<MeResponseData>('/auth/switch-branch', { branch_id: branchId })
    const data = res.data
    set({
      activeBranch: data.active_branch,
      permissions: new Set(data.permissions ?? []),
    })
  },
}))
