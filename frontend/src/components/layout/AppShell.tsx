import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';
import { ImpersonationBanner } from './ImpersonationBanner';
import { OfflineBanner } from './OfflineBanner';
import { SeoHead } from '../seo/SeoHead';

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main content wrapper with offset for desktop sidebar */}
        <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
          <AppHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          <main className="flex-1 p-(--page-padding-mobile) sm:p-(--page-padding) overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
