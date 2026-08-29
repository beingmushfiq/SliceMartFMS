import React from 'react';
import { Outlet } from 'react-router-dom';
import { PlatformSidebar } from './PlatformSidebar';
import { PlatformHeader } from './PlatformHeader';

export const PlatformShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-(--app-bg) text-default flex font-sans antialiased selection:bg-amber-500 selection:text-white relative">
      {/* Platform Sidebar */}
      <PlatformSidebar />

      {/* Main Control Plane Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <PlatformHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-(--app-bg) transition-colors duration-200">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
