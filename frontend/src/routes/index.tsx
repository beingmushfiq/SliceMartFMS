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
import { OrderFraudVerificationWorkspace } from '../modules/ecommerce/OrderFraudVerificationWorkspace';
import { SettingsCenterWorkspace } from '../modules/settings/SettingsCenterWorkspace';
import { TenantRoleDashboard } from '../pages/dashboard/TenantRoleDashboard';
import { ProfileSettingsWorkspace } from '../pages/settings/ProfileSettingsWorkspace';

// Master SaaS Platform Admin imports
import { PlatformProtectedRoute } from '../components/platform/PlatformProtectedRoute';
import { PlatformShell } from '../components/platform/PlatformShell';
import PlatformLoginPage from '../pages/platform/PlatformLoginPage';
import PlatformDashboardWorkspace from '../modules/platform/PlatformDashboardWorkspace';
import TenantDirectoryWorkspace from '../modules/platform/TenantDirectoryWorkspace';
import TenantRegistrationWizard from '../modules/platform/TenantRegistrationWizard';
import TenantDetailWorkspace from '../modules/platform/TenantDetailWorkspace';
import PlanManagerWorkspace from '../modules/platform/PlanManagerWorkspace';
import PlatformAuditWorkspace from '../modules/platform/PlatformAuditWorkspace';

// Public Headless E-Commerce Storefront imports
import { StorefrontShell } from '../components/storefront/StorefrontShell';
import { StorefrontHomePage } from '../pages/storefront/StorefrontHomePage';
import { StorefrontCatalogPage } from '../pages/storefront/StorefrontCatalogPage';
import { StorefrontProductDetailPage } from '../pages/storefront/StorefrontProductDetailPage';
import { StorefrontCheckoutPage } from '../pages/storefront/StorefrontCheckoutPage';
import { StorefrontOrderConfirmationPage } from '../pages/storefront/StorefrontOrderConfirmationPage';
import { StorefrontOrderTrackingPage } from '../pages/storefront/StorefrontOrderTrackingPage';
import { StorefrontDynamicPage } from '../pages/storefront/StorefrontDynamicPage';
import { StorefrontAccountPage } from '../pages/storefront/StorefrontAccountPage';
import { StorefrontSettingsWorkspace } from '../modules/storefront/StorefrontSettingsWorkspace';
import { StorefrontPageBuilderWorkspace } from '../modules/storefront/StorefrontPageBuilderWorkspace';

export const router = createBrowserRouter([
  // Public Headless Storefront Routes
  {
    path: '/store',
    element: <Navigate to="/store/slicemart" replace />,
  },
  {
    path: '/store/:subdomain',
    element: <StorefrontShell />,
    children: [
      {
        index: true,
        element: <StorefrontHomePage />,
      },
      {
        path: 'products',
        element: <StorefrontCatalogPage />,
      },
      {
        path: 'collections/:categorySlug',
        element: <StorefrontCatalogPage />,
      },
      {
        path: 'products/:idOrSku',
        element: <StorefrontProductDetailPage />,
      },
      {
        path: 'checkout',
        element: <StorefrontCheckoutPage />,
      },
      {
        path: 'order-confirmed',
        element: <StorefrontOrderConfirmationPage />,
      },
      {
        path: 'track',
        element: <StorefrontOrderTrackingPage />,
      },
      {
        path: 'account',
        element: <StorefrontAccountPage />,
      },
      {
        path: 'pages/:slug',
        element: <StorefrontDynamicPage />,
      },
    ],
  },

  // Master SaaS Admin Platform Routes
  {
    path: '/platform/login',
    element: <PlatformLoginPage />,
  },
  {
    path: '/platform',
    element: <PlatformProtectedRoute />,
    children: [
      {
        element: <PlatformShell />,
        children: [
          {
            index: true,
            element: <PlatformDashboardWorkspace />,
          },
          {
            path: 'tenants',
            element: <TenantDirectoryWorkspace />,
          },
          {
            path: 'tenants/new',
            element: <TenantRegistrationWizard />,
          },
          {
            path: 'tenants/:id',
            element: <TenantDetailWorkspace />,
          },
          {
            path: 'plans',
            element: <PlanManagerWorkspace />,
          },
          {
            path: 'audit-logs',
            element: <PlatformAuditWorkspace />,
          },
        ],
      },
    ],
  },

  // Tenant Application Routes (Slice Mart as Tenant #1)
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
            element: <TenantRoleDashboard />,
          },
          {
            path: 'dashboard',
            element: <TenantRoleDashboard />,
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
            path: 'storefront',
            element: <StorefrontSettingsWorkspace />,
          },
          {
            path: 'storefront/builder',
            element: <StorefrontPageBuilderWorkspace />,
          },
          {
            path: 'fraud-verification',
            element: <OrderFraudVerificationWorkspace />,
          },
          {
            path: 'sales/fraud-verification',
            element: <Navigate to="/fraud-verification" replace />,
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
            path: 'settings',
            element: <SettingsCenterWorkspace />,
          },
          {
            path: 'settings/profile',
            element: <ProfileSettingsWorkspace />,
          },
          {
            path: 'settings/:group',
            element: <SettingsCenterWorkspace />,
          },
          {
            path: 'profile',
            element: <ProfileSettingsWorkspace />,
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
