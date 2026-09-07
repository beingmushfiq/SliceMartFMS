import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';
import { ImpersonationBanner } from './ImpersonationBanner';
import { OfflineBanner } from './OfflineBanner';
import { SeoHead } from '../seo/SeoHead';
import { cn } from '../../lib/utils';

export function AppShell() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('erp_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('erp_sidebar_collapsed', String(next));
      } catch (err) {
        void err;
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-dvh bg-base text-default font-sans antialiased flex-col">
      <SeoHead
        title="SliceMart ERP"
        description="Private Tenant Enterprise Management Portal"
        noIndex={true}
        brandName="SliceMart ERP"
      />
      <OfflineBanner />
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main content wrapper with offset for desktop sidebar */}
        <div
          className={cn(
            'flex flex-1 flex-col min-w-0 transition-[padding] duration-300 ease-in-out',
            isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
        >
          <AppHeader
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />

          <main className="flex-1 p-(--page-padding-mobile) sm:p-(--page-padding) overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

