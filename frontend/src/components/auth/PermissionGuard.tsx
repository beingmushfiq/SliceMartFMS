import type { ReactNode } from 'react';
import { useAuthStore } from '../../lib/auth/authStore';

interface PermissionGuardProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
