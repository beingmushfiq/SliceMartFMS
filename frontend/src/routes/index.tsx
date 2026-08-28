import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';
import LoginPage from '../pages/auth/LoginPage';
import CatalogueWorkspace from '../modules/catalogue/CatalogueWorkspace';
import ProductionWorkspace from '../modules/production/ProductionWorkspace';
import QcWorkspace from '../modules/qc/QcWorkspace';
import InventoryWorkspace from '../modules/inventory/InventoryWorkspace';
import PurchasingWorkspace from '../modules/purchasing/PurchasingWorkspace';
import SalesWorkspace from '../modules/sales/SalesWorkspace';
import PosWorkspace from '../modules/pos/PosWorkspace';
import DeliveryWorkspace from '../modules/delivery/DeliveryWorkspace';
import FinanceWorkspace from '../modules/finance/FinanceWorkspace';
import AssetsWorkspace from '../modules/assets/AssetsWorkspace';
import HrWorkspace from '../modules/hr/HrWorkspace';
import { ReportsWorkspace } from '../modules/reports/ReportsWorkspace';
import { AuditLogWorkspace } from '../modules/audit/AuditLogWorkspace';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/production" replace />,
          },
          {
            path: 'catalogue',
            element: <CatalogueWorkspace />,
          },
          {
            path: 'production',
            element: <ProductionWorkspace />,
          },
          {
            path: 'qc',
            element: <QcWorkspace />,
          },
          {
            path: 'inventory',
            element: <InventoryWorkspace />,
          },
          {
            path: 'purchasing',
            element: <PurchasingWorkspace />,
          },
          {
            path: 'procurement',
            element: <Navigate to="/purchasing" replace />,
          },
          {
            path: 'sales',
            element: <SalesWorkspace />,
          },
          {
            path: 'pos',
            element: <PosWorkspace />,
          },
          {
            path: 'logistics',
            element: <DeliveryWorkspace />,
          },
          {
            path: 'delivery',
            element: <Navigate to="/logistics" replace />,
          },
          {
            path: 'finance',
            element: <FinanceWorkspace />,
          },
          {
            path: 'accounting',
            element: <Navigate to="/finance" replace />,
          },
          {
            path: 'assets',
            element: <AssetsWorkspace />,
          },
          {
            path: 'hr',
            element: <HrWorkspace />,
          },
          {
            path: 'payroll',
            element: <Navigate to="/hr" replace />,
          },
          {
            path: 'reports',
            element: <ReportsWorkspace />,
          },
          {
            path: 'rms',
            element: <Navigate to="/reports" replace />,
          },
          {
            path: 'audit-logs',
            element: <AuditLogWorkspace />,
          },
          {
            path: 'audit',
            element: <Navigate to="/audit-logs" replace />,
          },
          {
            path: '*',
            element: <Navigate to="/production" replace />,
          },
        ],
      },
    ],
  },
]);
