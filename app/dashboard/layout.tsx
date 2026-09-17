'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar, { Role } from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import BackendOfflineBanner from '../../components/BackendOfflineBanner';
import { AppDataProvider } from '../../lib/store';
import { getSession, roleForPath } from '../../lib/auth';

function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getSession();
    const requiredRole = roleForPath(pathname);
    if (!session || session.role !== requiredRole) {
      router.replace('/login');
      return;
    }
    setAuthorized(true);
  }, [pathname, router]);

  // Render nothing until the session check has actually passed, so
  // protected content never flashes on screen for an unauthenticated visit.
  if (!authorized) return null;
  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const role: Role = pathname.includes('/guru')
    ? 'guru'
    : pathname.includes('/admin')
      ? 'admin'
      : pathname.includes('/secretary')
        ? 'secretary'
        : 'student';
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <AppDataProvider>
      <RouteGuard>
        <div className="relative flex min-h-screen overflow-hidden bg-slate-50 text-gray-900 antialiased">
          {/* Decorative background blobs for the glassmorphism base */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[10%] -top-[10%] h-[45%] w-[45%] rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-[10%] top-[35%] h-[40%] w-[40%] rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-500/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[15%] left-[25%] h-[35%] w-[35%] rounded-full bg-teal-100/40 blur-3xl dark:bg-teal-500/10"
          />

          <Sidebar
            role={role}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />

          <div className="relative z-10 flex h-screen flex-1 flex-col overflow-y-auto md:ml-[280px]">
            <BackendOfflineBanner />
            <TopHeader role={role} onMenuClick={() => setMobileOpen(true)} />
            {children}
          </div>
        </div>
      </RouteGuard>
    </AppDataProvider>
  );
}
