import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TenantRoleDashboard } from './TenantRoleDashboard';
import { useAuthStore } from '../../lib/auth/authStore';

// Mock Recharts ResponsiveContainer to avoid size rendering issues in test DOM
vi.mock('recharts', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

describe('TenantRoleDashboard Dynamic Role Perspectives', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, String(value)),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    useAuthStore.setState({
      user: null,
      tenant: null,
      permissions: new Set(),
      status: 'authenticated',
      error: null,
    });
  });

  it('renders Executive Overview dashboard for Super Administrator', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        name: 'System Administrator',
        email: 'admin@slicemart.test',
        is_active: true,
        is_platform_admin: false,
        role: 'Super Administrator',
        roles: ['Super Administrator'],
        locale: 'en',
        theme: 'light',
        density: 'comfortable',
        landing_page: '/dashboard',
        tenant_id: 1,
        default_company_id: 1,
        default_branch_id: 1,
        default_factory_id: 1,
        default_warehouse_id: 1,
      },
      permissions: new Set(['*']),
    });

    render(
      <MemoryRouter>
        <TenantRoleDashboard />
      </MemoryRouter>
    );

    // Active role header indicator
    expect(screen.getByText('Super Administrator')).toBeInTheDocument();

    // Perspective switcher tabs available for Admin
    expect(screen.getByRole('button', { name: /Executive Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Factory Production/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stock & Warehouse/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quality Control/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sales & POS/i })).toBeInTheDocument();

    // Executive overview contents
    expect(screen.getByText('Executive Operations Overview')).toBeInTheDocument();
    expect(screen.getByText("TODAY'S REVENUE")).toBeInTheDocument();
  });

  it('defaults to Commercial & POS dashboard for Sales Officer', () => {
    useAuthStore.setState({
      user: {
        id: '5',
        name: 'Kamal Sales Officer',
        email: 'sales@slicemart.test',
        is_active: true,
        is_platform_admin: false,
        role: 'Sales Officer',
        roles: ['Sales Officer'],
        locale: 'en',
        theme: 'light',
        density: 'comfortable',
        landing_page: '/dashboard',
        tenant_id: 1,
        default_company_id: 1,
        default_branch_id: 1,
        default_factory_id: 1,
        default_warehouse_id: 1,
      },
      permissions: new Set([
        'sales.order.view',
        'sales.order.create',
        'sales.invoice.view',
        'pos.terminal.view',
        'pos.session.view',
        'pos.sale.create',
        'catalog.product.view',
      ]),
    });

    render(
      <MemoryRouter>
        <TenantRoleDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Sales Officer')).toBeInTheDocument();
    expect(screen.getByText('Commercial & POS Operations')).toBeInTheDocument();
    expect(screen.getByText('POS DRAWER')).toBeInTheDocument();
  });

  it('defaults to Stock & Warehouse dashboard for Warehouse Storekeeper', () => {
    useAuthStore.setState({
      user: {
        id: '4',
        name: 'Rafiq Store In-Charge',
        email: 'store@slicemart.test',
        is_active: true,
        is_platform_admin: false,
        role: 'Warehouse Storekeeper',
        roles: ['Warehouse Storekeeper'],
        locale: 'en',
        theme: 'light',
        density: 'comfortable',
        landing_page: '/dashboard',
        tenant_id: 1,
        default_company_id: 1,
        default_branch_id: 1,
        default_factory_id: 1,
        default_warehouse_id: 1,
      },
      permissions: new Set([
        'inventory.stock.view',
        'inventory.warehouse.view',
        'inventory.movement.view',
        'inventory.transfer.view',
        'inventory.count.view',
        'purchasing.grn.view',
        'catalog.product.view',
      ]),
    });

    render(
      <MemoryRouter>
        <TenantRoleDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Warehouse Storekeeper')).toBeInTheDocument();
    expect(screen.getByText('Warehouse & Stock Inventory')).toBeInTheDocument();
    expect(screen.getByText('TOTAL SKUS')).toBeInTheDocument();
  });

  it('defaults to Quality Assurance dashboard for QC Inspector', () => {
    useAuthStore.setState({
      user: {
        id: '3',
        name: 'Farhana QC Lead',
        email: 'qc@slicemart.test',
        is_active: true,
        is_platform_admin: false,
        role: 'QC Inspector',
        roles: ['QC Inspector'],
        locale: 'en',
        theme: 'light',
        density: 'comfortable',
        landing_page: '/dashboard',
        tenant_id: 1,
        default_company_id: 1,
        default_branch_id: 1,
        default_factory_id: 1,
        default_warehouse_id: 1,
      },
      permissions: new Set([
        'qc.inspection.view',
        'qc.inspection.create',
        'qc.parameter.view',
        'qc.wastage.view',
        'catalog.product.view',
      ]),
    });

    render(
      <MemoryRouter>
        <TenantRoleDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('QC Inspector')).toBeInTheDocument();
    expect(screen.getByText('Quality Assurance & Testing')).toBeInTheDocument();
    expect(screen.getByText('PENDING AUDIT')).toBeInTheDocument();
  });

  it('renders PWA banner with SliceMart ERP branding when install event fires', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        name: 'System Administrator',
        email: 'admin@slicemart.test',
        is_active: true,
        is_platform_admin: false,
        role: 'Super Administrator',
        roles: ['Super Administrator'],
        locale: 'en',
        theme: 'light',
        density: 'comfortable',
        landing_page: '/dashboard',
        tenant_id: 1,
        default_company_id: 1,
        default_branch_id: 1,
        default_factory_id: 1,
        default_warehouse_id: 1,
      },
      permissions: new Set(['*']),
    });

    render(
      <MemoryRouter>
        <TenantRoleDashboard />
      </MemoryRouter>
    );

    // Trigger PWA install event
    act(() => {
      window.dispatchEvent(new Event('pwa-install-available'));
    });

    expect(screen.getByText(/Install SliceMart ERP/i)).toBeInTheDocument();
    expect(screen.getByText(/Business Operations Platform PWA/i)).toBeInTheDocument();
    expect(screen.getByText(/faster business operations/i)).toBeInTheDocument();
    expect(screen.getByText('Install App')).toBeInTheDocument();
    expect(screen.getByText('Maybe Later')).toBeInTheDocument();
  });
});
