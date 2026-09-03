import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User, TenantInfo } from '../../types/api/auth';

describe('authStore strict RBAC hasPermission logic', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      tenant: null,
      activeBranch: null,
      branches: [],
      permissions: new Set(),
      status: 'idle',
      error: null,
    });
  });

  const mockUser: User = {
    id: '1',
    name: 'Test Operator',
    email: 'operator@example.com',
    is_active: true,
    is_platform_admin: false,
    locale: 'en',
    theme: 'system',
    density: 'compact',
    landing_page: '/dashboard',
    tenant_id: 1,
    default_company_id: 1,
    default_branch_id: 1,
    default_factory_id: 1,
    default_warehouse_id: 1,
  };

  const mockTenant: TenantInfo = {
    id: 1,
    uuid: 'ten-001',
    name: 'Acme Industries',
    slug: 'acme',
    status: 'active',
    currency_code: 'USD',
    timezone: 'UTC',
  };

  it('denies permissions when user is null', () => {
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('sales.order.create')).toBe(false);
  });

  it('permits all actions when user is platform admin', () => {
    useAuthStore.setState({
      user: { ...mockUser, is_platform_admin: true },
      tenant: mockTenant,
      permissions: new Set(),
    });
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('anything.at.all')).toBe(true);
  });

  it('permits all actions when wildcard * is present', () => {
    useAuthStore.setState({
      user: mockUser,
      tenant: mockTenant,
      permissions: new Set(['*']),
    });
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('production.batch.release')).toBe(true);
  });

  it('permits actions matching module wildcards like sales.*', () => {
    useAuthStore.setState({
      user: mockUser,
      tenant: mockTenant,
      permissions: new Set(['sales.*', 'inventory.stock.view']),
    });
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('sales.order.create')).toBe(true);
    expect(hasPermission('sales.invoice.approve')).toBe(true);
    expect(hasPermission('inventory.stock.view')).toBe(true);
    expect(hasPermission('inventory.stock.adjust')).toBe(false);
    expect(hasPermission('production.batch.release')).toBe(false);
  });

  it('strictly blocks unauthorized actions even if user has a role property', () => {
    useAuthStore.setState({
      user: { ...mockUser, role: 'Manager' } as unknown as User,
      tenant: mockTenant,
      permissions: new Set(['sales.order.view']),
    });
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('sales.order.view')).toBe(true);
    // Manager label no longer bypasses strict permissions
    expect(hasPermission('finance.journal.post')).toBe(false);
  });
});
