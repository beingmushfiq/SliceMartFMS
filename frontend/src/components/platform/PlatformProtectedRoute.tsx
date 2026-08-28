import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePlatformAuthStore } from '../../lib/auth/platformAuthStore';

export const PlatformProtectedRoute: React.FC = () => {
  const { status, user, bootstrap } = usePlatformAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (status === 'idle') {
      bootstrap();
    }
  }, [status, bootstrap]);

  if (status === 'idle' || status === 'authenticating') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono tracking-widest text-slate-400 uppercase">
          Verifying DevCenterPoint Platform Credentials...
        </p>
      </div>
    );
  }

  if (status === 'unauthenticated' || !user || !user.is_platform_user) {
    return <Navigate to="/platform/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
