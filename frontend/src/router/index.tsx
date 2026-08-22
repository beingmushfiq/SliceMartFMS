// ─────────────────────────────────────────────────────────────
// ROUTER — React Router v6 full application routes
// ─────────────────────────────────────────────────────────────

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';

// ── Eager-loaded core pages ───────────────────────────────────
import Dashboard        from '../pages/Dashboard';
import ProductionOrders from '../pages/production/ProductionOrders';
import ProductionEntry  from '../pages/production/ProductionEntry';
import InventoryOverview from '../pages/inventory/InventoryOverview';
import SalesPage        from '../pages/sales/SalesPage';
import QCQueue          from '../pages/qc/QCQueue';
import Workforce        from '../pages/workforce/Workforce';
import Finance          from '../pages/finance/Finance';
import Procurement      from '../pages/procurement/Procurement';

// ── Stub pages ────────────────────────────────────────────────
import {
  BOMPage, ProductionOverview, ProductionHistory,
  RawMaterials, FinishedGoods, StockMovements, StockAdjustments,
  WarehouseA, WarehouseB, Transfers,
  Suppliers, PurchaseHistory, ReceiveItems,
  NewSale, B2BSales, B2CSales, RawMaterialSales, Customers, Returns,
  AllDeliveries, PendingDeliveries, InTransit, Delivered,
  QCHistory, Rework,
  EmployeesPage, Attendance, Shifts, Performance,
  AccountsPage, Transactions, Expenses, Receivables, Payables, PnL,
  Notifications, CCTV,
  AdminUsers, AdminRoles, AdminSettings, AuditLog,
  ProductionReports, InventoryReports, SalesReports, FinanceReports,
} from '../pages/PlaceholderPage';

// ── Router definition ─────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // ── Dashboard
      { index: true,                   element: <Dashboard /> },
      { path: 'dashboard',             element: <Navigate to="/" replace /> },

      // ── Production
      { path: 'production',            element: <ProductionOverview /> },
      { path: 'production/orders',     element: <ProductionOrders /> },
      { path: 'production/entry',      element: <ProductionEntry /> },
      { path: 'production/bom',        element: <BOMPage /> },
      { path: 'production/history',    element: <ProductionHistory /> },

      // ── Inventory
      { path: 'inventory',             element: <InventoryOverview /> },
      { path: 'inventory/materials',   element: <RawMaterials /> },
      { path: 'inventory/products',    element: <FinishedGoods /> },
      { path: 'inventory/movements',   element: <StockMovements /> },
      { path: 'inventory/adjustments', element: <StockAdjustments /> },

      // ── Warehouse
      { path: 'warehouse/a',           element: <WarehouseA /> },
      { path: 'warehouse/b',           element: <WarehouseB /> },
      { path: 'warehouse/transfers',   element: <Transfers /> },

      // ── Procurement
      { path: 'procurement',           element: <Procurement /> },
      { path: 'procurement/suppliers', element: <Suppliers /> },
      { path: 'procurement/orders',    element: <Procurement /> },
      { path: 'procurement/receive',   element: <ReceiveItems /> },
      { path: 'procurement/history',   element: <PurchaseHistory /> },

      // ── Sales
      { path: 'sales',                 element: <SalesPage /> },
      { path: 'sales/new',             element: <NewSale /> },
      { path: 'sales/b2b',             element: <B2BSales /> },
      { path: 'sales/b2c',             element: <B2CSales /> },
      { path: 'sales/raw-material',    element: <RawMaterialSales /> },
      { path: 'sales/customers',       element: <Customers /> },
      { path: 'sales/returns',         element: <Returns /> },

      // ── Delivery
      { path: 'delivery',              element: <AllDeliveries /> },
      { path: 'delivery/pending',      element: <PendingDeliveries /> },
      { path: 'delivery/transit',      element: <InTransit /> },
      { path: 'delivery/delivered',    element: <Delivered /> },

      // ── QC
      { path: 'qc',                    element: <QCQueue /> },
      { path: 'qc/history',            element: <QCHistory /> },
      { path: 'qc/rework',             element: <Rework /> },

      // ── Workforce
      { path: 'workforce',             element: <Workforce /> },
      { path: 'workforce/employees',   element: <EmployeesPage /> },
      { path: 'workforce/attendance',  element: <Attendance /> },
      { path: 'workforce/shifts',      element: <Shifts /> },
      { path: 'workforce/performance', element: <Performance /> },

      // ── Finance
      { path: 'finance',               element: <Finance /> },
      { path: 'finance/accounts',      element: <AccountsPage /> },
      { path: 'finance/transactions',  element: <Transactions /> },
      { path: 'finance/expenses',      element: <Expenses /> },
      { path: 'finance/receivables',   element: <Receivables /> },
      { path: 'finance/payables',      element: <Payables /> },
      { path: 'finance/pnl',           element: <PnL /> },

      // ── Reports
      { path: 'reports/production',    element: <ProductionReports /> },
      { path: 'reports/inventory',     element: <InventoryReports /> },
      { path: 'reports/sales',         element: <SalesReports /> },
      { path: 'reports/finance',       element: <FinanceReports /> },

      // ── Monitoring
      { path: 'notifications',         element: <Notifications /> },
      { path: 'cctv',                  element: <CCTV /> },

      // ── Admin
      { path: 'admin/users',           element: <AdminUsers /> },
      { path: 'admin/roles',           element: <AdminRoles /> },
      { path: 'admin/settings',        element: <AdminSettings /> },
      { path: 'admin/audit',           element: <AuditLog /> },

      // ── Catch-all
      { path: '*',                     element: <Navigate to="/" replace /> },
    ],
  },
]);
