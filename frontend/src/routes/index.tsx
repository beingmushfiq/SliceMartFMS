import { Navigate, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AppShell } from '../components/layout/AppShell'
import LoginPage from '../pages/auth/LoginPage'
import CatalogueWorkspace from '../modules/catalogue/CatalogueWorkspace'

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
            element: <Navigate to="/catalogue" replace />,
          },
          {
            path: 'catalogue',
            element: <CatalogueWorkspace />,
          },
          {
            path: '*',
            element: <Navigate to="/catalogue" replace />,
          },
        ],
      },
    ],
  },
])
