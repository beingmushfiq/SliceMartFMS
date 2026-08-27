import { Navigate, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AppShell } from '../components/layout/AppShell'
import LoginPage from '../pages/auth/LoginPage'
import CatalogueWorkspace from '../modules/catalogue/CatalogueWorkspace'
import ProductionWorkspace from '../modules/production/ProductionWorkspace'
import QcWorkspace from '../modules/qc/QcWorkspace'
import InventoryWorkspace from '../modules/inventory/InventoryWorkspace'
import PurchasingWorkspace from '../modules/purchasing/PurchasingWorkspace'

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
            path: '*',
            element: <Navigate to="/production" replace />,
          },
        ],
      },
    ],
  },
])
