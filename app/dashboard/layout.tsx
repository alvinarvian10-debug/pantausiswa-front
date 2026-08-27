'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar, { Role } from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';

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
    <div className="relative flex min-h-screen overflow-hidden bg-slate-50 text-gray-900 antialiased">
      {/* Decorative background blobs for the glassmorphism base */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10%] -top-[10%] h-[45%] w-[45%] rounded-full bg-emerald-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[10%] top-[35%] h-[40%] w-[40%] rounded-full bg-blue-100/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[15%] left-[25%] h-[35%] w-[35%] rounded-full bg-teal-100/40 blur-3xl"
      />

      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="relative z-10 flex h-screen flex-1 flex-col overflow-y-auto md:ml-[280px]">
        <TopHeader role={role} onMenuClick={() => setMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
}
