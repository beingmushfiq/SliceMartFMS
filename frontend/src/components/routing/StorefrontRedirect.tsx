import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth/authStore';

export function StorefrontRedirect() {
  const tenantSubdomain = useAuthStore((state) => state.tenant?.subdomain || state.tenant?.slug) || 'store';
  return <Navigate to={`/store/${tenantSubdomain}`} replace />;
}
