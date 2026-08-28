import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content wrapper with offset for desktop sidebar */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <AppHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
