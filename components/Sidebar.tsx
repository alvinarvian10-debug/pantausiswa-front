'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from './Avatar';
import { CURRENT_GURU_ID, CURRENT_SISWA_ID, CURRENT_SEKRETARIS_ID, useAppData } from '../lib/store';

export type Role = 'student' | 'guru' | 'admin' | 'secretary';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /**
   * When true the item only highlights on an exact pathname match.
   * Used for each role's home route so it doesn't stay active on sub-pages
   * (which are matched with `pathname.startsWith(href)` instead).
   */
  exact?: boolean;
}

interface RoleConfig {
  portalLabel: string;
  items: NavItem[];
  /** Optional CTA rendered at the bottom of the sidebar (e.g. "Lapor Kendala"). */
  quickLink?: { href: string; label: string };
}

const NAV_CONFIG: Record<Role, RoleConfig> = {
  student: {
    portalLabel: 'Portal Siswa',
    items: [
      {
        href: '/dashboard/student/beranda',
        label: 'Beranda',
        icon: 'dashboard',
        exact: true,
      },
      {
        href: '/dashboard/student/peminjaman',
        label: 'Peminjaman Fasilitas',
        icon: 'business_center',
      },
      { href: '/dashboard/student/tugas', label: 'Tugas', icon: 'assignment' },
      { href: '/dashboard/student/aduan', label: 'Aduan', icon: 'campaign' },
    ],
    quickLink: { href: '/dashboard/student/aduan', label: 'Lapor Kendala' },
  },
  secretary: {
    portalLabel: 'Portal Sekretaris Kelas',
    items: [
      { href: '/dashboard/secretary', label: 'Presensi Kelas', icon: 'how_to_reg', exact: true },
      { href: '/dashboard/secretary/password', label: 'Ganti Password', icon: 'lock' },
    ],
  },
  guru: {
    portalLabel: 'Portal Guru',
    items: [
      {
        href: '/dashboard/guru',
        label: 'Beranda',
        icon: 'dashboard',
        exact: true,
      },
      {
        href: '/dashboard/guru/data-kelas',
        label: 'Data Kelas',
        icon: 'groups',
      },
      {
        href: '/dashboard/guru/persetujuan-izin',
        label: 'Persetujuan Izin',
        icon: 'check_circle',
      },
      {
        href: '/dashboard/guru/kelola-tugas',
        label: 'Kelola Tugas',
        icon: 'assignment',
      },
      { href: '/dashboard/guru/riwayat', label: 'Riwayat', icon: 'history' },
    ],
  },
  admin: {
    portalLabel: 'Portal Admin',
    items: [
      {
        href: '/dashboard/admin',
        label: 'Dashboard',
        icon: 'dashboard',
        exact: true,
      },
      {
        href: '/dashboard/admin/master-data',
        label: 'Master Data',
        icon: 'database',
      },
      {
        href: '/dashboard/admin/inventaris',
        label: 'Inventaris Fasilitas',
        icon: 'inventory_2',
      },
      {
        href: '/dashboard/admin/pengaduan',
        label: 'Laporan Pengaduan',
        icon: 'report_problem',
      },
      {
        href: '/dashboard/admin/analitik',
        label: 'Analitik Sekolah',
        icon: 'analytics',
      },
      {
        href: '/dashboard/admin/pengaturan',
        label: 'Pengaturan',
        icon: 'settings',
      },
    ],
    quickLink: { href: '/dashboard/admin/pengaduan', label: 'Lapor Kendala' },
  },
};

export function useRoleUser(role: Role): { name: string; subtitle: string } {
  const { getSiswa, getGuru, getKelas, sekretaris } = useAppData();
  if (role === 'student') {
    const s = getSiswa(CURRENT_SISWA_ID);
    const kelas = s ? getKelas(s.kelasId) : undefined;
    return { name: s?.nama ?? 'Siswa', subtitle: kelas?.nama ?? '-' };
  }
  if (role === 'secretary') {
    let secretaryId = CURRENT_SEKRETARIS_ID;
    if (typeof window !== 'undefined') {
      try {
        const session = JSON.parse(window.localStorage.getItem('pantausiswa.session') ?? '{}');
        if (session.secretaryId) secretaryId = session.secretaryId;
      } catch {}
    }
    const account = sekretaris.find((a) => a.id === secretaryId);
    const kelas = account ? getKelas(account.kelasId) : undefined;
    return { name: account?.nama ?? 'Sekretaris Kelas', subtitle: kelas?.nama ?? '-' };
  }
  if (role === 'guru') {
    const g = getGuru(CURRENT_GURU_ID);
    const kelas = g?.waliKelasId ? getKelas(g.waliKelasId) : undefined;
    return { name: g?.nama ?? 'Guru', subtitle: kelas ? `Wali Kelas ${kelas.nama}` : (g?.mapel.join(', ') ?? '-') };
  }
  return { name: 'Admin Sekolah', subtitle: 'Administrator Sekolah' };
}

interface SidebarProps {
  role: Role;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, mobileOpen, onClose }: SidebarProps) {
  const config = NAV_CONFIG[role];
  const user = useRoleUser(role);

  return (
    <>
      {/* Mobile scrim */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <nav
        aria-label="Navigasi utama"
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-white/60 bg-white/70 shadow-glass backdrop-blur-md transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 pb-6 pt-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-cta">
            <span className="material-symbols-outlined icon-fill text-[24px]">
              school
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-gray-900">
              PantauSiswa
            </h1>
            <p className="text-xs font-medium text-emerald-600">
              {config.portalLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-white/70 hover:text-gray-900 md:hidden"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Nav items */}
        <p className="px-8 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Menu
        </p>
        <ul className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-4">
          {config.items.map((item) => (
            <li key={item.href}>
              <NavLink item={item} onNavigate={onClose} />
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="border-t border-gray-100/80 px-4 pb-6 pt-4">
          {config.quickLink && (
            <Link
              href={config.quickLink.href}
              onClick={onClose}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100 transition-colors hover:bg-emerald-100"
            >
              <span className="material-symbols-outlined text-[18px]">
                report
              </span>
              {config.quickLink.label}
            </Link>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-white/60">
            <Avatar name={user.name} className="h-10 w-10 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user.subtitle}
              </p>
            </div>
          </div>

          <Link
            href="/login"
            onClick={onClose}
            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>
            Keluar
          </Link>
        </div>
      </nav>
    </>
  );
}

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-emerald-500 text-white shadow-md'
          : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:scale-110 ${
          isActive ? 'icon-fill' : ''
        }`}
      >
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
